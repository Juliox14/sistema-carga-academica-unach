// src/features/aperturas/AperturaDashboard.tsx
import { useState, useEffect } from 'react';
import { Layers, Loader2, AlertCircle, PlayCircle, Settings2, Info, Plus, Trash2, Search, ListTodo } from 'lucide-react';
import { FlatSelect } from '../../components/ui/Form';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';
import toast from 'react-hot-toast';

// Servicios
import { planesEstudioService } from '../../services/planesEstudio.service';
import type { CicloEscolar } from '../../types/ciclos';
import type { PlanEstudios } from '../../types/planesEstudio';
import { aperturaService, type GrupoAperturaInput, type GrupoAbiertoResponse, type PeriodoSugerido } from '../../services/apertura.service';
import { ciclosService } from '../../services/ciclos.service';

export default function AperturaDashboard({ userRole = 'SECRETARIA_ACADEMICA' }) {
    if (userRole !== 'SECRETARIA_ACADEMICA') {
        return (
            <div className="p-12 text-center text-red-500 font-bold">
                <AlertCircle className="mx-auto text-red-500 mb-2" size={48} />
                <span>Acceso denegado: Se requieren permisos de Secretaría Académica.</span>
            </div>
        );
    }

    // ─── ESTADOS ───
    const [activeTab, setActiveTab] = useState<'configurar' | 'listado'>('configurar');
    const [planes, setPlanes] = useState<PlanEstudios[]>([]);
    const [cicloActual, setCicloActual] = useState<CicloEscolar | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('');

    // Configuración interactiva de grupos abiertos por periodo:
    // Almacenamos una lista plana de grupos configurados para poder manipularlos
    const [gruposConfig, setGruposConfig] = useState<GrupoAperturaInput[]>([]);
    const [periodosDisponibles, setPeriodosDisponibles] = useState<number[]>([]);

    // Listado de grupos ya abiertos
    const [gruposAbiertos, setGruposAbiertos] = useState<GrupoAbiertoResponse[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Estados de carga
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

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

    // ─── FUNCIONES ───
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
            const sugerenciasData: PeriodoSugerido[] = await aperturaService.obtenerSugerencias(planId);
            
            // Extraer periodos disponibles
            const periodos = sugerenciasData.map(p => p.numero_periodo).sort((a, b) => a - b);
            setPeriodosDisponibles(periodos);

            // Convertir sugerencias del backend a la lista interactiva
            const listaInicial: GrupoAperturaInput[] = [];
            sugerenciasData.forEach(p => {
                p.sugerencias.forEach(s => {
                    listaInicial.push({
                        numero_periodo: p.numero_periodo,
                        grupo: s.grupo,
                        turno: s.turno
                    });
                });
            });
            setGruposConfig(listaInicial);
        } catch (error) {
            console.error("Error al obtener sugerencias:", error);
            toast.error("No se pudieron cargar las sugerencias para este plan.");
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
        // Encontrar letra disponible (A, B, C...)
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
                turno: 'MATUTINO'
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

    // ─── RENDERIZADO ───
    const planesOptions = [
        ...planes.map(p => ({ value: String(p.id), label: p.nombre }))
    ];

    const filteredGruposAbiertos = gruposAbiertos.filter(g => {
        const query = searchQuery.toLowerCase();
        return (
            g.plan_estudios_nombre.toLowerCase().includes(query) ||
            g.grupo.toLowerCase().includes(query) ||
            String(g.numero_periodo).includes(query) ||
            g.turno.toLowerCase().includes(query)
        );
    });

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
            <div className="flex border-b border-gray-200 gap-1 bg-white p-1 rounded-xl shadow-xs border border-gray-100">
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
                // ─── TAB 1: CONFIGURACIÓN DE APERTURA ───
                <div className="bg-white border border-gray-100 shadow-xs rounded-2xl overflow-hidden flex flex-col">
                    
                    {/* Filtro Plan */}
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                        <FlatSelect
                            name="plan"
                            label="Seleccionar Plan de Estudios"
                            options={planesOptions}
                            value={String(selectedPlanId)}
                            onChange={(e) => setSelectedPlanId(Number(e.target.value) || '')}
                        />
                    </div>

                    {/* Proyección de periodos */}
                    <div className="p-6 min-h-[300px] relative">
                        {!selectedPlanId ? (
                            <div className="h-full py-20 flex flex-col items-center justify-center text-gray-400 space-y-3">
                                <Settings2 size={48} className="opacity-20 animate-spin-slow" />
                                <p className="text-xs font-semibold uppercase tracking-wider">Selecciona un plan para comenzar la proyección</p>
                            </div>
                        ) : isFetchingSuggestions ? (
                            <div className="py-20 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-[#002d55] mb-3" size={32} />
                                <p className="text-xs font-bold text-gray-500 animate-pulse uppercase tracking-wider">
                                    Analizando histórico escolar y calculando sugerencias...
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-start gap-3 bg-blue-50/50 p-4 border border-blue-100 rounded-xl text-blue-800 text-xs">
                                    <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                    <div className="space-y-1 leading-relaxed">
                                        <p className="font-bold">Sugerencias inteligentes aplicadas:</p>
                                        <p>
                                            El sistema ha proyectado los grupos trayendo el avance académico de los alumnos desde el ciclo escolar anterior 
                                            (desplazando la cohorte un periodo arriba, ej: los grupos del periodo 1 anterior pasan a sugerirse en el periodo 2 actual).
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {periodosDisponibles.map(periodo => {
                                        const gruposEnPeriodo = gruposConfig.filter(g => g.numero_periodo === periodo);
                                        
                                        return (
                                            <div key={periodo} className="bg-gray-50/50 border border-gray-200/80 rounded-2xl p-5 flex flex-col gap-4">
                                                <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                                                    <span className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">
                                                        Periodo / Nivel {periodo}°
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 border border-gray-200 rounded-md">
                                                        {gruposEnPeriodo.length} {gruposEnPeriodo.length === 1 ? 'Grupo' : 'Grupos'}
                                                    </span>
                                                </div>

                                                {/* Lista de grupos del periodo */}
                                                <div className="space-y-3">
                                                    {gruposConfig.map((g, idx) => {
                                                        if (g.numero_periodo !== periodo) return null;
                                                        
                                                        return (
                                                            <div key={idx} className="bg-white border border-gray-150 p-3 rounded-xl flex gap-3 items-center shadow-2xs hover:shadow-xs transition-shadow">
                                                                {/* Identificador / Letra del Grupo */}
                                                                <div className="w-20 space-y-1">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Grupo</span>
                                                                    <input
                                                                        type="text"
                                                                        value={g.grupo}
                                                                        maxLength={5}
                                                                        placeholder="Ej: A"
                                                                        onChange={(e) => handleGrupoLetterChange(idx, e.target.value)}
                                                                        className="w-full text-center px-1.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 uppercase focus:outline-none focus:ring-1 focus:ring-[#002d55]"
                                                                    />
                                                                </div>

                                                                {/* Turno */}
                                                                <div className="grow space-y-1">
                                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Turno</span>
                                                                    <select
                                                                        value={g.turno}
                                                                        onChange={(e) => handleGrupoTurnoChange(idx, e.target.value)}
                                                                        className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#002d55]"
                                                                    >
                                                                        <option value="MATUTINO">MATUTINO</option>
                                                                        <option value="VESPERTINO">VESPERTINO</option>
                                                                        <option value="MIXTO">MIXTO</option>
                                                                    </select>
                                                                </div>

                                                                {/* Eliminar Grupo */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => eliminarGrupo(idx)}
                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer transition-colors mt-4 self-center"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        );
                                                    })}

                                                    {gruposEnPeriodo.length === 0 && (
                                                        <p className="text-center text-[11px] text-gray-400 py-3 italic font-medium">
                                                            No hay grupos configurados para este periodo.
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Agregar Grupo */}
                                                <button
                                                    type="button"
                                                    onClick={() => agregarGrupoAPeriodo(periodo)}
                                                    className="w-full mt-2 py-2 border border-dashed border-gray-300 hover:border-[#002d55] text-gray-500 hover:text-[#002d55] bg-white hover:bg-gray-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                                >
                                                    <Plus size={14} />
                                                    <span>Agregar Grupo</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer con Acciones */}
                    {selectedPlanId && !isFetchingSuggestions && (
                        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                            <div className="text-xs font-bold text-gray-600">
                                Total a abrir: <span className="text-sm font-extrabold text-[#002d55]">{gruposConfig.length}</span> grupos
                            </div>

                            <button
                                onClick={() => setConfirmOpen(true)}
                                disabled={isGenerating || gruposConfig.length === 0}
                                className="px-6 py-2.5 bg-[#002d55] hover:bg-[#001c37] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-colors"
                            >
                                <PlayCircle size={15} />
                                <span>Aperturar Grupos</span>
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                // ─── TAB 2: LISTADO DE GRUPOS ABIERTOS ───
                <div className="bg-white border border-gray-100 shadow-xs rounded-2xl overflow-hidden flex flex-col space-y-4 p-5">
                    
                    {/* Buscador */}
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                        <input
                            type="text"
                            placeholder="Buscar por plan, periodo, grupo o turno..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700"
                        />
                    </div>

                    {/* Tabla de Grupos */}
                    <div className="overflow-x-auto border border-gray-150 rounded-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <th className="px-6 py-3.5">Plan de Estudios</th>
                                    <th className="px-6 py-3.5">Periodo</th>
                                    <th className="px-6 py-3.5">Grupo</th>
                                    <th className="px-6 py-3.5">Turno</th>
                                    <th className="px-6 py-3.5">Ciclo Escolar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                {filteredGruposAbiertos.map(g => (
                                    <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-800">{g.plan_estudios_nombre}</td>
                                        <td className="px-6 py-4 font-semibold text-gray-500">{g.numero_periodo}° Nivel</td>
                                        <td className="px-6 py-4 font-mono font-bold text-[#002d55]">Grupo "{g.grupo}"</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                                g.turno === 'MATUTINO' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                                g.turno === 'VESPERTINO' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                                'bg-teal-50 text-teal-700 border border-teal-200'
                                            }`}>
                                                {g.turno}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-450 font-medium">{g.ciclo_escolar_nombre}</td>
                                    </tr>
                                ))}

                                {filteredGruposAbiertos.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-xs text-gray-400 font-semibold italic">
                                            No hay registros de grupos abiertos para este ciclo escolar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Confirmación */}
            <ConfirmAlert
                isOpen={confirmOpen}
                title="Confirmar Proyección de Apertura"
                message={`¿Estás seguro de que deseas proyectar y abrir estos ${gruposConfig.length} grupos en el ciclo escolar '${cicloActual?.nombre}'? Esto actualizará la oferta disponible del plan seleccionado.`}
                onConfirm={handleGenerarApertura}
                onCancel={() => setConfirmOpen(false)}
                isLoading={isGenerating}
            />
        </div>
    );
}