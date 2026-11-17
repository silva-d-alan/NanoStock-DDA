import axios from 'axios';
import { montarBaseUrl } from './apiUrl';

export const api = axios.create({
  baseURL: montarBaseUrl(import.meta.env.VITE_API_URL),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const naTelaDeLogin = window.location.pathname.includes('/login');
    if (error.response?.status === 401 && !naTelaDeLogin) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);