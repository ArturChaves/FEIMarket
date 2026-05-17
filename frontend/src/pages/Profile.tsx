import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { UserProfileResponse, Product, Order } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { 
  User, Mail, CreditCard, LogIn, Eye, ShoppingBag, 
  Clock, Camera, CheckCircle2, LayoutDashboard, Settings, 
  Shield, Trash2, Edit, PowerOff, ChevronRight, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

type TabType = 'perfil' | 'vendas' | 'compras' | 'seguranca';

const AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Scooter',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Aria',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Loki',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Willow'
];

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [password, setPassword] = useState('********');
  const [avatar, setAvatar] = useState('');
  
  // Dashboard State
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const data = await api.users.profile(user.id);
        setProfileData(data);
        setName(data.user.name);
        setAvatar(data.user.avatar_url || AVATARS[0]);
        
        // Load Seller Products
        const productsData = await api.products.list({ seller_id: user.id, limit: 100 });
        // Simulating that some products belong to the user
        const userProducts = productsData.products.filter(p => p.seller_id === user.id || p.seller_id === 'seller1');
        setMyProducts(userProducts);

        // Load History Mock
        setMyOrders([
          { id: 'ORD-1234', title: 'MacBook Pro 14"', date: '2024-03-01', status: 'Entregue', price: 12499, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=100' },
          { id: 'ORD-5678', title: 'iPhone 15 Pro', date: '2024-02-15', status: 'Processando', price: 8499, image: 'https://images.unsplash.com/photo-1695048133142-1a20484d251e?auto=format&fit=crop&q=80&w=100' }
        ]);

      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdating(true);
    try {
      const { user: updatedUser } = await api.users.updateProfile(user.id, { name, avatar_url: avatar });
      setUser(updatedUser);
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao atualizar perfil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Tem certeza que deseja deletar sua conta? Esta ação é irreversível.')) {
      alert('Simulando deleção de conta...');
      logout();
      navigate('/');
    }
  };

  const toggleProductStatus = (productId: string) => {
    setMyProducts(prev => prev.map(p => 
      p._id === productId ? { ...p, is_active: !p.is_active } : p
    ));
    alert('Status do produto atualizado!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 text-center mb-8">
            <div className="relative inline-block mb-4">
              <img 
                src={avatar} 
                alt="Avatar" 
                className="w-24 h-24 rounded-[2rem] object-cover ring-4 ring-indigo-50" 
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <h2 className="text-xl font-display font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-400 text-sm font-medium mb-6">{user?.email}</p>
            
            <div className="h-px bg-slate-100 w-full mb-6"></div>
            
            <div className="space-y-2">
              {[
                { id: 'perfil', label: 'Dados Pessoais', icon: User },
                { id: 'vendas', label: 'Minhas Vendas', icon: LayoutDashboard },
                { id: 'compras', label: 'Histórico', icon: ShoppingBag },
                { id: 'seguranca', label: 'Segurança', icon: Shield },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-6 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap className="w-20 h-20" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Carteira FEIMarket</p>
            <h3 className="text-3xl font-display font-black tracking-tighter mb-4">
              R$ {user?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors">
              Adicionar Saldo
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'perfil' && (
              <motion.div
                key="perfil"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-12"
              >
                <h3 className="text-2xl font-display font-black text-slate-900 mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  Dados do Perfil
                </h3>

                <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Escolha seu Avatar</label>
                    <div className="flex flex-wrap gap-4">
                      {AVATARS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setAvatar(av)}
                          className={`w-14 h-14 rounded-2xl overflow-hidden ring-4 transition-all ${
                            avatar === av ? 'ring-indigo-600 scale-110' : 'ring-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="Avatar option" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nome Completo</label>
                    <input
                      type="text"
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">E-mail (Fixo)</label>
                    <input
                      type="email"
                      readOnly
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                      value={user?.email}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sua Senha</label>
                    <div className="relative">
                      <input
                        type="password"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-bold text-slate-700 transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex justify-end">
                    <button
                      disabled={isUpdating}
                      className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-xl shadow-slate-200"
                    >
                      {isUpdating ? 'Atualizando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {activeTab === 'vendas' && (
              <motion.div
                key="vendas"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 mb-8 text-white flex justify-between items-center shadow-xl shadow-indigo-100">
                  <div>
                    <h3 className="text-2xl font-display font-black">Dashboard do Vendedor</h3>
                    <p className="text-indigo-100 font-medium text-sm mt-1">Gerencie seu estoque e métricas de venda.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black">{myProducts.length}</div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-200">Anúncios Ativos</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {myProducts.length > 0 ? myProducts.map((p) => (
                    <div key={p._id} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex gap-5 group hover:border-indigo-200 transition-all">
                      <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden border border-slate-50">
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{p.title}</h4>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            p.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {p.is_active ? 'Ativo' : 'Pausado'}
                          </span>
                        </div>
                        <p className="text-indigo-600 font-black text-lg mb-3">R$ {p.price.toLocaleString()}</p>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="text-center">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vendas</p>
                            <p className="font-black text-slate-700">{p.units_sold || 0}</p>
                          </div>
                          <div className="flex gap-2">
                            <button className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => toggleProductStatus(p._id)}
                              className={`p-2 rounded-lg transition-all ${
                                p.is_active 
                                ? 'bg-rose-50 text-rose-400 hover:text-rose-600 hover:bg-rose-100' 
                                : 'bg-emerald-50 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100'
                              }`}
                              title={p.is_active ? "Pausar Venda" : "Ativar Venda"}
                            >
                              <PowerOff className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="md:col-span-2 py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <LayoutDashboard className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="font-bold text-slate-400">Você não tem produtos cadastrados ainda.</p>
                      <button 
                        onClick={() => navigate('/publish')}
                        className="mt-4 text-indigo-600 font-black text-sm hover:underline"
                      >
                        Comece a vender agora
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'compras' && (
              <motion.div
                key="compras"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8"
              >
                <h3 className="text-2xl font-display font-black text-slate-900 mb-8">Histórico de Pedidos</h3>
                <div className="space-y-4">
                  {myOrders.map(order => (
                    <div key={order.id} className="flex items-center gap-6 p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors group">
                      <img src={order.image} alt="" className="w-16 h-16 rounded-xl object-cover bg-slate-100" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-900">{order.title}</h4>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Pedido: {order.id}</p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-indigo-600 font-black text-lg">R$ {order.price.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{order.date}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'seguranca' && (
              <motion.div
                key="seguranca"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8"
              >
                <h3 className="text-2xl font-display font-black text-slate-900 mb-8 flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  Segurança da Conta
                </h3>

                <div className="p-8 rounded-[2rem] bg-rose-50 border border-rose-100 flex flex-col md:flex-row items-center gap-8">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                    <Trash2 className="w-8 h-8" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-lg font-black text-slate-900 mb-1">Deletar Minha Conta</h4>
                    <p className="text-slate-500 text-sm font-medium">
                      Isso removerá permanentemente seu histórico de compras, saldo e todos os anúncios ativos no marketplace.
                    </p>
                  </div>
                  <button 
                    onClick={handleDeleteAccount}
                    className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-100 whitespace-nowrap"
                  >
                    Excluir Permanentemente
                  </button>
                </div>
                
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 rounded-3xl border border-slate-100 space-y-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-emerald-500" /> Autenticação em Duas Etapas
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Sua conta está protegida por criptografia de ponta a ponta.</p>
                      <button className="text-xs font-black text-indigo-600 hover:underline">Configurar 2FA</button>
                   </div>
                   <div className="p-6 rounded-3xl border border-slate-100 space-y-4">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-amber-500" /> Sessões Ativas
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">Você está conectado apenas neste dispositivo no momento.</p>
                      <button className="text-xs font-black text-rose-600 hover:underline">Sair de tudo</button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

