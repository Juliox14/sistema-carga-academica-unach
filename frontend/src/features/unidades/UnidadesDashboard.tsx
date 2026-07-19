import { useEffect, useState } from "react";
import { Building2, Plus, Pencil, Trash2, MapPin, Loader2, Search } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import UnidadesFormSlideOver, { type UnidadAcademica } from "./components/UnidadesFormSlideOver";

function toRoman(num: number): string {
  if (num < 1 || num > 3999) return String(num);
  const lookup: [string, number][] = [
    ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
    ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
    ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
  ];
  let roman = '';
  let current = num;
  for (const [letter, value] of lookup) {
    while (current >= value) {
      roman += letter;
      current -= value;
    }
  }
  return roman;
}

export default function UnidadesDashboard() {
  const [unidades, setUnidades] = useState<UnidadAcademica[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState<UnidadAcademica | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof UnidadAcademica | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const fetchUnidades = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/unidades-academicas/");
      setUnidades(res.data);
    } catch {
      toast.error("Error al cargar las unidades académicas.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUnidades(); }, []);

  const openCreate = () => {
    setEditingUnidad(null);
    setModalOpen(true);
  };

  const openEdit = (u: UnidadAcademica) => {
    setEditingUnidad(u);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/unidades-academicas/${id}`);
      toast.success("Unidad eliminada.");
      setDeleteConfirmId(null);
      fetchUnidades();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "No se pudo eliminar la unidad.");
      setDeleteConfirmId(null);
    }
  };

  const handleSuccess = () => {
    setModalOpen(false);
    fetchUnidades();
  };

  const handleSort = (field: keyof UnidadAcademica) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof UnidadAcademica) => {
    if (sortField !== field) return '⇅';
    return sortDirection === 'asc' ? '▲' : '▼';
  };

  const filteredUnidades = unidades.filter(u => 
    u.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.clave.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.ciudad && u.ciudad.toLowerCase().includes(searchQuery.toLowerCase())) ||
    toRoman(u.campus).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedUnidades = [...filteredUnidades].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue === null) return 1;
    if (bValue === null) return -1;
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-xs border border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#002d55]/10 flex items-center justify-center text-[#002d55]">
              <Building2 size={20} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">
              Unidades Académicas
            </h1>
          </div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Administración de Sedes y Facultades
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#002d55] hover:bg-[#0038C3] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>Nueva Unidad</span>
        </button>
      </div>

      {/* Tabla de Unidades */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden flex flex-col">
        {/* Actions Bar (Search) */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar unidad por nombre, clave, campus o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#002d55] focus:border-[#002d55] transition-all"
            />
          </div>
          <div className="text-xs text-gray-400 font-semibold">
            Mostrando {sortedUnidades.length} de {unidades.length}
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="animate-spin text-[#002d55]" />
            <span className="text-sm font-semibold text-gray-500">Cargando unidades...</span>
          </div>
        ) : sortedUnidades.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
              <Building2 size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500">No se encontraron unidades académicas.</p>
              {unidades.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">Prueba cambiando tu búsqueda.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('clave')}
                  >
                    Clave {getSortIcon('clave')}
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('nombre')}
                  >
                    Nombre de Unidad {getSortIcon('nombre')}
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('campus')}
                  >
                    Campus {getSortIcon('campus')}
                  </th>
                  <th 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('ciudad')}
                  >
                    Ubicación {getSortIcon('ciudad')}
                  </th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedUnidades.map((u) => (
                  <tr 
                    key={u.id} 
                    className="hover:bg-gray-50/50 transition-colors group relative"
                  >
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[#002d55]/5 text-[#002d55] border border-[#002d55]/10 uppercase tracking-wide">
                        {u.clave}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-800">{u.nombre}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {toRoman(u.campus)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {(u.ciudad || u.direccion) ? (
                        <div className="space-y-1">
                          {u.ciudad && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                              <MapPin size={12} className="text-gray-400" />
                              {u.ciudad}
                            </div>
                          )}
                          {u.direccion && (
                            <p className="text-xs text-gray-400 line-clamp-1 max-w-62.5" title={u.direccion}>
                              {u.direccion}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No especificada</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {deleteConfirmId === u.id ? (
                          <div className="flex items-center gap-2 absolute right-6 bg-white py-1 px-3 rounded-xl border border-red-100 shadow-sm animate-fade-in z-10">
                            <span className="text-xs font-bold text-red-600 mr-2">¿Eliminar?</span>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 shadow-sm transition-colors"
                            >
                              Confirmar
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => openEdit(u)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-[#002d55] hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                              title="Editar Unidad"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(u.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                              title="Eliminar Unidad"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <UnidadesFormSlideOver 
        isOpen={modalOpen} 
        unidad={editingUnidad} 
        onClose={() => setModalOpen(false)} 
        onSuccess={handleSuccess} 
      />
    </div>
  );
}
