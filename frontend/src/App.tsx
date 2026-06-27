import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
// import ProtectedRoute from './components/auth/ProtectedRoute';
import ActividadesDashboard from './features/actividades/ActividadesDashboard';
import AreasDashboard from './features/areasConocimiento/AreasDashboard';
import AperturaDashboard from './features/apertura/AperturaDashboard';
import AssignmentDashboard from './features/asignacion/AssignmentDashboard';
import CategoriasDashboard from './features/categorias/CategoriasDashboard';
import CiclosDashboard from './features/ciclos/CiclosDashboard';
import DocentesDashboard from './features/docentes/DocentesDashboard';
import MateriasDashboard from './features/materias/MateriasDashboard';
import ProgramasDashboard from './features/programas/ProgramasDashboard';
import PlanesDashboard from './features/planesEstudio/PlanesDashboard';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <div className="p-8">Login</div>,
  },
  {
    path: '/',
    element: <>
      {/* <ProtectedRoute allowedRoles={['SECRETARIA_ACADEMICA']} userRole={null} /> */}
      <MainLayout /></>,
    children: [
      {
        index: true,
        element: <Navigate to="/asignacion" replace />,
      },
      {
        path: 'aperturas',
        element: <AperturaDashboard />,
      },
      {
        path: 'asignacion',
        element: <AssignmentDashboard />,
      },
      {
        path: 'docentes',
        element: <DocentesDashboard userRole="SECRETARIA_ACADEMICA" />,
      },
      // 2. AÑADIR LAS RUTAS DE CATÁLOGOS AQUÍ ABAJO
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
]);

export default function App() {
  return <RouterProvider router={router} />;
}