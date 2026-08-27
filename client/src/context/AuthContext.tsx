import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import api from '../services/api.ts';
import { User, UserRole } from '../types/index.ts';
import { useAppDispatch, useAppSelector } from '../store/index.ts';
import { setCredentials, logout as reduxLogout } from '../store/slices/authSlice.ts';

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
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = React.useState<boolean>(false);

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

      if (token && !user) {
        try {
          const res = await api.get<User>('/users/profile');
          dispatch(setCredentials({ user: res.data, accessToken: token }));
        } catch {
          dispatch(reduxLogout());
        }
      }
    };

    initAuth();
  }, [dispatch, user]);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post<{ user: User; accessToken: string }>('/auth/login', { email, password });
    const { user: userData, accessToken } = res.data;
    dispatch(setCredentials({ user: userData, accessToken }));
    return userData;
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'STAFF'): Promise<User> => {
    const res = await api.post<{ user: User; accessToken: string }>('/auth/register', { name, email, password, role });
    const { user: userData, accessToken } = res.data;
    dispatch(setCredentials({ user: userData, accessToken }));
    return userData;
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout API errors
    } finally {
      dispatch(reduxLogout());
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
