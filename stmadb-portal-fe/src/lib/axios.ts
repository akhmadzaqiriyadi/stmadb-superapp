// src/lib/axios.ts

import axios from 'axios';

const api = axios.create({
  // Hapus "_BASE" dari nama variabel
  baseURL: process.env.NEXT_PUBLIC_API_URL, 
});

// Nanti kita akan tambahkan interceptor di sini untuk token JWT
api.interceptors.request.use(config => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export default api;