import { PlayCircle, ClipboardList, Calendar, Settings, Shield, ArrowRight } from 'lucide-react';

interface AdminHomeProps {
  navigate: (path: string) => void;
  displayNombre?: string;
}

export default function AdminHome({ navigate, displayNombre = 'Administrador' }: AdminHomeProps) {
  const adminCards = [
    {
      title: 'Usuarios y Roles',
      description: 'Gestión de accesos, creación de cuentas y asignación de roles de personal.',
      icon: Shield,
      path: '/usuarios',
      color: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100/50'
    },
    {
      title: 'Plantillas de Oficios',
      description: 'Configure la leyenda y estructura del oficio UNACH de carga horaria.',
      icon: Settings,
      path: '/oficios/plantillas',
      color: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100/50'
    },
    {
      title: 'Apertura de Grupos',
      description: 'Defina y configure cuántos grupos abrir por periodo y plan de estudios para el ciclo.',
      icon: PlayCircle,
      path: '/aperturas',
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/50'
    },
    {
      title: 'Asignación Académica',
      description: 'Gestione las materias de cada grupo y asigne docentes titulares o provisionales.',
      icon: ClipboardList,
      path: '/asignacion',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50'
    },
    {
      title: 'Creación de Horarios',
      description: 'Calendarice clases con el motor semiautomático que optimiza por preferencias docentes.',
      icon: Calendar,
      path: '/horarios',
      color: 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100/50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Banner Principal */}
      <div className="bg-linear-to-r from-red-950 to-red-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-red-950">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Shield size={220} className="text-white" />
        </div>
        <div className="space-y-3 max-w-2xl text-left">
          <div className="inline-flex items-center gap-1.5 bg-red-400/25 border border-red-400 text-red-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Administración Central
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Hola, {displayNombre}
          </h2>
          <p className="text-red-200 text-sm leading-relaxed">
            Controle los privilegios del personal, configure plantillas institucionales oficiales de los oficios, y supervise la consistencia técnica de la base de datos.
          </p>
        </div>
      </div>

      {/* Tarjetas Administrativas */}
      <div className="space-y-4 text-left">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Módulos Administrativos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx}
                onClick={() => navigate(card.path)}
                className={`p-6 border rounded-2xl transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between h-[160px] text-left group ${card.color}`}
              >
                <div className="space-y-2">
                  <Icon size={24} className="group-hover:scale-110 transition-transform" />
                  <h4 className="font-bold text-sm text-gray-800">{card.title}</h4>
                  <p className="text-[11px] text-gray-400 leading-tight font-medium">{card.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold mt-2 self-end group-hover:translate-x-1 transition-transform">
                  Gestionar <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
