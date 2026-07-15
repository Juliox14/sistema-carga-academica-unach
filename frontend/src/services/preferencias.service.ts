import api from './api';

export interface PreferenciaDocente {
  id?: number;
  dia_semana: string;
  tipo_preferencia: 'PREFERIR' | 'EVITAR' | 'NEUTRAL';
  horas_bloqueadas?: string | null;
}

export const preferenciasService = {
  obtenerMisPreferencias: async (): Promise<PreferenciaDocente[]> => {
    const response = await api.get<PreferenciaDocente[]>('/preferencias/mi-preferencia');
    return response.data;
  },

  guardarMisPreferencias: async (preferencias: PreferenciaDocente[]): Promise<PreferenciaDocente[]> => {
    const response = await api.post<PreferenciaDocente[]>('/preferencias/mi-preferencia', {
      preferencias: preferencias.map(p => ({
        dia_semana: p.dia_semana,
        tipo_preferencia: p.tipo_preferencia,
        horas_bloqueadas: p.horas_bloqueadas || null
      }))
    });
    return response.data;
  }
};
