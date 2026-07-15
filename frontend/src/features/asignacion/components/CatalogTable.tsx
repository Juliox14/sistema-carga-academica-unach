import { useMemo, useState } from 'react';
import { Search, GripVertical, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useAsignacionStore } from '../store/useAsignacionStore';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { normalizar } from '../../../utils/text';

type SortKey = 'asignatura' | 'periodo' | 'grupo' | 'hsm';

export default function CatalogTable() {
  const { 
    activeTab, 
    materiasDisponibles, 
    actividadesDisponibles, 
    selectedMateriaIds, 
    toggleMateriaSelection 
  } = useAsignacionStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({
    key: 'periodo',
    direction: 'asc'
  });

  // Limpiar el buscador al cambiar de pestaña
  useMemo(() => {
    setSearchQuery('');
  }, [activeTab]);

  const handleSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const filteredMaterias = useMemo(() => {
    if (!searchQuery.trim()) return materiasDisponibles;
    const query = normalizar(searchQuery);
    return materiasDisponibles.filter(m =>
      normalizar(m.asignatura).includes(query) ||
      String(m.periodo).includes(query) ||
      normalizar(m.grupo).includes(query)
    );
  }, [materiasDisponibles, searchQuery]);

  const sortedMaterias = useMemo(() => {
    return [...filteredMaterias].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      let result = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        result = aValue.localeCompare(bValue);
      } else {
        result = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }

      if (sortConfig.direction === 'desc') result *= -1;
      if (result === 0) return a.grupo.localeCompare(b.grupo);
      return result;
    });
  }, [filteredMaterias, sortConfig]);

  const filteredActividades = useMemo(() => {
    if (!searchQuery.trim()) return actividadesDisponibles;
    const query = normalizar(searchQuery);
    return actividadesDisponibles.filter(a =>
      normalizar(a.nombre).includes(query)
    );
  }, [actividadesDisponibles, searchQuery]);

  const renderSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-0 group-hover:opacity-40" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  return (
    <div className="bg-white border border-gray-200 flex flex-col shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
          {activeTab === 'carga' ? 'Catálogo de Materias' : 'Catálogo de Actividades'}
        </h3>
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded px-7 py-1 text-xs focus:outline-none focus:border-[#002d55]" 
          />
        </div>
      </div>

      <div className="overflow-x-auto min-h-75 max-h-125 overflow-y-auto select-none">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-white border-b border-gray-200 text-gray-500 text-xs uppercase sticky top-0 z-10">
            <tr>
              {/* Ajuste de ancho para el checkbox + grip */}
              <th className="py-3 px-4 w-12 text-center">Sel</th> 
              <th className="py-3 px-2 font-medium cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('asignatura')}>
                <div className="flex items-center gap-1">
                  {activeTab === 'carga' ? 'Asignatura' : 'Actividad'} {renderSortIcon('asignatura')}
                </div>
              </th>
              {activeTab === 'carga' && (
                <>
                  <th className="py-3 px-2 font-medium text-center cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('periodo')}>
                    <div className="flex items-center justify-center gap-1">Sem {renderSortIcon('periodo')}</div>
                  </th>
                  <th className="py-3 px-2 font-medium text-center cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('grupo')}>
                    <div className="flex items-center justify-center gap-1">Grp {renderSortIcon('grupo')}</div>
                  </th>
                </>
              )}
              <th className="py-3 px-4 font-medium text-center cursor-pointer hover:bg-gray-100 group" onClick={() => handleSort('hsm')}>
                <div className="flex items-center justify-center gap-1">HSM {renderSortIcon('hsm')}</div>
              </th>
            </tr>
          </thead>
          
          {activeTab === 'carga' ? (
            <Droppable droppableId="catalogo-materias" type="materia" isDropDisabled={true}>
              {(provided) => (
                <tbody 
                  className="divide-y divide-gray-100"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {sortedMaterias.map((m, index) => {
                    const dragId = `materia-${m.materia_id}-${m.grupo_abierto_id}`;
                    // Comprobamos si está seleccionada
                    const isSelected = selectedMateriaIds?.includes(dragId);

                    return (
                      <Draggable key={dragId} draggableId={dragId} index={index}>
                        {(provided, snapshot) => (
                          <tr 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            // --- Actualización: Clases condicionales para la selección múltiple ---
                            className={`group transition-colors ${
                              snapshot.isDragging 
                                ? 'bg-blue-50 shadow-lg table-row' 
                                : isSelected 
                                  ? 'bg-blue-50/40 hover:bg-blue-50/60' 
                                  : 'hover:bg-gray-50'
                            }`}
                            style={{ ...provided.draggableProps.style }}
                          >
                            {/* --- Actualización: Celda combinada con Checkbox y Grip --- */}
                            <td className="py-3 px-2 text-center flex items-center justify-center gap-2 h-full">
                              <input 
                                type="checkbox" 
                                checked={isSelected || false}
                                onChange={() => toggleMateriaSelection(dragId)}
                                className="rounded border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer w-4 h-4"
                              />
                              <div {...provided.dragHandleProps} className="text-gray-300 group-hover:text-[#002d55] cursor-grab active:cursor-grabbing">
                                <GripVertical size={16} />
                              </div>
                            </td>
                            
                            <td className="py-3 px-2 text-gray-800 font-medium">
                              {m.asignatura}
                              {m.es_cobertura && <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">COBERTURA</span>}
                            </td>
                            <td className="py-3 px-2 text-gray-600 text-center">{m.periodo}</td>
                            <td className="py-3 px-2 text-gray-600 text-center font-bold">{m.grupo}</td>
                            <td className="py-3 px-4 text-[#002d55] font-bold text-center">{m.hsm}</td>
                          </tr>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          ) : (
            <Droppable droppableId="catalogo-actividades" type="actividad" isDropDisabled={true}>
              {(provided) => (
                <tbody 
                  className="divide-y divide-gray-100"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {filteredActividades.map((a, index) => {
                    const dragId = `actividad-${a.id}-${a.hsm}`;
                    return (
                      <Draggable key={dragId} draggableId={dragId} index={index}>
                        {(provided, snapshot) => (
                          <tr 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`group cursor-grab active:cursor-grabbing ${snapshot.isDragging ? 'bg-teal-50 shadow-lg table-row' : 'hover:bg-gray-50'}`}
                            style={{ ...provided.draggableProps.style }}
                          >
                            <td className="py-3 px-2 text-center text-gray-300 group-hover:text-teal-500">
                              <GripVertical size={16} className="inline-block" />
                            </td>
                            <td className="py-3 px-2 text-gray-800 font-medium">{a.nombre}</td>
                            <td className="py-3 px-4 text-teal-700 font-bold text-center">{a.hsm}</td>
                          </tr>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          )}
        </table>
      </div>
    </div>
  );
}