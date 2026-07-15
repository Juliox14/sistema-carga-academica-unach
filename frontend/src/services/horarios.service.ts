import api from './api';

export interface HorarioClase {
  id: number;
  asignacion_carga_id: number;
  materia_nombre: string;
  docente_nombre: string;
  dia_semana: string;
  hora_inicio: number;
  hora_fin: number;
}

export interface SugerenciaSlot {
  dia_semana: string;
  hora_inicio: number;
  hora_fin: number;
  afinidad: 'ALTA' | 'MEDIA' | 'BAJA' | 'CONFLICTO';
  razon: string;
}

export interface GrupoAsignacion {
  id: number;
  materia_id: number;
  materia_nombre: string;
  materia_hsm: number;
  horas_programadas: number;
  docente_nombre: string;
}

export const horariosService = {
  obtenerAsignacionesGrupo: async (grupoId: number): Promise<GrupoAsignacion[]> => {
    const response = await api.get<GrupoAsignacion[]>(`/horarios/asignaciones-grupo/${grupoId}`);
    return response.data;
  },

  obtenerHorariosGrupo: async (grupoId: number): Promise<HorarioClase[]> => {
    const response = await api.get<HorarioClase[]>(`/horarios/grupo/${grupoId}`);
    return response.data;
  },

  programarBloque: async (asignacionCargaId: number, diaSemana: string, horaInicio: number, duracion: number = 1): Promise<HorarioClase> => {
    const response = await api.post<HorarioClase>('/horarios/programar', {
      asignacion_carga_id: asignacionCargaId,
      dia_semana: diaSemana,
      hora_inicio: horaInicio,
      duracion: duracion
    });
    return response.data;
  },

  desprogramarBloque: async (horarioId: number): Promise<void> => {
    await api.delete(`/horarios/${horarioId}`);
  },

  obtenerSugerencias: async (asignacionId: number): Promise<SugerenciaSlot[]> => {
    const response = await api.get<{ sugerencias: SugerenciaSlot[] }>(`/horarios/sugerencias/${asignacionId}`);
    return response.data.sugerencias;
  }
};
