import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({
  children,
}) => {
  const [user, setUser] =
    useState(null);

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [adminRole, setAdminRole] =
    useState('viewer');

  const [loading, setLoading] =
    useState(true);

  const checkAdmin = async (
    currentUser
  ) => {
    try {
      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        setAdminRole('viewer');
        return;
      }

      setUser(currentUser);

      const timeoutPromise =
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'Timeout admin check'
                )
              ),
            5000
          )
        );

      const adminPromise =
        supabase
          .from('admins')
          .select('id, role')
          .eq('id', currentUser.id)
          .maybeSingle();

      const result =
        await Promise.race([
          adminPromise,
          timeoutPromise,
        ]);

      const {
        data: adminData,
        error: adminError,
      } = result;

      if (adminError) {
        console.error('Erro admin:', adminError);
        setIsAdmin(false);
        setAdminRole('viewer');
        return;
      }

      setIsAdmin(!!adminData);
      setAdminRole(adminData?.role || 'viewer');
    } catch (err) {
      console.error(
        'Erro checkAdmin:',
        err
      );

      setIsAdmin(false);
      setAdminRole('viewer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout sessão')), 8000)
        );

        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise, timeoutPromise]);

        if (error) {
          console.error('Erro sessão:', error);
        }

        await checkAdmin(session?.user || null);
      } catch (err) {
        console.error('Erro loadSession:', err);
        setUser(null);
        setIsAdmin(false);
        setAdminRole('viewer');
      } finally {
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setLoading(true);
          checkAdmin(session?.user || null);
        }
      );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();

    setUser(null);
    setIsAdmin(false);
    setAdminRole('viewer');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        adminRole,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);