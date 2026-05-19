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

  const [loading, setLoading] =
    useState(true);

  const checkAdmin = async (
    currentUser
  ) => {
    try {
      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
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
          .select('id')
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
        console.error(
          'Erro admin:',
          adminError
        );
      }

      setIsAdmin(!!adminData);
    } catch (err) {
      console.error(
        'Erro checkAdmin:',
        err
      );

      setIsAdmin(false);
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
        setLoading(false);
      }
    };

    loadSession();

    const {
      data: authListener,
    } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (session?.user) {
            setUser(session.user);

            // mantém admin validado
            setIsAdmin(true);
          } else {
            setUser(null);
            setIsAdmin(false);
          }

          setLoading(false);
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
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