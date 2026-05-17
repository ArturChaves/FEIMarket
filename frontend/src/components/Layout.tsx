import React, { ReactNode } from 'react';
import { ShoppingCart, LogOut, User as UserIcon, LayoutDashboard, PlusCircle, History, Package } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { SearchBar } from './SearchBar';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isAdmin, logout, cartCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Unified Top Header */}
      <header className="sticky top-0 z-50 h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 gap-8">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-100">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">FEI<span className="text-indigo-600">Market</span></span>
        </Link>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-2xl px-4">
          <SearchBar onSearch={(p) => {
            const params = new URLSearchParams();
            if (p.search) params.set('q', p.search);
            if (p.category) params.set('cat', p.category);
            if (p.minPrice) params.set('min', p.minPrice);
            if (p.maxPrice) params.set('max', p.maxPrice);
            if (p.sortBy) params.set('sort', p.sortBy);
            navigate(`/?${params.toString()}`);
          }} compact />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {!isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/auth/login" className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                Login
              </Link>
              <Link to="/auth/register" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                Cadastro
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {isAdmin ? (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-md"
                  title="Painel Admin"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Painel Admin
                </Link>
              ) : (
                <>
                  <Link 
                    to="/publish" 
                    className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors shadow-sm"
                    title="Anunciar Produto"
                  >
                    <PlusCircle className="w-6 h-6" />
                  </Link>

                  <Link 
                    to="/my-products" 
                    className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 hover:text-indigo-600 transition-colors shadow-sm"
                    title="Meus Produtos"
                  >
                    <Package className="w-6 h-6" />
                  </Link>
                  
                  <Link 
                    to="/cart" 
                    className="p-2.5 text-slate-400 hover:text-indigo-600 transition-colors relative"
                    title="Carrinho"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-in zoom-in duration-200">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </>
              )}

              <div className="h-8 w-px bg-slate-200 mx-1"></div>

              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 overflow-hidden ring-2 ring-white shadow-sm">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || '')}`} 
                      alt={user?.name} 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>
              </button>

              <button 
                onClick={logout}
                className="p-2.5 text-slate-400 hover:text-rose-500 transition-colors"
                title="Sair"
              >
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
