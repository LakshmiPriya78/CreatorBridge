import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken } from '../api/client';
import type { User, CreatorProfile, AgencyProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: CreatorProfile | AgencyProfile | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string; expectedRole?: 'creator' | 'agency' }) => Promise<void>;
  register: (data: { email: string; password: string; role: 'creator' | 'agency' }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setTermsAccepted: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<CreatorProfile | AgencyProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setProfile(data.profile);
    } catch {
      setUser(null);
      setProfile(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('creatorbridge_token');
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string; expectedRole?: 'creator' | 'agency' }) => {
    const res = await api.login(credentials);
    setToken(res.token);
    setUser(res.user);
    await refreshUser();
  };

  const register = async (data: { email: string; password: string; role: 'creator' | 'agency' }) => {
    const res = await api.register(data);
    setToken(res.token);
    setUser(res.user);
    await refreshUser();
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const setTermsAccepted = () => {
    if (user) {
      setUser({ ...user, hasAcceptedTerms: true });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        setTermsAccepted,
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
