import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import type { GrupoAbiertoResponse } from '../../services/apertura.service';

interface AperturaListTableProps {
  gruposAbiertos: GrupoAbiertoResponse[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setGrupoToDelete: (grupo: GrupoAbiertoResponse) => void;
  setDeleteConfirmOpen: (open: boolean) => void;
}

export default function AperturaListTable({
  gruposAbiertos,
  searchQuery,
  setSearchQuery,
  setGrupoToDelete,
  setDeleteConfirmOpen
}: AperturaListTableProps) {
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

  const filtered = gruposAbiertos.filter(g => {
    const query = searchQuery.toLowerCase();
    return (
      g.plan_estudios_nombre.toLowerCase().includes(query) ||
      g.grupo.toLowerCase().includes(query) ||
      String(g.numero_periodo).includes(query) ||
      g.turno.toLowerCase().includes(query) ||
      g.ciclo_escolar_nombre.toLowerCase().includes(query)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;

    const aVal = a[sortField as keyof typeof a];
    const bVal = b[sortField as keyof typeof b];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal || '');
    const bStr = String(bVal || '');
    return sortDirection === 'asc'
      ? aStr.localeCompare(bStr, 'es', { numeric: true })
      : bStr.localeCompare(aStr, 'es', { numeric: true });
  });

  return (
    <div className="bg-white border border-gray-100 shadow-xs rounded-2xl overflow-hidden flex flex-col space-y-4 p-5">
      {/* Buscador */}
      <div className="relative max-w-md w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
        <input
          type="text"
          placeholder="Buscar por plan, periodo, grupo o turno..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#002d55] focus:border-[#002d55] transition-all text-gray-700"
        />
      </div>

      {/* Tabla de Grupos */}
      <div className="overflow-x-auto border border-gray-150 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-400 uppercase tracking-widest select-none">
              <th 
                className="px-6 py-3.5 cursor-pointer hover:text-black hover:bg-gray-100/50 transition-colors"
                onClick={() => handleSort('plan_estudios_nombre')}
              >
                Plan de Estudios{getSortIcon('plan_estudios_nombre')}
              </th>
              <th 
                className="px-6 py-3.5 cursor-pointer hover:text-black hover:bg-gray-100/50 transition-colors text-center"
                onClick={() => handleSort('numero_periodo')}
              >
                Periodo{getSortIcon('numero_periodo')}
              </th>
              <th 
                className="px-6 py-3.5 cursor-pointer hover:text-black hover:bg-gray-100/50 transition-colors text-center"
                onClick={() => handleSort('grupo')}
              >
                Grupo{getSortIcon('grupo')}
              </th>
              <th 
                className="px-6 py-3.5 cursor-pointer hover:text-black hover:bg-gray-100/50 transition-colors"
                onClick={() => handleSort('turno')}
              >
                Turno{getSortIcon('turno')}
              </th>
              <th 
                className="px-6 py-3.5 cursor-pointer hover:text-black hover:bg-gray-100/50 transition-colors"
                onClick={() => handleSort('ciclo_escolar_nombre')}
              >
                Ciclo Escolar{getSortIcon('ciclo_escolar_nombre')}
              </th>
              <th className="px-6 py-3.5 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
            {sorted.map(g => (
              <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-800">{g.plan_estudios_nombre}</td>
                <td className="px-6 py-4 font-semibold text-gray-500 text-center">{g.numero_periodo}° Nivel</td>
                <td className="px-6 py-4 font-mono font-bold text-[#002d55] text-center">Grupo "{g.grupo}"</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[9px] ${
                    g.turno === 'MATUTINO' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    g.turno === 'VESPERTINO' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                    'bg-teal-50 text-teal-700 border border-teal-200'
                  }`}>
                    {g.turno}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-450 font-medium">{g.ciclo_escolar_nombre}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => {
                      setGrupoToDelete(g);
                      setDeleteConfirmOpen(true);
                    }}
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg cursor-pointer transition-colors"
                    title="Eliminar Grupo Abierto"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}

            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-xs text-gray-400 font-semibold italic">
                  No hay registros de grupos abiertos para este ciclo escolar o que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
