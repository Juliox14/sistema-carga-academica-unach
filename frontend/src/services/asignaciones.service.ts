import api from './api';
import type { CatalogosBaseResponse, DocenteFiltrado, ResumenCargaResponse } from '../types/asignaciones';

export const asignacionesService = {
  obtenerCatalogosBase: async () => {
    const response = await api.get<CatalogosBaseResponse>('/asignaciones/catalogos-base');
    return response.data;
  },
  
  obtenerDocentesFiltrados: async (categoriaId?: number | '', query?: string) => {
    const params: Record<string, any> = {};
    if (categoriaId !== '') params.categoria_id = categoriaId;
    if (query !== '') params.query = query;

    const response = await api.get<DocenteFiltrado[]>('/asignaciones/docentes', { params });
    return response.data;
  },

  obtenerResumenCarga: async () => {
    const response = await api.get<ResumenCargaResponse>('/asignaciones/resumen-carga');
    return response.data;
  },

  obtenerVacantes: async () => {
    const response = await api.get<any[]>('/asignaciones/vacantes');
    return response.data;
  }
};