import { Product } from '@/types';
import { ShoppingCart, Star, Edit } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { toast } from 'react-toastify';

interface ProductCardProps {
  product: Product;
  showAdminActions?: boolean;
  onEdit?: (id: string) => void;
  onToggleActive?: (id: string) => void;
  [key: string]: any; // Allow for other props like key
}

export const ProductCard = ({ product, showAdminActions, onEdit, onToggleActive }: ProductCardProps) => {
  const imageUrl = product.images?.[0] || 'https://via.placeholder.com/300';
  const { user, refreshCartCount } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.id === product.seller_id;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation
    if (!user) {
      navigate('/auth/login');
      return;
    }
    if (user.id === product.seller_id) {
      toast.error('Você não pode comprar seu próprio produto!');
      return;
    }
    try {
      await api.cart.addItem(user.id, product._id, 1);
      if (refreshCartCount) {
        await refreshCartCount();
      }
      toast.success('Produto adicionado ao carrinho!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar item.');
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full hover:border-slate-200 transition-all"
    >
      <Link to={`/products/${product._id}`} className="block relative aspect-square overflow-hidden bg-slate-50">
        <img 
          src={imageUrl} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {!product.is_active && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-white text-[10px] font-bold tracking-widest uppercase bg-rose-600 px-3 py-1 rounded-full shadow-lg">Inativo</span>
          </div>
        )}
      </Link>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{product.category}</span>
            {isOwner && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                  Meu Produto
                </span>
              </>
            )}
          </div>
          <div className="flex items-center text-amber-500 text-[10px] font-bold bg-amber-50 px-2 py-0.5 rounded-full">
            <Star className="w-2.5 h-2.5 fill-current mr-1" />
            <span>4.5</span>
          </div>
        </div>
        
        <Link to={`/products/${product._id}`}>
          <h3 className="font-display font-bold text-slate-800 leading-tight line-clamp-2 hover:text-indigo-600 transition-colors mb-3">
            {product.title}
          </h3>
        </Link>
        
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
          <span className="text-xl font-bold text-slate-900 font-display">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
          </span>
          
          {isOwner ? (
            <button 
              onClick={(e) => {
                e.preventDefault();
                navigate('/my-products');
              }}
              className="p-2.5 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all shadow-sm"
              title="Gerenciar Produto"
            >
              <Edit className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={handleAddToCart}
              className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
              title="Adicionar ao Carrinho"
              disabled={product.stock === 0}
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
          )}
        </div>

        {showAdminActions && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button 
              onClick={() => onEdit?.(product._id)}
              className="py-2 text-[10px] font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors uppercase tracking-widest"
            >
              Editar
            </button>
            <button 
              onClick={() => onToggleActive?.(product._id)}
              className={`py-2 text-[10px] font-bold rounded-lg transition-colors uppercase tracking-widest ${
                product.is_active ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              {product.is_active ? 'Ocultar' : 'Exibir'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
