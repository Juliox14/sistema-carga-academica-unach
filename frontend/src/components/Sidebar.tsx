import { useState } from 'react';
import {
  Building2, ChevronRight, LayoutDashboard, ClipboardList, Layers,
  BookOpen, FileText, Library, Users, BarChart2, Bell, Settings,
  PlayCircle, Calendar, Briefcase, Activity
} from 'lucide-react';
import SidebarHeader from './layout/SidebarHeader';
import UserProfileCard from './layout/UserProfileCard';
import NavItem from './layout/NavItem';

const navItems = [
  { label: 'Inicio', icon: LayoutDashboard, path: '/' },

  // ─── PROCESOS OPERATIVOS ───
  { label: 'Apertura de Grupos', icon: PlayCircle, path: '/aperturas' },
  { label: 'Asignación Académica', icon: ClipboardList, path: '/asignacion' },

  // ─── GESTIÓN ───
  { label: 'Gestión Docente', icon: Users, path: '/docentes' },

  // ─── CONFIGURACIÓN BASE ───
  {
    label: 'Catálogos',
    icon: Layers,
    children: [
      { label: 'Ciclos Escolares', icon: Calendar, path: '/catalogos/ciclos' },
      { label: 'Programas Educativos', icon: Building2, path: '/catalogos/programas' },
      { label: 'Planes de Estudio', icon: BookOpen, path: '/catalogos/planes' },
      { label: 'Materias', icon: FileText, path: '/catalogos/materias' },
      { label: 'Áreas de Conocimiento', icon: Library, path: '/catalogos/areas' },
      { label: 'Categorías Docentes', icon: Briefcase, path: '/catalogos/categorias' },
      { label: 'Otras Actividades', icon: Activity, path: '/catalogos/actividades' },
    ],
  },

  { label: 'Reportes', icon: BarChart2, path: '/reportes' },
];

const bottomItems = [
  { label: 'Notificaciones', icon: Bell, badge: 2, path: '/notificaciones' },
  { label: 'Configuración', icon: Settings, path: '/configuracion' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`relative shrink-0 h-screen sticky top-0 z-20 transition-all duration-300 ease-in-out ${collapsed ? 'w-18' : 'w-70'}`}>
      {/* BUG 1 FIX: Botón FUERA del aside (que tiene overflow-hidden) para que no se recorte */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-5 -right-2.5 z-50 w-5 h-5 rounded-full flex items-center justify-center bg-[#D4E600] text-[#060F5C] shadow-lg shadow-[#D4E600]/30 hover:scale-110 transition-transform border-2 border-[#060F5C]"
      >
        <ChevronRight size={10} strokeWidth={3} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      <aside className="relative flex flex-col h-full w-full font-sans select-none overflow-hidden"
        style={{ background: '#0038C3', boxShadow: '4px 0 24px rgba(6,15,92,0.35)' }}>

        <SidebarHeader collapsed={collapsed} />

        {/* BUG 3 FIX: clase custom-scrollbar aplicada al nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-1 custom-scrollbar">
          {!collapsed && <p className="text-[10px] font-semibold text-[#6B83D6] uppercase tracking-widest px-4 mb-2 mt-2">Panel de Control</p>}
          {navItems.map(item => <NavItem key={item.label} item={item} collapsed={collapsed} />)}
        </nav>

        <div className="shrink-0 px-3 pb-4 space-y-1">
          <div className="mx-1 mb-2 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
          {!collapsed && <p className="text-[10px] font-semibold text-[#6B83D6] uppercase tracking-widest px-4 mb-2">Sistema</p>}
          {bottomItems.map(item => <NavItem key={item.label} item={item} collapsed={collapsed} />)}
          <UserProfileCard collapsed={collapsed} />
        </div>
      </aside>
    </div>
  );
}