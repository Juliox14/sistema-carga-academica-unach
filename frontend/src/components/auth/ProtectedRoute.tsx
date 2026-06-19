import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
  userRole: string | null;
}

export default function ProtectedRoute({ allowedRoles, userRole }: ProtectedRouteProps) {
  // 1. Si no hay usuario logueado, lo mandamos al login
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }

  // 2. Si el usuario está logueado pero su rol no está en la lista permitida
  if (!allowedRoles.includes(userRole)) {
    // Lo mandamos a una página de "Acceso Denegado" o a la página de inicio
    return <Navigate to="/no-autorizado" replace />;
  }

  // 3. Si todo está bien, Outlet renderiza la página hija (el Dashboard)
  return <Outlet />;
}