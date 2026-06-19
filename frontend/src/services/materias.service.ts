import api from './api';
import type { Materia } from '../types/materias';

export const materiasService = {
  obtenerTodos: async () => {
    const response = await api.get<Materia[]>('/materias/');
    return response.data;
  },
  crear: async (materia: Omit<Materia, 'id'>) => {
    const response = await api.post<Materia>('/materias/', materia);
    return response.data;
  },
  actualizar: async (id: number, materia: Partial<Materia>) => {
    const response = await api.put<Materia>(`/materias/${id}`, materia);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/materias/${id}`);
    return response.data;
  }
};