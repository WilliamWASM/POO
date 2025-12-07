const API_URL = 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const api = {

  // ==========================================================================
  // AUTENTICAÇÃO (ADMIN & GUEST)
  // ==========================================================================

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Falha no login');
    return response.json();
  },

  guestRegister: async (data: any) => {
    const response = await fetch(`${API_URL}/auth/guest/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Erro no cadastro');
    return response.json();
  },

  guestLogin: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/guest/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) throw new Error('Falha no login');
    return response.json();
  },

  // ==========================================================================
  // GERENCIAMENTO DE DADOS (GET)
  // ==========================================================================

  getRooms: async () => {
    const response = await fetch(`${API_URL}/rooms`, { headers: getHeaders() });
    return response.json();
  },

  getGuests: async () => {
    const response = await fetch(`${API_URL}/guests`, { headers: getHeaders() });
    return response.json();
  },

  getReservations: async () => {
    const response = await fetch(`${API_URL}/reservations`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Erro ao buscar reservas');
    return response.json();
  },

  // ==========================================================================
  // AÇÕES DE QUARTO (ADMIN)
  // ==========================================================================

  createRoom: async (roomData: any) => {
    const response = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(roomData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao criar quarto');
    }
    return response.json();
  },

  deleteRoom: async (id: number) => {
    const response = await fetch(`${API_URL}/rooms/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Erro ao excluir');
    return response.json();
  },

  cleanRoom: async (roomId: number) => {
    const response = await fetch(`${API_URL}/rooms/${roomId}/clean`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    return response.json();
  },

  // ==========================================================================
  // FLUXO DE RESERVA E CHECK-IN/OUT
  // ==========================================================================

  reserveRoom: async (roomId: number, guestId: number) => {
    const response = await fetch(`${API_URL}/rooms/${roomId}/reserve`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ guestId })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erro ao reservar');
    }
    return response.json();
  },

  checkIn: async (guestId: number, roomId: number, daysToStay: number) => {
    const response = await fetch(`${API_URL}/checkin`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ guestId, roomId, daysToStay })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro no check-in');
    }
    return response.json();
  },

  // Checkout direto (quando já se tem o ID da reserva)
  checkOut: async (reservationId: number) => {
    const response = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reservationId })
    });
    return response.json();
  },

  // Helper: Encontra a reserva pelo número do quarto e faz checkout
  performCheckOutByRoom: async (roomNumber: string | number) => {
    const response = await fetch(`${API_URL}/reservations`, { headers: getHeaders() });
    const reservations = await response.json();

    const reservaEncontrada = reservations.find((r: any) => r.roomNumber == roomNumber);

    if (!reservaEncontrada) {
      throw new Error(`Não foi encontrada reserva ativa para o quarto ${roomNumber}.`);
    }

    const checkoutResponse = await fetch(`${API_URL}/checkout`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ reservationId: reservaEncontrada.id })
    });

    if (!checkoutResponse.ok) {
        const err = await checkoutResponse.json();
        throw new Error(err.error || 'Erro ao realizar checkout');
    }
    
    return checkoutResponse.json();
  }
};
