// src/store/authStore.ts
import { create } from 'zustand';
import { User } from '@/types'; // <-- Gunakan tipe User dari file types/index.ts

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void; // Tambahkan fungsi ini untuk update user
}

// Coba ambil data user dari local storage saat inisialisasi
const getInitialUser = (): User | null => {
    if (typeof window === 'undefined') return null;
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('accessToken') : false,
  login: (user, token) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user)); // Simpan user ke local storage
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user'); // Hapus user dari local storage
    set({ user: null, token: null, isAuthenticated: false });
  },
  // Fungsi untuk memperbarui data user (misal setelah edit profil)
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  }
}));