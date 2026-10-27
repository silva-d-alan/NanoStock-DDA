import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000', // Forçando a porta correta
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Vamos DESATIVAR o redirecionamento automático por enquanto para descobrir o erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na API:', error.message, error.response?.data);
    return Promise.reject(error);
  }
);