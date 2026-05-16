import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: '#475569' }}>Carregando...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
        <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '400px' }}>
          <h2 style={{ color: '#b91c1c', marginTop: 0 }}>Acesso Negado</h2>
          <p style={{ color: '#475569', marginBottom: '1.5rem' }}>
            Você não tem permissão de administrador para acessar o painel.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{ 
              padding: '0.5rem 1rem', 
              backgroundColor: '#0f172a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Voltar para o Login
          </button>
        </div>
      </div>
    )
  }

  return children
}
