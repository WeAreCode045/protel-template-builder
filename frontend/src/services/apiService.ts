import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request. use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  }
};

// Placeholders
export const placeholderService = {
  getAll: async () => {
    const response = await api.get('/placeholders');
    return response. data;
  },
  getData: async () => {
    const response = await api.get('/placeholders/data');
    return response.data;
  },
  create: async (placeholder: any) => {
    const response = await api.post('/placeholders', placeholder);
    return response.data;
  },
  update: async (id: string, placeholder: any) => {
    const response = await api.put(`/placeholders/${id}`, placeholder);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/placeholders/${id}`);
    return response.data;
  }
};

// Documents
export const documentService = {
  getAll: async () => {
    const response = await api.get('/documents');
    return response. data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  upload: async (file: File, content: string, name?:  string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('content', content);
    if (name) formData.append('name', name);

    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  update: async (id: string, content: string, changeDescription?: string) => {
    const response = await api.put(`/documents/${id}`, { content, changeDescription });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
  }
};

// Versions
export const versionService = {
  getHistory: async (documentId: string) => {
    const response = await api.get(`/versions/${documentId}`);
    return response.data;
  },
  getVersion: async (documentId: string, versionNumber: number) => {
    const response = await api.get(`/versions/${documentId}/${versionNumber}`);
    return response.data;
  },
  restore: async (documentId: string, versionNumber: number) => {
    const response = await api.post(`/versions/${documentId}/${versionNumber}/restore`);
    return response.data;
  }
};

export default api;