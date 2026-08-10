import { create } from 'zustand';
import api from '../../../services/api';

export interface Plantilla {
  id: number;
  nombre: string;
  tipos_contrato: string[];
  contenido_html: string;
  requiere_firma: boolean;
  es_activa: boolean;
  lugar_emision?: string;
  asunto?: string;
  destinatarios?: string;
  cuerpo_html?: string;
  despedida?: string;
  remitente_nombre?: string;
  remitente_cargo?: string;
  con_copia_para?: string;
}

export interface OficioDocente {
  id: number;
  docente_id: number;
  docente_nombre: string;
  ciclo_id: number;
  ciclo_nombre: string;
  plantilla_id: number;
  plantilla_nombre: string;
  estado: string;
  numero_oficio: string;
  fecha_emision: string;
  fecha_lectura: string | null;
  fecha_firma: string | null;
  ip_firma: string | null;
  hash_firma: string | null;
  tipo_contrato?: string;
  contenido_html: string | null;
  requiere_firma: boolean;
  observaciones_rechazo?: string;
}

interface OficiosState {
  plantillas: Plantilla[];
  oficiosEmitidos: OficioDocente[];
  miOficio: OficioDocente | null;
  isLoading: boolean;

  fetchPlantillas: () => Promise<void>;
  crearPlantilla: (payload: Omit<Plantilla, 'id' | 'es_activa' | 'contenido_html'>) => Promise<void>;
  activarPlantilla: (id: number) => Promise<void>;
  emitirOficios: (categorias?: string[], folioPrefijo?: string, folioInicial?: number, folioSufijo?: string) => Promise<{ mensaje: string; total: number }>;
  fetchOficiosEmitidos: () => Promise<void>;
  fetchMiOficio: () => Promise<void>;
  leerMiOficio: () => Promise<void>;
  firmarMiOficio: (password: string) => Promise<void>;
  rechazarMiOficio: (observaciones: string) => Promise<void>;
  actualizarPlantilla: (id: number, payload: Omit<Plantilla, 'id' | 'es_activa' | 'contenido_html'>) => Promise<void>;
  eliminarPlantilla: (id: number) => Promise<void>;
}

export const useOficiosStore = create<OficiosState>((set, get) => ({
  plantillas: [],
  oficiosEmitidos: [],
  miOficio: null,
  isLoading: false,

  fetchPlantillas: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/oficios/plantillas');
      set({ plantillas: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  crearPlantilla: async (payload) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/oficios/plantillas', payload);
      set((state) => ({
        plantillas: [...state.plantillas, response.data],
        isLoading: false
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  activarPlantilla: async (id) => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/oficios/plantillas/${id}/activar`);
      await get().fetchPlantillas();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  emitirOficios: async (categorias, folioPrefijo, folioInicial, folioSufijo) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/oficios/emitir', {
        categorias: categorias || null,
        folio_prefijo: folioPrefijo || null,
        folio_inicial: folioInicial !== undefined ? folioInicial : null,
        folio_sufijo: folioSufijo || null
      });
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchOficiosEmitidos: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/oficios/emitidos');
      set({ oficiosEmitidos: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchMiOficio: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/oficios/mi-oficio');
      set({ miOficio: response.data, isLoading: false });
    } catch (error) {
      set({ miOficio: null, isLoading: false });
      throw error;
    }
  },

  leerMiOficio: async () => {
    const { miOficio } = get();
    if (!miOficio || miOficio.estado !== 'EMITIDO') return;

    try {
      const response = await api.patch('/oficios/mi-oficio/leer');
      set({ miOficio: response.data });
    } catch (error) {
      console.error('Error al registrar lectura de oficio:', error);
    }
  },

  firmarMiOficio: async (password) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/oficios/mi-oficio/firmar', { password });
      set({ miOficio: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  rechazarMiOficio: async (observaciones) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/oficios/mi-oficio/rechazar', { observaciones });
      set({ miOficio: response.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  actualizarPlantilla: async (id, payload) => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/oficios/plantillas/${id}`, payload);
      set((state) => ({
        plantillas: state.plantillas.map((p) => (p.id === id ? response.data : p)),
        isLoading: false
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  eliminarPlantilla: async (id) => {
    set({ isLoading: true });
    try {
      await api.delete(`/oficios/plantillas/${id}`);
      set((state) => ({
        plantillas: state.plantillas.filter((p) => p.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  }
}));
