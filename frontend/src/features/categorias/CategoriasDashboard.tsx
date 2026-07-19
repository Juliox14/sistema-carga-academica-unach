import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, AlertCircle } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';

import type { CategoriaDocente } from '../../types/categorias';
import CategoriaFormSlideOver from './components/CategoriasFormSlideOver';
import { categoriasService } from '../../services/categorias.service';

export default function CategoriasDashboard({ userRole = 'SECRETARIA_ACADEMICA' }) {
  if (userRole !== 'SECRETARIA_ACADEMICA') return <AlertCircle className="mx-auto mt-20 text-red-500" size={48} />;

  const [categorias, setCategorias] = useState<CategoriaDocente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<CategoriaDocente | null>(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [categoriaToDelete, setCategoriaToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados de Búsqueda y Selección
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const data = await categoriasService.obtenerTodos();
      setCategorias(data);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Búsqueda y Selección
  const filteredCategorias = categorias.filter(cat => 
    cat.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.siglas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredCategorias.map(c => c.id).filter(id => id !== undefined) as number[];
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      const ids = filteredCategorias.map(c => c.id);
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

  const sortedCategorias = [...filteredCategorias].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
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
    setCategoriaToDelete(id);
    setDeleteAlertOpen(true);
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setCategoriaToDelete(null);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (categoriaToDelete) {
        await categoriasService.eliminar(categoriaToDelete);
        setSelectedIds(prev => prev.filter(id => id !== categoriaToDelete));
      } else if (selectedIds.length > 0) {
        await Promise.all(selectedIds.map(id => categoriasService.eliminar(id)));
        setSelectedIds([]);
      }
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudieron eliminar las categorías. Verifique si tienen docentes asignados.");
    } finally {
      setIsDeleting(false);
      setCategoriaToDelete(null);
    }
  };

  const openForm = (categoria: CategoriaDocente | null = null) => {
    setEditingCategoria(categoria);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingCategoria(null), 300);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Categorías Docentes</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de tipos de contratación y sus HSM base.</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
          <Plus size={16} /> Nueva Categoría
        </button>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex justify-between items-center gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar categoría..." 
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
                  checked={filteredCategorias.length > 0 && filteredCategorias.every(c => selectedIds.includes(c.id!))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('siglas')}>
                Siglas{getSortIcon('siglas')}
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('nombre')}>
                Nombre{getSortIcon('nombre')}
              </th>
              <th className="py-3 px-4 font-semibold text-center cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('hsm_base')}>
                HSM Base{getSortIcon('hsm_base')}
              </th>
              <th className="py-3 px-4 font-semibold text-center cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('nivel_prioridad')}>
                Prioridad{getSortIcon('nivel_prioridad')}
              </th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedCategorias.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">No hay categorías registradas.</td>
              </tr>
            ) : (
              sortedCategorias.map((cat) => (
                <tr key={cat.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(cat.id!)}
                      onChange={(e) => handleSelectOne(cat.id!, e.target.checked)}
                      className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-700">{cat.siglas}</td>
                  <td className="py-3 px-4 font-medium text-[#002d55]">
                    <div className="flex items-center gap-2">
                      <span>{cat.nombre}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center text-gray-600 font-semibold">{cat.hsm_base} hrs</td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-sm text-xs font-bold border border-gray-200">
                      Nivel {cat.nivel_prioridad}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(cat)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(cat.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CategoriaFormSlideOver isOpen={isSlideOverOpen} categoria={editingCategoria} onClose={closeForm} onSuccess={cargarDatos} />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Categoría(s) Docente"
        message={categoriaToDelete ? "¿Estás seguro? Esta acción no podrá deshacerse." : `¿Estás seguro de que deseas eliminar las ${selectedIds.length} categorías seleccionadas?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />
    </div>
  );
}