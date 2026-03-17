import api from './api';

export const authService = {
  register: async (userData) => {
    const response = await api.post('/api/auth/register/', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/api/auth/login/', credentials);
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout/');
    } finally {
      localStorage.removeItem('authToken');
    }
  },

  getProfile: async () => {
    const response = await api.get('/api/auth/profile/');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/api/auth/profile/update/', profileData);
    return response.data;
  },
};

