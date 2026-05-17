import { CartItem } from '@/types';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  [key: string]: any;
}

export const CartItemRow = ({ item, onUpdateQuantity, onRemove }: CartItemRowProps) => {
  const imageUrl = item.images?.[0] || 'https://via.placeholder.com/100';

  return (
    <div className="flex items-center gap-6 py-6 border-b border-gray-100 last:border-0">
      <Link to={`/products/${item.productId}`} className="w-24 h-24 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
        <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
      </Link>
      
      <div className="flex-grow">
        <Link to={`/products/${item.productId}`} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors">
          {item.title}
        </Link>
        <p className="text-sm text-gray-500 mt-1">Vendido por: {item.seller_name}</p>
        <p className="text-lg font-bold text-gray-900 mt-2">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
        </p>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
        <button
          onClick={() => onUpdateQuantity(item.productId, Math.max(1, item.quantity - 1))}
          className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
        <button
          onClick={() => onUpdateQuantity(item.productId, Math.min(item.stock, item.quantity + 1))}
          className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-gray-600 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="text-right w-32 hidden sm:block">
        <p className="text-sm text-gray-400 mb-1">Subtotal</p>
        <p className="font-bold text-gray-900">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
        </p>
      </div>

      <button
        onClick={() => onRemove(item.productId)}
        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Remover item"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
};
