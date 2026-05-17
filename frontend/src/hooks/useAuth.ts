import { useState, useEffect, useCallback } from 'react';
import { User } from '@/types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData: User) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  }, []);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!user;

  return { 
    user, 
    login, 
    logout, 
    isAuthenticated, 
    isAdmin,
    isLoading,
    setUser // For manual balance updates etc.
  };
};
