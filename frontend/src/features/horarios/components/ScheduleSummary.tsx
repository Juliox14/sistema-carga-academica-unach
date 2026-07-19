import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Clock, CheckCircle2, AlertTriangle, AlertCircle, LayoutDashboard } from 'lucide-react';
import type { ResumenHorariosGlobalResponse } from '../../../services/horarios.service';
import { horariosService } from '../../../services/horarios.service';

interface Props {
  cicloActivoId: number | undefined;
  selectedPlanId: number | '';
  onSelectGrupo: (grupoId: number) => void;
}

export default function ScheduleSummary({ cicloActivoId, selectedPlanId, onSelectGrupo }: Props) {
  const [isVisible, setIsVisible] = useState(() => {
    const saved = localStorage.getItem('sipad_schedule_summary_visible');
    return saved !== 'false';
  });
  
  const [summary, setSummary] = useState<ResumenHorariosGlobalResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!cicloActivoId) return;
    
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await horariosService.obtenerResumenProgramacion();
        setSummary(data);
      } catch (error) {
        console.error("Error fetching schedule summary", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, [cicloActivoId]);

  const toggleVisibility = () => {
    const newVal = !isVisible;
    setIsVisible(newVal);
    localStorage.setItem('sipad_schedule_summary_visible', String(newVal));
  };

  if (!cicloActivoId) return null;

  // Filtrado de grupos y recálculo de totales
  const filteredGrupos = summary 
    ? (selectedPlanId === '' ? summary.grupos : summary.grupos.filter(g => g.plan_id === selectedPlanId))
    : [];

  const total_grupos = filteredGrupos.length;
  const grupos_completos = filteredGrupos.filter(g => g.estado === 'COMPLETO').length;
  const grupos_incompletos = filteredGrupos.filter(g => g.estado === 'INCOMPLETO').length;
  const grupos_vacios = filteredGrupos.filter(g => g.estado === 'VACIO').length;
  const total_hsm = filteredGrupos.reduce((acc, g) => acc + g.hsm_totales, 0);
  const total_programadas = filteredGrupos.reduce((acc, g) => acc + g.horas_programadas, 0);

  return (
    <div className="bg-white border-b border-gray-200 w-full shrink-0">
      <div 
        className="flex items-center justify-between px-8 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleVisibility}
      >
        <div className="flex items-center gap-3">
          <div className="bg-[#002d55]/10 p-1.5 rounded-md">
            <LayoutDashboard size={18} className="text-[#002d55]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-800">Resumen de Programación de Horarios</h3>
            {summary && (
              <p className="text-xs text-gray-500">
                {grupos_completos} de {total_grupos} grupos completos • {total_programadas} / {total_hsm} horas programadas
              </p>
            )}
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 focus:outline-none p-1">
          {isVisible ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isVisible && (
        <div className="px-8 pb-6 bg-gray-50/50 border-t border-gray-100">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-[#002d55]" size={24} />
            </div>
          ) : summary ? (
            <div className="mt-4 flex flex-col lg:flex-row gap-6">
              
              {/* Tarjetas de Estadísticas (Izquierda) */}
              <div className="w-full lg:w-1/3 flex flex-col gap-3">
                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Progreso Global</p>
                    <p className="text-2xl font-bold text-[#002d55] mt-1">
                      {total_hsm > 0 ? Math.round((total_programadas / total_hsm) * 100) : 0}%
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-full">
                    <Clock size={24} className="text-blue-600" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/30 flex flex-col">
                    <div className="flex items-center gap-1.5 text-emerald-700 mb-1">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-bold uppercase">Completos</span>
                    </div>
                    <span className="text-xl font-bold text-emerald-800">{grupos_completos}</span>
                  </div>

                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/30 flex flex-col">
                    <div className="flex items-center gap-1.5 text-amber-700 mb-1">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-bold uppercase">Incompletos</span>
                    </div>
                    <span className="text-xl font-bold text-amber-800">{grupos_incompletos}</span>
                  </div>
                </div>
              </div>

              {/* Lista de Grupos Pendientes (Derecha) */}
              <div className="w-full lg:w-2/3 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden max-h-64">
                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-600 uppercase">Grupos por Completar</h4>
                  <span className="text-xs bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                    {grupos_incompletos + grupos_vacios} pendientes
                  </span>
                </div>
                <div className="overflow-y-auto p-2">
                  {(grupos_incompletos + grupos_vacios) === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-emerald-600">
                      <CheckCircle2 size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">¡Todos los grupos tienen sus horarios completos!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {filteredGrupos.filter(g => g.estado !== 'COMPLETO').map(grupo => {
                        // find plan id somehow? Actually the API doesn't return plan_id, only plan_nombre.
                        // I will pass just grupo_id and we'll handle the plan search in the parent component.
                        return (
                        <div 
                          key={grupo.grupo_id}
                          onClick={() => onSelectGrupo(grupo.grupo_id)}
                          className={`
                            p-3 rounded border flex items-center justify-between cursor-pointer transition-colors
                            ${grupo.estado === 'VACIO' 
                              ? 'bg-rose-50 border-rose-100 hover:bg-rose-100/50 hover:border-rose-300' 
                              : 'bg-amber-50 border-amber-100 hover:bg-amber-100/50 hover:border-amber-300'}
                          `}
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              {grupo.estado === 'VACIO' ? (
                                <AlertCircle size={14} className="text-rose-500" />
                              ) : (
                                <AlertTriangle size={14} className="text-amber-500" />
                              )}
                              <p className="text-sm font-bold text-gray-800">{grupo.grupo_nombre}</p>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5 truncate max-w-37.5">{grupo.plan_nombre}</p>
                          </div>
                          
                          <div className="text-right">
                            <span className={`text-xs font-bold ${grupo.estado === 'VACIO' ? 'text-rose-600' : 'text-amber-600'}`}>
                              {grupo.horas_pendientes} hrs pend.
                            </span>
                          </div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <p className="text-center text-sm text-gray-500 py-4">No se pudo cargar el resumen.</p>
          )}
        </div>
      )}
    </div>
  );
}
