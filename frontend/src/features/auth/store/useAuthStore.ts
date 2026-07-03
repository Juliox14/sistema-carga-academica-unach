import { create } from 'zustand';
import api from '../../../services/api';

interface UserProfile {
  email: string;
  rol: string;
  requiere_cambio_password: boolean;
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

      const { access_token } = response.data;
      localStorage.setItem('sipad_token', access_token);

      set({ token: access_token });
      await get().cargarPerfil();
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
      const { email_institucional, rol_clave, requiere_cambio_password } = response.data;
      
      set({
        user: { 
          email: email_institucional, 
          rol: rol_clave, 
          requiere_cambio_password: requiere_cambio_password 
        },
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
      
      // Actualizar localmente requiere_cambio_password a false
      set((state) => {
        if (state.user) {
          return {
            user: { ...state.user, requiere_cambio_password: false },
            isLoading: false
          };
        }
        return { isLoading: false };
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
