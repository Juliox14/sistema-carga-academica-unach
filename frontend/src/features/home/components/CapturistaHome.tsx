import { Calendar, Building2, FileText, Award, ArrowRight } from 'lucide-react';

interface CapturistaHomeProps {
  displayNombre: string;
  navigate: (path: string) => void;
}

export default function CapturistaHome({ displayNombre, navigate }: CapturistaHomeProps) {
  const capturistaCards = [
    {
      title: 'Ciclos Escolares',
      description: 'Gestione los ciclos escolares activos del sistema.',
      icon: Calendar,
      path: '/catalogos/ciclos',
      color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100/50'
    },
    {
      title: 'Programas Educativos',
      description: 'Configure las facultades, escuelas y programas.',
      icon: Building2,
      path: '/catalogos/programas',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/50'
    },
    {
      title: 'Planes de Estudio',
      description: 'Administre los planes de estudios y retículas.',
      icon: FileText,
      path: '/catalogos/planes',
      color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/50'
    },
    {
      title: 'Catálogo de Materias',
      description: 'Cargue, edite e importe asignaturas del plan académico.',
      icon: Award,
      path: '/catalogos/materias',
      color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100/50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Banner Principal */}
      <div className="bg-linear-to-r from-[#0d5f47] to-[#128a67] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-emerald-900">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Building2 size={220} className="text-white" />
        </div>
        <div className="space-y-3 max-w-2xl text-left">
          <div className="inline-flex items-center gap-1.5 bg-yellow-400/25 border border-yellow-400 text-yellow-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Rol: Capturista Escolar
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bienvenido, {displayNombre}
          </h2>
          <p className="text-emerald-100 text-sm leading-relaxed">
            Su función es fundamental para alimentar y mantener actualizados los catálogos base de la facultad (ciclos, materias, planes de estudios).
          </p>
        </div>
      </div>

      {/* Accesos Catálogos */}
      <div className="space-y-4 text-left">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Módulos de Captura</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capturistaCards.map((card, idx) => {
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
                  Entrar <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
