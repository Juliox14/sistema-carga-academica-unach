import { useState } from 'react';
import { BookCopy, BrainCircuit, CalendarCheck2, ChevronDown, ChevronUp, GripVertical, Scale, Sparkles, Star, University } from 'lucide-react';
import { useAsignacionStore } from '../store/useAsignacionStore';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import type { MateriaSugeridaDTO } from '../../../types/asignaciones';


function SuggestionCard({ sugerencia, dragHandleProps }: { sugerencia: MateriaSugeridaDTO, dragHandleProps: any }) {
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

        <div className="flex-1">
          <h4 className="font-bold text-[#002d55] flex items-center gap-1.5 text-sm">
            {sugerencia.score_total >= 80 && (
              <Star size={14} className="text-amber-500 fill-amber-500" />
            )}
            {sugerencia.asignatura}
          </h4>
          <p className="text-xs text-gray-600 mt-0.5">
            Semestre {sugerencia.periodo} • Grupo {sugerencia.grupo} • {sugerencia.hsm} HSM
          </p>
          <p className="text-xs font-semibold text-amber-700 mt-1">
            Score de afinidad: {sugerencia.score_total}%
          </p>
        </div>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-amber-600 hover:text-[#002d55] p-1 rounded-full hover:bg-amber-100 transition-all cursor-pointer"
          title={isExpanded ? "Ocultar razones" : "Ver razones de la sugerencia"}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <div className={desgloseClasses}>
        <div className="flex justify-between">
          <span title="Calculado proporcionalmente según el récord histórico de esta asignatura">
            <BookCopy className="inline w-4 mr-2" /> Experiencia previa ({sugerencia.veces_impartida} veces)
          </span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.historial} pts</span>
        </div>
        <div className="flex justify-between">
          <span> <BrainCircuit className="inline w-4 mr-2" /> Afinidad con Área de Conocimiento</span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.area} pts</span>
        </div>
        <div className="flex justify-between">
          <span><CalendarCheck2 className="inline w-4 mr-2" /> Compatibilidad de Turno</span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.turno} pts</span>
        </div>
        <div className="flex justify-between opacity-75">
          <span><University className="inline w-4 mr-2" /> Prioridad Institucional</span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.prioridad} pts</span>
        </div>
        <div className="flex justify-between opacity-75">
          <span><Scale className="inline w-4 mr-2" /> Balance de Carga Horaria</span>
          <span className="font-semibold text-gray-900">{sugerencia.desglose.carga} pts</span>
        </div>
      </div>
    </div>
  );
}

export default function SmartSuggestions() {
  const { materiasSugeridas, docenteSeleccionadoId, planEstudioSeleccionadoId } = useAsignacionStore();
  
  // Estado para expandir/contraer el panel completo
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

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
        className="px-4 py-3 bg-linear-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center justify-between gap-2 cursor-pointer group"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-amber-600 animate-pulse" />
          <h3 className="font-bold text-amber-900 text-sm tracking-wide uppercase">
            Sugerencias del Sistema
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
                {materiasSugeridas.map((sug, index) => {
                  const dragId = `materia-${sug.materia_id}-${sug.grupo_abierto_id}`;
                  
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
                            sugerencia={sug} 
                            dragHandleProps={provided.dragHandleProps} 
                          />
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
}