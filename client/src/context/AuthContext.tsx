import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api.ts';
import { User, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      let token = sessionStorage.getItem('accessToken');
      if (!token) {
        try {
          const refreshRes = await api.post<{ accessToken: string }>('/auth/refresh');
          token = refreshRes.data.accessToken;
          sessionStorage.setItem('accessToken', token);
        } catch {
          // No valid cookie found
        }
      }

      if (token) {
        try {
          const res = await api.get<User>('/users/profile');
          setUser(res.data);
          sessionStorage.setItem('user', JSON.stringify(res.data));
        } catch {
          logout();
        }
      } else {
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ user: User; accessToken: string }>('/auth/login', { email, password });
    const { user: userData, accessToken } = res.data;
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'STAFF'): Promise<User> => {
    const res = await api.post<{ user: User; accessToken: string }>('/auth/register', { name, email, password, role });
    const { user: userData, accessToken } = res.data;
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    } finally {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
      setUser(null);
    }
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
