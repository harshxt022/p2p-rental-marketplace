import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rentmate_token') || '');
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('rentmate_token')));
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('rentmate_token');
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('rentmate_token');
      setToken('');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('rentmate_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem('rentmate_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthModalOpen(false);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('rentmate_token');
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        setUser,
        authModalOpen,
        openAuthModal: () => setAuthModalOpen(true),
        closeAuthModal: () => setAuthModalOpen(false)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
