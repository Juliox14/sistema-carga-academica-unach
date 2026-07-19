import { useState, useEffect } from 'react';
import { Save, AlertCircle, Settings, Clock, RefreshCw, BrainCircuit, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { actualizarConfiguraciones } from '../../services/configuracion.service';
import { categoriasService } from '../../services/categorias.service';
import type { CategoriaDocente } from '../../types/categorias';
import { useConfigStore } from './store/useConfigStore';
import EstatusDocentesDashboard from './components/EstatusDocentesDashboard';

export default function ConfiguracionDashboard() {
    const { configs, fetchConfigs, updateConfigItem, isLoading } = useConfigStore();
    const [activeTab, setActiveTab] = useState<'reglas' | 'estatus'>('reglas');
    const [categoriasList, setCategoriasList] = useState<CategoriaDocente[]>([]);

    useEffect(() => {
        categoriasService.obtenerTodos()
            .then(data => setCategoriasList(data))
            .catch(err => {
                console.error("Error al obtener categorías:", err);
                toast.error("No se pudieron cargar las categorías docentes");
            });
    }, []);

    // Estados locales para la vista (se inicializan con los valores del store global)
    const [motivoObligatorio, setMotivoObligatorio] = useState(configs.DESCARGA_MOTIVO_OBLIGATORIO);
    const [permitirExcedentes, setPermitirExcedentes] = useState(configs.PERMITIR_HORAS_EXCEDENTES);
    const [maxHorasExcedentes, setMaxHorasExcedentes] = useState(configs.MAX_HORAS_EXCEDENTES);
    const [limitarRacha, setLimitarRacha] = useState(configs.MAX_CICLOS_CONSECUTIVOS > 0);
    const [maxCiclosConsecutivos, setMaxCiclosConsecutivos] = useState(configs.MAX_CICLOS_CONSECUTIVOS || 3);
    const [pesos, setPesos] = useState(configs.PESOS_SUGERENCIAS);

    // Cargamos las configuraciones al entrar a la pantalla
    useEffect(() => {
        fetchConfigs();
    }, [fetchConfigs]);

    // Sincronizamos los estados locales cuando el fetch termine
    useEffect(() => {
        setMotivoObligatorio(configs.DESCARGA_MOTIVO_OBLIGATORIO);
        setPermitirExcedentes(configs.PERMITIR_HORAS_EXCEDENTES);
        setMaxHorasExcedentes(configs.MAX_HORAS_EXCEDENTES);
        setLimitarRacha(configs.MAX_CICLOS_CONSECUTIVOS > 0);
        setMaxCiclosConsecutivos(configs.MAX_CICLOS_CONSECUTIVOS || 3);
        setPesos(configs.PESOS_SUGERENCIAS);
    }, [configs]);

    const handlePesoChange = (key: keyof typeof pesos, value: number) => {
        setPesos(prev => ({ ...prev, [key]: value }));
    };

    const totalPesos = Object.values(pesos).reduce((a, b) => a + b, 0);
    const isPesosValid = totalPesos === 100;

    const handleGuardar = async () => {
        if (!isPesosValid) {
            toast.error("La suma de los pesos de la IA debe ser exactamente 100%");
            return;
        }
        
        const payload = [
            { clave: "DESCARGA_MOTIVO_OBLIGATORIO", valor: motivoObligatorio.toString() },
            { clave: "PERMITIR_HORAS_EXCEDENTES", valor: permitirExcedentes.toString() },
            { clave: "MAX_HORAS_EXCEDENTES", valor: maxHorasExcedentes.toString() },
            { clave: "MAX_CICLOS_CONSECUTIVOS", valor: limitarRacha ? maxCiclosConsecutivos.toString() : "0" },
            { clave: "PESOS_SUGERENCIAS", valor: JSON.stringify(pesos) }
        ];

        try {
            await actualizarConfiguraciones(payload);

            // Guardar reglas de asignación por categoría
            const payloadReglas = categoriasList.map(c => ({
                id: c.id!,
                permite_titular: c.permite_titular,
                permite_suplente: c.permite_suplente
            }));
            await categoriasService.actualizarReglasBulk(payloadReglas);

            updateConfigItem("DESCARGA_MOTIVO_OBLIGATORIO", motivoObligatorio);
            updateConfigItem("PERMITIR_HORAS_EXCEDENTES", permitirExcedentes);
            updateConfigItem("MAX_HORAS_EXCEDENTES", maxHorasExcedentes);
            updateConfigItem("MAX_CICLOS_CONSECUTIVOS", limitarRacha ? maxCiclosConsecutivos : 0);
            updateConfigItem("PESOS_SUGERENCIAS", pesos);
            toast.success("Configuraciones aplicadas en todo el sistema");
        } catch (error) {
            console.error("Falló al guardar:", error);
            toast.error("Ocurrió un error al guardar las configuraciones");
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-gray-500">Cargando reglas de negocio...</div>;
    }

    const criteriosSugerencias = [
        { key: 'historial', label: 'Experiencia previa impartiendo la materia', color: 'bg-blue-500' },
        { key: 'area', label: 'Afinidad con su Área de Conocimiento', color: 'bg-green-500' },
        { key: 'turno', label: 'Compatibilidad de Turno', color: 'bg-yellow-500' },
        { key: 'prioridad', label: 'Prioridad Institucional', color: 'bg-red-500' },
        { key: 'carga', label: 'Balance de Carga Horaria', color: 'bg-purple-500' }
    ] as const;

    return (
        <div className="flex-1 p-8 bg-gray-50/50 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-end border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[#002d55] flex items-center gap-2">
                            <Settings size={28} /> Configuración del Sistema
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Ajuste los parámetros globales y controle los estatus de docentes del ciclo académico.
                        </p>
                    </div>
                    {activeTab === 'reglas' && (
                        <button
                            onClick={handleGuardar}
                            className="flex items-center gap-2 bg-[#002d55] hover:bg-blue-900 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-sm cursor-pointer text-sm"
                        >
                            <Save size={18} /> Guardar Cambios
                        </button>
                    )}
                </div>

                {/* Tabs de Navegación */}
                <div className="flex border-b border-gray-200 gap-6">
                    <button
                        onClick={() => setActiveTab('reglas')}
                        className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                            activeTab === 'reglas'
                                ? 'border-[#002d55] text-[#002d55]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Reglas de Negocio
                    </button>
                    <button
                        onClick={() => setActiveTab('estatus')}
                        className={`pb-3 text-sm font-semibold tracking-wide border-b-2 transition-all cursor-pointer ${
                            activeTab === 'estatus'
                                ? 'border-[#002d55] text-[#002d55]'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        Estatus de Docentes
                    </button>
                </div>

                {/* Contenido de la pestaña */}
                {activeTab === 'reglas' ? (
                    <div className="space-y-6">
                        {/* Sección 1: Carga y Horas */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                                <Clock size={18} className="text-blue-600" />
                                <h3 className="font-bold text-gray-800">Límites de Carga Académica</h3>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="max-w-xl">
                                        <h4 className="font-medium text-gray-900">Permitir horas excedentes controladas</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Autoriza a los coordinadores asignar materias que sobrepasen las HSM (Horas Semana Mes) base del contrato del docente.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={permitirExcedentes} onChange={() => setPermitirExcedentes(!permitirExcedentes)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {/* Sub-configuración dependiente */}
                                <div className={`pl-4 border-l-2 transition-opacity duration-200 ${permitirExcedentes ? 'border-blue-500 opacity-100' : 'border-gray-200 opacity-40 pointer-events-none'}`}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Margen máximo de horas extra permitidas
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={maxHorasExcedentes}
                                            onChange={(e) => setMaxHorasExcedentes(Number(e.target.value))}
                                            className="w-24 border border-gray-300 rounded-md p-2 text-center focus:ring-blue-500 focus:border-blue-500"
                                        />
                                        <span className="text-sm text-gray-500">horas. (Ej: Contrato 20h + 3h margen = 23h máximo).</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sección 2: Rotación Académica (Rachas) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                                <RefreshCw size={18} className="text-orange-600" />
                                <h3 className="font-bold text-gray-800">Rotación y Rachas Académicas</h3>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="max-w-xl">
                                        <h4 className="font-medium text-gray-900">Limitar ciclos consecutivos</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Bloquea la asignación de una materia si el docente ya la ha impartido ininterrumpidamente durante varios semestres, fomentando la rotación académica.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={limitarRacha} onChange={() => setLimitarRacha(!limitarRacha)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                    </label>
                                </div>

                                <div className={`pl-4 border-l-2 transition-opacity duration-200 ${limitarRacha ? 'border-orange-500 opacity-100' : 'border-gray-200 opacity-40 pointer-events-none'}`}>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Máximo de periodos consecutivos permitidos
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={maxCiclosConsecutivos}
                                            onChange={(e) => setMaxCiclosConsecutivos(Number(e.target.value))}
                                            className="w-24 border border-gray-300 rounded-md p-2 text-center focus:ring-orange-500 focus:border-orange-500"
                                        />
                                        <span className="text-sm text-gray-500">semestres seguidos. (Al superarlo, el sistema rechazará la asignación).</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sección 3: Descargas */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                                <AlertCircle size={18} className="text-purple-600" />
                                <h3 className="font-bold text-gray-800">Liberación de Materias (Descargas)</h3>
                            </div>

                            <div className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="max-w-xl">
                                        <h4 className="font-medium text-gray-900">Motivo de descarga obligatorio</h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Exige capturar una justificación escrita (año sabático, comisión, etc.) al remover una carga previamente asignada a un docente titular.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={motivoObligatorio} onChange={() => setMotivoObligatorio(!motivoObligatorio)} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Sección 4: Reglas por Categoría */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                                <Briefcase size={18} className="text-[#002d55]" />
                                <h3 className="font-bold text-gray-800">Reglas de Asignación por Categoría Docente</h3>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-sm text-gray-500">
                                    Configure qué tipos de carga académica se pueden asignar a cada categoría de contratación en el sistema.
                                </p>

                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-600 text-[11px] uppercase tracking-wider font-bold">
                                            <tr>
                                                <th className="py-3.5 px-4 w-24">Siglas</th>
                                                <th className="py-3.5 px-4">Categoría</th>
                                                <th className="py-3.5 px-4 text-center w-48">Asignar como Titular<br/><span className="text-[10px] text-gray-400 capitalize normal-case font-normal">(Materias regulares)</span></th>
                                                <th className="py-3.5 px-4 text-center w-48">Asignar como Suplente<br/><span className="text-[10px] text-gray-400 capitalize normal-case font-normal">(Suplir descargas)</span></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-150">
                                            {categoriasList.map((cat, idx) => (
                                                <tr key={cat.id || idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-3 px-4 font-bold text-gray-700">{cat.siglas}</td>
                                                    <td className="py-3 px-4 font-medium text-[#002d55]">{cat.nombre}</td>
                                                    <td className="py-3 px-4 text-center">
                                                        <label className="relative inline-flex items-center cursor-pointer justify-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={cat.permite_titular} 
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setCategoriasList(prev => prev.map(c => c.id === cat.id ? { ...c, permite_titular: checked } : c));
                                                                }} 
                                                                className="sr-only peer" 
                                                            />
                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                                        </label>
                                                    </td>
                                                    <td className="py-3 px-4 text-center">
                                                        <label className="relative inline-flex items-center cursor-pointer justify-center">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={cat.permite_suplente} 
                                                                onChange={(e) => {
                                                                    const checked = e.target.checked;
                                                                    setCategoriasList(prev => prev.map(c => c.id === cat.id ? { ...c, permite_suplente: checked } : c));
                                                                }} 
                                                                className="sr-only peer" 
                                                            />
                                                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                                        </label>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sección 5: IA Sugerencias */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BrainCircuit size={18} className="text-emerald-600" />
                                    <h3 className="font-bold text-gray-800">Motor de Sugerencias Inteligentes (IA)</h3>
                                </div>

                                <div className={`text-sm font-bold px-3 py-1 rounded-full ${isPesosValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    Suma total: {totalPesos}%
                                </div>
                            </div>

                            <div className="p-6">
                                <p className="text-sm text-gray-500 mb-6">
                                    Ajusta el peso (importancia) que el algoritmo le dará a cada criterio al momento de sugerirle materias a un docente. La suma de todos los factores debe ser exactamente 100%.
                                </p>

                                <div className="space-y-5">
                                    {criteriosSugerencias.map(({ key, label }) => (
                                        <div key={key} className="flex items-center gap-4">
                                            <div className="w-1/3">
                                                <label className="text-sm font-medium text-gray-700">{label}</label>
                                            </div>
                                            <div className="flex-1">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="100"
                                                    value={pesos[key]}
                                                    onChange={(e) => handlePesoChange(key, Number(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                                />
                                            </div>
                                            <div className="w-16 text-right">
                                                <span className="inline-block px-2 py-1 bg-gray-100 rounded text-sm font-bold text-gray-700 border border-gray-200">
                                                    {pesos[key]}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {!isPesosValid && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-2 border border-red-100">
                                        <AlertCircle size={16} />
                                        Debes {totalPesos > 100 ? 'restar' : 'sumar'} {Math.abs(100 - totalPesos)} puntos para poder guardar los cambios.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <EstatusDocentesDashboard />
                )}
            </div>
        </div>
    );
}