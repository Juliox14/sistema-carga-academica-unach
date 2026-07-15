import { PlayCircle, ClipboardList, Calendar, FileText, ArrowRight, Sparkles, Building2 } from 'lucide-react';

interface SecretariaHomeProps {
  displayNombre: string;
  navigate: (path: string) => void;
}

export default function SecretariaHome({ displayNombre, navigate }: SecretariaHomeProps) {
  const coordCards = [
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
    },
    {
      title: 'Auditoría de Oficios',
      description: 'Monitoree el estatus de firma y conformidad de la carga horaria por parte de los docentes.',
      icon: FileText,
      path: '/oficios/auditoria',
      color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Banner Principal */}
      <div className="bg-linear-to-r from-[#002d55] to-[#004e92] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-blue-900">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Building2 size={220} className="text-white" />
        </div>
        <div className="space-y-3 max-w-2xl text-left">
          <div className="inline-flex items-center gap-1.5 bg-yellow-400/25 border border-yellow-400 text-yellow-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            <Sparkles size={12} className="animate-spin" />
            Portal de Planeación Académica
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bienvenido, {displayNombre}
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Gestione y supervise la planeación del ciclo escolar activo. Siga la ruta lógica del sistema para completar la apertura de grupos, asignaciones y horarios.
          </p>
        </div>
      </div>

      {/* Flujo de Trabajo */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs text-left">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-5">Ruta de Planeación Activa</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {[
            { step: '1', title: 'Apertura', desc: 'Definición de grupos abiertos', active: true },
            { step: '2', title: 'Asignación', desc: 'Asignación de docentes y HSM', active: true },
            { step: '3', title: 'Firma y Oficios', desc: 'Conformidad docente en línea', active: true },
            { step: '4', title: 'Horarios de Clase', desc: 'Motor de sugerencia de celdas', active: true }
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-gray-50/50 border border-gray-200 rounded-2xl relative space-y-1">
              <span className="w-6 h-6 rounded-full bg-[#002d55] text-white font-bold text-xs flex items-center justify-center">
                {item.step}
              </span>
              <h4 className="font-bold text-xs text-gray-800 mt-2">{item.title}</h4>
              <p className="text-[10px] text-gray-400 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Accesos Rápidos */}
      <div className="space-y-4 text-left">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Módulos Operativos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {coordCards.map((card, idx) => {
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
                  Acceder <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
