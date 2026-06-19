// src/features/aperturas/AperturaDashboard.tsx
import { useState, useEffect } from 'react';
import { Layers, Loader2, AlertCircle, PlayCircle, Settings2, Info } from 'lucide-react';
import { FlatSelect } from '../../components/ui/Form';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';

// Servicios
import { planesEstudioService } from '../../services/planesEstudio.service';
import type { CicloEscolar } from '../../types/ciclos';
import type { PlanEstudios } from '../../types/planesEstudio';
import { aperturaService } from '../../services/apertura.service';
import { ciclosService } from '../../services/ciclos.service';

export default function AperturaDashboard({ userRole = 'SECRETARIA_ACADEMICA' }) {
    if (userRole !== 'SECRETARIA_ACADEMICA') {
        return <AlertCircle className="mx-auto mt-20 text-red-500" size={48} />;
    }

    // ─── ESTADOS ───
    const [planes, setPlanes] = useState<PlanEstudios[]>([]);
    const [cicloActual, setCicloActual] = useState<CicloEscolar | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<number | ''>('');

    // Configuración dinámica de grupos: { [numero_periodo]: cantidad_grupos }
    const [configGrupos, setConfigGrupos] = useState<Record<number, number>>({});

    // Estados de carga y alertas
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // ─── EFECTOS ───
    useEffect(() => {
        cargarDatosIniciales();
    }, []);

    // Al cambiar el plan seleccionado, pedir sugerencias al backend
    useEffect(() => {
        if (selectedPlanId) {
            cargarSugerencias(Number(selectedPlanId));
        } else {
            setConfigGrupos({});
        }
    }, [selectedPlanId]);

    // ─── FUNCIONES ───
    const cargarDatosIniciales = async () => {
        try {
            setIsLoading(true);
            const [planesData, ciclosData] = await Promise.all([
                planesEstudioService.obtenerTodos(),
                ciclosService.obtenerTodos()
            ]);

            // Filtramos solo los planes vigentes
            setPlanes((planesData as PlanEstudios[]).filter(p => p.vigente));

            // Buscamos el ciclo activo
            const activo = (ciclosData as CicloEscolar[]).find(c => c.activo);
            setCicloActual(activo || null);
        } catch (error) {
            console.error("Error al cargar datos base:", error);
            alert("Hubo un error al conectar con el servidor.");
        } finally {
            setIsLoading(false);
        }
    };

    const cargarSugerencias = async (planId: number) => {
        try {
            setIsFetchingSuggestions(true);
            const sugerencias = await aperturaService.obtenerSugerencias(planId);
            setConfigGrupos(sugerencias);
        } catch (error) {
            console.error("Error al obtener sugerencias:", error);
            alert("No se pudieron cargar las sugerencias para este plan.");
        } finally {
            setIsFetchingSuggestions(false);
        }
    };

    const handleInputChange = (periodo: string, value: string) => {
        const numValue = parseInt(value, 10) || 0;
        setConfigGrupos(prev => ({
            ...prev,
            [periodo]: numValue >= 0 ? numValue : 0 // Evitar números negativos
        }));
    };

    const handleGenerarApertura = async () => {
        if (!selectedPlanId || !cicloActual) return;

        try {
            setIsGenerating(true);
            await aperturaService.ejecutar({
                plan_estudios_id: Number(selectedPlanId),
                configuracion_grupos: configGrupos
            });

            alert("¡Apertura de grupos generada con éxito!");
            setSelectedPlanId(''); // Limpiar pantalla tras éxito
            setConfirmOpen(false);
        } catch (error) {
            console.error("Error en apertura:", error);
            alert("Ocurrió un error al generar la apertura. Verifique que no existan grupos ya creados para este ciclo y plan.");
        } finally {
            setIsGenerating(false);
        }
    };

    // ─── RENDERIZADO ───
    const planesOptions = [
        ...planes.map(p => ({ value: String(p.id), label: p.nombre }))
    ];

    const totalGrupos = Object.values(configGrupos).reduce((a, b) => a + b, 0);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="animate-spin text-[#002d55]" size={40} />
            </div>
        );
    }

    return (
        <div className="p-8 max-w-5xl mx-auto h-full flex flex-col relative">

            {/* Cabecera */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#002d55] flex items-center gap-2">
                        <Layers size={28} /> Generación de Apertura
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Configura y proyecta la cantidad de grupos necesarios por nivel académico.</p>
                </div>

                {/* Indicador de Ciclo Activo */}
                <div className={`px-4 py-3 border-l-4 bg-white shadow-sm flex flex-col ${cicloActual ? 'border-green-500' : 'border-red-500'}`}>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">Ciclo Escolar Destino</span>
                    <span className={`text-sm mt-1 font-bold ${cicloActual ? 'text-green-700' : 'text-red-600'}`}>
                        {cicloActual ? cicloActual.nombre : '⚠ NINGÚN CICLO ACTIVO'}
                    </span>
                </div>
            </div>

            {!cicloActual ? (
                <div className="bg-red-50 text-red-700 p-6 rounded-sm border border-red-200 flex items-center gap-4">
                    <AlertCircle size={32} />
                    <div>
                        <h3 className="font-bold text-lg">Acción Bloqueada</h3>
                        <p className="text-sm">Debe existir un ciclo escolar configurado como "Activo" en el catálogo para poder aperturar grupos.</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 shadow-sm grow flex flex-col">

                    {/* Barra de Selección */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex gap-4 items-end">
                        <div className="grow">
                            <FlatSelect
                                name="plan"
                                label="Plan de Estudios a Aperturar"
                                options={planesOptions}
                                value={String(selectedPlanId)}
                                onChange={(e) => setSelectedPlanId(Number(e.target.value) || '')}
                            />
                        </div>
                    </div>

                    {/* Área Principal de Configuración */}
                    <div className="p-8 grow relative">
                        {!selectedPlanId ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                                <Settings2 size={48} className="opacity-20" />
                                <p>Seleccione un plan de estudios para comenzar la proyección.</p>
                            </div>
                        ) : isFetchingSuggestions ? (
                            <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-[#002d55] mb-4" size={32} />
                                <p className="text-sm font-medium text-gray-500 animate-pulse">Analizando histórico y calculando sugerencias...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-start gap-3 bg-blue-50/50 p-4 border border-blue-100 rounded-sm">
                                    <Info size={20} className="text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800 leading-relaxed">
                                        Se han precargado sugerencias basadas en el avance del ciclo inmediato anterior.
                                        Modifique las cantidades en las cajas de texto según la demanda proyectada.
                                        <strong> Un valor de 0 indica que no se abrirán materias para ese nivel.</strong>
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {Object.keys(configGrupos).sort((a, b) => Number(a) - Number(b)).map((periodo) => (
                                        <div key={periodo} className="bg-gray-50 p-4 border border-gray-200 flex flex-col items-center justify-center group hover:border-[#002d55] transition-colors">
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">
                                                Nivel / Periodo {periodo}
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                value={configGrupos[Number(periodo)]}
                                                onChange={(e) => handleInputChange(periodo, e.target.value)}
                                                className="w-20 text-center text-2xl font-bold text-[#002d55] border-b-2 border-gray-300 bg-transparent focus:outline-none focus:border-[#002d55] pb-1"
                                            />
                                            <span className="text-xs text-gray-400 mt-2">Grupos solicitados</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer / Acciones */}
                    <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-600">
                            Total proyectado: <span className="text-lg font-bold text-[#002d55] ml-1">{totalGrupos}</span> grupos
                        </div>

                        <button
                            onClick={() => setConfirmOpen(true)}
                            disabled={!selectedPlanId || totalGrupos === 0 || isFetchingSuggestions}
                            className="px-6 py-3 bg-[#002d55] text-white text-sm font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-[#001f3b] shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <PlayCircle size={18} />
                            Generar Apertura
                        </button>
                    </div>
                </div>
            )}

            {/* Modal de Confirmación */}
            <ConfirmAlert
                isOpen={confirmOpen}
                title="Confirmar Apertura Masiva"
                message={`Se generarán automáticamente todos los registros para un total de ${totalGrupos} grupos en el ciclo escolar '${cicloActual?.nombre}'. Asegúrese de que las proyecciones sean correctas.`}
                onConfirm={handleGenerarApertura}
                onCancel={() => setConfirmOpen(false)}
                isLoading={isGenerating}
            />
        </div>
    );
}