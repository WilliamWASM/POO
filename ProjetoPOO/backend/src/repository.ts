import { PrismaClient } from '@prisma/client';
import { User, Guest, Room, StandardRoom, LuxurySuite, Reservation, RoomStatus } from './domain';
import { hashPassword } from './auth';

const prisma = new PrismaClient();

// ============================================================================
// 1. REPOSITÓRIO DE QUARTOS (RoomRepository)
// ============================================================================
export class RoomRepository {
  
  // Converte dados do banco para Classes do Domínio (Standard ou Luxury)
  private mapToDomain(data: any): Room {
    const status = data.status as RoomStatus;
    let room: Room;

    if (data.type === 'LUXURY') {
      room = new LuxurySuite(
        data.id, data.number, data.pricePerNight, 
        data.hasJacuzzi, data.hasOceanView, status, data.description
      );
    } else {
      room = new StandardRoom(
        data.id, data.number, data.pricePerNight, status, data.description
      );
    }

    room.reservedBy = data.reservedBy; 
    
    return room;
  }

  async delete(id: number): Promise<void> {
    await prisma.reservation.deleteMany({ where: { roomId: id } });
    await prisma.room.delete({ where: { id } });
  }

  async findAll(): Promise<Room[]> {
    const roomsData = await prisma.room.findMany();
    return roomsData.map(room => this.mapToDomain(room));
  }

  async findById(id: number): Promise<Room | null> {
    const roomData = await prisma.room.findUnique({ where: { id } });
    if (!roomData) return null;
    return this.mapToDomain(roomData);
  }

  async save(room: Room): Promise<Room> {
    const isLuxury = room instanceof LuxurySuite;
    const type = isLuxury ? 'LUXURY' : 'STANDARD';
    const hasJacuzzi = isLuxury ? (room as LuxurySuite).hasJacuzzi : false;
    const hasOceanView = isLuxury ? (room as LuxurySuite).hasOceanView : false;

    const savedData = await prisma.room.create({
      data: {
        number: room.number,
        pricePerNight: room.pricePerNight,
        status: room.status,
        type: type,
        hasJacuzzi: hasJacuzzi,
        hasOceanView: hasOceanView,
        description: room.description || "",
        reservedBy: room.reservedBy
      } as any
    });

    room.id = savedData.id;
    return room;
  }

  async update(room: Room): Promise<void> {
    await prisma.room.update({
      where: { id: room.id },
      data: {
        status: room.status,
        reservedBy: room.reservedBy
      }
    });
  }
}

// ============================================================================
// 2. REPOSITÓRIO DE HÓSPEDES (GuestRepository)
// ============================================================================
export class GuestRepository {
  
  async save(guest: Guest): Promise<Guest> {
    const savedGuest = await prisma.guest.create({
      data: {
        name: guest.name,
        email: guest.email,
        document: guest.document,
        password: guest.password || "" 
      }
    });
    
    return new Guest(
      savedGuest.id, 
      savedGuest.name, 
      savedGuest.email, 
      savedGuest.document, 
      savedGuest.password
    );
  }

  async findAll(): Promise<Guest[]> {
    const guests = await prisma.guest.findMany();
    return guests.map(g => new Guest(g.id, g.name, g.email, g.document, g.password));
  }

  async findByEmail(email: string): Promise<Guest | null> {
    const guest = await prisma.guest.findUnique({
      where: { email }
    });

    if (!guest) return null;

    return new Guest(
      guest.id, 
      guest.name, 
      guest.email, 
      guest.document, 
      guest.password
    );
  }
}

// ============================================================================
// 3. REPOSITÓRIO DE RESERVAS (ReservationRepository)
// ============================================================================
export class ReservationRepository {
  private roomRepo = new RoomRepository();

  async update(reservation: Reservation): Promise<void> {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        active: reservation.active,
        checkOutDate: reservation.checkOutDate
      }
    });
  }

  async save(reservation: Reservation): Promise<Reservation> {
    const data = await prisma.reservation.create({
      data: {
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        active: reservation.active,
        guest: { connect: { id: reservation.guest.id } },
        room: { connect: { id: reservation.room.id } }
      }
    });
    reservation.id = data.id;
    return reservation;
  }

  async findActive(): Promise<Reservation[]> {
    const data = await prisma.reservation.findMany({
      where: { active: true },
      include: { guest: true, room: true }
    });

    const results: Reservation[] = [];

    for (const r of data) {
        const guest = new Guest(r.guest.id, r.guest.name, r.guest.email, r.guest.document);
        
        let room: Room;
        const status = r.room.status as RoomStatus;
        if (r.room.type === 'LUXURY') {
            room = new LuxurySuite(r.room.id, r.room.number, r.room.pricePerNight, r.room.hasJacuzzi, r.room.hasOceanView, status);
        } else {
            room = new StandardRoom(r.room.id, r.room.number, r.room.pricePerNight, status);
        }

        const reservation = new Reservation(guest, room, r.checkInDate, r.checkOutDate, r.id);
        reservation.active = r.active;
        results.push(reservation);
    }
    
    return results;
  }
}

// ============================================================================
// 4. REPOSITÓRIO DE USUÁRIOS/ADMIN (UserRepository)
// ============================================================================
export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const data = await prisma.user.findUnique({ where: { email } });
    if (!data) return null;
    
    const user = new User(data.name, data.email);
    user.id = data.id;
    user.password = data.password;
    return user;
  }

  async save(user: User): Promise<User> {
    if (!user.password) throw new Error("Password required");
    
    const hashedPassword = await hashPassword(user.password);
    
    const data = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: hashedPassword
      }
    });
    
    user.id = data.id;
    user.password = undefined;
    return user;
  }
}