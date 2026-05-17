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
import { toast } from 'react-toastify';

type TabType = 'perfil' | 'vendas' | 'compras' | 'seguranca';



export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // Password Change States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Avatar Upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const res = await api.users.uploadAvatar(user.id, file);
      setAvatar(res.avatar_url);
      
      // Update global context with new avatar url
      setUser({ ...user, avatar_url: res.avatar_url });
      
      toast.success('Imagem do perfil atualizada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar a imagem.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };
  
  // Dashboard State
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);

  // Add Balance State
  const [isAddingBalance, setIsAddingBalance] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');

  const handleAddBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Por favor, insira um valor válido maior que zero.');
      return;
    }
    setIsUpdating(true);
    try {
      const res = await api.users.addBalance(user.id, amount);
      setUser(res.user);
      toast.success(`R$ ${amount.toFixed(2)} adicionados com sucesso!`);
      setIsAddingBalance(false);
      setBalanceAmount('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar saldo.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setIsUpdatingPassword(true);
    try {
      await api.users.updateProfile(user.id, { password: newPassword });
      toast.success('Senha atualizada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar senha.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      try {
        const data = await api.users.profile(user.id);
        setProfileData(data);
        setName(data.user.name);
        setAvatar(data.user.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(data.user.name));
        
        // Load Seller Products
        const productsData = await api.products.list({ seller_id: user.id, limit: 100 });
        // Simulating that some products belong to the user
        const userProducts = productsData.products.filter(p => p.seller_id === user.id || p.seller_id === 'seller1');
        setMyProducts(userProducts);

        // Load Orders History from the API
        try {
          const ordersData = await api.orders.list(user.id);
          setMyOrders(ordersData.orders || []);
        } catch (orderErr) {
          console.error('Failed to load order history', orderErr);
        }

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
      toast.success('Perfil atualizado com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = () => {
    if (confirm('Tem certeza que deseja deletar sua conta? Esta ação é irreversível.')) {
      toast.info('Simulando deleção de conta...');
      logout();
      navigate('/');
    }
  };

  const toggleProductStatus = async (productId: string) => {
    if (!user) return;
    const product = myProducts.find(p => p._id === productId);
    if (!product) return;

    try {
      await api.products.update(productId, { userId: user.id, is_active: !product.is_active });
      setMyProducts(prev => prev.map(p => 
        p._id === productId ? { ...p, is_active: !p.is_active } : p
      ));
      toast.success(product.is_active ? 'Venda pausada com sucesso!' : 'Venda reativada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar status do produto.');
    }
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
            
            {isAddingBalance ? (
              <form onSubmit={handleAddBalanceSubmit} className="space-y-3 relative z-10 animate-in fade-in duration-200">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Valor em R$ (ex: 50.00)"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500 font-bold placeholder:text-white/40 text-sm"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Confirmar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingBalance(false);
                      setBalanceAmount('');
                    }}
                    className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingBalance(true)}
                className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors relative z-10"
              >
                Adicionar Saldo
              </button>
            )}
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
                  <div className="md:col-span-2 flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                    <div className="relative group w-24 h-24 rounded-[2rem] overflow-hidden shrink-0 ring-4 ring-indigo-50">
                      <img 
                        src={avatar} 
                        alt="Avatar do Usuário" 
                        className="w-full h-full object-cover transition-all group-hover:scale-110" 
                      />
                      {isUploadingAvatar ? (
                        <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : (
                        <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                          <Camera className="w-6 h-6 text-white" />
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleAvatarChange} 
                          />
                        </label>
                      )}
                    </div>
                    <div className="text-center sm:text-left space-y-2">
                      <h4 className="font-display font-bold text-slate-800 text-base">Foto do Perfil</h4>
                      <p className="text-slate-400 text-xs font-medium max-w-sm">
                        Clique na imagem acima ou no botão abaixo para fazer upload de um arquivo PNG ou JPG (máximo 5MB).
                      </p>
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all">
                        <Camera className="w-3.5 h-3.5" />
                        Fazer Upload
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarChange} 
                          disabled={isUploadingAvatar}
                        />
                      </label>
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
                            <button 
                              onClick={() => navigate(`/products/edit/${p._id}`)}
                              className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="Editar Produto"
                            >
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
                {myOrders.length === 0 ? (
                  <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="font-bold text-slate-400">Você não realizou nenhuma compra ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {myOrders.map(order => (
                      <div key={order.id} className="bg-slate-50 rounded-[2rem] border border-slate-100 p-6 space-y-4 hover:border-indigo-200 transition-all duration-300">
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-200/60">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID do Pedido</span>
                            <h4 className="font-display font-bold text-slate-900 text-sm truncate max-w-xs">{order.id}</h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                              Pago
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              {order.created_at ? format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : ''}
                            </span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-3">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-4 py-2">
                              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100">
                                {item.product_image ? (
                                  <img 
                                    src={item.product_image} 
                                    alt={item.product_name} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <ShoppingBag className="w-6 h-6" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-slate-800 text-sm truncate">{item.product_name}</h5>
                                <p className="text-xs text-slate-400 font-medium">
                                  Qtd: {item.quantity} × R$ {item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-slate-800 text-sm">
                                  R$ {item.subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200/60">
                          <span className="text-xs font-bold text-slate-500">Total do Pedido</span>
                          <span className="text-indigo-600 font-display font-black text-xl">
                            R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'seguranca' && (
              <motion.div
                key="seguranca"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-12 space-y-8"
              >
                <h3 className="text-2xl font-display font-black text-slate-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  Segurança da Conta
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Password Change Form */}
                  <div className="p-8 rounded-[2rem] border border-slate-100 bg-slate-50 space-y-6">
                    <div>
                      <h4 className="text-lg font-black text-slate-900 mb-1">Alterar Senha</h4>
                      <p className="text-slate-500 text-xs font-medium">
                        Escolha uma nova senha forte com pelo menos 6 caracteres para proteger sua conta.
                      </p>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Nova Senha</label>
                        <input
                          type="password"
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all text-sm"
                          placeholder="Digite a nova senha"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Confirmar Nova Senha</label>
                        <input
                          type="password"
                          className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all text-sm"
                          placeholder="Confirme a nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isUpdatingPassword}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
                      >
                        {isUpdatingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                      </button>
                    </form>
                  </div>

                  {/* Delete Account */}
                  <div className="p-8 rounded-[2rem] bg-rose-50/50 border border-rose-100 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                        <Trash2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 mb-1">Deletar Minha Conta</h4>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                          Isso removerá permanentemente seu histórico de compras, saldo e todos os anúncios ativos no marketplace. Esta ação é irreversível.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleDeleteAccount}
                      className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 text-sm"
                    >
                      Excluir Permanentemente
                    </button>
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

