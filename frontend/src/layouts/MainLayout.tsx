import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Calendar as CalendarIcon } from 'lucide-react';

export default function MainLayout() {
  return (
    <div className="flex h-screen bg-[#f3f4f6] font-sans overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-[#002d55]">SIPAD Portal</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
            <CalendarIcon size={16} className="text-[#002d55]" />
            <span className="font-medium">Ciclo Activo</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}