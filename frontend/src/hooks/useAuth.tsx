import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { User } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCartCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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

  const [cartCount, setCartCount] = useState(0);

  const refreshCartCount = useCallback(async () => {
    if (!user) {
      setCartCount(0);
      return;
    }
    try {
      const data = await api.cart.get(user.id);
      const count = data.items.reduce((acc: number, item: any) => acc + item.quantity, 0);
      setCartCount(count);
    } catch (err) {
      console.error('Failed to fetch cart count', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshCartCount();
    } else {
      setCartCount(0);
    }
  }, [user, refreshCartCount]);

  const handleSetUser = useCallback((newUserData: User | null) => {
    if (newUserData) {
      localStorage.setItem('user', JSON.stringify(newUserData));
    } else {
      localStorage.removeItem('user');
    }
    setUser(newUserData);
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

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, isAuthenticated, isAdmin, isLoading, setUser: handleSetUser,
      cartCount, setCartCount, refreshCartCount 
    }}>
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
