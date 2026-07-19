import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';
import { ImportModal } from '../../components/ui/ImportModal';

import type { Docente } from '../../types/docentes';
import type { CategoriaDocente } from '../../types/categorias';
import type { AreaConocimiento } from '../../types/areas';

import { docentesService } from '../../services/docentes.service';
import { categoriasService } from '../../services/categorias.service';
import { areasService } from '../../services/areas.service';

import DocenteFormSlideOver from './components/DocentesFormSlideOver';

import { useAuthStore } from '../auth/store/useAuthStore';

export default function DocentesDashboard({ userRole = 'SECRETARIA_ACADEMICA' }) {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'SUPER_ADMIN';
  const isSecretaria = user?.rol === 'SECRETARIA_ACADEMICA';

  if (!isAdmin && !isSecretaria && userRole !== 'SECRETARIA_ACADEMICA') return <AlertCircle className="mx-auto mt-20 text-red-500" size={48} />;

  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDocente[]>([]);
  const [areas, setAreas] = useState<AreaConocimiento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [docenteToDelete, setDocenteToDelete] = useState<number | null>(null);
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
      const [docentesData, categoriasData, areasData] = await Promise.all([
        docentesService.obtenerTodos(),
        categoriasService.obtenerTodos(),
        areasService.obtenerTodos()
      ]);
      setDocentes(docentesData);
      setCategorias(categoriasData);
      setAreas(areasData);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const getNombreCategoria = (id: number) => {
    const cat = categorias.find(c => c.id === id);
    return cat ? cat.siglas : 'N/A';
  };

  // Lógica de Búsqueda y Selección
  const filteredDocentes = docentes.filter(doc => 
    doc.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (doc.apellidos?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
    (doc.plaza?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    getNombreCategoria(doc.categoria_id).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredDocentes.map(d => d.id).filter(id => id !== undefined) as number[];
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      const ids = filteredDocentes.map(d => d.id);
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

  const sortedDocentes = [...filteredDocentes].sort((a, b) => {
    if (!sortField) return 0;
    let aValue = a[sortField as keyof typeof a];
    let bValue = b[sortField as keyof typeof b];
    if (sortField === 'nombre_completo') {
      aValue = `${a.apellidos} ${a.nombre}`;
      bValue = `${b.apellidos} ${b.nombre}`;
    } else if (sortField === 'categoria') {
      aValue = getNombreCategoria(a.categoria_id);
      bValue = getNombreCategoria(b.categoria_id);
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
    setDocenteToDelete(id);
    setDeleteAlertOpen(true);
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDocenteToDelete(null);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (docenteToDelete) {
        await docentesService.eliminar(docenteToDelete);
        setSelectedIds(prev => prev.filter(id => id !== docenteToDelete));
      } else if (selectedIds.length > 0) {
        await Promise.all(selectedIds.map(id => docentesService.eliminar(id)));
        setSelectedIds([]);
      }
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudieron eliminar los docentes. Verifique dependencias.");
    } finally {
      setIsDeleting(false);
      setDocenteToDelete(null);
    }
  };

  const openForm = (docente: Docente | null = null) => {
    setEditingDocente(docente);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingDocente(null), 300);
  };

  // Convertimos las categorías para el select del formulario
  const categoriasOptions = categorias.map(cat => ({
    value: String(cat.id),
    label: `${cat.siglas} - ${cat.nombre}`
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Plantilla Docente</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de profesores, plazas y áreas de conocimiento.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-2 border border-gray-300 bg-white text-gray-750 px-4 py-2 rounded-sm text-sm font-medium hover:bg-gray-50 hover:text-black transition-colors shadow-xs cursor-pointer">
            <FileSpreadsheet size={16} /> Importar Docentes
          </button>
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
            <Plus size={16} /> Nuevo Docente
          </button>
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex justify-between items-center gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre, apellidos, plaza o categoría..." 
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
                  checked={filteredDocentes.length > 0 && filteredDocentes.every(d => selectedIds.includes(d.id!))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('plaza')}>
                Plaza{getSortIcon('plaza')}
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('nombre_completo')}>
                Nombre Completo{getSortIcon('nombre_completo')}
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('correo_institucional')}>
                Correo{getSortIcon('correo_institucional')}
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('telefono')}>
                Teléfono{getSortIcon('telefono')}
              </th>
              <th className="py-3 px-4 font-semibold cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('categoria')}>
                Categoría{getSortIcon('categoria')}
              </th>
              {isAdmin && <th className="py-3 px-4 font-semibold">Unidad Académica</th>}
              <th className="py-3 px-4 font-semibold">Áreas</th>
              <th className="py-3 px-4 font-semibold text-center cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('estatus')}>
                Estatus{getSortIcon('estatus')}
              </th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedDocentes.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-400">No hay docentes registrados.</td>
              </tr>
            ) : (
              sortedDocentes.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="py-3 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(doc.id!)}
                      onChange={(e) => handleSelectOne(doc.id!, e.target.checked)}
                      className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-700">{doc.plaza || '—'}</td>
                  <td className="py-3 px-4 font-medium text-[#002d55]">
                    <div className="flex items-center gap-2">
                      <span>{doc.es_comodin ? doc.nombre : `${doc.apellidos || ''} ${doc.nombre}`}</span>
                      {doc.es_comodin && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-sm uppercase font-bold tracking-wider">Comodín</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600 font-mono text-xs">{doc.correo_institucional || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{doc.telefono || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{getNombreCategoria(doc.categoria_id)}</td>
                  
                  {isAdmin && (
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {doc.unidades && doc.unidades.length > 0 ? (
                          doc.unidades.map(u => (
                            <span key={u.unidad_academica.id} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200">
                              {u.unidad_academica.clave}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">Global</span>
                        )}
                      </div>
                    </td>
                  )}

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {doc.areas_conocimiento && doc.areas_conocimiento.length > 0 ? (
                        doc.areas_conocimiento.map(a => (
                          <span key={a.id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-blue-100">
                            {a.nombre}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">Sin áreas</span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm border ${
                      doc.estatus?.nombre === 'ACTIVO' ? 'bg-green-50 text-green-700 border-green-200' : 
                      (doc.estatus?.nombre === 'SABATICO' || doc.estatus?.nombre === 'SABÁTICO') ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      doc.estatus?.nombre === 'PERMISO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      doc.estatus?.nombre === 'INACTIVO' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {doc.estatus?.nombre || 'INACTIVO'}
                    </span>
                  </td>
                  
                  <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openForm(doc)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => requestDelete(doc.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <DocenteFormSlideOver 
        isOpen={isSlideOverOpen} 
        docente={editingDocente} 
        categoriasOptions={categoriasOptions}
        areasDisponibles={areas}
        onClose={closeForm} 
        onSuccess={cargarDatos} 
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Docente(s)"
        message={docenteToDelete ? "¿Estás seguro de que deseas eliminar este registro? Perderá todo su historial académico." : `¿Estás seguro de que deseas eliminar los ${selectedIds.length} docentes seleccionados?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(file) => docentesService.importar(file).then(cargarDatos)}
        title="Importar Docentes"
      />
    </div>
  );
}