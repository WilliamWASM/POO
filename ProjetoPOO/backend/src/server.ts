import express, { Request, Response } from 'express';
import cors from 'cors';
import { generateToken, authenticateToken, comparePassword, hashPassword } from './auth';
import { 
  RoomRepository, 
  GuestRepository, 
  ReservationRepository, 
  UserRepository 
} from './repository';
import { 
  StandardRoom, 
  LuxurySuite, 
  Guest, 
  Reservation, 
  User 
} from './domain';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Inicialização dos Repositórios
const roomRepo = new RoomRepository();
const guestRepo = new GuestRepository();
const reservationRepo = new ReservationRepository();
const userRepo = new UserRepository();

// ============================================================================
// 1. ROTAS DE AUTENTICAÇÃO (ADMIN)
// ============================================================================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const user = new User(name, email, password);
    await userRepo.save(user);
    res.status(201).json({ message: "Recepcionista cadastrado com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar usuário." });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await userRepo.findByEmail(email);

    if (!user || !user.password || !(await comparePassword(password, user.password))) {
      return res.status(401).json({ error: "Credenciais inválidas." });
    }

    const token = generateToken(user.id);
    res.json({ token, name: user.name });
  } catch (error) {
    res.status(500).json({ error: "Erro no login." });
  }
});

// ============================================================================
// 2. ROTAS DE HÓSPEDES (GUESTS)
// ============================================================================

app.get('/api/guests', authenticateToken, async (req: Request, res: Response) => {
  const guests = await guestRepo.findAll();
  res.json(guests);
});

app.post('/api/auth/guest/register', async (req: Request, res: Response) => {
  try {
    const { name, email, document, password } = req.body;
    const hashedPassword = await hashPassword(password);
    
    // Cria e salva
    await guestRepo.save({ name, email, document, password: hashedPassword } as Guest);
    
    res.status(201).json({ message: "Conta criada com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar conta." });
  }
});

app.post('/api/auth/guest/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const guests = await guestRepo.findAll();
    const guest = guests.find(g => g.email === email);

    if (!guest || !guest.password || !(await comparePassword(password, guest.password))) {
      return res.status(401).json({ error: "Email ou senha incorretos." });
    }

    const token = generateToken(guest.id); 
    res.json({ token, name: guest.name, id: guest.id, role: 'GUEST' });
  } catch (error) {
    res.status(500).json({ error: "Erro no login." });
  }
});

// ============================================================================
// 3. ROTAS DE QUARTOS (ROOMS)
// ============================================================================

app.get('/api/rooms', async (req: Request, res: Response) => {
  try {
    const rooms = await roomRepo.findAll();
    const response = rooms.map(room => ({
      id: room.id,
      number: room.number,
      price: room.pricePerNight,
      status: room.status,
      description: room.getDescription(),
      type: room instanceof LuxurySuite ? 'LUXURY' : 'STANDARD',
      reservedBy: room.reservedBy
    }));
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar quartos." });
  }
});

app.post('/api/rooms', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { number, price, type, description } = req.body;
    
    const existing = (await roomRepo.findAll()).find(r => r.number === number);
    if (existing) return res.status(409).json({ error: "Quarto já existe." });

    let newRoom;
    if (type === 'LUXURY') {
      newRoom = new LuxurySuite(0, number, parseFloat(price), true, true);
    } else {
      newRoom = new StandardRoom(0, number, parseFloat(price));
    }
    
    // Garante que a descrição seja atribuída antes de salvar
    newRoom.description = description;

    await roomRepo.save(newRoom);
    res.status(201).json({ message: "Quarto criado com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar quarto." });
  }
});

app.delete('/api/rooms/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await roomRepo.delete(id);
    res.json({ message: "Quarto excluído com sucesso." });
  } catch (error) {
    res.status(500).json({ error: "Erro ao excluir quarto." });
  }
});

// Limpeza
app.patch('/api/rooms/:id/clean', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const room = await roomRepo.findById(id);
    
    if (!room) return res.status(404).json({ error: "Quarto não encontrado." });

    room.markAsClean(); 
    await roomRepo.update(room);
    
    res.json({ message: `Quarto ${room.number} limpo.` });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reserva (Apenas reservar, sem entrar)
app.patch('/api/rooms/:id/reserve', authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { guestId } = req.body; 

    // Validações de Unicidade
    const allRooms = await roomRepo.findAll();
    const jaTemReserva = allRooms.find(r => r.reservedBy === guestId);
    if (jaTemReserva) {
        return res.status(400).json({ error: `Cliente já reservou o quarto ${jaTemReserva.number}.` });
    }

    const activeReservations = await reservationRepo.findActive();
    const jaEstaHospedado = activeReservations.find(r => r.guest.id === guestId);
    if (jaEstaHospedado) {
        return res.status(400).json({ error: `Cliente já está hospedado no quarto ${jaEstaHospedado.room.number}.` });
    }

    // Executa a reserva
    const room = await roomRepo.findById(id);
    if (!room) return res.status(404).json({ error: "Quarto não encontrado." });

    room.reserve(guestId); 
    await roomRepo.update(room);

    res.json({ message: `Quarto ${room.number} reservado com sucesso!` });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Seed (Criar dados iniciais)
app.post('/api/rooms/seed', async (req: Request, res: Response) => {
  try {
    await roomRepo.save(new StandardRoom(0, "101", 100));
    await roomRepo.save(new StandardRoom(0, "102", 100));
    await roomRepo.save(new StandardRoom(0, "103", 100));
    await roomRepo.save(new LuxurySuite(0, "201", 300, true, true)); 
    await roomRepo.save(new LuxurySuite(0, "202", 250, true, false)); 
    res.json({ message: "Quartos criados com sucesso!" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

// ============================================================================
// 4. ROTAS DE RESERVAS E CHECK-IN (CORE)
// ============================================================================

app.get('/api/reservations', authenticateToken, async (req: Request, res: Response) => {
  const reservations = await reservationRepo.findActive();
  
  const response = reservations.map(r => ({
    id: r.id,
    guestName: r.guest.name,
    roomNumber: r.room.number,
    checkIn: r.checkInDate,
    checkOut: r.checkOutDate,
    total: r.calculateTotalPrice()
  }));

  res.json(response);
});

// CHECK-IN (Entrada efetiva)
app.post('/api/checkin', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { guestId, roomId, daysToStay } = req.body;

    // Validações de Unicidade
    const activeReservations = await reservationRepo.findActive();
    const jaEstaHospedado = activeReservations.find(r => r.guest.id === guestId);
    if (jaEstaHospedado) {
        return res.status(400).json({ error: `Cliente já ocupa o quarto ${jaEstaHospedado.room.number}.` });
    }

    const allRooms = await roomRepo.findAll();
    const reservaEmOutroQuarto = allRooms.find(r => r.reservedBy === guestId && r.id !== roomId);
    if (reservaEmOutroQuarto) {
        return res.status(400).json({ error: `Cliente possui reserva pendente no quarto ${reservaEmOutroQuarto.number}.` });
    }

    // Processamento
    const guest = (await guestRepo.findAll()).find(g => g.id === guestId);
    const room = await roomRepo.findById(roomId);

    if (!guest || !room) return res.status(404).json({ error: "Hóspede ou Quarto não encontrado." });

    try {
      room.checkIn(); 
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }

    const checkInDate = new Date();
    const checkOutDate = new Date();
    checkOutDate.setDate(checkInDate.getDate() + daysToStay);

    const reservation = new Reservation(guest, room, checkInDate, checkOutDate);
    
    await reservationRepo.save(reservation);
    await roomRepo.update(room);

    res.json({ message: "Check-in realizado com sucesso!", reservation });
  } catch (error) {
    res.status(500).json({ error: "Erro interno no check-in." });
  }
});

// CHECK-OUT (Saída e Pagamento)
app.post('/api/checkout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { reservationId } = req.body;
    
    const activeReservations = await reservationRepo.findActive();
    const reservation = activeReservations.find(r => r.id === reservationId);

    if (!reservation) {
      return res.status(404).json({ error: "Reserva não encontrada." });
    }

    const totalToPay = reservation.calculateTotalPrice();

    // Atualiza status na memória e no banco
    reservation.room.checkOut(); 
    reservation.cancel(); 

    await reservationRepo.update(reservation); 
    await roomRepo.update(reservation.room);
    
    res.json({ 
      message: "Check-out realizado.",
      roomNumber: reservation.room.number,
      status: reservation.room.status,
      totalPayable: totalToPay
    });

  } catch (error) {
    res.status(500).json({ error: "Erro ao realizar check-out." });
  }
});

app.get('/', (req, res) => {
  res.send('API do Hotel funcionando! 🚀');
});

app.listen(PORT, () => {
  console.log(`🏨 Hotel Management Server running on port ${PORT}`);
});