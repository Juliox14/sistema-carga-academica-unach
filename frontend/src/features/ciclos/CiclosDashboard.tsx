import {Fragment} from 'react';
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, PlayCircle, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { ConfirmAlert } from '../../components/ui/ConfirmAlert';
import { useAuthStore } from '../auth/store/useAuthStore';
import toast from 'react-hot-toast';

import type { CicloEscolar } from '../../types/ciclos';

import CicloFormSlideOver from './components/CiclosFormSlideOver';
import { ciclosService } from '../../services/ciclos.service';

export default function CiclosDashboard() {
  const { user } = useAuthStore();
  const isAdmin = user?.rol === 'SUPER_ADMIN';
  
  const [ciclos, setCiclos] = useState<CicloEscolar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [editingCiclo, setEditingCiclo] = useState<CicloEscolar | null>(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [cicloToDelete, setCicloToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  // Estados para Cierre de Ciclo
  const [closeAlertOpen, setCloseAlertOpen] = useState(false);
  const [cicloToClose, setCicloToClose] = useState<CicloEscolar | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Estados de Búsqueda y Selección
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const data = await ciclosService.obtenerTodos();
      setCiclos(data);
      setSelectedIds([]);
    } catch (error) {
      console.error("Error al cargar ciclos:", error);
      alert("Hubo un error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  // Lógica de Búsqueda y Selección
  const filteredCiclos = ciclos.filter(ciclo => 
    ciclo.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(ciclo.anio).includes(searchQuery)
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const ids = filteredCiclos.map(c => c.id).filter(id => id !== undefined) as number[];
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      const ids = filteredCiclos.map(c => c.id);
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

  const sortedCiclos = [...filteredCiclos].sort((a, b) => {
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
    setCicloToDelete(id);
    setDeleteAlertOpen(true);
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setCicloToDelete(null);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      if (cicloToDelete) {
        await ciclosService.eliminar(cicloToDelete);
        setSelectedIds(prev => prev.filter(id => id !== cicloToDelete));
      } else if (selectedIds.length > 0) {
        await Promise.all(selectedIds.map(id => ciclosService.eliminar(id)));
        setSelectedIds([]);
      }
      await cargarDatos();
      setDeleteAlertOpen(false);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert("No se pudieron eliminar los ciclos. Es probable que ya tengan cargas académicas registradas.");
    } finally {
      setIsDeleting(false);
      setCicloToDelete(null);
    }
  };

  const openForm = (ciclo: CicloEscolar | null = null) => {
    setEditingCiclo(ciclo);
    setIsSlideOverOpen(true);
  };

  const closeForm = () => {
    setIsSlideOverOpen(false);
    setTimeout(() => setEditingCiclo(null), 300);
  };

  const handleActivar = async (ciclo: CicloEscolar) => {
    try {
      let unidadId: number | undefined = undefined;
      if (isAdmin) {
        const input = window.prompt('Eres SUPER_ADMIN. Ingresa el ID de la unidad académica para activar este ciclo:');
        if (!input) return;
        unidadId = parseInt(input);
        if (isNaN(unidadId)) return alert('ID inválido');
      }
      await ciclosService.activar(ciclo.id!, unidadId);
      await cargarDatos();
      toast.success('Ciclo activado exitosamente');
    } catch (error: any) {
      console.error("Error al activar:", error);
      toast.error(error?.response?.data?.detail || "No se pudo activar el ciclo.");
    }
  };

  const openCloseAlert = (ciclo: CicloEscolar) => {
    setCicloToClose(ciclo);
    setCloseAlertOpen(true);
  };

  const confirmClose = async () => {
    if (!cicloToClose) return;
    setIsClosing(true);
    try {
      let unidadId: number | undefined = undefined;
      if (isAdmin) {
        const input = window.prompt('Eres SUPER_ADMIN. Ingresa el ID de la unidad académica para cerrar este ciclo:');
        if (!input) {
          setIsClosing(false);
          setCloseAlertOpen(false);
          return;
        }
        unidadId = parseInt(input);
        if (isNaN(unidadId)) {
          setIsClosing(false);
          setCloseAlertOpen(false);
          return toast.error('ID inválido');
        }
      }
      await ciclosService.cerrar(cicloToClose.id!, unidadId);
      await cargarDatos();
      toast.success('Ciclo cerrado y carga finalizada exitosamente.');
      setCloseAlertOpen(false);
    } catch (error: any) {
      console.error("Error al cerrar:", error);
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        alert("El ciclo no se puede cerrar por las siguientes validaciones pendientes:\n\n" + detail.join('\n'));
      } else {
        toast.error(detail || "No se pudo cerrar el ciclo.");
      }
      setCloseAlertOpen(false);
    } finally {
      setIsClosing(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002d55]">Ciclos Escolares</h1>
          <p className="text-sm text-gray-500 mt-1">Administra los periodos de clases (semestres/cuatrimestres) de la institución.</p>
        </div>
        {isAdmin && (
          <button onClick={() => openForm()} className="flex items-center gap-2 bg-[#002d55] text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-[#001f3b] transition-colors shadow-sm cursor-pointer">
            <Plus size={16} /> Nuevo Ciclo
          </button>
        )}
      </div>

      <div className="bg-white p-4 border border-gray-200 border-b-0 flex justify-between items-center gap-4">
        <div className="relative grow max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o año..." 
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
                  checked={filteredCiclos.length > 0 && filteredCiclos.every(c => selectedIds.includes(c.id!))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                />
              </th>
              {isAdmin && <th className="py-3 px-2 w-10"></th>}
              <th className="py-3 px-4 font-semibold w-2/5 cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('nombre')}>
                Periodo Escolar{getSortIcon('nombre')}
              </th>
              <th className="py-3 px-4 font-semibold text-center cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('anio')}>
                Año{getSortIcon('anio')}
              </th>
              <th className="py-3 px-4 font-semibold text-center cursor-pointer select-none hover:text-black hover:bg-gray-100" onClick={() => handleSort('activo')}>
                Estado{getSortIcon('activo')}
              </th>
              <th className="py-3 px-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedCiclos.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center text-gray-400">No hay ciclos escolares registrados.</td>
              </tr>
            ) : (
              sortedCiclos.map((ciclo) => (
                <Fragment key={ciclo.id}>
                  <tr className={`hover:bg-blue-50/50 transition-colors group ${ciclo.activo ? 'bg-blue-50/20' : ''}`}>
                    <td className="py-3 px-4 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(ciclo.id!)}
                        onChange={(e) => handleSelectOne(ciclo.id!, e.target.checked)}
                        className="rounded-sm border-gray-300 text-[#002d55] focus:ring-[#002d55] cursor-pointer"
                      />
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-2 text-center">
                        <button onClick={() => toggleExpand(ciclo.id!)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                          {expandedRows.includes(ciclo.id!) ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                      </td>
                    )}
                    <td className="py-3 px-4 font-bold text-[#002d55]">{ciclo.nombre}</td>
                    <td className="py-3 px-4 text-center font-medium text-gray-600">{ciclo.anio}</td>
                    <td className="py-3 px-4 text-center">
                      {isAdmin ? (
                        <span className="text-gray-400 text-xs italic">Ver detalle abajo</span>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-sm border ${
                          ciclo.activo 
                            ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' 
                            : ciclo.carga_finalizada
                              ? 'bg-purple-50 text-purple-700 border-purple-200 shadow-sm'
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}>
                          {ciclo.activo ? 'Activo (Actual)' : ciclo.carga_finalizada ? 'Cerrado' : 'Histórico / Inactivo'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isAdmin && ciclo.activo && ciclo.carga_finalizada && (
                        <button onClick={() => openCloseAlert(ciclo)} className="text-gray-400 hover:text-purple-600 mx-2 cursor-pointer" title="Cerrar Ciclo Definitivamente">
                          <CheckCircle2 size={18} />
                        </button>
                      )}
                      {!isAdmin && !ciclo.activo && !ciclo.carga_finalizada && (
                        <button onClick={() => handleActivar(ciclo)} className="text-gray-400 hover:text-green-600 mx-2 cursor-pointer" title="Activar Ciclo">
                          <PlayCircle size={18} />
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <button onClick={() => openForm(ciclo)} className="text-gray-400 hover:text-[#002d55] mx-2 cursor-pointer" title="Editar">
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => requestDelete(ciclo.id)} className="text-gray-400 hover:text-red-500 cursor-pointer" title="Eliminar">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                  {isAdmin && expandedRows.includes(ciclo.id!) && (
                    <tr className="bg-slate-50 border-b border-gray-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                      <td colSpan={6} className="p-0">
                        <div className="px-12 py-5">
                          <h4 className="text-sm font-semibold text-[#002d55] mb-3">Detalle por Unidad Académica</h4>
                          {(!ciclo.estados_unidades || ciclo.estados_unidades.length === 0) ? (
                            <p className="text-sm text-gray-400 italic bg-white p-4 rounded-md border border-gray-200">No hay unidades académicas registradas.</p>
                          ) : (
                            <div className="bg-white border border-gray-200 rounded-md overflow-hidden max-w-3xl">
                              <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                                  <tr>
                                    <th className="py-2.5 px-4 text-left font-medium">Unidad Académica</th>
                                    <th className="py-2.5 px-4 text-right font-medium">Estado del Ciclo</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {ciclo.estados_unidades.map(eu => (
                                    <tr key={eu.unidad_academica_id} className="hover:bg-gray-50 transition-colors">
                                      <td className="py-3 px-4 text-gray-700 font-medium">{eu.unidad_academica_nombre}</td>
                                      <td className="py-3 px-4 text-right">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                          eu.activo 
                                            ? 'bg-green-100 text-green-700' 
                                            : eu.carga_finalizada
                                              ? 'bg-purple-100 text-purple-700'
                                              : 'bg-gray-100 text-gray-500'
                                        }`}>
                                          {eu.activo ? 'Activo (Abierto)' : eu.carga_finalizada ? 'Cerrado Definitivamente' : 'Histórico'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}

          </tbody>
        </table>
      </div>

      <CicloFormSlideOver
        isOpen={isSlideOverOpen}
        ciclo={editingCiclo}
        onClose={closeForm}
        onSuccess={cargarDatos}
      />

      <ConfirmAlert
        isOpen={deleteAlertOpen}
        title="Eliminar Ciclo(s) Escolar(es)"
        message={cicloToDelete ? "¿Estás seguro de que deseas eliminar este ciclo? Todas las aperturas de grupos y asignaciones vinculadas se verán afectadas." : `¿Estás seguro de que deseas eliminar los ${selectedIds.length} ciclos seleccionados?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteAlertOpen(false)}
        isLoading={isDeleting}
      />

      <ConfirmAlert
        isOpen={closeAlertOpen}
        title="Cerrar Ciclo Definitivamente"
        message={cicloToClose ? `¿Estás seguro de cerrar definitivamente el ciclo ${cicloToClose.nombre} ${cicloToClose.anio}? No se podrán hacer más asignaciones ni modificar horarios.` : ""}
        onConfirm={confirmClose}
        onCancel={() => setCloseAlertOpen(false)}
        isLoading={isClosing}
        confirmText="Sí, cerrar ciclo"
        cancelText="Cancelar"
      />
    </div>
  );
}