import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/Login'
import Admin from '../pages/Admin'
import ProtectedRoute from '../components/ProtectedRoute'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}
