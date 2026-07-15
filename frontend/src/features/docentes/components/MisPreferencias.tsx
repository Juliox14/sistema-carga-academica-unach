import { useEffect, useState } from 'react';
import { Sliders, Save, HelpCircle, Loader2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { preferenciasService } from '../../../services/preferencias.service';
import type { PreferenciaDocente } from '../../../services/preferencias.service';

const DIAS = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

// Rango de horas completo del sistema (de 7:00 AM a 10:00 PM)
const HORAS_DISPONIBLES = Array.from({ length: 15 }, (_, i) => i + 7); 

export default function MisPreferencias() {
  const [preferencias, setPreferencias] = useState<Record<string, 'PREFERIR' | 'EVITAR' | 'NEUTRAL'>>({});
  const [horasBloqueadas, setHorasBloqueadas] = useState<Record<string, number[]>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPreferencias() {
      try {
        setLoading(true);
        const data = await preferenciasService.obtenerMisPreferencias();
        const mapping: Record<string, 'PREFERIR' | 'EVITAR' | 'NEUTRAL'> = {};
        const mappingHours: Record<string, number[]> = {};
        
        // Inicializar
        DIAS.forEach(d => {
          mapping[d] = 'NEUTRAL';
          mappingHours[d] = [];
        });

        // Poblar con las guardadas en DB
        data.forEach(p => {
          mapping[p.dia_semana] = p.tipo_preferencia;
          if (p.horas_bloqueadas) {
            mappingHours[p.dia_semana] = p.horas_bloqueadas
              .split(',')
              .map(Number)
              .filter(n => !isNaN(n));
          }
        });

        setPreferencias(mapping);
        setHorasBloqueadas(mappingHours);
      } catch (err: any) {
        console.error('Error al cargar preferencias:', err);
        toast.error(err.response?.data?.detail || 'No se pudieron cargar sus preferencias.');
      } finally {
        setLoading(false);
      }
    }
    loadPreferencias();
  }, []);

  const handleSelectPreferencia = (dia: string, tipo: 'PREFERIR' | 'EVITAR' | 'NEUTRAL') => {
    setPreferencias(prev => ({
      ...prev,
      [dia]: tipo
    }));
  };

  const handleToggleHour = (dia: string, hora: number) => {
    setHorasBloqueadas(prev => {
      const current = prev[dia] || [];
      const updated = current.includes(hora)
        ? current.filter(h => h !== hora)
        : [...current, hora];
      return {
        ...prev,
        [dia]: updated
      };
    });
  };

  const handleToggleExpand = (dia: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dia]: !prev[dia]
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: PreferenciaDocente[] = DIAS.map(dia => ({
        dia_semana: dia,
        tipo_preferencia: preferencias[dia] || 'NEUTRAL',
        horas_bloqueadas: horasBloqueadas[dia] && horasBloqueadas[dia].length > 0 
          ? horasBloqueadas[dia].join(',') 
          : null
      }));
      await preferenciasService.guardarMisPreferencias(payload);
      toast.success('Mis preferencias de horario han sido guardadas.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Error al guardar preferencias.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-75">
        <Loader2 className="animate-spin text-[#002d55]" size={36} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55] flex items-center gap-2">
            <Sliders className="text-[#002d55]" size={24} />
            Mis Preferencias de Horario
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Indique qué días prefiere concentrar su carga horaria, cuáles desea evitar o expanda un día para bloquear horas específicas.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#002d55] hover:bg-[#001f3b] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Guardar Cambios
        </button>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-900 leading-relaxed text-xs">
        <HelpCircle size={18} className="text-blue-550 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Guía de asignación:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li><strong>Preferir:</strong> Sugiere clases prioritariamente en este día para optimizar su tiempo.</li>
            <li><strong>Evitar:</strong> Penaliza este día reduciendo al mínimo la posibilidad de tener horas asignadas (ideal para compromisos externos).</li>
            <li><strong>Neutral:</strong> Indica que no tiene problemas en laborar este día de manera ordinaria.</li>
            <li><strong>Horas Específicas a Evitar:</strong> Expanda cualquier día para marcar horas particulares (ej. las primeras de la mañana) que prefiere no impartir.</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        {DIAS.map((dia) => {
          const pref = preferencias[dia] || 'NEUTRAL';
          const isExpanded = expandedDays[dia] || false;
          const blockedList = horasBloqueadas[dia] || [];

          return (
            <div 
              key={dia} 
              className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-300 transition-all hover:shadow-xs"
            >
              {/* Contenedor Principal Día */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleExpand(dia)}
                    className="p-1 text-gray-400 hover:text-[#002d55] rounded-lg transition-colors cursor-pointer"
                    title={isExpanded ? 'Colapsar horas' : 'Expandir horas'}
                  >
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                  
                  <div>
                    <h3 className="text-md font-bold text-[#002d55] capitalize">{dia.toLowerCase()}</h3>
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                      {blockedList.length > 0 ? (
                        <>
                          <Clock size={12} className="text-rose-500" />
                          <span className="text-rose-600 font-semibold">{blockedList.length} hrs a evitar</span>
                        </>
                      ) : (
                        <span>Horario ordinario completo</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Selector de Afinidades */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPreferencia(dia, 'EVITAR')}
                    className={`px-4 py-2 text-xs font-bold border transition-all rounded-xl cursor-pointer ${
                      pref === 'EVITAR'
                        ? 'bg-rose-50 border-rose-200 text-rose-700 font-semibold shadow-xs'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    Evitar día
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleSelectPreferencia(dia, 'NEUTRAL')}
                    className={`px-4 py-2 text-xs font-bold border transition-all rounded-xl cursor-pointer ${
                      pref === 'NEUTRAL'
                        ? 'bg-gray-100 border-gray-300 text-gray-700 font-semibold shadow-xs'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    Neutral
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreferencia(dia, 'PREFERIR')}
                    className={`px-4 py-2 text-xs font-bold border transition-all rounded-xl cursor-pointer ${
                      pref === 'PREFERIR'
                        ? 'bg-teal-50 border-teal-200 text-teal-700 font-semibold shadow-xs'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                  >
                    Preferir día
                  </button>
                </div>
              </div>

              {/* Panel Expandido: Horas específicas */}
              {isExpanded && (
                <div className="pt-4 border-t border-gray-100 space-y-3">
                  <p className="text-xs text-gray-500 font-medium">
                    Marque los bloques de horario específicos en los que <b>prefiere evitar tener clases asignadas</b> (se marcarán como afinidad baja):
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {HORAS_DISPONIBLES.map(hora => {
                      const isBlocked = blockedList.includes(hora);
                      const label = `${hora.toString().padStart(2, '0')}:00 - ${(hora + 1).toString().padStart(2, '0')}:00`;

                      return (
                        <button
                          key={hora}
                          type="button"
                          onClick={() => handleToggleHour(dia, hora)}
                          className={`py-2 px-2.5 text-center text-[10.5px] rounded-lg border transition-all cursor-pointer ${
                            isBlocked
                              ? 'bg-rose-50/70 border-rose-250 text-rose-700 font-bold'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <p>{label}</p>
                          <span className="text-[8px] block font-medium mt-0.5 uppercase tracking-wider">
                            {isBlocked ? 'Evitar' : 'Disponible'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
