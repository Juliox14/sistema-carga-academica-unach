import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, AlertCircle, Upload } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';
import { ImportModal } from '../../components/ui/ImportModal';

import type { Materia } from '../../types/materias';
import { planesEstudioService } from '../../services/planesEstudio.service';

import MateriaFormSlideOver from './components/MateriaFormSlideOver';
import { materiasService } from '../../services/materias.service';
import { useAuthStore } from '../auth/store/useAuthStore';

export default function MateriasDashboard({ userRole = 'SECRETARIA_ACADEMICA' }) {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'SUPER_ADMIN';
  const isSecretaria = user?.rol === 'SECRETARIA_ACADEMICA';

  if (!isAdmin && !isSecretaria && userRole !== 'SECRETARIA_ACADEMICA') return <AlertCircle className="mx-auto mt-20 text-red-500" size={48} />;

  // Estados de datos
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [planes, setPlanes] = useState<{ id: number; nombre: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados del SlideOver
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<Materia | null>(null);

  // Estados del ConfirmAlert
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState<number | null>(null);
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
      const [materiasData, planesData] = await Promise.all([
        materiasService.obtenerTodos(),
        planesEstudioService.obtenerTodos()
      ]);
      setMaterias(materiasData);
      setPlanes(planesData as any);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const planesOptions = planes.map(plan => ({
    value: String(plan.id),
    label: plan.nombre
  }));

  const getNombrePlan = (id: number) => {
    const plan = planes.find(p => p.id === id);
    return plan ? plan.nombre : 'Desconocido';
  };

  // Lógica de Búsqueda y Selección
  const filteredMaterias = materias.filter(materia => 
    materia.nombre_asignatura.toLowerCase().includes(searchQuery.toLowerCase()) || 
    getNombrePlan(materia.plan_estudios_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredMaterias.map(m => m.id).filter(id => id !== undefined) as number[];
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      const ids = filteredMaterias.map(m => m.id);
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

  const sortedMaterias = [...filteredMaterias].sort((a, b) => {
    if (!sortField) return 0;
    let aValue = a[sortField as keyof typeof a];
    let bValue = b[sortField as keyof typeof b];
    if (sortField === 'plan') {
      aValue = getNombrePlan(a.plan_estudios_id);
      bValue = getNombrePlan(b.plan_estudios_id);
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
    setMateriaToDelete(id);
    setDeleteAlertOpen(true);
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setMateriaToDelete(null);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (materiaToDelete) {
        await materiasService.eliminar(materiaToDelete);
        setSelectedIds(prev => prev.filter(id => id !== materiaToDelete));
      } else if (selectedIds.length > 0) {
        await Promise.all(selectedIds.map(id => materiasService.eliminar(id)));
        setSelectedIds([]);
      }
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudieron eliminar las materias. Verifique si tienen dependencias asignadas.");
    } finally {
      setIsDeleting(false);
      setMateriaToDelete(null);
    }
  };

  const openForm = (materia: Materia | null = null) => {
    setEditingMateria(materia);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingMateria(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Unidades de Aprendizaje</h1>
          <p className="text-sm text-gray-500 mt-1">Catálogo de materias y sus HSM correspondientes.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 border border-gray-300 bg-white text-gray-750 px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-50 hover:text-black transition-colors shadow-xs cursor-pointer">
            <Upload size={16} /> Importar
          </button>
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
            <Plus size={16} /> Nueva Materia
          </button>
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex justify-between items-center gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o plan..." 
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
                  checked={filteredMaterias.length > 0 && filteredMaterias.every(m => selectedIds.includes(m.id!))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('nombre_asignatura')}>
                Materia{getSortIcon('nombre_asignatura')}
              </th>
              <th className="py-3 px-4 font-semibold text-center cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('numero_periodo')}>
                Periodo{getSortIcon('numero_periodo')}
              </th>
              <th className="py-3 px-4 font-semibold text-center cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('hsm')}>
                HSM{getSortIcon('hsm')}
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('plan')}>
                Plan de Estudios{getSortIcon('plan')}
              </th>
              {isAdmin && <th className="py-3 px-4 font-semibold">Unidad Académica</th>}
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedMaterias.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">No hay materias registradas.</td>
              </tr>
            ) : (
              sortedMaterias.map((materia) => (
                <tr key={materia.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(materia.id!)}
                      onChange={(e) => handleSelectOne(materia.id!, e.target.checked)}
                      className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-medium text-[#002d55]">
                    <div className="flex items-center gap-2">
                      <span>{materia.nombre_asignatura}</span>
                      {materia.es_especial && (
                        <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm uppercase font-bold tracking-wider">Especial</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600">{materia.numero_periodo}º</td>
                  <td className="py-3 px-4 text-center font-semibold text-gray-700">{materia.hsm} hrs</td>
                  <td className="py-3 px-4 text-gray-600">{getNombrePlan(materia.plan_estudios_id)}</td>
                  
                  {isAdmin && (
                    <td className="py-3 px-4">
                      {materia.plan_estudio?.programa_educativo?.unidad_academica ? (
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200">
                          {materia.plan_estudio.programa_educativo.unidad_academica.clave}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No asignada</span>
                      )}
                    </td>
                  )}

                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(materia)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(materia.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MateriaFormSlideOver 
        isOpen={isSlideOverOpen} 
        materia={editingMateria} 
        planesOptions={planesOptions}
        onClose={closeForm} 
        onSuccess={cargarDatos} 
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Unidad(es) de Aprendizaje"
        message={materiaToDelete ? "¿Estás seguro de que deseas eliminar esta materia? Al hacerlo, no podrás asignarla en futuros ciclos escolares." : `¿Estás seguro de que deseas eliminar las ${selectedIds.length} materias seleccionadas?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(file) => materiasService.importar(file).then(cargarDatos)}
        title="Importar Unidades de Aprendizaje"
      />
    </div>
  );
}