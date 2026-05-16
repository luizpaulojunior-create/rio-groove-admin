import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async (userId) => {
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('id', userId)
          .single()
        
        if (mounted) {
          if (data) {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status de administrador:', error.message)
        if (mounted) setIsAdmin(false)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          if (mounted) setUser(session.user)
          await checkAdmin(session.user.id)
        } else {
          if (mounted) {
            setUser(null)
            setIsAdmin(false)
            setLoading(false)
          }
        }
      } catch (err) {
        console.error('Erro ao inicializar auth:', err.message)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        if (mounted) {
          setLoading(true)
          setUser(session.user)
        }
        await checkAdmin(session.user.id)
      } else {
        if (mounted) {
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false;
      subscription.unsubscribe()
    }
  }, [])

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  return useContext(AuthContext)
}
