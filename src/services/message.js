import api from './api';

export const messageService = {
  sendMessage: async (chatroomId, content) => {
    const response = await api.post(`/api/auth/chatrooms/${chatroomId}/send-message/`, {
      content,
    });
    return response.data;
  },

  getMessages: async (chatroomId, page = 1, pageSize = 50) => {
    const response = await api.get(`/api/auth/chatrooms/${chatroomId}/messages/`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  searchMessages: async (chatroomId, query) => {
    const response = await api.get(`/api/auth/chatrooms/${chatroomId}/search/`, {
      params: { q: query },
    });
    return response.data;
  },
};

