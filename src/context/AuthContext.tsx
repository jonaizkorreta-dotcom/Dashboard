import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('scope_tracker_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from local storage');
      }
    }
    setLoading(false);
  }, []);

  const login = async (firstName: string, lastName: string) => {
    try {
      // First, try to find the user
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('first_name', firstName)
        .ilike('last_name', lastName)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        throw error;
      }

      let currentUser = data;

      // If user doesn't exist, create them
      if (!currentUser) {
        const isAdmin = firstName.toLowerCase() === 'admin' && lastName.toLowerCase() === 'admin';
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert([{ first_name: firstName, last_name: lastName, is_admin: isAdmin }])
          .select()
          .single();

        if (insertError) throw insertError;
        currentUser = newUser;
      }

      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('scope_tracker_user', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Login error:', error);
      // Fallback for when Supabase is not properly configured yet
      const fallbackUser = {
        id: crypto.randomUUID(),
        first_name: firstName,
        last_name: lastName,
        is_admin: firstName.toLowerCase() === 'admin' && lastName.toLowerCase() === 'admin'
      };
      setUser(fallbackUser);
      localStorage.setItem('scope_tracker_user', JSON.stringify(fallbackUser));
      console.log('Using local fallback user since Supabase call failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('scope_tracker_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
