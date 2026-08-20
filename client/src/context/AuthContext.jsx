import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      let token = sessionStorage.getItem('accessToken');
      if (!token) {
        try {
          const refreshRes = await api.post('/auth/refresh');
          token = refreshRes.data.accessToken;
          sessionStorage.setItem('accessToken', token);
        } catch (err) {
          // No valid cookie found
        }
      }

      if (token) {
        try {
          const res = await api.get('/users/profile');
          setUser(res.data);
          sessionStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
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

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { user, accessToken } = res.data;
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (name, email, password, role = 'STAFF') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    const { user, accessToken } = res.data;
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout API errors
    } finally {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
      setUser(null);
    }
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
