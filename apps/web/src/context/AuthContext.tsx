import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserSummary, LoginDto, RegisterDto, Role } from '@neighborly/shared';
import { api } from '../lib/api';

interface AuthContextType {
  user: UserSummary | null;
  loading: boolean;
  isProviderMode: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  toggleProviderMode: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProviderMode, setIsProviderMode] = useState(false);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('neighborly_access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const userData = await api.get<UserSummary>('/auth/me');
      setUser(userData);
      // If user is provider and previously saved preference was provider mode, respect it
      const savedMode = localStorage.getItem('neighborly_mode');
      if (userData.isProvider && savedMode === 'provider') {
        setIsProviderMode(true);
      } else {
        setIsProviderMode(false);
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
      localStorage.removeItem('neighborly_access_token');
      localStorage.removeItem('neighborly_refresh_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (dto: LoginDto) => {
    setLoading(true);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: UserSummary }>(
        '/auth/login',
        dto,
      );
      localStorage.setItem('neighborly_access_token', data.accessToken);
      localStorage.setItem('neighborly_refresh_token', data.refreshToken);
      setUser(data.user);
      if (data.user.isProvider) {
        setIsProviderMode(true);
        localStorage.setItem('neighborly_mode', 'provider');
      } else {
        setIsProviderMode(false);
        localStorage.setItem('neighborly_mode', 'requester');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (dto: RegisterDto) => {
    setLoading(true);
    try {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: UserSummary }>(
        '/auth/register',
        dto,
      );
      localStorage.setItem('neighborly_access_token', data.accessToken);
      localStorage.setItem('neighborly_refresh_token', data.refreshToken);
      setUser(data.user);
      if (data.user.isProvider) {
        setIsProviderMode(true);
        localStorage.setItem('neighborly_mode', 'provider');
      } else {
        setIsProviderMode(false);
        localStorage.setItem('neighborly_mode', 'requester');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('neighborly_access_token');
    localStorage.removeItem('neighborly_refresh_token');
    localStorage.removeItem('neighborly_mode');
    setUser(null);
    setIsProviderMode(false);
  };

  const toggleProviderMode = async () => {
    if (!user) return;
    const newMode = !isProviderMode;

    // If user is not yet marked as provider on backend, enable it
    if (newMode && !user.isProvider) {
      await api.patch('/users/toggle-provider', { isProvider: true });
      await refreshUser();
    }

    setIsProviderMode(newMode);
    localStorage.setItem('neighborly_mode', newMode ? 'provider' : 'requester');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isProviderMode,
        login,
        register,
        logout,
        toggleProviderMode,
        refreshUser,
      }}
    >
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
