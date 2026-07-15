import { Clock } from 'lucide-react';
import { useAsignacionStore } from '../store/useAsignacionStore';

export default function TeacherStatsBar() {
  const { 
    horasFrenteGrupo, 
    horasDescargadas, 
    horasOtrasActividades, 
    sumaTotal, 
    hsmBase,
    docenteSeleccionadoId,
    nombreDocente
  } = useAsignacionStore();

  const baseSegura = hsmBase > 0 ? hsmBase : 50;

  const pFrente = (horasFrenteGrupo / baseSegura) * 100;
  const pOtras = (horasOtrasActividades / baseSegura) * 100;
  const pDescargas = (horasDescargadas / baseSegura) * 100;

  if (!docenteSeleccionadoId) {
    return (
      <section className="bg-white px-6 py-4 border border-gray-200 flex items-center justify-center text-gray-400 text-sm italic">
        Selecciona un docente en el buscador superior para ver su carga académica actual.
      </section>
    );
  }

  return (
    <section className="flex items-center justify-between bg-white px-6 py-4 border border-gray-200 border-l-4 border-l-[#002d55]">
      <div className="flex flex-col">
        <h2 className="text-lg font-bold text-gray-800">
          {/* El nombre se renderiza dinámicamente y en mayúsculas */}
          Carga Actual: <span className="text-[#002d55] uppercase">{nombreDocente}</span>
        </h2>
        <div className="flex gap-6 mt-2 text-xs font-semibold text-gray-600">
          <span className="flex items-center gap-1">
            <Clock size={14} className="text-blue-500"/> Frente a grupo: {horasFrenteGrupo}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} className="text-teal-500"/> Otras Actividades: {horasOtrasActividades}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} className="text-purple-500"/> Descargadas: {horasDescargadas}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm font-bold text-[#002d55]">Total Asignado: {sumaTotal} / {baseSegura !== 50 ? baseSegura : "Sin límite"} hrs</span>
        <div className="w-64 h-2.5 bg-gray-200 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-blue-500 transition-all duration-500" 
            style={{ width: `${pFrente}%` }} 
            title={`Frente a grupo: ${horasFrenteGrupo}`}
          ></div>
          <div 
            className="h-full bg-teal-500 transition-all duration-500" 
            style={{ width: `${pOtras}%` }} 
            title={`Otras act: ${horasOtrasActividades}`}
          ></div>
          <div 
            className="h-full bg-purple-500 transition-all duration-500" 
            style={{ width: `${pDescargas}%` }} 
            title={`Descargas: ${horasDescargadas}`}
          ></div>
        </div>
      </div>
    </section>
  );
}