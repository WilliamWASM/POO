import { useState, useEffect } from 'react';
import { api } from './api';
import { Dashboard } from './dashboard';

export default function App() {
  const [viewMode, setViewMode] = useState<'GUEST' | 'ADMIN'>('GUEST');
  
  // Estado do Usuário
  const [user, setUser] = useState<any>(null);

  // States de Login (Admin)
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [adminError, setAdminError] = useState('');

  // States do Hóspede (Guest)
  const [rooms, setRooms] = useState<any[]>([]);
  const [showGuestAuth, setShowGuestAuth] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestDoc, setGuestDoc] = useState('');
  const [guestPass, setGuestPass] = useState('');
  const [guestError, setGuestError] = useState('');

  useEffect(() => {
    if (viewMode === 'GUEST') {
      loadRooms();
    }
    loadRooms();
    
    const token = localStorage.getItem('token');
    const savedName = localStorage.getItem('userName');
    const savedRole = localStorage.getItem('userRole');
    const savedId = localStorage.getItem('userId');

    if (token && savedName) {
      setUser({ name: savedName, role: savedRole, id: savedId });
    }
  }, [viewMode]);

  const loadRooms = async () => {
    try {
      const data = await api.getRooms();
      setRooms(data);
    } catch (e) { console.error(e); }
  };

  // ==========================================================================
  // AÇÕES DE AUTENTICAÇÃO (ADMIN & GUEST)
  // ==========================================================================

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await api.login(adminEmail, adminPass);
      loginSuccess(data, 'ADMIN');
    } catch (err) { setAdminError('Acesso negado.'); }
  };

  const handleGuestAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError('');
    try {
      if (isRegistering) {
        await api.guestRegister({ name: guestName, email: guestEmail, document: guestDoc, password: guestPass });
        setIsRegistering(false);
        setGuestError('Conta criada! Faça login.');
      } else {
        const data = await api.guestLogin(guestEmail, guestPass);
        loginSuccess(data, 'GUEST');
        setShowGuestAuth(false);
      }
    } catch (err) { setGuestError('Erro na autenticação. Verifique os dados.'); }
  };

  const loginSuccess = (data: any, role: string) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userName', data.name);
    localStorage.setItem('userRole', role);
    if(data.id) localStorage.setItem('userId', data.id);
    
    setUser({ name: data.name, role: role, id: data.id });
    
    if (role === 'ADMIN') setViewMode('ADMIN');
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setViewMode('GUEST');
  };

  // ==========================================================================
  // AÇÕES DO CLIENTE (RESERVA)
  // ==========================================================================

  const handleReserveClick = async (room: any) => {
    if (!user) {
      setShowGuestAuth(true);
      return;
    }

    if (user.role === 'ADMIN') {
      alert("Funcionários devem usar o painel administrativo para fazer reservas.");
      return;
    }

    const daysStr = window.prompt(`Quantos dias você deseja ficar no Quarto ${room.number}?`);
    if (!daysStr) return;

    const days = parseInt(daysStr);
    if (isNaN(days) || days <= 0) {
      alert("Por favor, digite um número válido de dias.");
      return;
    }

    try {
      await api.checkIn(Number(user.id), room.id, days);
      alert(`Reserva realizada com sucesso! Bom descanso no quarto ${room.number}.`);
      loadRooms();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao reservar: " + err.message);
    }
  };

  // ==========================================================================
  // RENDERIZAÇÃO
  // ==========================================================================

  if (viewMode === 'ADMIN' && user?.role === 'ADMIN') {
    return <Dashboard onLogout={handleLogout} />;
  }

  // Tela de Login Admin
  if (viewMode === 'ADMIN') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#222', color: '#fff' }}>
        <h2>Área Restrita (Funcionários)</h2>
        {adminError && <p style={{ color: 'red' }}>{adminError}</p>}
        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 300 }}>
          <input placeholder="Email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} style={{ padding: 10 }} />
          <input type="password" placeholder="Senha" value={adminPass} onChange={e => setAdminPass(e.target.value)} style={{ padding: 10 }} />
          <button type="submit" style={{ padding: 10, background: '#646cff', color: 'white', border: 'none' }}>ENTRAR COMO FUNCIONÁRIO</button>
        </form>
        <button onClick={() => setViewMode('GUEST')} style={{ marginTop: 20, color: '#ccc', background: 'none', border: 'none', cursor: 'pointer' }}>← Voltar para o Site</button>
      </div>
    );
  }

  // Vitrine (Site Público)
  return (
    <div style={{ minHeight: '100vh', background: '#f0f0f0', color: '#333' }}>
      
      {/* HEADER */}
      <header style={{ background: '#fff', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#646cff' }}>🏨 Hotel Paradise</h1>
        <div>
          {user ? (
            <span style={{ marginRight: 15 }}>Olá, <b>{user.name}</b> ({user.role === 'GUEST' ? 'Cliente' : 'Staff'})</span>
          ) : null}
          
          {user ? (
            <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>Sair</button>
          ) : (
            <>
              <button onClick={() => setShowGuestAuth(true)} style={{ padding: '8px 16px', marginRight: 10, background: '#646cff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Login Cliente</button>
              <button onClick={() => setViewMode('ADMIN')} style={{ padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Sou Funcionário</button>
            </>
          )}
        </div>
      </header>

      {/* MODAL DE LOGIN/CADASTRO */}
      {showGuestAuth && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: 30, borderRadius: 8, width: 350, position: 'relative' }}>
            <button onClick={() => setShowGuestAuth(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            
            <h3>{isRegistering ? 'Criar Conta de Hóspede' : 'Login de Hóspede'}</h3>
            {guestError && <p style={{ color: 'red', fontSize: '0.9rem' }}>{guestError}</p>}
            
            <form onSubmit={handleGuestAuth} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isRegistering && (
                <>
                  <input placeholder="Seu Nome" value={guestName} onChange={e => setGuestName(e.target.value)} style={{ padding: 10, border: '1px solid #ccc' }} required />
                  <input placeholder="CPF/Documento" value={guestDoc} onChange={e => setGuestDoc(e.target.value)} style={{ padding: 10, border: '1px solid #ccc' }} required />
                </>
              )}
              <input type="email" placeholder="Seu Email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} style={{ padding: 10, border: '1px solid #ccc' }} required />
              <input type="password" placeholder="Sua Senha" value={guestPass} onChange={e => setGuestPass(e.target.value)} style={{ padding: 10, border: '1px solid #ccc' }} required />
              
              <button type="submit" style={{ padding: 10, background: '#27ae60', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}>
                {isRegistering ? 'CADASTRAR' : 'ENTRAR'}
              </button>
            </form>

            <p style={{ marginTop: 15, fontSize: '0.9rem', textAlign: 'center' }}>
              {isRegistering ? 'Já tem conta? ' : 'Não tem conta? '}
              <span onClick={() => setIsRegistering(!isRegistering)} style={{ color: '#646cff', cursor: 'pointer', fontWeight: 'bold' }}>
                {isRegistering ? 'Fazer Login' : 'Cadastre-se'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* LISTA DE QUARTOS (VITRINE) */}
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        <h3 style={{ marginBottom: '1rem' }}>Reserve sua estadia</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {rooms.map(room => (
            <div key={room.id} style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <div style={{ height: 150, background: room.type === 'LUXURY' ? '#ffd700' : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                {room.type === 'LUXURY' ? '✨ SUÍTE LUXO' : '🛏️ QUARTO PADRÃO'}
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>Quarto {room.number}</h4>
                  <span style={{ fontWeight: 'bold', color: '#27ae60' }}>R$ {room.price}</span>
                </div>
                
                {/* Descrição do Quarto */}
                <p style={{ fontSize: '0.9rem', color: '#666', margin: '10px 0' }}>{room.description}</p>
                
                <button 
                  onClick={() => handleReserveClick(room)}
                  disabled={room.status !== 'AVAILABLE'}
                  style={{ 
                    width: '100%', 
                    padding: 10, 
                    background: room.status === 'AVAILABLE' ? '#646cff' : '#ccc', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 4, 
                    cursor: room.status === 'AVAILABLE' ? 'pointer' : 'not-allowed' 
                  }}
                >
                  {room.status === 'AVAILABLE' ? 'Reservar Agora' : 'Indisponível'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}