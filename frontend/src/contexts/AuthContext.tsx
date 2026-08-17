'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { fetchAPI, setAuthToken, getAuthToken } from '@/lib/api';
import SplashScreen from '@/components/layout/SplashScreen';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isTransitioning: boolean;
  triggerTransition: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchAPI('/api/auth/me');
      setUser(data);
    } catch (err) {
      console.error('Failed to fetch current user:', err);
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  // Tự động đồng bộ số dư xu thời gian thực và lắng nghe sự kiện từ các component
  useEffect(() => {
    const handleRefresh = () => {
      refreshUser();
    };

    window.addEventListener('refresh-user', handleRefresh);
    window.addEventListener('refresh-coins', handleRefresh);

    const timer = setInterval(() => {
      const token = getAuthToken();
      if (token) {
        fetchAPI('/api/auth/me')
          .then((data) => {
            if (data && data.username) {
              setUser((prev) => {
                if (!prev || prev.coins !== data.coins || prev.avatar !== data.avatar || prev.fullname !== data.fullname) {
                  return data;
                }
                return prev;
              });
            }
          })
          .catch(() => {});
      }
    }, 3000);

    return () => {
      window.removeEventListener('refresh-user', handleRefresh);
      window.removeEventListener('refresh-coins', handleRefresh);
      clearInterval(timer);
    };
  }, []);

  const triggerTransition = async () => {
    setIsTransitioning(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsTransitioning(false);
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const data = await fetchAPI('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      // Kích hoạt hiệu ứng chuyển cảnh
      setIsTransitioning(true);
      await new Promise(r => setTimeout(r, 1200)); // Đợi hiệu ứng logo hội tụ
      
      setAuthToken(data.token);
      setUser(data.user);
      
      setTimeout(() => setIsTransitioning(false), 300);
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setIsTransitioning(true);
    await new Promise(r => setTimeout(r, 1200)); // Đợi hiệu ứng logo hội tụ
    setAuthToken(null);
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isTransitioning, triggerTransition }}>
      {children}
      {isTransitioning && <SplashScreen />}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

