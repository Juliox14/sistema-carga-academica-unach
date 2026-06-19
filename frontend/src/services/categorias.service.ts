import api from './api';
import type { CategoriaDocente } from '../types/categorias';

export const categoriasService = {
  obtenerTodos: async () => {
    const response = await api.get<CategoriaDocente[]>('/categorias/');
    return response.data;
  },
  crear: async (categoria: Omit<CategoriaDocente, 'id'>) => {
    const response = await api.post<CategoriaDocente>('/categorias/', categoria);
    return response.data;
  },
  actualizar: async (id: number, categoria: Partial<CategoriaDocente>) => {
    const response = await api.put<CategoriaDocente>(`/categorias/${id}`, categoria);
    return response.data;
  },
  eliminar: async (id: number) => {
    const response = await api.delete(`/categorias/${id}`);
    return response.data;
  }
};