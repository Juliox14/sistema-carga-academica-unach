import { create } from 'zustand';
import api from '../../../services/api'; 

// 1. Tipamos nuestro objeto de configuraciones para que TypeScript nos ayude
export interface AppConfig {
  DESCARGA_MOTIVO_OBLIGATORIO: boolean;
  PERMITIR_HORAS_EXCEDENTES: boolean;
  MAX_HORAS_EXCEDENTES: number;
  MAX_CICLOS_CONSECUTIVOS: number;
  PESOS_SUGERENCIAS: {
    historial: number;
    area: number;
    turno: number;
    prioridad: number;
    carga: number;
  };
}

// 2. Valores por defecto (Fallback) por si la red falla o está cargando
const defaultConfigs: AppConfig = {
  DESCARGA_MOTIVO_OBLIGATORIO: true,
  PERMITIR_HORAS_EXCEDENTES: false,
  MAX_HORAS_EXCEDENTES: 0,
  MAX_CICLOS_CONSECUTIVOS: 0,
  PESOS_SUGERENCIAS: { historial: 35, area: 25, turno: 15, prioridad: 15, carga: 10 },
};

interface ConfigState {
  configs: AppConfig;
  isLoading: boolean;
  fetchConfigs: () => Promise<void>;
  updateConfigItem: (clave: keyof AppConfig, valor: any) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  configs: defaultConfigs,
  isLoading: false,

  // --- OBTENER CONFIGURACIONES DEL BACKEND ---
  fetchConfigs: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get<{clave: string, valor: string}[]>('/configuraciones/');
      
      // Transformamos el array [{clave: 'X', valor: 'true'}] en un objeto { X: true }
      const parsedConfigs = { ...defaultConfigs };
      
      data.forEach((item) => {
        if (item.clave === 'DESCARGA_MOTIVO_OBLIGATORIO' || item.clave === 'PERMITIR_HORAS_EXCEDENTES') {
          parsedConfigs[item.clave] = item.valor.toLowerCase() === 'true';
        } 
        else if (item.clave === 'MAX_HORAS_EXCEDENTES' || item.clave === 'MAX_CICLOS_CONSECUTIVOS') {
          parsedConfigs[item.clave] = parseInt(item.valor, 10) || 0;
        }
        else if (item.clave === 'PESOS_SUGERENCIAS') {
            try {
                parsedConfigs[item.clave] = JSON.parse(item.valor);
            } catch (e) {
                console.error(`Error parsing PESOS_SUGERENCIAS: ${e}`);
                parsedConfigs[item.clave] = defaultConfigs.PESOS_SUGERENCIAS;
            }
        }
      });

      set({ configs: parsedConfigs, isLoading: false });
    } catch (error) {
      console.error('Error al cargar configuraciones:', error);
      set({ isLoading: false }); // Se queda con los defaultConfigs
    }
  },

  // --- ACTUALIZAR EL ESTADO LOCAL DESPUÉS DE GUARDAR ---
  // Esta función la llamaremos después de que el PUT sea exitoso
  updateConfigItem: (clave, valor) => {
    set((state) => ({
      configs: {
        ...state.configs,
        [clave]: valor
      }
    }));
  }
}));