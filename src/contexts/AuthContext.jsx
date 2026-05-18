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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error(
            'Erro auth:',
            error
          );
        }

        if (!user) {
          setUser(null);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setUser(user);

        const {
          data: adminData,
          error: adminError,
        } = await supabase
          .from('admins')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (adminError) {
          console.error(
            'Erro admin:',
            adminError
          );
        }

        setIsAdmin(!!adminData);
      } catch (err) {
        console.error(
          'Erro geral auth:',
          err
        );

        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
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