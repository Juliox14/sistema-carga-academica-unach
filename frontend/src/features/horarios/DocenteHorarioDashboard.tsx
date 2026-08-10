import { useEffect, useState } from 'react';
import { horariosService } from '../../services/horarios.service';
import type { MiHorarioResponse } from '../../services/horarios.service';
import { Calendar, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function DocenteHorarioDashboard() {
  const [loading, setLoading] = useState(true);
  const [horario, setHorario] = useState<MiHorarioResponse | null>(null);

  useEffect(() => {
    const loadHorario = async () => {
      setLoading(true);
      try {
        const data = await horariosService.obtenerMiHorario();
        setHorario(data);
      } catch (error: any) {
        if (error.response?.status !== 400) {
          toast.error("Error al cargar el horario.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadHorario();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="animate-spin text-[#002d55] mb-4" size={48} />
        <p className="text-gray-500 font-medium">Cargando horario...</p>
      </div>
    );
  }

  if (!horario || (horario.materias.length === 0 && horario.otras_actividades?.length === 0)) {
    return (
      <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <Calendar size={48} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Sin carga académica asignada</h2>
          <p className="text-gray-500 max-w-md">
            Actualmente no tienes materias ni horarios asignados para este ciclo escolar, o el ciclo no está activo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col relative space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mi Horario</h1>
          <p className="text-gray-500 mt-1">Consulta tu carga académica y horarios frente a grupo asignados.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Table header mimicking the image */}
        <div className="bg-[#002d55] text-white text-center font-bold py-2 text-sm uppercase tracking-wide">
          CARGA ACADÉMICA DOCENTE
        </div>
        <div className="bg-gray-200 text-gray-700 text-center font-semibold py-1.5 text-xs uppercase border-y border-gray-300">
          HORARIOS DOCENCIA FRENTE A GRUPO
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold border-b-2 border-gray-300">
              <tr>
                <th className="px-4 py-3 border-r border-gray-200 text-center">Prog. Educ.</th>
                <th className="px-4 py-3 border-r border-gray-200">Unidad de Competencia</th>
                <th className="px-3 py-3 border-r border-gray-200 text-center">PDO</th>
                <th className="px-3 py-3 border-r border-gray-200 text-center">G</th>
                <th className="px-3 py-3 border-r border-gray-200 text-center w-24">L</th>
                <th className="px-3 py-3 border-r border-gray-200 text-center w-24">M</th>
                <th className="px-3 py-3 border-r border-gray-200 text-center w-24">M</th>
                <th className="px-3 py-3 border-r border-gray-200 text-center w-24">J</th>
                <th className="px-3 py-3 border-r border-gray-200 text-center w-24">V</th>
                <th className="px-3 py-3 border-r border-gray-200 text-center w-24">S</th>
                <th className="px-3 py-3 border-r border-gray-200 text-center w-24">D</th>
                <th className="px-4 py-3 text-center">H</th>
              </tr>
            </thead>
            <tbody>
              {horario.materias.map((materia, idx) => (
                <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 border-r border-gray-200 text-center font-medium">{materia.programa_educativo}</td>
                  <td className="px-4 py-3 border-r border-gray-200 text-gray-800">{idx + 1}.- {materia.unidad_competencia} -</td>
                  <td className="px-3 py-3 border-r border-gray-200 text-center">{materia.periodo}</td>
                  <td className="px-3 py-3 border-r border-gray-200 text-center font-medium">{materia.grupo}</td>
                  <td className="px-2 py-3 border-r border-gray-200 text-center text-xs whitespace-pre-line">{materia.horario_dias.L}</td>
                  <td className="px-2 py-3 border-r border-gray-200 text-center text-xs whitespace-pre-line">{materia.horario_dias.M}</td>
                  <td className="px-2 py-3 border-r border-gray-200 text-center text-xs whitespace-pre-line">{materia.horario_dias.X}</td>
                  <td className="px-2 py-3 border-r border-gray-200 text-center text-xs whitespace-pre-line">{materia.horario_dias.J}</td>
                  <td className="px-2 py-3 border-r border-gray-200 text-center text-xs whitespace-pre-line">{materia.horario_dias.V}</td>
                  <td className="px-2 py-3 border-r border-gray-200 text-center text-xs whitespace-pre-line">{materia.horario_dias.S}</td>
                  <td className="px-2 py-3 border-r border-gray-200 text-center text-xs whitespace-pre-line">{materia.horario_dias.D}</td>
                  <td className="px-4 py-3 text-center font-semibold">{materia.hsm.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 font-bold text-gray-800 text-xs">
              <tr>
                <td colSpan={11} className="px-4 py-3 text-right border-r border-gray-200 uppercase">
                  Total de HFG:
                </td>
                <td className="px-4 py-3 text-center border-b border-gray-300">
                  {horario.total_hsm.toFixed(1)}
                </td>
              </tr>
              <tr className="bg-gray-200">
                <td colSpan={11} className="px-4 py-3 text-right border-r border-gray-300 uppercase">
                  Total de Horas:
                </td>
                <td className="px-4 py-3 text-center">
                  {horario.total_hsm.toFixed(1)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Tabla de Otras Actividades */}
      {horario.otras_actividades && horario.otras_actividades.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col mt-6">
          <div className="bg-gray-600 text-white text-center font-bold py-2 text-sm uppercase tracking-wide">
            OTRAS ACTIVIDADES ASIGNADAS
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold border-b-2 border-gray-300">
                <tr>
                  <th className="px-4 py-3 border-r border-gray-200">Actividad</th>
                  <th className="px-4 py-3 border-r border-gray-200">Observaciones</th>
                  <th className="px-4 py-3 text-center w-32">Horas</th>
                </tr>
              </thead>
              <tbody>
                {horario.otras_actividades.map((act, idx) => (
                  <tr key={idx} className="border-b border-gray-200 hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 border-r border-gray-200 font-medium">{act.actividad}</td>
                    <td className="px-4 py-3 border-r border-gray-200 text-gray-600">{act.observaciones || "-"}</td>
                    <td className="px-4 py-3 text-center font-semibold">{act.horas.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-bold text-gray-800 text-xs">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-right border-r border-gray-200 uppercase">
                    Total Horas de Otras Actividades:
                  </td>
                  <td className="px-4 py-3 text-center border-b border-gray-300">
                    {horario.total_horas_actividades.toFixed(1)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      
    </div>
  );
}
