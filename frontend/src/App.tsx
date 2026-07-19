import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthStore } from './features/auth/store/useAuthStore';
import Login from './features/auth/Login';

// Import Dashboards
import ActividadesDashboard from './features/actividades/ActividadesDashboard';
import AreasDashboard from './features/areasConocimiento/AreasDashboard';
import AperturaDashboard from './features/apertura/AperturaDashboard';
import AssignmentDashboard from './features/asignacion/AssignmentDashboard';
import CategoriasDashboard from './features/categorias/CategoriasDashboard';
import CiclosDashboard from './features/ciclos/CiclosDashboard';
import ConfiguracionDashboard from './features/configuracion/ConfiguracionDashboard';
import DocentesDashboard from './features/docentes/DocentesDashboard';
import MateriasDashboard from './features/materias/MateriasDashboard';
import ProgramasDashboard from './features/programas/ProgramasDashboard';
import PlanesDashboard from './features/planesEstudio/PlanesDashboard';
import UsuariosDashboard from './features/usuarios/UsuariosDashboard';
import UnidadesDashboard from './features/unidades/UnidadesDashboard';

// Import ForceChangePassword
import ForceChangePassword from './features/auth/ForceChangePassword';

// Import Oficios Components
import PlantillasManager from './features/oficios/components/PlantillasManager';
import AuditoriaOficios from './features/oficios/components/AuditoriaOficios';
import DocenteOficioPortal from './features/oficios/components/DocenteOficioPortal';
import HorariosReport from './features/reportes/HorariosReport';

// Import Scheduling & Preferences Components
import MisPreferencias from './features/docentes/components/MisPreferencias';
import MiPerfilDashboard from './features/docentes/MiPerfilDashboard';
import HorariosDashboard from './features/horarios/HorariosDashboard';

// Import InicioDashboard
import InicioDashboard from './features/home/InicioDashboard';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/no-autorizado',
    element: (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <h1 className="text-4xl font-extrabold text-[#002d55] mb-2">Acceso No Autorizado</h1>
        <p className="text-gray-600 mb-6">No tienes los permisos necesarios para acceder a esta sección.</p>
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 bg-[#002d55] text-white rounded-lg font-bold hover:bg-[#0038C3] transition-colors cursor-pointer"
        >
          Volver
        </button>
      </div>
    ),
  },
  {
    path: '/',
    element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SECRETARIA_ACADEMICA', 'CAPTURISTA', 'DOCENTE']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <InicioDashboard />,
          },
          // ─── RUTAS COMPARTIDAS SUPER_ADMIN Y SECRETARIA_ACADEMICA ───
          {
            element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SECRETARIA_ACADEMICA']} />,
            children: [
              {
                path: 'configuracion',
                element: <ConfiguracionDashboard />,
              },
              {
                path: 'docentes',
                element: <DocentesDashboard userRole="SECRETARIA_ACADEMICA" />,
              },
            ],
          },
          // ─── RUTAS EXCLUSIVAS DE SECRETARIA_ACADEMICA ───
          {
            element: <ProtectedRoute allowedRoles={['SECRETARIA_ACADEMICA']} />,
            children: [
              {
                path: 'aperturas',
                element: <AperturaDashboard />,
              },
              {
                path: 'asignacion',
                element: <AssignmentDashboard />,
              },
              {
                path: 'oficios/plantillas',
                element: <PlantillasManager />,
              },
              {
                path: 'oficios/auditoria',
                element: <AuditoriaOficios />,
              },
              {
                path: 'reportes/horarios',
                element: <HorariosReport />,
              },
              {
                path: 'horarios',
                element: <HorariosDashboard />,
              },
            ],
          },
          // ─── RUTA EXCLUSIVA DE DOCENTES Y ROLES AUTENTICADOS ───
          {
            element: <ProtectedRoute allowedRoles={['DOCENTE']} />,
            children: [
              {
                path: 'oficios/firma',
                element: <DocenteOficioPortal />,
              },
              {
                path: 'preferencias',
                element: <MisPreferencias />,
              },
              {
                path: 'mi-perfil',
                element: <MiPerfilDashboard />,
              },
            ],
          },
          // ─── RUTAS EXCLUSIVAS DE SUPER_ADMIN ───
          {
            element: <ProtectedRoute allowedRoles={['SUPER_ADMIN']} />,
            children: [
              {
                path: 'usuarios',
                element: <UsuariosDashboard />,
              },
              {
                path: 'unidades',
                element: <UnidadesDashboard />,
              },
            ],
          },
          // ─── RUTAS DE CATÁLOGOS (ACCESIBLES POR CAPTURISTA, SECRETARIA_ACADEMICA Y SUPER_ADMIN) ───
          {
            element: <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'SECRETARIA_ACADEMICA', 'CAPTURISTA']} />,
            children: [
              {
                path: 'catalogos/programas',
                element: <ProgramasDashboard />,
              },
              {
                path: 'catalogos/planes',
                element: <PlanesDashboard />,
              },
              {
                path: 'catalogos/materias',
                element: <MateriasDashboard userRole="SECRETARIA_ACADEMICA" />,
              },
              {
                path: 'catalogos/actividades',
                element: <ActividadesDashboard userRole="SECRETARIA_ACADEMICA" />,
              },
              {
                path: 'catalogos/categorias',
                element: <CategoriasDashboard userRole="SECRETARIA_ACADEMICA" />,
              },
              {
                path: 'catalogos/areas',
                element: <AreasDashboard />,
              },
              {
                path: 'catalogos/ciclos',
                element: <CiclosDashboard />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default function App() {
  const { cargarPerfil, token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      cargarPerfil().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token, cargarPerfil]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#002d55]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-yellow-400"></div>
      </div>
    );
  }

  // Interceptar si requiere cambio obligatorio de clave
  if (user?.requiere_cambio_password) {
    return (
      <>
        <Toaster />
        <ForceChangePassword />
      </>
    );
  }

  return (
    <>
      <Toaster />
      <RouterProvider router={router} />
    </>
  );
}