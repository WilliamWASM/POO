import { useState, useEffect } from 'react';
import { api } from './api';

interface DashboardProps {
  onLogout?: () => void;
}

export function Dashboard({ onLogout }: DashboardProps) {
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [guests, setGuests] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  // States do Check-in / Reserva
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [stayDays, setStayDays] = useState(1);
  const [isReservationMode, setIsReservationMode] = useState(false);

  // States do Novo Quarto
  const [newNumber, setNewNumber] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newType, setNewType] = useState('STANDARD');
  const [newDesc, setNewDesc] = useState('');

  // States do Modal
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickDoc, setQuickDoc] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickPass, setQuickPass] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const r = await api.getRooms();
      setRooms(Array.isArray(r) ? r : []);
      
      const g = await api.getGuests();
      setGuests(Array.isArray(g) ? g : []);

      const res = await api.getReservations();
      setReservations(Array.isArray(res) ? res : []);
    } catch (error) { 
      console.error(error); 
    }
  };

  // --- 1. FUNÇÃO HÍBRIDA: CHECK-IN OU RESERVA ---
  const handleCheckInOrReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuestId || !selectedRoomId) {
      alert("Selecione hóspede e quarto."); return;
    }

    try {
      if (isReservationMode) {
        await api.reserveRoom(Number(selectedRoomId), Number(selectedGuestId));
        setMsg('Quarto RESERVADO com sucesso!');
      } else {
        await api.checkIn(Number(selectedGuestId), Number(selectedRoomId), Number(stayDays));
        setMsg('Check-in realizado!');
      }

      setSelectedGuestId(''); setSelectedRoomId(''); setStayDays(1);
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err: any) { alert("Erro: " + err.message); }
  };

  // --- 2. CONFIRMAR ENTRADA EM QUARTO RESERVADO ---
  const handleConfirmReservation = (room: any) => {
    const guestQueReservou = guests.find(g => g.id === room.reservedBy);

    if (guestQueReservou) setSelectedGuestId(guestQueReservou.id);
    
    setSelectedRoomId(room.id);
    setStayDays(1); 
    setIsReservationMode(false); 

    alert(`Reserva de ${guestQueReservou?.name || 'Cliente'} detectada!\n\nO formulário foi preenchido. Apenas confirme os dias e clique em "CONFIRMAR ENTRADA".`);
  };

  // Funções Auxiliares
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRoom({
        number: newNumber, price: newPrice, type: newType,
        description: newDesc || (newType === 'LUXURY' ? 'Suíte Completa' : 'Quarto Padrão')
      });
      setMsg('Quarto criado!'); setNewNumber(''); setNewPrice(''); setNewDesc('');
      fetchData(); setTimeout(() => setMsg(''), 3000);
    } catch (err: any) { setMsg('Erro: ' + err.message); }
  };

  const handleDeleteRoom = async (id: number, n: string) => { if (confirm(`Excluir ${n}?`)) { await api.deleteRoom(id); fetchData(); }};
  const handleClean = async (id: number) => { await api.cleanRoom(id); fetchData(); };
  
  const handleQuickGuestRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.guestRegister({ name: quickName, email: quickEmail, document: quickDoc, password: quickPass || '123456' });
      alert("Hóspede cadastrado!"); setShowGuestModal(false); setQuickName(''); setQuickDoc(''); setQuickEmail(''); setQuickPass('');
      const updatedGuests = await api.getGuests(); setGuests(updatedGuests);
      if(updatedGuests.length > 0) setSelectedGuestId(updatedGuests[updatedGuests.length - 1].id);
    } catch (err: any) { alert("Erro: " + err.message); }
  };

  return (
    <div style={{ padding: '2rem', background: '#242424', minHeight: '100vh', color: 'white', fontFamily: 'Arial, sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #444', paddingBottom: '1rem' }}>
        <h2>🛠️ Painel Administrativo</h2>
        {msg && <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{msg}</span>}
        <button onClick={onLogout} style={{ padding: '8px 16px', background: '#c0392b', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Sair</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 320px 1fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* 1. CRIAR QUARTO */}
        <div style={{ background: '#333', padding: '1.5rem', borderRadius: 8 }}>
          <h3 style={{ marginTop: 0 }}>➕ Novo Quarto</h3>
          <form onSubmit={handleCreateRoom} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input value={newNumber} onChange={e => setNewNumber(e.target.value)} placeholder="Número" style={inputStyle} required />
            <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="Preço" style={inputStyle} required />
            <select value={newType} onChange={e => setNewType(e.target.value)} style={inputStyle}><option value="STANDARD">Padrão</option><option value="LUXURY">Suíte Luxo</option></select>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descrição..." rows={2} style={inputStyle} />
            <button type="submit" style={btnGreenStyle}>CADASTRAR</button>
          </form>
        </div>

        {/* 2. PAINEL CENTRAL */}
        <div style={{ background: isReservationMode ? '#2980b9' : '#2c3e50', padding: '1.5rem', borderRadius: 8, border: '1px solid #34495e', transition: '0.3s' }}>
          
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 15}}>
            <h3 style={{ margin: 0 }}>
              {isReservationMode ? '📅 Nova Reserva' : '🛎️ Fazer Check-in'}
            </h3>
            <button 
              type="button" 
              onClick={() => setIsReservationMode(!isReservationMode)}
              style={{ fontSize:'0.7rem', padding:'5px 10px', borderRadius:20, border:'none', cursor:'pointer', background: isReservationMode ? 'white' : 'rgba(0,0,0,0.3)', color: isReservationMode ? '#2980b9' : 'white'}}
            >
              {isReservationMode ? 'Mudar p/ Check-in' : 'Mudar p/ Reserva'}
            </button>
          </div>

          <form onSubmit={handleCheckInOrReserve} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <label style={{fontSize: '0.9rem'}}>Hóspede:</label>
              <button type="button" onClick={() => setShowGuestModal(true)} style={{background: 'none', border: 'none', color: isReservationMode ? '#fff' : '#3498db', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold'}}>+ Novo</button>
            </div>
            
            <select value={selectedGuestId} onChange={e => setSelectedGuestId(e.target.value)} style={inputStyle} required>
              <option value="">-- Selecione --</option>
              {guests.map(g => (<option key={g.id} value={g.id}>{g.name}</option>))}
            </select>

            <label style={{fontSize: '0.9rem'}}>
              {isReservationMode ? 'Quarto a Reservar:' : 'Quarto Disponível/Reservado:'}
            </label>
            <select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)} style={inputStyle} required>
              <option value="">-- Selecione --</option>
              {rooms.filter(r => 
                r.status === 'AVAILABLE' || (!isReservationMode && r.status === 'RESERVED')
              ).map(r => (
                <option key={r.id} value={r.id}>
                   #{r.number} {r.status === 'RESERVED' ? '(RESERVADO)' : ''}
                </option>
              ))}
            </select>

            {!isReservationMode && (
              <>
                <label style={{fontSize: '0.9rem'}}>Dias:</label>
                <input type="number" min="1" value={stayDays} onChange={e => setStayDays(Number(e.target.value))} style={inputStyle} required />
              </>
            )}

            <button type="submit" style={{...btnGreenStyle, background: isReservationMode ? '#3498db' : '#27ae60'}}>
              {isReservationMode ? 'CONFIRMAR RESERVA' : 'CONFIRMAR ENTRADA'}
            </button>
          </form>
        </div>

        {/* 3. LISTA DE QUARTOS */}
        <div>
          <h3 style={{ marginTop: 0 }}>🏨 Mapa de Quartos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
            {rooms.map(room => {
              let bg = '#27ae60'; 
              let statusLabel = 'DISPONÍVEL';

              if (room.status === 'OCCUPIED') { bg = '#c0392b'; statusLabel = 'OCUPADO 🚫'; }
              if (room.status === 'DIRTY')    { bg = '#d35400'; statusLabel = 'SUJO / LIMPEZA 🧹'; }
              if (room.status === 'RESERVED') { bg = '#2980b9'; statusLabel = 'RESERVADO 📅'; }

              const guestReserva = room.reservedBy ? guests.find(g => g.id === room.reservedBy) : null;
              const reservaAtiva = reservations.find((r: any) => r.roomNumber == room.number);

              let diasRestantes = null;
              if (reservaAtiva) {
                  const hoje = new Date();
                  const saida = new Date(reservaAtiva.checkOut);
                  const diffTime = Math.ceil((saida.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                  diasRestantes = diffTime;
              }

              return (
                <div key={room.id} style={{ 
                  background: bg, 
                  padding: '12px', 
                  borderRadius: 8, 
                  position: 'relative', 
                  color: 'white', 
                  border: room.type === 'LUXURY' ? '2px solid #f1c40f' : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                  minHeight: '160px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                }}>
                  
                  <button onClick={() => handleDeleteRoom(room.id, room.number)} style={btnDeleteStyle}>✕</button>
                  
                  <div>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <strong style={{fontSize: '1.2rem'}}>#{room.number}</strong>
                        <span style={{fontSize:'0.7rem', opacity: 0.8}}>({room.type === 'LUXURY' ? 'LUXO' : 'STD'})</span>
                    </div>
                    
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginTop: 5, padding: '4px', background: 'rgba(0,0,0,0.2)', borderRadius: 4, textAlign: 'center' }}>
                        {statusLabel}
                    </div>

                    {room.status === 'OCCUPIED' && reservaAtiva && (
                        <div style={{marginTop: 8, fontSize: '0.8rem', background: 'rgba(0,0,0,0.15)', padding: 6, borderRadius: 4}}>
                            <p style={{margin: '0 0 4px 0'}}>👤 <strong>{reservaAtiva.guestName}</strong></p>
                            <p style={{margin: 0}}>
                                ⏳ Sai em: <strong>{diasRestantes} dia(s)</strong>
                                <br/>
                                <span style={{fontSize: '0.7rem', opacity: 0.8}}>({new Date(reservaAtiva.checkOut).toLocaleDateString()})</span>
                            </p>
                        </div>
                    )}

                    {room.status === 'OCCUPIED' && (
                        <button 
                        onClick={async () => {
                            if(!confirm(`Realizar Check-out de ${reservaAtiva ? reservaAtiva.guestName : 'Hóspede'}?`)) return;
                            try {
                                const dados = await api.performCheckOutByRoom(room.number); 
                                alert(`✅ Check-out realizado com sucesso!\n\n💰 VALOR A RECEBER: R$ ${dados.totalPayable}`);
                                setMsg(`Check-out realizado! Quarto ${room.number} agora está SUJO.`);
                                fetchData();
                            } catch (e: any) { alert("Erro: " + e.message); }
                        }} 
                        style={{...btnActionStyle, background: '#fff', color: '#c0392b'}}
                        >
                        👋 CHECK-OUT
                        </button>
                    )}
                    
                    {room.status === 'RESERVED' && guestReserva && (
                         <div style={{marginTop: 8, fontSize: '0.8rem'}}>
                            <p style={{margin: 0}}>👤 Reservado p/: <br/><strong>{guestReserva.name}</strong></p>
                         </div>
                    )}
                  </div>

                  <div style={{ marginTop: 10 }}>
                    {room.status === 'RESERVED' && (
                        <button 
                        onClick={() => handleConfirmReservation(room)}
                        style={btnActionStyle}
                        >
                        ✅ CONFIRMAR ENTRADA
                        </button>
                    )}
                    
                    {room.status === 'DIRTY' && (
                        <button onClick={() => handleClean(room.id)} style={{...btnActionStyle, background: '#fff', color: '#d35400'}}>✨ LIMPAR</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE HÓSPEDE */}
      {showGuestModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', color: '#333', padding: '2rem', borderRadius: 8, width: '300px', position: 'relative' }}>
            <button onClick={() => setShowGuestModal(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            <h3>👤 Novo Hóspede</h3>
            <form onSubmit={handleQuickGuestRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input placeholder="Nome" value={quickName} onChange={e => setQuickName(e.target.value)} style={modalInputStyle} required />
              <input placeholder="CPF" value={quickDoc} onChange={e => setQuickDoc(e.target.value)} style={modalInputStyle} required />
              <input placeholder="Email" value={quickEmail} onChange={e => setQuickEmail(e.target.value)} style={modalInputStyle} required />
              <input type="password" placeholder="Senha" value={quickPass} onChange={e => setQuickPass(e.target.value)} style={modalInputStyle} />
              <button type="submit" style={{ ...btnGreenStyle, marginTop: 10 }}>SALVAR</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Estilos Auxiliares
const inputStyle = { padding: 8, background: '#fff', border: 'none', borderRadius: 4, color: '#333' };
const modalInputStyle = { padding: 10, border: '1px solid #ccc', borderRadius: 4, width: '100%', boxSizing: 'border-box' as 'border-box' };
const btnGreenStyle = { padding: 10, background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' };
const btnDeleteStyle = { position: 'absolute' as 'absolute', top: 5, right: 5, background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' };
const btnActionStyle = { 
  width: '100%', 
  marginTop: 5, 
  padding: 8, 
  background: 'white', 
  color: '#333', 
  border: 'none', 
  borderRadius: 4, 
  cursor: 'pointer', 
  fontWeight: 'bold', 
  fontSize: '0.8rem' 
};