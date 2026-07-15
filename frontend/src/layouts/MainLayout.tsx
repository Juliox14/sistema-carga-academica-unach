import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Calendar as CalendarIcon, Lock } from 'lucide-react';
import { ciclosService } from '../services/ciclos.service';
import type { CicloEscolar } from '../types/ciclos';

export default function MainLayout() {
  const [cicloActivo, setCicloActivo] = useState<CicloEscolar | null | undefined>(undefined);

  useEffect(() => {
    ciclosService.obtenerTodos()
      .then(ciclos => setCicloActivo(ciclos.find(c => c.activo) ?? null))
      .catch(() => setCicloActivo(null));
  }, []);

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-[#002d55]">SIPAD Portal</h1>

          {/* Badge de ciclo activo */}
          {cicloActivo === undefined ? (
            // Skeleton mientras carga
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200 animate-pulse">
              <div className="w-4 h-4 bg-gray-300 rounded" />
              <div className="w-32 h-3 bg-gray-300 rounded" />
            </div>
          ) : cicloActivo === null ? (
            // Sin ciclo activo
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
              <CalendarIcon size={16} className="text-gray-400" />
              <span className="font-medium">Sin ciclo activo</span>
            </div>
          ) : (
            // Ciclo activo encontrado
            <div className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border font-medium ${
              cicloActivo.carga_finalizada
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {cicloActivo.carga_finalizada
                ? <Lock size={14} className="text-amber-500 shrink-0" />
                : <CalendarIcon size={15} className="text-emerald-600 shrink-0" />
              }
              <span>{cicloActivo.nombre}</span>
              {cicloActivo.carga_finalizada && (
                <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded uppercase tracking-wide ml-1">
                  Carga finalizada
                </span>
              )}
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}