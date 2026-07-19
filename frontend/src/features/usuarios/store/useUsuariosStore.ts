import { create } from 'zustand';
import api from '../../../services/api';

export interface Usuario {
  id: number;
  email_institucional: string;
  rol_id: number;
  activo: boolean;
  rol_clave: string;
  rol_nombre: string;
  unidad_academica_id?: number;
  unidad_academica_clave?: string;
  unidad_academica_nombre?: string;
}

export interface Rol {
  id: number;
  nombre: string;
  clave: string;
}

interface UsuariosState {
  usuarios: Usuario[];
  roles: Rol[];
  docentesSinUsuario: any[];
  isLoading: boolean;

  fetchUsuarios: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchDocentesSinUsuario: () => Promise<void>;
  crearUsuario: (email: string, password: string | null, claveRol: string, docenteId?: number | null, unidadAcademicaId?: number | null, nombre?: string | null) => Promise<any>;
  toggleActivo: (usuarioId: number) => Promise<void>;
  cambiarRol: (usuarioId: number, claveRol: string) => Promise<void>;
  eliminarUsuario: (usuarioId: number) => Promise<void>;
  restablecerPassword: (usuarioId: number, nuevaPassword: string) => Promise<void>;
}

export const useUsuariosStore = create<UsuariosState>((set) => ({
  usuarios: [],
  roles: [],
  docentesSinUsuario: [],
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

  fetchDocentesSinUsuario: async () => {
    try {
      const response = await api.get('/auth/usuarios/docentes-sin-usuario');
      set({ docentesSinUsuario: response.data });
    } catch (error) {
      console.error('Error al cargar docentes sin usuario:', error);
    }
  },

  crearUsuario: async (email, password, claveRol, docenteId, unidadAcademicaId, nombre) => {
    set({ isLoading: true });
    try {
      const payload = {
        email_institucional: email,
        password: password || undefined,
        clave_rol: claveRol,
        docente_id: docenteId || undefined,
        unidad_academica_id: unidadAcademicaId || undefined,
        nombre: nombre || undefined,
      };
      
      const response = await api.post('/auth/registro', payload);
      const data = response.data;
      
      // Volver a listar para tener la tabla actualizada
      const listResponse = await api.get('/auth/usuarios');
      
      set((state) => ({ 
        usuarios: listResponse.data,
        isLoading: false,
        // Limpiar el docente creado de la lista de docentes sin usuario
        docentesSinUsuario: docenteId ? state.docentesSinUsuario.filter((d) => d.id !== docenteId) : state.docentesSinUsuario
      }));
      
      return data;
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
