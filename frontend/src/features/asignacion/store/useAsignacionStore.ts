import { create } from 'zustand';
import api from '../../../services/api';
import { isAxiosError } from 'axios';
import type { ActividadBaseDTO, TabType, MateriaAsignadaDTO, OtraActividadAsignadaDTO, MateriaDisponibleDTO, TableroDocenteResponse, MateriaSugeridaDTO, ResumenCargaResponse, CategoriaDocente } from '../../../types/asignaciones';
import toast from 'react-hot-toast';
import { asignacionesService } from '../../../services/asignaciones.service';

interface AsignacionState {
  nombreDocente: string;
  // UI States
  activeTab: TabType;
  hasChanges: boolean;
  isLoading: boolean;
  docenteSeleccionadoId: number | null;
  planEstudioSeleccionadoId: number | null;
  actividadesDisponibles: ActividadBaseDTO[];

  // Data
  materiasDisponibles: MateriaDisponibleDTO[];
  cargaAsignada: MateriaAsignadaDTO[];
  descargas: MateriaAsignadaDTO[];
  otrasActividades: OtraActividadAsignadaDTO[];
  selectedMateriaIds: string[];


  materiasSugeridas: MateriaSugeridaDTO[];

  // Metadatos
  hsmBase: number;
  horasFrenteGrupo: number;
  horasDescargadas: number;
  horasOtrasActividades: number;
  sumaTotal: number;
  resumenCarga: ResumenCargaResponse | null;
  selectedCategoriaId: number | '';
  categoriasDocentes: CategoriaDocente[];

  // Acciones
  setActiveTab: (tab: TabType) => void;
  setDocente: (docenteId: number) => void;
  setPlanEstudio: (planId: number) => void;
  setActividadesDisponibles: (actividades: ActividadBaseDTO[]) => void;
  toggleMateriaSelection: (dragId: string) => void;
  clearSelection: () => void;

  // Peticiones GET
  fetchTablero: () => Promise<void>;
  fetchDisponibles: () => Promise<void>;

  // Peticiones POST / DELETE (Carga Académica)
  vincularMateria: (materiaId: number, grupoAbiertoId: number) => Promise<void>;
  desvincularMateria: (asignacionId: number) => Promise<void>;

  // Peticiones POST / DELETE (Descargas)
  asignarDescarga: (asignacionId: number, motivo: string) => Promise<void>;
  removerDescarga: (asignacionId: number) => Promise<void>;

  // Peticiones POST / DELETE (Otras Actividades)
  asignarOtraActividad: (actividadId: number, horas: number, observaciones?: string) => Promise<void>;
  eliminarOtraActividad: (asignacionActividadId: number) => Promise<void>;
  fetchSugerencias: () => Promise<void>;
  fetchResumenCarga: () => Promise<void>;
  setSelectedCategoriaId: (id: number | '') => void;
  setCategoriasDocentes: (categorias: CategoriaDocente[]) => void;
}

export const useAsignacionStore = create<AsignacionState>((set, get) => ({
  activeTab: 'carga',
  actividadesDisponibles: [],
  hasChanges: false,
  isLoading: false,
  docenteSeleccionadoId: null,
  planEstudioSeleccionadoId: null,
  nombreDocente: '',

  materiasDisponibles: [],
  cargaAsignada: [],
  descargas: [],
  otrasActividades: [],
  selectedMateriaIds: [],
  materiasSugeridas: [],

  hsmBase: 40,
  horasFrenteGrupo: 0,
  horasDescargadas: 0,
  horasOtrasActividades: 0,
  sumaTotal: 0,
  resumenCarga: null,
  selectedCategoriaId: '',
  categoriasDocentes: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActividadesDisponibles: (actividades) => set({ actividadesDisponibles: actividades }),



  // Desacoplado: Carga el tablero del docente e intenta refrescar catálogos/sugerencias
  setDocente: (docenteId) => {
    set({ docenteSeleccionadoId: docenteId });
    get().fetchTablero();

    if (get().planEstudioSeleccionadoId) {
      get().fetchDisponibles();
      get().fetchSugerencias();
    }
  },

  setPlanEstudio: (planId) => {
    set({ planEstudioSeleccionadoId: planId });
    get().fetchDisponibles();

    if (get().docenteSeleccionadoId) {
      get().fetchSugerencias(); // <-- Llama a la IA de sugerencias
    }
  },

  fetchTablero: async () => {
    const { docenteSeleccionadoId } = get();
    if (!docenteSeleccionadoId) return;

    set({ isLoading: true });
    try {
      const { data } = await api.get<TableroDocenteResponse>(`/asignaciones/tablero/${docenteSeleccionadoId}`);

      set({
        nombreDocente: data.nombre_completo, // Guardamos el nombre real devuelto por la API
        cargaAsignada: data.carga_academica,
        descargas: data.descargas,
        otrasActividades: data.otras_actividades,
        hsmBase: data.hsm_base,
        horasFrenteGrupo: data.horas_frente_grupo,
        horasDescargadas: data.horas_descargadas,
        horasOtrasActividades: data.horas_otras_actividades,
        sumaTotal: data.suma_total,
      });
    } catch (error) {
      console.error('Error al obtener el tablero:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchDisponibles: async () => {
    const { docenteSeleccionadoId, planEstudioSeleccionadoId } = get();

    // ¡Ahora solo necesitamos el plan para mostrar el catálogo!
    if (!planEstudioSeleccionadoId) return;

    set({ isLoading: true });
    try {
      // Preparamos los parámetros, agregando el docente solo si existe
      const params: any = { plan_id: planEstudioSeleccionadoId };
      if (docenteSeleccionadoId) {
        params.docente_id = docenteSeleccionadoId;
      }

      const { data } = await api.get<MateriaDisponibleDTO[]>('/asignaciones/disponibles', { params });
      set({ materiasDisponibles: data });
    } catch (error) {
      console.error('Error al obtener disponibles:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSugerencias: async () => {
    const { docenteSeleccionadoId, planEstudioSeleccionadoId } = get();

    // Si falta el docente o el plan, limpiamos el panel de sugerencias y salimos
    if (!docenteSeleccionadoId || !planEstudioSeleccionadoId) {
      set({ materiasSugeridas: [] });
      return;
    }

    try {
      const { data } = await api.get<MateriaSugeridaDTO[]>('/asignaciones/sugerencias', {
        params: {
          docente_id: docenteSeleccionadoId,
          plan_id: planEstudioSeleccionadoId
        }
      });
      set({ materiasSugeridas: data });
    } catch (error) {
      console.error('Error al obtener sugerencias del servidor:', error);
      set({ materiasSugeridas: [] });
    }
  },

  fetchResumenCarga: async () => {
    try {
      const data = await asignacionesService.obtenerResumenCarga();
      set({ resumenCarga: data });
    } catch (error) {
      console.error('Error al obtener el resumen de carga:', error);
    }
  },

  setSelectedCategoriaId: (id) => set({ selectedCategoriaId: id }),
  setCategoriasDocentes: (categorias) => set({ categoriasDocentes: categorias }),


  vincularMateria: async (materiaId: number, grupoAbiertoId: number) => {
    const { docenteSeleccionadoId } = get();
    if (!docenteSeleccionadoId) return;

    set({ isLoading: true });
    try {
      await api.post('/asignaciones/vincular', {
        materia_id: materiaId,
        grupo_abierto_id: grupoAbiertoId,
        docente_id: docenteSeleccionadoId
      });

      await get().fetchTablero();
      await get().fetchDisponibles();
      await get().fetchSugerencias();
      await get().fetchResumenCarga();
      toast.success('Materia asignada exitosamente');

    } catch (error: any) {
      if (isAxiosError(error) && error.response?.status === 400) {
        const mensajeServidor = error.response.data.detail;
        toast.error(mensajeServidor);
      } else {
        toast.error('Error al vincular materia');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  desvincularMateria: async (asignacionId: number) => {
    set({ isLoading: true });
    try {
      await api.delete(`/asignaciones/desvincular/${asignacionId}`);

      await get().fetchTablero();
      await get().fetchDisponibles();
      await get().fetchSugerencias();
      await get().fetchResumenCarga();
      toast.success('Materia desvinculada exitosamente');
    } catch (error: any) {
      console.error('Error al desvincular:', error);
      toast.error(error.response?.data?.detail || 'Error al desvincular materia');
    } finally {
      set({ isLoading: false });
    }
  },

  toggleMateriaSelection: (dragId: string) => {
    const { selectedMateriaIds } = get();
    if (selectedMateriaIds.includes(dragId)) {
      set({ selectedMateriaIds: selectedMateriaIds.filter(id => id !== dragId) });
    } else {
      set({ selectedMateriaIds: [...selectedMateriaIds, dragId] });
    }
  },

  clearSelection: () => set({ selectedMateriaIds: [] }),

  // ==========================================
  // DESCARGAS
  // ==========================================
  asignarDescarga: async (asignacionId: number, motivo: string) => {
    set({ isLoading: true });
    try {
      await api.post('/asignaciones/descargar', {
        asignacion_id: asignacionId,
        motivo_descarga: motivo
      });

      await get().fetchTablero();
      await get().fetchDisponibles();
      await get().fetchSugerencias();
      await get().fetchResumenCarga();
      toast.success('Descarga asignada exitosamente');
    } catch (error: any) {
      console.error('Error al asignar descarga:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar la descarga');
    } finally {
      set({ isLoading: false });
    }
  },

  removerDescarga: async (asignacionId: number) => {
    set({ isLoading: true });
    try {
      await api.delete(`/asignaciones/remover-descarga/${asignacionId}`);

      await get().fetchTablero();
      await get().fetchDisponibles();
      await get().fetchSugerencias();
      await get().fetchResumenCarga();
      toast.success('Descarga revertida exitosamente');
    } catch (error: any) {
      console.error('Error al remover descarga:', error);
      toast.error(error.response?.data?.detail || 'Error al revertir la descarga');
    } finally {
      set({ isLoading: false });
    }
  },

  // ==========================================
  // OTRAS ACTIVIDADES
  // ==========================================
  asignarOtraActividad: async (actividadId: number, horas: number, observaciones?: string) => {
    const { docenteSeleccionadoId } = get();
    if (!docenteSeleccionadoId) return;

    set({ isLoading: true });
    try {
      await api.post('/asignaciones/actividades', {
        docente_id: docenteSeleccionadoId,
        actividad_id: actividadId,
        horas_asignadas: horas,
        observaciones: observaciones || null
      });

      await get().fetchTablero();
      await get().fetchSugerencias();
      await get().fetchResumenCarga();
      toast.success('Actividad asignada exitosamente');
    } catch (error: any) {
      console.error('Error al asignar otra actividad:', error);
      toast.error(error.response?.data?.detail || 'Error al asignar la actividad');
    } finally {
      set({ isLoading: false });
    }
  },

  eliminarOtraActividad: async (asignacionActividadId: number) => {
    set({ isLoading: true });
    try {
      await api.delete(`/asignaciones/actividades/${asignacionActividadId}`);

      await get().fetchTablero();
      await get().fetchResumenCarga();
      toast.success('Actividad eliminada exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar otra actividad:', error);
      toast.error(error.response?.data?.detail || 'Error al eliminar la actividad');
    } finally {
      set({ isLoading: false });
    }
  }
}));