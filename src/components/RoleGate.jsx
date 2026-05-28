import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMinRoleForPath, hasMinRole } from '../config/adminRoles';

export default function RoleGate({ children }) {
  const { adminRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-white/60">
        Verificando permissões...
      </div>
    );
  }

  const minRole = getMinRoleForPath(location.pathname);
  if (!hasMinRole(adminRole, minRole)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
