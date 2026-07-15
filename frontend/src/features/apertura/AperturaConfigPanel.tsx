import { PlayCircle, Settings2, Loader2, Info, Plus, Trash2 } from 'lucide-react';
import { FlatSelect } from '../../components/ui/Form';
import type { GrupoAperturaInput } from '../../services/apertura.service';

interface AperturaConfigPanelProps {
  planesOptions: { value: string; label: string }[];
  selectedPlanId: number | '';
  setSelectedPlanId: (val: number | '') => void;
  isFetchingSuggestions: boolean;
  periodosDisponibles: number[];
  gruposConfig: GrupoAperturaInput[];
  agregarGrupoAPeriodo: (periodo: number) => void;
  eliminarGrupo: (index: number) => void;
  handleGrupoLetterChange: (index: number, val: string) => void;
  handleGrupoTurnoChange: (index: number, val: string) => void;
  setConfirmOpen: (open: boolean) => void;
  isGenerating: boolean;
}

export default function AperturaConfigPanel({
  planesOptions,
  selectedPlanId,
  setSelectedPlanId,
  isFetchingSuggestions,
  periodosDisponibles,
  gruposConfig,
  agregarGrupoAPeriodo,
  eliminarGrupo,
  handleGrupoLetterChange,
  handleGrupoTurnoChange,
  setConfirmOpen,
  isGenerating
}: AperturaConfigPanelProps) {
  return (
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
      <div className="p-6 min-h-75 relative">
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
        <div className="p-5 border-t border-gray-150 bg-gray-50/50 flex items-center justify-between">
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
  );
}
