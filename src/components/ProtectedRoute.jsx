import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const {
    user,
    isAdmin,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-white bg-[#050505]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF4D00] border-t-transparent" />
        <p className="text-sm text-white/60">Carregando painel...</p>
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