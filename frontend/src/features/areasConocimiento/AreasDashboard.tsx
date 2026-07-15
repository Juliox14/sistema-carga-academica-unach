import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Upload } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';
import { ImportModal } from '../../components/ui/ImportModal';

import AreaFormSlideOver from './components/AreaFormSlideOver';
import { areasService } from '../../services/areas.service';

import type { AreaConocimiento } from '../../types/areas';

export default function AreasDashboard() {
  const [areas, setAreas] = useState<AreaConocimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados del SlideOver
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<AreaConocimiento | null>(null);

  // Estados del ConfirmAlert
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado del ImportModal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Estados de Búsqueda y Selección
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const data = await areasService.obtenerTodos();
      setAreas(data);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error al cargar áreas:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Selección
  const filteredAreas = areas.filter(area => 
    area.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (area.descripcion && area.descripcion.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredAreas.map(a => a.id).filter(id => id !== undefined) as number[];
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      const ids = filteredAreas.map(a => a.id);
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    }
  };

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return ' ⇅';
    return sortDirection === 'asc' ? ' ▲' : ' ▼';
  };

  const sortedAreas = [...filteredAreas].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    const aString = String(aValue).toLowerCase();
    const bString = String(bValue).toLowerCase();
    return sortDirection === 'asc' ? aString.localeCompare(bString) : bString.localeCompare(aString);
  });

  const handleSelectOne = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(x => x !== id));
    }
  };

  // Lógica de Eliminación
  const requestDelete = (id: number | undefined) => {
    if (!id) return;
    setAreaToDelete(id);
    setDeleteAlertOpen(true);
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setAreaToDelete(null);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (areaToDelete) {
        await areasService.eliminar(areaToDelete);
        setSelectedIds(prev => prev.filter(id => id !== areaToDelete));
      } else if (selectedIds.length > 0) {
        await Promise.all(selectedIds.map(id => areasService.eliminar(id)));
        setSelectedIds([]);
      }
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudieron eliminar los registros. Verifique si están asignados a docentes actualmente.");
    } finally {
      setIsDeleting(false);
      setAreaToDelete(null);
    }
  };

  const openForm = (area: AreaConocimiento | null = null) => {
    setEditingArea(area);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingArea(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Áreas de Conocimiento</h1>
          <p className="text-sm text-gray-500 mt-1">Clasificación de disciplinas para agrupar docentes y materias.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 border border-gray-300 bg-white text-gray-750 px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-50 hover:text-black transition-colors shadow-xs cursor-pointer">
            <Upload size={16} /> Importar
          </button>
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
            <Plus size={16} /> Nueva Área
          </button>
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex justify-between items-center gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar área..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-gray-300 pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[#002d55] bg-gray-50" 
          />
        </div>
        {selectedIds.length > 0 && (
          <button 
            onClick={requestBulkDelete} 
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
          >
            <Trash2 size={16} /> Eliminar Seleccionados ({selectedIds.length})
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 overflow-x-auto grow relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10">
            <Loader2 className="animate-spin text-[#002d55]" size={32} />
          </div>
        )}
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="py-3 px-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={filteredAreas.length > 0 && filteredAreas.every(a => selectedIds.includes(a.id!))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-semibold w-1/3 cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('nombre')}>
                Nombre del Área{getSortIcon('nombre')}
              </th>
              <th className="py-3 px-4 font-semibold w-1/2 cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('descripcion')}>
                Descripción{getSortIcon('descripcion')}
              </th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedAreas.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">No hay áreas de conocimiento registradas.</td>
              </tr>
            ) : (
              sortedAreas.map((area) => (
                <tr key={area.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(area.id!)}
                      onChange={(e) => handleSelectOne(area.id!, e.target.checked)}
                      className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-[#002d55]">{area.nombre}</td>
                  <td className="py-3 px-4 text-gray-600 italic">
                    {area.descripcion ? area.descripcion : <span className="text-gray-400">Sin descripción</span>}
                  </td>
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(area)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(area.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AreaFormSlideOver 
        isOpen={isSlideOverOpen} 
        area={editingArea} 
        onClose={closeForm} 
        onSuccess={cargarDatos} 
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Área(s) de Conocimiento"
        message={areaToDelete ? "¿Estás seguro de que deseas eliminar esta área? Podría afectar a los docentes que la tienen asignada en su perfil." : `¿Estás seguro de que deseas eliminar las ${selectedIds.length} áreas seleccionadas?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(file) => areasService.importar(file).then(cargarDatos)}
        title="Importar Áreas de Conocimiento"
      />
    </div>
  );
}