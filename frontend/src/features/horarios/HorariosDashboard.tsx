import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { planesEstudioService } from '../../services/planesEstudio.service';
import { ciclosService } from '../../services/ciclos.service';
import { horariosService } from '../../services/horarios.service';
import type { HorarioClase, SugerenciaSlot, GrupoAsignacion } from '../../services/horarios.service';
import type { PlanEstudios } from '../../types/planesEstudio';
import type { CicloEscolar } from '../../types/ciclos';
import toast from 'react-hot-toast';
import { BookOpen, Sparkles, Loader2 } from 'lucide-react';

// Import Subcomponents
import HorarioHeader from './components/HorarioHeader';
import AsignacionesSidebar from './components/AsignacionesSidebar';
import LeyendaHorarios from './components/LeyendaHorarios';
import BloqueDurationModal from './components/BloqueDurationModal';
import HorarioGridTable from './components/HorarioGridTable';

// Import UI confirm components
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';

interface GrupoAbierto {
  id: number;
  ciclo_escolar_id: number;
  ciclo_escolar_nombre: string;
  plan_estudios_id: number;
  plan_estudios_nombre: string;
  numero_periodo: number;
  grupo: string;
  turno: string;
}

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const HORAS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 a 21:00 (Fin 22:00)

export default function HorariosDashboard() {
  const [planes, setPlanes] = useState<PlanEstudios[]>([]);
  const [cicloActivo, setCicloActivo] = useState<CicloEscolar | null>(null);
  const [grupos, setGrupos] = useState<GrupoAbierto[]>([]);
  
  const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('');
  const [selectedGrupoId, setSelectedGrupoId] = useState<number | ''>('');
  
  const [horarios, setHorarios] = useState<HorarioClase[]>([]);
  const [asignaciones, setAsignaciones] = useState<GrupoAsignacion[]>([]);
  
  const [selectedAsignacionId, setSelectedAsignacionId] = useState<number | null>(null);
  const [sugerencias, setSugerencias] = useState<SugerenciaSlot[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingSugerencias, setLoadingSugerencias] = useState(false);

  // States for Modals
  const [durationModalOpen, setDurationModalOpen] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<{ dia: string; hora: number } | null>(null);

  // States for Confirm Deletion
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [horarioToDelete, setHorarioToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Cargar Planes y Ciclo Escolar Activo
  useEffect(() => {
    async function init() {
      try {
        const [planesData, ciclosData] = await Promise.all([
          planesEstudioService.obtenerTodos(),
          ciclosService.obtenerTodos()
        ]);
        setPlanes(planesData as any);
        const activo = ciclosData.find(c => c.activo);
        setCicloActivo(activo || null);
      } catch (error) {
        console.error('Error al inicializar horarios:', error);
      }
    }
    init();
  }, []);

  // 2. Cargar grupos abiertos del ciclo
  useEffect(() => {
    if (!cicloActivo) return;
    async function loadGrupos() {
      try {
        const { data } = await api.get<GrupoAbierto[]>('/aperturas/abiertos');
        setGrupos(data);
      } catch (error) {
        console.error('Error al cargar grupos:', error);
      }
    }
    loadGrupos();
  }, [cicloActivo]);

  // Filtrar grupos por el plan seleccionado
  const gruposFiltrados = grupos.filter(g => g.plan_estudios_id === selectedPlanId);

  // 3. Cargar horarios y asignaciones cuando se cambia de grupo
  const cargarHorariosYAsignaciones = async (grupoId: number) => {
    setLoading(true);
    try {
      const [horariosData, asignacionesData] = await Promise.all([
        horariosService.obtenerHorariosGrupo(grupoId),
        horariosService.obtenerAsignacionesGrupo(grupoId)
      ]);
      setHorarios(horariosData);
      setAsignaciones(asignacionesData);
      setSelectedAsignacionId(null);
      setSugerencias([]);
    } catch (error) {
      console.error('Error al cargar datos del grupo:', error);
      toast.error('No se pudieron obtener los datos de horario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGrupoId !== '') {
      cargarHorariosYAsignaciones(Number(selectedGrupoId));
    } else {
      setHorarios([]);
      setAsignaciones([]);
      setSelectedAsignacionId(null);
      setSugerencias([]);
    }
  }, [selectedGrupoId]);

  // 4. Cargar sugerencias cuando se selecciona una materia para programar
  useEffect(() => {
    if (selectedAsignacionId !== null) {
      async function fetchSugs() {
        setLoadingSugerencias(true);
        try {
          const sugs = await horariosService.obtenerSugerencias(selectedAsignacionId!);
          setSugerencias(sugs);
        } catch (error) {
          console.error(error);
          toast.error('Error al calcular las sugerencias de horario.');
        } finally {
          setLoadingSugerencias(false);
        }
      }
      fetchSugs();
    } else {
      setSugerencias([]);
    }
  }, [selectedAsignacionId]);

  const activeAsignacion = asignaciones.find(a => a.id === selectedAsignacionId);

  const handleCellClick = async (dia: string, hora: number) => {
    if (!selectedAsignacionId || !activeAsignacion) {
      toast.error('Por favor, seleccione primero una materia de la barra lateral.');
      return;
    }

    const sug = sugerencias.find(s => s.dia_semana === dia && s.hora_inicio === hora);
    if (sug?.afinidad === 'CONFLICTO') {
      toast.error(`Bloque inhabilitado: ${sug.razon}`);
      return;
    }

    const pendingHours = activeAsignacion.materia_hsm - activeAsignacion.horas_programadas;
    const nextSug = sugerencias.find(s => s.dia_semana === dia && s.hora_inicio === hora + 1);
    const isNextAvailable = nextSug && nextSug.afinidad !== 'CONFLICTO';

    if (pendingHours >= 2 && isNextAvailable) {
      setPendingSelection({ dia, hora });
      setDurationModalOpen(true);
    } else {
      try {
        await horariosService.programarBloque(selectedAsignacionId, dia, hora, 1);
        toast.success('Clase programada (1 hora).');
        if (selectedGrupoId !== '') {
          await cargarHorariosYAsignaciones(Number(selectedGrupoId));
        }
      } catch (err: any) {
        console.error(err);
        toast.error(err.response?.data?.detail || 'Error al programar el bloque horario.');
      }
    }
  };

  const handleSelectDuration = async (duracion: number) => {
    if (!pendingSelection || !selectedAsignacionId) return;
    setDurationModalOpen(false);
    try {
      await horariosService.programarBloque(selectedAsignacionId, pendingSelection.dia, pendingSelection.hora, duracion);
      toast.success(`Clase programada (${duracion} ${duracion === 1 ? 'hora' : 'horas'}).`);
      if (selectedGrupoId !== '') {
        await cargarHorariosYAsignaciones(Number(selectedGrupoId));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Error al programar.');
    } finally {
      setPendingSelection(null);
    }
  };

  const handleDeleteHorarioClick = (horarioId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar click en la celda
    setHorarioToDelete(horarioId);
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (horarioToDelete === null) return;
    setIsDeleting(true);
    try {
      await horariosService.desprogramarBloque(horarioToDelete);
      toast.success('Clase desprogramada.');
      if (selectedGrupoId !== '') {
        await cargarHorariosYAsignaciones(Number(selectedGrupoId));
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al desprogramar la clase.');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setHorarioToDelete(null);
    }
  };

  // Encontrar el grupo seleccionado
  const grupoSeleccionadoObj = grupos.find(g => g.id === Number(selectedGrupoId));

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative space-y-6">
      
      {/* Header Selector */}
      <HorarioHeader
        planes={planes}
        cicloActivo={cicloActivo}
        selectedPlanId={selectedPlanId}
        selectedGrupoId={selectedGrupoId}
        gruposFiltrados={gruposFiltrados}
        onSelectPlan={(id) => {
          setSelectedPlanId(id);
          setSelectedGrupoId('');
        }}
        onSelectGrupo={setSelectedGrupoId}
      />

      {selectedGrupoId === '' ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-xs grow flex flex-col justify-center items-center">
          <BookOpen className="text-gray-300 mb-4 animate-bounce" size={56} />
          <h3 className="text-md font-bold text-gray-600">Ningún Grupo Seleccionado</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Elija un plan de estudios y un grupo abierto del listado superior para iniciar la planeación de horarios.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start grow">
          
          {/* Panel Lateral: Asignaciones del Grupo */}
          <AsignacionesSidebar
            asignaciones={asignaciones}
            selectedAsignacionId={selectedAsignacionId}
            onSelectAsignacion={setSelectedAsignacionId}
            cicloActivo={cicloActivo}
            loading={loading}
            grupoSeleccionadoObj={grupoSeleccionadoObj}
          />

          {/* Grilla Semanal Horaria */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs lg:col-span-3 flex flex-col relative min-h-125">
            {selectedAsignacionId && (
              <div className="mb-4 bg-teal-50 border border-teal-100 text-teal-900 rounded-2xl p-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-teal-600 animate-pulse" />
                  <span className="text-xs font-bold">Optimización Horaria:</span>
                  <span className="text-xs text-teal-800 font-medium">Recomendando bloques para <strong className="font-semibold text-teal-950">{activeAsignacion?.materia_nombre}</strong></span>
                </div>
                <button onClick={() => setSelectedAsignacionId(null)} className="text-[10px] font-bold text-teal-700 hover:text-teal-900 cursor-pointer">
                  Limpiar Selección
                </button>
              </div>
            )}

            {/* Escala de Colores (Leyenda) */}
            <LeyendaHorarios />

            {loadingSugerencias && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-xs flex items-center justify-center z-10 rounded-2xl">
                <Loader2 className="animate-spin text-[#002d55]" size={36} />
              </div>
            )}

            {/* Weekly Schedule Grid */}
            <HorarioGridTable
              DIAS={DIAS}
              horasAMostrar={HORAS.filter(hora => {
                const grupoTurno = grupoSeleccionadoObj?.turno?.toUpperCase() || 'MIXTO';
                if (grupoTurno === 'MATUTINO') {
                  return hora >= 7 && hora < 14;
                }
                if (grupoTurno === 'VESPERTINO') {
                  return hora >= 15 && hora < 22;
                }
                return true;
              })}
              horarios={horarios}
              sugerencias={sugerencias}
              selectedAsignacionId={selectedAsignacionId}
              onCellClick={handleCellClick}
              onDeleteClick={handleDeleteHorarioClick}
            />
          </div>

        </div>
      )}

      {/* Duration modal */}
      <BloqueDurationModal
        isOpen={durationModalOpen}
        onClose={() => {
          setDurationModalOpen(false);
          setPendingSelection(null);
        }}
        materiaNombre={activeAsignacion?.materia_nombre || ''}
        pendingSelection={pendingSelection}
        onSelectDuration={handleSelectDuration}
      />

      {/* Custom confirm alert component */}
      <ConfirmAlert
        isOpen={confirmDeleteOpen}
        title="Desprogramar Clase"
        message="¿Está seguro de que desea desprogramar esta hora de clase? Esta acción removerá la materia de la celda horaria seleccionada."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setHorarioToDelete(null);
        }}
      />
    </div>
  );
}
