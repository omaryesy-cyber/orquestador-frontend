const API_URL = import.meta.env.VITE_API_URL || '/api';

export const authAPI = {
  signup: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al registrarse');
    return data;
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Credenciales inválidas');
    if (!data.token) throw new Error('Respuesta inválida');
    return data;
  }
};

export const requisitosAPI = {
  getAll: async (token) => {
    const response = await fetch(`${API_URL}/requisitos`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Error al cargar requisitos');
    return response.json();
  },

  create: async (token, data) => {
    const response = await fetch(`${API_URL}/requisitos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear requisito');
    return response.json();
  }
};
