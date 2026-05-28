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
    useState('editor');

  const [loading, setLoading] =
    useState(true);

  const checkAdmin = async (
    currentUser
  ) => {
    try {
      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        setAdminRole('editor');
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
      setAdminRole(adminData?.role || 'editor');
    } catch (err) {
      console.error(
        'Erro checkAdmin:',
        err
      );

      setIsAdmin(false);
      setAdminRole('editor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSession = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          console.error(
            'Erro sessão:',
            error
          );
        }

        await checkAdmin(
          session?.user || null
        );
      } catch (err) {
        console.error(
          'Erro loadSession:',
          err
        );

        setUser(null);
        setIsAdmin(false);
        setAdminRole('editor');
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
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
    setAdminRole('editor');
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