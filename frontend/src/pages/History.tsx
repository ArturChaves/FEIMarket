import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Order } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History as HistoryIcon, Package, Calendar, Tag, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function History() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      try {
        const data = await api.orders.list(user.id);
        setOrders(data.orders);
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHistory();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-display font-extrabold text-gray-900 tracking-tight">Histórico de Compras</h1>
        <p className="text-gray-500 font-medium mt-1">Todas as suas transações asseguradas via blockchain acadêmica (PostgreSQL).</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200">
          <HistoryIcon className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-900">Nenhuma compra realizada ainda</h3>
          <p className="text-gray-500 mt-2">Seu histórico aparecerá aqui após sua primeira transação.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, idx) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="bg-gray-50 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pedido</span>
                    <span className="text-xs font-mono font-bold text-blue-600">#{order.id.slice(-8)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Data</span>
                    <span className="text-sm font-bold text-gray-700">
                      {format(new Date(order.created_at), "dd 'de' MMM. 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Total</span>
                    <span className="text-xl font-extrabold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 hidden sm:block" />
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 gap-6">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.product_name}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Qtd: {item.quantity}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Unit: R$ {item.unit_price.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">R$ {item.subtotal.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Status: Processado
                  </span>
                  <span>Blockchain Type: PostgreSQL</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
