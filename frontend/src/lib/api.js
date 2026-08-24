// src/lib/api.js — Axios API client
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor: handle 401 auto-refresh ────────────
api.interceptors.response.use(
  res => res,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 429 && error.response?.data?.error === 'MONTHLY_QUOTA_EXCEEDED') {
      toast.error(error.response?.data?.message || '⚠️ இந்த மாதத்திற்கான 50 கடித வரம்பு முடிவடைந்தது. வரம்பற்ற கடிதங்களுக்கு Pro திட்டத்திற்கு மாறவும்.');
      return Promise.reject(error);
    }

    if (error.response?.status === 402) {
      toast.error(error.response?.data?.message || '🔒 உங்கள் சோதனைக் காலம் முடிவடைந்தது. சந்தாவை புதுப்பிக்கவும்.');
      if (window.location.pathname !== '/subscription' && window.location.pathname !== '/payment') {
        window.location.href = '/subscription';
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
