import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { UserStats, InventoryStats, TrafficStats, ActivityStats } from '@/types';
import { StatsCard } from '@/components/StatsCard';
import { StatsSkeleton } from '@/components/LoadingSkeleton';
import { 
  Users, ShoppingCart, DollarSign, PieChart, 
  Database, BarChart3, Clock, LayoutGrid, 
  MousePointer2, Zap, Search, Activity, Package
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';

export default function Admin() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null);
  const [trafficStats, setTrafficStats] = useState<TrafficStats | null>(null);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllStats = async () => {
    setIsRefreshing(true);
    try {
      const [users, inventory, traffic, activity] = await Promise.all([
        api.admin.statsUsers(),
        api.admin.statsInventory(),
        api.admin.statsTraffic(),
        api.admin.statsActivity(),
      ]);
      setUserStats(users);
      setInventoryStats(inventory);
      setTrafficStats(traffic);
      setActivityStats(activity);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllStats();
  }, []);

  const DbBadge = ({ name, color }: { name: string, color: string }) => (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${color}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></div>
      {name}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-display font-black text-slate-900 tracking-tight">Admin Control Center</h1>
          <p className="text-slate-500 font-medium mt-1">Monitoramento multi-banco em tempo real.</p>
        </div>
        <button 
          onClick={loadAllStats}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Sincronizando...' : 'Atualizar Dados'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PostgreSQL Section */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex flex-col group hover:border-blue-200 transition-all">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Database className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-slate-900">Financeiro</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Relacional & Transacional</p>
              </div>
            </div>
            <DbBadge name="PostgreSQL" color="bg-blue-50 text-blue-600 border-blue-100" />
          </div>

          {!userStats ? <StatsSkeleton /> : (
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Usuários</p>
                <p className="text-2xl font-display font-black text-slate-900">{userStats.total_users.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                  <TrendingUp className="w-3 h-3" /> +12%
                </div>
              </div>
              <div className="space-y-1 border-l border-slate-100 pl-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Pedidos</p>
                <p className="text-2xl font-display font-black text-slate-900">{userStats.total_orders.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500">
                  <TrendingUp className="w-3 h-3" /> +5%
                </div>
              </div>
              <div className="space-y-1 border-l border-slate-100 pl-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Volume (R$)</p>
                <p className="text-2xl font-display font-black text-slate-900">{userStats.total_transacted.toLocaleString()}</p>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                  <Activity className="w-3 h-3" /> Estável
                </div>
              </div>
            </div>
          )}
        </section>

        {/* MongoDB Section */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex flex-col group hover:border-emerald-200 transition-all">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-slate-900">Catálogo</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Document-Oriented / NoSQL</p>
              </div>
            </div>
            <DbBadge name="MongoDB" color="bg-emerald-50 text-emerald-600 border-emerald-100" />
          </div>

          {!inventoryStats ? <StatsSkeleton /> : (
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Produtos Ativos</p>
                  <p className="text-4xl font-display font-black text-slate-900">{inventoryStats.total_products}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <div key={s} className={`w-3 h-3 rounded-sm ${s <= 4 ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Rating Médio: {inventoryStats.avg_rating}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {inventoryStats.by_category.map(cat => (
                  <div key={cat.category} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-600">{cat.category}</span>
                    <span className="text-xs font-black text-emerald-600">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Redis Section */}
        <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex flex-col group hover:border-rose-200 transition-all">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-slate-900">Tempo Real</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">In-Memory Intelligence</p>
              </div>
            </div>
            <DbBadge name="Redis" color="bg-rose-50 text-rose-600 border-rose-100" />
          </div>

          {!trafficStats ? <StatsSkeleton /> : (
            <div className="grid grid-cols-2 gap-8">
              <div className="p-6 rounded-3xl bg-rose-50/50 border border-rose-100/50 flex flex-col justify-center text-center">
                <ShoppingCart className="w-6 h-6 text-rose-600 mx-auto mb-3" />
                <p className="text-3xl font-display font-black text-slate-900">{trafficStats.active_carts}</p>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">Carrinhos Ativos</p>
              </div>
              <div className="p-6 rounded-3xl bg-slate-900 text-white flex flex-col justify-center text-center overflow-hidden relative">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Search className="w-12 h-12" />
                </div>
                <p className="text-3xl font-display font-black">{trafficStats.cached_searches.toLocaleString()}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Buscas em Cache</p>
              </div>
            </div>
          )}
        </section>

        {/* Performance / System Overlap - Optional but good for UI */}
        <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white overflow-hidden relative md:col-span-1">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Activity className="w-40 h-40" />
          </div>
          <h3 className="text-xl font-display font-black mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> System Latency
          </h3>
          <div className="space-y-6 relative z-10">
            {[
              { db: 'PostgreSQL', lat: '14ms', fill: '60%' },
              { db: 'MongoDB', lat: '8ms', fill: '30%' },
              { db: 'Redis', lat: '1ms', fill: '5%' },
              { db: 'Cassandra', lat: '42ms', fill: '85%' },
            ].map(item => (
              <div key={item.db} className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>{item.db}</span>
                  <span className="text-white">{item.lat}</span>
                </div>
                <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: item.fill }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cassandra Section - Full Width */}
        <section className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 flex flex-col group hover:border-purple-200 transition-all">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                <LayoutGrid className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-display font-black text-slate-900">Comportamento</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Big Data / Column-Family</p>
              </div>
            </div>
            <DbBadge name="Cassandra" color="bg-purple-50 text-purple-600 border-purple-100" />
          </div>

          {!activityStats ? <StatsSkeleton /> : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Logins */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> Últimos 10 Logins
                </h4>
                <div className="space-y-2">
                  {activityStats.last_logins.map((log, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl text-[10px] flex justify-between items-center group-hover:bg-white transition-colors">
                      <span className="font-bold text-slate-700">{log.user_id}</span>
                      <span className="text-slate-400 font-medium">{log.device.split(' ')[0]}</span>
                      <span className="font-black text-indigo-600">{format(new Date(log.logged_at), 'HH:mm')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Views */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Produtos Vistos
                </h4>
                <div className="space-y-2">
                  {activityStats.last_views.map((log, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl text-[10px] flex justify-between items-center group-hover:bg-white transition-colors">
                      <span className="font-bold text-slate-700 truncate max-w-[80px]">{log.product_name}</span>
                      <span className="text-slate-400 font-medium">R$ {log.price}</span>
                      <span className="font-black text-emerald-600">{format(new Date(log.viewed_at), 'HH:mm')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Purchases */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Compras Recentes
                </h4>
                <div className="space-y-2">
                  {activityStats.last_purchases.map((log, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl text-[10px] flex justify-between items-center group-hover:bg-white transition-colors">
                      <span className="font-bold text-slate-700 truncate max-w-[80px]">{log.product_name}</span>
                      <span className="text-slate-400 font-medium">x{log.quantity}</span>
                      <span className="font-black text-rose-600">{format(new Date(log.purchased_at), 'HH:mm')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></svg>
  );
}
