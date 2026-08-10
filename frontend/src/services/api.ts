import axios from 'axios';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL.slice(0, -1) : rawBaseURL;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sipad_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;