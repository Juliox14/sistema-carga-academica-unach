import { Users, Award, Sliders, ArrowRight } from 'lucide-react';

interface DocenteHomeProps {
  displayNombre: string;
  navigate: (path: string) => void;
}

export default function DocenteHome({ displayNombre, navigate }: DocenteHomeProps) {
  return (
    <div className="space-y-8">
      {/* Banner Principal */}
      <div className="bg-linear-to-r from-[#0038C3] to-[#00288c] rounded-3xl p-8 text-white relative overflow-hidden shadow-lg border border-blue-800">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center pointer-events-none">
          <Users size={220} className="text-white" />
        </div>
        <div className="space-y-3 max-w-2xl text-left">
          <div className="inline-flex items-center gap-1.5 bg-[#D4E600]/20 border border-[#D4E600] text-[#D4E600] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse">
            Portal Docente UNACH
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Bienvenido, Mtro. {displayNombre}
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Consulte su carga académica asignada, firme de conformidad sus oficios oficiales del ciclo escolar activo y configure sus prioridades de horario.
          </p>
        </div>
      </div>

      {/* Accesos Docente */}
      <div className="space-y-4 text-left">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Acciones Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Firma */}
          <div 
            onClick={() => navigate('/oficios/firma')}
            className="p-6 bg-emerald-50/50 border border-emerald-200 rounded-3xl hover:border-emerald-400 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[160px] text-left group"
          >
            <div className="space-y-2">
              <Award size={28} className="text-emerald-700 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-md text-emerald-950">Mi Carga y Firma Digital</h4>
              <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                Acceda a su portal oficial de firmas para revisar el oficio de asignación de materias emitido por la secretaría académica y manifestar su aceptación o rechazo.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold mt-4 self-end text-emerald-700 group-hover:translate-x-1 transition-transform">
              Ir a Firmar <ArrowRight size={12} />
            </div>
          </div>

          {/* Card 2: Preferencias */}
          <div 
            onClick={() => navigate('/preferencias')}
            className="p-6 bg-blue-50/50 border border-blue-200 rounded-3xl hover:border-blue-400 transition-all duration-300 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[160px] text-left group"
          >
            <div className="space-y-2">
              <Sliders size={28} className="text-blue-700 group-hover:scale-110 transition-transform" />
              <h4 className="font-bold text-md text-blue-950">Mis Preferencias Horarias</h4>
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Indique sus días preferidos de la semana y configure los bloques de horas en los que prefiere evitar dar clases para que la coordinación organice su horario ideal.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold mt-4 self-end text-blue-700 group-hover:translate-x-1 transition-transform">
              Configurar Preferencias <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
