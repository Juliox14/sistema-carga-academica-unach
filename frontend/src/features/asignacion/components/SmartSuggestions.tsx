import { useState, useMemo } from 'react';
import { BookCopy, BrainCircuit, CalendarCheck2, ChevronDown, ChevronUp, GripVertical, Scale, Sparkles, Star, University } from 'lucide-react';
import { useAsignacionStore } from '../store/useAsignacionStore';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { MateriaSugeridaDTO } from '../../../types/asignaciones';

interface VarianteGrupo {
  materia_id: number;
  grupo_abierto_id: number;
  grupo: string;
  score_total: number;
  desglose: any;
}

interface SuggestionCardProps {
  sugerencia: MateriaSugeridaDTO;
  dragHandleProps: any;
  variantes: VarianteGrupo[];
  selectedIdx: number;
  setSelectedIdx: (idx: number) => void;
}

function SuggestionCard({
  sugerencia,
  dragHandleProps,
  variantes,
  selectedIdx,
  setSelectedIdx
}: SuggestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const desgloseClasses = `ml-7 text-xs text-gray-700 grid gap-2 transition-all duration-300 ease-in-out ${
    isExpanded 
      ? 'max-h-[500px] opacity-100 mt-3 pt-3 border-t border-amber-200/50'
      : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0 overflow-hidden'
  }`;

  return (
    <div className="border border-amber-200 rounded-lg p-3 mb-3 shadow-sm group bg-white hover:border-amber-300 transition-colors">
      <div className="flex justify-between items-start">
        <div 
          {...dragHandleProps} 
          className="mt-1 mr-2.5 text-amber-300 cursor-grab active:cursor-grabbing group-hover:text-amber-500 transition-colors"
        >
          <GripVertical size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-[#002d55] flex items-center gap-1.5 text-sm truncate">
            {sugerencia.score_total >= 80 && (
              <Star size={14} className="text-amber-500 fill-amber-500 shrink-0" />
            )}
            <span className="truncate">{sugerencia.asignatura}</span>
          </h4>
          
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
            <span className="text-[11px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded-md font-medium">
              Nivel {sugerencia.periodo}
            </span>
            <span className="text-[11px] text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded-md font-medium">
              {sugerencia.hsm} HSM
            </span>
            
            {variantes.length > 1 ? (
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-gray-500 font-semibold">Grupo:</span>
                <select
                  value={selectedIdx}
                  onChange={(e) => setSelectedIdx(Number(e.target.value))}
                  className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 hover:border-amber-300 text-amber-900 rounded-md text-[11px] font-bold focus:outline-none cursor-pointer transition-colors"
                >
                  {variantes.map((v, i) => (
                    <option key={v.grupo_abierto_id} value={i}>
                      "{v.grupo}" ({v.score_total}%)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-[11px] text-gray-700 bg-amber-50/50 border border-amber-100 px-1.5 py-0.5 rounded-md font-bold">
                Grupo "{sugerencia.grupo}"
              </span>
            )}
          </div>

          <p className="text-[11px] font-extrabold text-amber-700 mt-2 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" />
            Score de afinidad: {sugerencia.score_total}%
          </p>
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-amber-600 hover:text-[#002d55] p-1 rounded-full hover:bg-amber-100 transition-all cursor-pointer shrink-0 ml-1"
          title={isExpanded ? "Ocultar razones" : "Ver razones de la sugerencia"}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <div className={desgloseClasses}>
        <div className="flex justify-between">
          <span className="flex items-center" title="Calculado proporcionalmente según el récord histórico de esta asignatura">
            <BookCopy className="w-3.5 h-3.5 mr-2 text-gray-400" /> Experiencia previa ({sugerencia.veces_impartida} veces)
          </span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.historial} pts</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center"> <BrainCircuit className="w-3.5 h-3.5 mr-2 text-gray-400" /> Afinidad con Área de Conocimiento</span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.area} pts</span>
        </div>
        <div className="flex justify-between">
          <span className="flex items-center"><CalendarCheck2 className="w-3.5 h-3.5 mr-2 text-gray-400" /> Compatibilidad de Turno</span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.turno} pts</span>
        </div>
        <div className="flex justify-between opacity-75">
          <span className="flex items-center"><University className="w-3.5 h-3.5 mr-2 text-gray-400" /> Prioridad Institucional</span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.prioridad} pts</span>
        </div>
        <div className="flex justify-between opacity-75">
          <span className="flex items-center"><Scale className="w-3.5 h-3.5 mr-2 text-gray-400" /> Balance de Carga Horaria</span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.carga} pts</span>
        </div>
      </div>
    </div>
  );
}

function GroupedSuggestionDraggable({ sug, index }: { sug: any; index: number }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  
  // Garantizar que el índice sea válido
  const activeIdx = selectedIdx >= sug.variantes.length ? 0 : selectedIdx;
  const activeVariante = sug.variantes[activeIdx] || sug.variantes[0];
  
  const dragId = `materia-${activeVariante.materia_id}-${activeVariante.grupo_abierto_id}`;
  
  const currentSugerencia: MateriaSugeridaDTO = {
    materia_id: activeVariante.materia_id,
    grupo_abierto_id: activeVariante.grupo_abierto_id,
    asignatura: sug.asignatura,
    periodo: sug.periodo,
    grupo: activeVariante.grupo,
    hsm: sug.hsm,
    score_total: activeVariante.score_total,
    veces_impartida: sug.veces_impartida,
    desglose: activeVariante.desglose
  };

  return (
    <Draggable key={dragId} draggableId={dragId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{ ...provided.draggableProps.style }}
          className={snapshot.isDragging ? 'opacity-90 shadow-2xl scale-105 transition-all' : 'transition-all'}
        >
          <SuggestionCard 
            sugerencia={currentSugerencia} 
            dragHandleProps={provided.dragHandleProps} 
            variantes={sug.variantes}
            selectedIdx={activeIdx}
            setSelectedIdx={setSelectedIdx}
          />
        </div>
      )}
    </Draggable>
  );
}

export default function SmartSuggestions() {
  const { materiasSugeridas, docenteSeleccionadoId, planEstudioSeleccionadoId } = useAsignacionStore();
  
  // Estado para expandir/contraer el panel completo
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  // Agrupar sugerencias por asignatura
  const sugerenciasAgrupadas = useMemo(() => {
    const mapa = new Map<string, {
      asignatura: string;
      periodo: number;
      hsm: number;
      veces_impartida: number;
      variantes: VarianteGrupo[];
    }>();

    materiasSugeridas.forEach(sug => {
      const key = sug.asignatura.trim().toLowerCase();
      if (!mapa.has(key)) {
        mapa.set(key, {
          asignatura: sug.asignatura,
          periodo: sug.periodo,
          hsm: sug.hsm,
          veces_impartida: sug.veces_impartida,
          variantes: []
        });
      }
      
      const groupData = mapa.get(key)!;
      // Evitar grupos duplicados con el mismo nombre de grupo
      const existeVariante = groupData.variantes.some(
        v => v.grupo.toUpperCase() === sug.grupo.toUpperCase()
      );
      if (!existeVariante) {
        groupData.variantes.push({
          materia_id: sug.materia_id,
          grupo_abierto_id: sug.grupo_abierto_id,
          grupo: sug.grupo,
          score_total: sug.score_total,
          desglose: sug.desglose
        });
      }
    });

    return Array.from(mapa.values());
  }, [materiasSugeridas]);

  // Ocultar por completo si no hay datos suficientes o el arreglo está vacío
  if (!docenteSeleccionadoId || !planEstudioSeleccionadoId || materiasSugeridas.length === 0) {
    return null;
  }

  const mainContentClasses = `transition-all duration-300 ease-in-out ${
    isPanelExpanded
      ? 'max-h-[500px] opacity-100'
      : 'max-h-0 opacity-0 overflow-hidden'
  }`;
  
  const internalContentClasses = "p-4 overflow-y-auto max-h-[380px] scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-amber-50";

  return (
    <div className="bg-white border border-amber-200 rounded-lg shadow-sm overflow-hidden flex flex-col mb-4">
      <div 
        onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        className="px-4 py-3 bg-linear-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center justify-between gap-2 cursor-pointer group select-none"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-600 animate-pulse animate-duration-1000" />
          <h3 className="font-bold text-amber-900 text-sm tracking-wide uppercase">
            Sugerencias del Sistema ({sugerenciasAgrupadas.length})
          </h3>
        </div>
        
        {/* Icono que rota smoothly */}
        <div className="text-amber-600 group-hover:text-amber-800 transition-all p-0.5 rounded-full">
          {isPanelExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>
      
      <div className={mainContentClasses}>
        <div className={internalContentClasses}>
          <Droppable droppableId="sugerencias-materias" type="materia" isDropDisabled={true}>
            {(provided) => (
              <div 
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-h-2.5"
              >
                {sugerenciasAgrupadas.map((sug, index) => (
                  <GroupedSuggestionDraggable 
                    key={sug.asignatura} 
                    sug={sug} 
                    index={index} 
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
}