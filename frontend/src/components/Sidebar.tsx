import { useState, useEffect } from 'react';
import {
  Building2, ChevronLeft, LayoutDashboard, ClipboardList, Layers,
  BookOpen, FileText, Library, Users, BarChart2, Bell, Settings,
  PlayCircle, Calendar, Briefcase, Activity, Shield, Award, Eye, Sliders, Send
} from 'lucide-react';
import SidebarHeader from './layout/SidebarHeader';
import UserProfileCard from './layout/UserProfileCard';
import NavItem from './layout/NavItem';
import { useAuthStore } from '../features/auth/store/useAuthStore';
import { invitacionesService } from '../services/invitaciones.service';

const bottomItems = [
  { label: 'Notificaciones', icon: Bell, badge: 2, path: '/notificaciones' },
  { label: 'Configuración', icon: Settings, path: '/configuracion' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [pendingInvitacionesCount, setPendingInvitacionesCount] = useState(0);
  const { user } = useAuthStore();
  const userRole = user?.rol;
  const unidadNombre = user?.unidad_academica_nombre;
  const unidadClave = user?.unidad_academica_clave;

  useEffect(() => {
    if (userRole === 'SECRETARIA_ACADEMICA' || userRole === 'SUPER_ADMIN') {
      invitacionesService.obtenerPendientesCount()
        .then(setPendingInvitacionesCount)
        .catch(err => console.error("Error al obtener invitaciones pendientes:", err));
    }
  }, [userRole]);

  const navItems = [
    { label: 'Inicio', icon: LayoutDashboard, path: '/' },

    // ─── PROCESOS OPERATIVOS ───
    { label: 'Apertura de Grupos', icon: PlayCircle, path: '/aperturas', role: 'SECRETARIA_ACADEMICA' },
    { label: 'Asignación Académica', icon: ClipboardList, path: '/asignacion', role: 'SECRETARIA_ACADEMICA' },
    { label: 'Creación de Horarios', icon: Calendar, path: '/horarios', role: 'SECRETARIA_ACADEMICA' },

    // ─── OFICIOS Y FIRMAS ───
    { label: 'Mi Carga y Firma', icon: Award, path: '/oficios/firma', role: 'DOCENTE' },
    { label: 'Mis Preferencias', icon: Sliders, path: '/preferencias', role: 'DOCENTE' },
    { label: 'Mi Horario', icon: Calendar, path: '/docente/horario', role: 'DOCENTE' },

    // ─── REPORTES Y AUDITORÍA ───
    {
      label: 'Reportes',
      icon: BarChart2,
      role: 'SECRETARIA_ACADEMICA',
      children: [
        { label: 'Plantillas de Oficios', icon: FileText, path: '/oficios/plantillas' },
        { label: 'Auditoría de Oficios', icon: Eye, path: '/oficios/auditoria' },
        { label: 'Horarios (PAD)', icon: Calendar, path: '/reportes/horarios' },
      ]
    },

    // ─── GESTIÓN ───
    { label: 'Gestión Docente', icon: Users, path: '/docentes' },
    { label: 'Invitaciones', icon: Send, path: '/invitaciones', role: 'SECRETARIA_ACADEMICA', badge: pendingInvitacionesCount > 0 ? pendingInvitacionesCount : undefined },
    { label: 'Usuarios y Roles', icon: Shield, path: '/usuarios', role: 'SUPER_ADMIN' },
    { label: 'Unidades Académicas', icon: Building2, path: '/unidades', role: 'SUPER_ADMIN' },

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
  ];

  const filteredNavItems = navItems.filter(item => {
    // Rutas exclusivas para Docentes
    if ((item.label === 'Mi Carga y Firma' || item.label === 'Mis Preferencias' || item.label === 'Mi Horario') && userRole !== 'DOCENTE') {
      return false;
    }

    if (item.role === 'SUPER_ADMIN' && userRole !== 'SUPER_ADMIN') {
      return false;
    }
    if (item.role === 'SECRETARIA_ACADEMICA' && userRole !== 'SECRETARIA_ACADEMICA') {
      return false;
    }
    if (item.role === 'DOCENTE' && userRole !== 'DOCENTE') {
      return false;
    }

    if (userRole === 'DOCENTE') {
      return item.label === 'Inicio' || item.label === 'Mi Carga y Firma' || item.label === 'Mis Preferencias' || item.label === 'Mi Horario';
    }

    if (userRole === 'CAPTURISTA') {
      return item.label === 'Inicio' || item.label === 'Catálogos';
    }

    return true;
  });

  // Filtrar bottomItems (Configuración solo visible para SECRETARIA_ACADEMICA)
  const filteredBottomItems = bottomItems.filter(item => {
    if (item.label === 'Configuración' && userRole !== 'SECRETARIA_ACADEMICA') {
      return false;
    }
    return true;
  });

  return (
    <div className={`shrink-0 h-screen sticky top-0 z-20 transition-all duration-300 ease-in-out ${collapsed ? 'w-18' : 'w-70'}`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-5 -right-2.5 z-50 w-5 h-5 rounded-full flex items-center justify-center bg-[#D4E600] text-[#060F5C] shadow-lg shadow-[#D4E600]/30 hover:scale-110 transition-transform border-2 border-[#060F5C] cursor-pointer"
      >
        <ChevronLeft size={10} strokeWidth={3} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      <aside className="relative flex flex-col h-full w-full font-sans select-none overflow-hidden rounded-r-2xl"
        style={{ background: '#002582', boxShadow: '4px 0 24px rgba(6,15,92,0.35)' }}>

        <SidebarHeader collapsed={collapsed} />

        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-1 custom-scrollbar">
          {!collapsed && (
            <div className="flex flex-col gap-0.5 px-4 mb-2 mt-2">
              <p className="text-[10px] font-semibold text-[#6B83D6] uppercase tracking-widest">Panel de Control</p>
              {unidadNombre && userRole !== 'SUPER_ADMIN' && (
                <span className="text-[10px] font-medium text-white/60 truncate" title={unidadNombre}>
                  🏫 {unidadClave ?? unidadNombre}
                </span>
              )}
              {userRole === 'SUPER_ADMIN' && (
                <span className="text-[10px] font-medium text-[#D4E600] truncate">⚡ Acceso Global</span>
              )}
            </div>
          )}
          {filteredNavItems.map(item => <NavItem key={item.label} item={item} collapsed={collapsed} />)}
        </nav>

        <div className="shrink-0 px-3 pb-4 space-y-1">
          <div className="mx-1 mb-2 h-px bg-linear-to-r from-transparent via-white/15 to-transparent" />
          {!collapsed && <p className="text-[10px] font-semibold text-[#6B83D6] uppercase tracking-widest px-4 mb-2">Sistema</p>}
          {filteredBottomItems.map(item => <NavItem key={item.label} item={item} collapsed={collapsed} />)}
          <UserProfileCard collapsed={collapsed} />
        </div>
      </aside>
    </div>
  );
}