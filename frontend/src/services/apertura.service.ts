import api from './api';

export interface GrupoSugerido {
  grupo: string;
  turno: string;
  es_especial?: boolean;
}

export interface PeriodoSugerido {
  numero_periodo: number;
  sugerencias: GrupoSugerido[];
}

export interface SugerenciaAperturaResponse {
  periodos: PeriodoSugerido[];
}

export interface GrupoAperturaInput {
  numero_periodo: number;
  grupo: string;
  turno: string;
  es_especial?: boolean;
}

export interface GrupoAbiertoResponse {
  id: number;
  ciclo_escolar_id: number;
  ciclo_escolar_nombre: string;
  plan_estudios_id: number;
  plan_estudios_nombre: string;
  numero_periodo: number;
  grupo: string;
  turno: string;
  es_especial: boolean;
}

export const aperturaService = {
  obtenerSugerencias: async (planId: number): Promise<PeriodoSugerido[]> => {
    const response = await api.get<SugerenciaAperturaResponse>(`/aperturas/sugerencias/${planId}`);
    return response.data.periodos;
  },
  
  ejecutar: async (payload: { plan_estudios_id: number; grupos: GrupoAperturaInput[] }) => {
    const response = await api.post('/aperturas/ejecutar', payload);
    return response.data;
  },

  obtenerAbiertos: async (): Promise<GrupoAbiertoResponse[]> => {
    const response = await api.get<GrupoAbiertoResponse[]>('/aperturas/abiertos');
    return response.data;
  },

  eliminarGrupoAbierto: async (grupoId: number) => {
    const response = await api.delete(`/aperturas/grupos-abiertos/${grupoId}`);
    return response.data;
  }
};