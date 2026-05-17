import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { CartItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { CartItemRow } from '@/components/CartItemRow';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCart = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await api.cart.get(user.id);
      setItems(data.items);
    } catch (err) {
      console.error('Failed to load cart', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    try {
      await api.cart.updateItem(user.id, productId, quantity);
      loadCart();
    } catch (err) {
      alert('Erro ao atualizar quantidade.');
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;
    try {
      await api.cart.removeItem(user.id, productId);
      loadCart();
    } catch (err) {
      alert('Erro ao remover item.');
    }
  };

  const clearCart = async () => {
    if (!user) return;
    if (!confirm('Tem certeza que deseja esvaziar o carrinho?')) return;
    try {
      await api.cart.clear(user.id);
      setItems([]);
    } catch (err) {
      alert('Erro ao limpar carrinho.');
    }
  };

  const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-gray-900 tracking-tight">Carrinho de Compras</h1>
          <p className="text-gray-500 font-medium mt-1">
            {items.length} {items.length === 1 ? 'produto selecionado' : 'produtos selecionados'}
          </p>
        </div>
        <Link to="/" className="text-blue-600 font-bold flex items-center gap-2 hover:underline">
          <ChevronLeft className="w-4 h-4" /> Continuar comprando
        </Link>
      </div>

      {items.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-sm"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 text-blue-600 rounded-full mb-6">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Seu carrinho está vazio</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto">Parece que você ainda não adicionou nenhum produto ao seu carrinho.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            Explorar Produtos <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <div className="space-y-2">
                {items.map(item => (
                  <CartItemRow 
                    key={item.productId} 
                    item={item} 
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
              
              <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-center text-sm">
                <button
                  onClick={clearCart}
                  className="flex items-center gap-2 text-red-500 font-bold hover:text-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Esvaziar Carrinho
                </button>
                <div className="flex items-center gap-2 text-slate-300 italic font-medium">
                  FEIMarket Checkout Seguro
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-28">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Resumo do Pedido</h3>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Frete</span>
                  <span className="font-bold text-emerald-600">Grátis</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between text-lg text-gray-900">
                  <span className="font-bold">Total</span>
                  <span className="font-extrabold text-2xl text-indigo-600 tracking-tight">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]"
              >
                Prosseguir para Checkout
                <ArrowRight className="w-6 h-6" />
              </button>
              
              <p className="text-center text-xs text-gray-400 mt-6 font-medium">
                Ao clicar em prosseguir, você concorda com nossos termos de serviço e privacidade.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
