import { create } from 'zustand';
import api from '../../../services/api';
import type { Token } from '../../../types/asignaciones'; // We can define a simplified type here or reuse a general one.

interface UserProfile {
  email: string;
  rol: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  cargarPerfil: () => Promise<boolean>;
  cambiarPasswordPropia: (passwordActual: string, nuevaPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('sipad_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/login', {
        email_institucional: email,
        password: password
      });

      const { access_token, rol } = response.data;
      localStorage.setItem('sipad_token', access_token);

      set({
        token: access_token,
        user: { email, rol },
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('sipad_token');
    set({ user: null, token: null });
  },

  cargarPerfil: async () => {
    const { token } = get();
    if (!token) return false;

    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      const { email_institucional, rol_clave } = response.data;
      
      set({
        user: { email: email_institucional, rol: rol_clave },
        isLoading: false
      });
      return true;
    } catch (error) {
      console.error('Error al cargar perfil de usuario:', error);
      localStorage.removeItem('sipad_token');
      set({ user: null, token: null, isLoading: false });
      return false;
    }
  },

  cambiarPasswordPropia: async (passwordActual, nuevaPassword) => {
    set({ isLoading: true });
    try {
      await api.patch('/auth/usuarios/me/change-password', {
        password_actual: passwordActual,
        nueva_password: nuevaPassword
      });
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
