import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const {
    user,
    isAdmin,
    loading,
  } = useAuth();

  console.log({
    user,
    isAdmin,
    loading,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading auth...
      </div>
    );
  }

  // Só manda pro login se REALMENTE não existir usuário
  if (!user) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  // Usuário existe mas não é admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Sem permissão de administrador
      </div>
    );
  }

  return <Outlet />;
}