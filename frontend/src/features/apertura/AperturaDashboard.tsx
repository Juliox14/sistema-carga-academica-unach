// src/features/aperturas/AperturaDashboard.tsx
import { useState, useEffect } from 'react';
import { Layers, Loader2, AlertCircle, PlayCircle, ListTodo } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';
import toast from 'react-hot-toast';

// Servicios y Tipos
import { planesEstudioService } from '../../services/planesEstudio.service';
import type { CicloEscolar } from '../../types/ciclos';
import type { PlanEstudios } from '../../types/planesEstudio';
import { 
  aperturaService, 
  type GrupoAperturaInput, 
  type GrupoAbiertoResponse, 
  type PeriodoSugerido 
} from '../../services/apertura.service';
import { ciclosService } from '../../services/ciclos.service';

// Subcomponentes
import AperturaConfigPanel from './AperturaConfigPanel';
import AperturaListTable from './AperturaListTable';

export default function AperturaDashboard({ userRole = 'SECRETARIA_ACADEMICA' }) {
    if (userRole !== 'SECRETARIA_ACADEMICA') {
        return (
            <div className="p-12 text-center text-red-500 font-bold">
                <AlertCircle className="mx-auto text-red-500 mb-2" size={48} />
                <span>Acceso denegado: Se requieren permisos de Secretaría Académica.</span>
            </div>
        );
    }

    // Tab activa: 'configurar' | 'listado'
    const [activeTab, setActiveTab] = useState<'configurar' | 'listado'>('configurar');

    // Datos base de la base de datos
    const [planes, setPlanes] = useState<PlanEstudios[]>([]);
    const [cicloActual, setCicloActual] = useState<CicloEscolar | null>(null);

    // Selección de Plan
    const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('');

    // Configuración interactiva de la proyección
    const [periodosDisponibles, setPeriodosDisponibles] = useState<number[]>([]);
    const [gruposConfig, setGruposConfig] = useState<GrupoAperturaInput[]>([]);

    // Listado de grupos abiertos en el ciclo
    const [gruposAbiertos, setGruposAbiertos] = useState<GrupoAbiertoResponse[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Estados de carga
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // Estados para eliminar grupo abierto
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [grupoToDelete, setGrupoToDelete] = useState<GrupoAbiertoResponse | null>(null);
    const [isDeletingGrupo, setIsDeletingGrupo] = useState(false);

    // ─── EFECTOS ───
    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    // Cargar sugerencias cuando cambie el plan
    useEffect(() => {
        if (selectedPlanId) {
            cargarSugerencias(Number(selectedPlanId));
        } else {
            setGruposConfig([]);
            setPeriodosDisponibles([]);
        }
    }, [selectedPlanId]);

    // Recargar listado al cambiar a pestaña de listado
    useEffect(() => {
        if (activeTab === 'listado') {
            cargarGruposAbiertos();
        }
    }, [activeTab]);

    // ─── MÉTODOS DE DATOS ───
    const cargarDatosIniciales = async () => {
        try {
            setIsLoading(true);
            const [planesData, ciclosData] = await Promise.all([
                planesEstudioService.obtenerTodos(),
                ciclosService.obtenerTodos()
            ]);

            setPlanes((planesData as PlanEstudios[]).filter(p => p.vigente));
            const activo = (ciclosData as CicloEscolar[]).find(c => c.activo);
            setCicloActual(activo || null);
        } catch (error) {
            console.error("Error al cargar datos base:", error);
            toast.error("Hubo un error al conectar con el servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    const cargarSugerencias = async (planId: number) => {
        try {
            setIsFetchingSuggestions(true);
            
            // 1. Obtener grupos abiertos existentes del ciclo
            const abiertos = await aperturaService.obtenerAbiertos();
            const existentesParaPlan = abiertos.filter(g => g.plan_estudios_id === planId);

            const sugerenciasData: PeriodoSugerido[] = await aperturaService.obtenerSugerencias(planId);
            
            // Extraer periodos disponibles
            const periodos = sugerenciasData.map(p => p.numero_periodo).sort((a, b) => a - b);
            setPeriodosDisponibles(periodos);

            // Detectar cuáles periodos requieren un grupo especial (tienen sugerencias de grupo especial)
            const periodosEspecialesRequeridos = sugerenciasData
                .filter(p => p.sugerencias.some(s => s.es_especial))
                .map(p => p.numero_periodo);

            let listaFinal: GrupoAperturaInput[] = [];

            if (existentesParaPlan.length > 0) {
                // Si ya existen grupos abiertos para este plan en el ciclo actual,
                // cargamos los grupos existentes como el estado de configuración.
                listaFinal = existentesParaPlan.map(g => ({
                    numero_periodo: g.numero_periodo,
                    grupo: g.grupo,
                    turno: g.turno,
                    es_especial: g.es_especial
                }));
                toast.success("Se cargaron los grupos abiertos previamente para este plan.");
            } else {
                // Si no hay grupos abiertos, cargamos la sugerencia por defecto
                sugerenciasData.forEach(p => {
                    p.sugerencias.forEach(s => {
                        listaFinal.push({
                            numero_periodo: p.numero_periodo,
                            grupo: s.grupo,
                            turno: s.turno,
                            es_especial: s.es_especial
                        });
                    });
                });
            }

            // Asegurar que si un periodo requiere materias especiales, contenga al menos un grupo especial
            periodosEspecialesRequeridos.forEach(pNum => {
                const tieneEspecial = listaFinal.some(g => g.numero_periodo === pNum && g.es_especial);
                if (!tieneEspecial) {
                    listaFinal.push({
                        numero_periodo: pNum,
                        grupo: "U",
                        turno: "MIXTO",
                        es_especial: true
                    });
                }
            });

            setGruposConfig(listaFinal);
        } catch (error) {
            console.error("Error al obtener sugerencias o grupos abiertos:", error);
            toast.error("No se pudieron cargar los datos de apertura.");
        } finally {
            setIsFetchingSuggestions(false);
        }
    };

    const cargarGruposAbiertos = async () => {
        try {
            const data = await aperturaService.obtenerAbiertos();
            setGruposAbiertos(data);
        } catch (error) {
            console.error("Error al cargar grupos abiertos:", error);
            toast.error("No se pudo cargar la lista de grupos abiertos.");
        }
    };

    // Agregar un nuevo grupo vacío a un periodo
    const agregarGrupoAPeriodo = (periodo: number) => {
        const gruposEnPeriodo = gruposConfig.filter(g => g.numero_periodo === periodo);
        const letrasOcupadas = gruposEnPeriodo.map(g => g.grupo.toUpperCase());
        const abecedario = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "O"];
        let nuevaLetra = "A";
        for (const l of abecedario) {
            if (!letrasOcupadas.includes(l)) {
                nuevaLetra = l;
                break;
            }
        }

        setGruposConfig(prev => [
            ...prev,
            {
                numero_periodo: periodo,
                grupo: nuevaLetra,
                turno: 'MATUTINO',
                es_especial: false
            }
        ]);
        toast.success(`Grupo "${nuevaLetra}" agregado al Periodo ${periodo}`);
    };

    // Eliminar un grupo de la configuración
    const eliminarGrupo = (index: number) => {
        setGruposConfig(prev => prev.filter((_, i) => i !== index));
    };

    // Cambiar la letra del grupo
    const handleGrupoLetterChange = (index: number, val: string) => {
        const uppercaseVal = val.toUpperCase().trim().slice(0, 5); // Máximo 5 caracteres
        setGruposConfig(prev => {
            const next = [...prev];
            next[index].grupo = uppercaseVal;
            return next;
        });
    };

    // Cambiar el turno del grupo
    const handleGrupoTurnoChange = (index: number, val: string) => {
        setGruposConfig(prev => {
            const next = [...prev];
            next[index].turno = val;
            return next;
        });
    };



    const handleGenerarApertura = async () => {
        if (!selectedPlanId || !cicloActual) return;

        // Validar que no haya letras vacías
        if (gruposConfig.some(g => !g.grupo.trim())) {
            toast.error("Todos los grupos deben tener una letra o identificador asignado.");
            return;
        }

        // Validar duplicados de letra dentro de un mismo periodo
        const periodosUnicos = Array.from(new Set(gruposConfig.map(g => g.numero_periodo)));
        for (const p of periodosUnicos) {
            const letras = gruposConfig.filter(g => g.numero_periodo === p).map(g => g.grupo.toUpperCase());
            const letrasSet = new Set(letras);
            if (letras.length !== letrasSet.size) {
                toast.error(`Existen grupos con la misma letra en el Periodo ${p}.`);
                return;
            }
        }

        try {
            setIsGenerating(true);
            await aperturaService.ejecutar({
                plan_estudios_id: Number(selectedPlanId),
                grupos: gruposConfig
            });

            toast.success("¡Apertura de grupos generada con éxito!");
            setSelectedPlanId('');
            setConfirmOpen(false);
            setActiveTab('listado'); // Navegar a la lista tras éxito
        } catch (error: any) {
            console.error("Error en apertura:", error);
            const msg = error.response?.data?.detail || "Ocurrió un error al generar la apertura.";
            toast.error(msg);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmDeleteGrupo = async () => {
        if (!grupoToDelete) return;
        setIsDeletingGrupo(true);
        try {
            await aperturaService.eliminarGrupoAbierto(grupoToDelete.id);
            toast.success(`Grupo "${grupoToDelete.grupo}" del periodo ${grupoToDelete.numero_periodo}º eliminado con éxito.`);
            await cargarGruposAbiertos();
            setDeleteConfirmOpen(false);
            setGrupoToDelete(null);
        } catch (error: any) {
            console.error("Error al eliminar grupo abierto:", error);
            const msg = error.response?.data?.detail || "No se pudo eliminar el grupo abierto.";
            toast.error(msg);
        } finally {
            setIsDeletingGrupo(false);
        }
    };

    // ─── RENDERIZADO ───
    const planesOptions = [
        ...planes.map(p => ({ value: String(p.id), label: p.nombre }))
    ];

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-20">
                <Loader2 className="animate-spin text-[#002d55]" size={40} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">

            {/* Cabecera y Tab Switcher */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                <div className="space-y-1">
                    <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Layers className="text-[#002d55]" size={24} /> 
                        <span>Apertura de Grupos por Plan</span>
                    </h1>
                    <p className="text-xs text-gray-500">Configura la proyección de grupos y gestiona la oferta educativa del ciclo activo.</p>
                </div>

                {/* Ciclo Escolar Activo */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-xs font-bold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span>Ciclo Destino: {cicloActual?.nombre || 'Ninguno Activo'}</span>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b gap-1 bg-white p-1 rounded-xl shadow-xs border border-gray-100">
                <button
                    onClick={() => setActiveTab('configurar')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'configurar' 
                            ? 'bg-[#002d55] text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <PlayCircle size={15} />
                    <span>Configurar Apertura</span>
                </button>
                <button
                    onClick={() => setActiveTab('listado')}
                    className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'listado' 
                            ? 'bg-[#002d55] text-white shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                >
                    <ListTodo size={15} />
                    <span>Grupos Abiertos</span>
                </button>
            </div>

            {!cicloActual ? (
                <div className="bg-red-50 text-red-800 p-6 border border-red-200 rounded-2xl flex items-center gap-4">
                    <AlertCircle size={32} className="text-red-600 shrink-0" />
                    <div>
                        <h3 className="font-bold text-sm">Acción Bloqueada</h3>
                        <p className="text-xs">Debe existir un ciclo escolar configurado como "Activo" en el sistema para poder aperturar o listar grupos.</p>
                    </div>
                </div>
            ) : activeTab === 'configurar' ? (
                <AperturaConfigPanel 
                  planesOptions={planesOptions}
                  selectedPlanId={selectedPlanId}
                  setSelectedPlanId={setSelectedPlanId}
                  isFetchingSuggestions={isFetchingSuggestions}
                  periodosDisponibles={periodosDisponibles}
                  gruposConfig={gruposConfig}
                  agregarGrupoAPeriodo={agregarGrupoAPeriodo}
                  eliminarGrupo={eliminarGrupo}
                  handleGrupoLetterChange={handleGrupoLetterChange}
                  handleGrupoTurnoChange={handleGrupoTurnoChange}
                  setConfirmOpen={setConfirmOpen}
                  isGenerating={isGenerating}
                />
            ) : (
                <AperturaListTable 
                  gruposAbiertos={gruposAbiertos}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  setGrupoToDelete={setGrupoToDelete}
                  setDeleteConfirmOpen={setDeleteConfirmOpen}
                />
            )}

            {/* Confirmación de Apertura */}
            <ConfirmAlert
                isOpen={confirmOpen}
                title="Confirmar Proyección de Apertura"
                message={`¿Estás seguro de que deseas proyectar y abrir estos ${gruposConfig.length} grupos en el ciclo escolar '${cicloActual?.nombre}'? Esto actualizará la oferta disponible del plan seleccionado.`}
                onConfirm={handleGenerarApertura}
                onCancel={() => setConfirmOpen(false)}
                isLoading={isGenerating}
                color="blue"
                confirmText="Sí, Proyectar"
            />

            {/* Confirmación de Eliminación de Grupo Abierto */}
            <ConfirmAlert
                isOpen={deleteConfirmOpen}
                title="Eliminar Grupo Abierto"
                message={grupoToDelete ? `¿Estás seguro de que deseas eliminar el grupo "${grupoToDelete.grupo}" del periodo ${grupoToDelete.numero_periodo}º de forma definitiva? Esta acción eliminará en cascada todas las asignaciones de docentes y horarios asociados al grupo en el ciclo escolar activo.` : ''}
                onConfirm={handleConfirmDeleteGrupo}
                onCancel={() => {
                    setDeleteConfirmOpen(false);
                    setGrupoToDelete(null);
                }}
                isLoading={isDeletingGrupo}
                color="red"
                confirmText="Sí, eliminar"
            />
        </div>
    );
}