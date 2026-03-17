import api from './api';

export const chatroomService = {
  listChatrooms: async () => {
    const response = await api.get('/api/auth/chatrooms/');
    // Handle both array and object responses
    return Array.isArray(response.data) ? response.data : response.data.results || [];
  },

  createChatroom: async (chatroomData) => {
    const response = await api.post('/api/auth/chatrooms/create/', chatroomData);
    return response.data;
  },

  getChatroomDetails: async (chatroomId) => {
    const response = await api.get(`/api/auth/chatrooms/${chatroomId}/`);
    return response.data;
  },

  joinChatroom: async (chatroomId) => {
    const response = await api.post(`/api/auth/chatrooms/${chatroomId}/join/`);
    return response.data;
  },

  leaveChatroom: async (chatroomId) => {
    const response = await api.post(`/api/auth/chatrooms/${chatroomId}/leave/`);
    return response.data;
  },

  deleteChatroom: async (chatroomId) => {
    const response = await api.delete(`/api/auth/chatrooms/${chatroomId}/delete/`);
    return response.data;
  },

  removeMember: async (chatroomId, memberId) => {
    const response = await api.delete(`/api/auth/chatrooms/${chatroomId}/members/${memberId}/remove/`);
    return response.data;
  },
};

