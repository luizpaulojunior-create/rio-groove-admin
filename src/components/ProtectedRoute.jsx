import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute() {
  const { user, isAdmin, loading } = useAuth();

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

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}