import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CartItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, CreditCard, Wallet, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Checkout() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      if (!user) return;
      try {
        const data = await api.cart.get(user.id);
        if (data.items.length === 0) navigate('/cart');
        setItems(data.items);
      } catch (err) {
        navigate('/cart');
      }
    };
    loadCart();
  }, [user, navigate]);

  const total = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const canAfford = (user?.balance || 0) >= total;

  const handleConfirm = async () => {
    if (!user) return;
    if (!canAfford) {
      alert('Saldo insuficiente! Venda alguns produtos para aumentar seu saldo.');
      return;
    }

    setIsProcessing(true);
    try {
      await api.orders.checkout(user.id);
      // Update local balance
      setUser({ ...user, balance: user.balance - total });
      setIsSuccess(true);
      setTimeout(() => navigate('/history'), 3000);
    } catch (err: any) {
      alert(err.message || 'Erro ao processar compra.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-12 rounded-3xl shadow-2xl border border-gray-100 text-center max-w-md"
        >
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-display font-extrabold text-gray-900 mb-4">Compra Confirmada!</h1>
          <p className="text-gray-500 font-medium mb-8">
            Sua transação foi processada com sucesso no PostgreSQL e o recibo gerado. Redirecionando para seu histórico...
          </p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 3 }}
              className="bg-green-500 h-full"
            ></motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-20">
      <h1 className="text-4xl font-display font-extrabold text-gray-900 mb-10 text-center">Finalizar Compra</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Payment & Summary */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" /> Método de Pagamento
            </h3>
            
            <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm font-bold text-blue-900 uppercase tracking-wider">Saldo em Conta</p>
                  <p className="text-2xl font-extrabold text-blue-700">R$ {user?.balance.toFixed(2)}</p>
                </div>
              </div>
              <CheckCircle2 className="w-6 h-6 text-blue-600 fill-current bg-white rounded-full" />
            </div>
            
            {!canAfford && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                <p className="text-sm text-red-600 font-medium">
                  <strong>Saldo insuficiente.</strong> Você precisa de mais {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total - (user?.balance || 0))} para completar esta compra.
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-400" /> Revisão de Dados
            </h3>
            <div className="space-y-3 py-4 border-y border-white/10">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Itens ({items.length})</span>
                <span className="text-white font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Taxa de Sistema</span>
                <span className="text-white font-bold">R$ 0,00</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-400 font-semibold uppercase tracking-widest text-xs">Total Final</span>
              <span className="text-3xl font-extrabold text-blue-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
              </span>
            </div>
            
            <button
              onClick={handleConfirm}
              disabled={isProcessing || !canAfford}
              className="w-full py-5 bg-blue-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-blue-600 shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
            >
              {isProcessing ? 'Processando transação...' : (
                <>
                  Confirmar Pagamento
                  <Lock className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Order Items */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center justify-between">
            Itens do Pedido
            <Link to="/cart" className="text-sm font-semibold text-blue-600 hover:underline">Editar</Link>
          </h3>
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.productId} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <img 
                  src={item.product.images?.[0] || 'https://via.placeholder.com/60'} 
                  alt="" 
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0" 
                />
                <div className="flex-grow">
                  <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{item.product.title}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Qtd: {item.quantity}</p>
                  <p className="text-blue-600 font-bold text-sm mt-1">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-400 italic">
            Esta transação seguirá o modelo ACID via PostgreSQL. O Cassandra irá registrar a conversão para análise comportamental.
          </div>
        </div>
      </div>
    </div>
  );
}
