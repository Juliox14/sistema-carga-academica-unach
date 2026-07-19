import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Upload } from 'lucide-react';

import { planesEstudioService } from '../../services/planesEstudio.service';
import { programasService } from '../../services/programas.service';

import type { PlanEstudios } from '../../types/planesEstudio';
import type { ProgramaEducativo } from '../../types/programas';

import { ConfirmAlert } from '../../components/ui/ConfirmAlert';
import { ImportModal } from '../../components/ui/ImportModal';

import PlanFormSlideOver from './components/PlanesFormSlideOver';
import { useAuthStore } from '../auth/store/useAuthStore';

export default function PlanesDashboard() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'SUPER_ADMIN';
  const [planes, setPlanes] = useState<PlanEstudios[]>([]);
  const [programas, setProgramas] = useState<ProgramaEducativo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanEstudios | null>(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const [planesData, programasData] = await Promise.all([
        planesEstudioService.obtenerTodos(),
        programasService.obtenerTodos()
      ]);
      setPlanes(planesData as any);
      setProgramas(programasData as any);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const programasOptions = programas.map(prog => ({
    value: String(prog.id),
    label: `${prog.clave} - ${prog.nombre}`
  }));

  const getNombrePrograma = (id: number) => {
    const prog = programas.find(p => p.id === id);
    return prog ? prog.clave : 'Desconocido';
  };

  // Lógica de Búsqueda y Selección
  const filteredPlanes = planes.filter(plan => 
    plan.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    getNombrePrograma(plan.programa_educativo_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredPlanes.map(p => p.id).filter(id => id !== undefined) as number[];
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      const ids = filteredPlanes.map(p => p.id);
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

  const sortedPlanes = [...filteredPlanes].sort((a, b) => {
    if (!sortField) return 0;
    let aValue = a[sortField as keyof typeof a];
    let bValue = b[sortField as keyof typeof b];
    if (sortField === 'programa') {
      aValue = getNombrePrograma(a.programa_educativo_id);
      bValue = getNombrePrograma(b.programa_educativo_id);
    }
    if (aValue === undefined || aValue === null) return 1;
    if (bValue === undefined || bValue === null) return -1;
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
      return sortDirection === 'asc' ? (aValue === bValue ? 0 : aValue ? 1 : -1) : (aValue === bValue ? 0 : bValue ? 1 : -1);
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

  const requestDelete = (id: number | undefined) => {
    if (!id) return;
    setPlanToDelete(id);
    setDeleteAlertOpen(true);
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setPlanToDelete(null);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (planToDelete) {
        await planesEstudioService.eliminar(planToDelete);
        setSelectedIds(prev => prev.filter(id => id !== planToDelete));
      } else if (selectedIds.length > 0) {
        await Promise.all(selectedIds.map(id => planesEstudioService.eliminar(id)));
        setSelectedIds([]);
      }
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudieron eliminar los planes. Verifique dependencias.");
    } finally {
      setIsDeleting(false);
      setPlanToDelete(null);
    }
  };

  const openForm = (plan: PlanEstudios | null = null) => {
    setEditingPlan(plan);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingPlan(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Planes de Estudio</h1>
          <p className="text-sm text-gray-500 mt-1">Estructuras curriculares dependientes de un programa educativo.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 border border-gray-300 bg-white text-gray-750 px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-50 hover:text-black transition-colors shadow-xs cursor-pointer">
            <Upload size={16} /> Importar
          </button>
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
            <Plus size={16} /> Nuevo Plan
          </button>
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex justify-between items-center gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar plan..." 
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
                  checked={filteredPlanes.length > 0 && filteredPlanes.every(p => selectedIds.includes(p.id!))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('nombre')}>
                Plan de Estudios{getSortIcon('nombre')}
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('programa')}>
                Programa Padre{getSortIcon('programa')}
              </th>
              {isAdmin && <th className="py-3 px-4 font-semibold">Unidad Académica</th>}
              <th className="py-3 px-4 font-semibold text-center cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('vigente')}>
                Estatus{getSortIcon('vigente')}
              </th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedPlanes.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">No hay planes registrados.</td>
              </tr>
            ) : (
              sortedPlanes.map((plan: PlanEstudios) => (
                <tr key={plan.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(plan.id!)}
                      onChange={(e) => handleSelectOne(plan.id!, e.target.checked)}
                      className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-[#002d55]">{plan.nombre}</td>
                  <td className="py-3 px-4 font-medium text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-500">{getNombrePrograma(plan.programa_educativo_id)}</span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="py-3 px-4">
                      {plan.programa_educativo?.unidad_academica ? (
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200">
                          {plan.programa_educativo.unidad_academica.clave}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No asignada</span>
                      )}
                    </td>
                  )}
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-sm border ${plan.vigente ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      {plan.vigente ? 'Vigente' : 'En Liquidación'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(plan)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(plan.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PlanFormSlideOver 
        isOpen={isSlideOverOpen} 
        plan={editingPlan} 
        programasOptions={programasOptions}
        onClose={closeForm} 
        onSuccess={cargarDatos} 
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Plan de Estudios"
        message={planToDelete ? "¿Estás seguro de que deseas eliminar este plan? Se perderán todas las referencias curriculares asociadas a él." : `¿Estás seguro de que deseas eliminar los ${selectedIds.length} planes seleccionados?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(file) => planesEstudioService.importar(file).then(cargarDatos)}
        title="Importar Planes de Estudio"
      />
    </div>
  );
}