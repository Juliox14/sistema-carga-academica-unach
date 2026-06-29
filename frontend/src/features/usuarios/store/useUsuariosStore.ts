import { create } from 'zustand';
import api from '../../../services/api';

export interface Usuario {
  id: number;
  email_institucional: string;
  rol_id: number;
  activo: boolean;
  rol_clave: string;
  rol_nombre: string;
}

export interface Rol {
  id: number;
  nombre: string;
  clave: string;
}

interface UsuariosState {
  usuarios: Usuario[];
  roles: Rol[];
  isLoading: boolean;

  fetchUsuarios: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  crearUsuario: (email: string, password: string, claveRol: string) => Promise<void>;
  toggleActivo: (usuarioId: number) => Promise<void>;
  cambiarRol: (usuarioId: number, claveRol: string) => Promise<void>;
  eliminarUsuario: (usuarioId: number) => Promise<void>;
  restablecerPassword: (usuarioId: number, nuevaPassword: string) => Promise<void>;
}

export const useUsuariosStore = create<UsuariosState>((set, get) => ({
  usuarios: [],
  roles: [],
  isLoading: false,

  fetchUsuarios: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/auth/usuarios');
      set({ usuarios: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchRoles: async () => {
    try {
      const response = await api.get('/auth/roles');
      set({ roles: response.data });
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  },

  crearUsuario: async (email, password, claveRol) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/registro', {
        email_institucional: email,
        password: password,
        clave_rol: claveRol
      });
      // Volver a listar para tener la tabla actualizada
      const response = await api.get('/auth/usuarios');
      set({ usuarios: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  toggleActivo: async (usuarioId) => {
    try {
      const response = await api.patch(`/auth/usuarios/${usuarioId}/toggle-activo`);
      const updatedUsuario = response.data;
      
      set((state) => ({
        usuarios: state.usuarios.map((u) => 
          u.id === usuarioId ? { ...u, ...updatedUsuario } : u
        )
      }));
    } catch (error) {
      console.error('Error al alternar estado activo del usuario:', error);
      throw error;
    }
  },

  cambiarRol: async (usuarioId, claveRol) => {
    try {
      const response = await api.patch(`/auth/usuarios/${usuarioId}/rol`, {
        clave_rol: claveRol
      });
      const updatedUsuario = response.data;

      set((state) => ({
        usuarios: state.usuarios.map((u) => 
          u.id === usuarioId ? { ...u, ...updatedUsuario } : u
        )
      }));
    } catch (error) {
      console.error('Error al cambiar rol del usuario:', error);
      throw error;
    }
  },

  eliminarUsuario: async (usuarioId) => {
    try {
      await api.delete(`/auth/usuarios/${usuarioId}`);
      set((state) => ({
        usuarios: state.usuarios.filter((u) => u.id !== usuarioId)
      }));
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      throw error;
    }
  },

  restablecerPassword: async (usuarioId, nuevaPassword) => {
    try {
      const response = await api.patch(`/auth/usuarios/${usuarioId}/reset-password`, {
        nueva_password: nuevaPassword
      });
      const updatedUsuario = response.data;
      set((state) => ({
        usuarios: state.usuarios.map((u) => 
          u.id === usuarioId ? { ...u, ...updatedUsuario } : u
        )
      }));
    } catch (error) {
      console.error('Error al restablecer contraseña de usuario:', error);
      throw error;
    }
  }
}));
