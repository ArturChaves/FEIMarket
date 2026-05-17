import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Product, Review } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { ReviewCard } from '@/components/ReviewCard';
import { ReviewForm } from '@/components/ReviewForm';
import { ShoppingCart, Star, Package, ChevronLeft, ShieldCheck, Truck } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await api.products.getById(id, user?.id);
      setProduct(data.product);
      setReviews(data.reviews);
      setActiveImage(data.product.images?.[0] || 'https://via.placeholder.com/600');
    } catch (err) {
      console.error('Failed to load product', err);
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) return navigate('/auth/login');
    if (!product || !user) return;
    
    if (user.id === product.seller_id) {
      toast.error('Você não pode comprar seu próprio produto!');
      return;
    }
    
    setIsAddingToCart(true);
    try {
      await api.cart.addItem(user.id, product._id, 1);
      toast.success('Produto adicionado ao carrinho!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao adicionar item.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!id || !user) return;
    setIsSubmittingReview(true);
    try {
      await api.reviews.create(id, { userId: user.id, rating, comment });
      loadData(); // Refresh reviews
    } catch (err: any) {
      toast.error(err.message || 'Você só pode avaliar produtos que já comprou.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) return <div className="text-center py-20">Produto não encontrado.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium mb-8 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
        {/* Image Gallery */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="aspect-square rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm"
          >
            <img 
              src={activeImage} 
              alt={product.title} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images?.map((img, i) => (
              <button 
                key={i}
                onClick={() => setActiveImage(img)}
                className={`w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                  activeImage === img ? 'border-blue-600 ring-2 ring-blue-50' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="mb-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider">
              {product.category}
            </span>
          </div>
          
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">{product.title}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < 4 ? 'fill-current' : ''}`} />
              ))}
              <span className="ml-1 text-gray-900 font-bold">4.5</span>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500 font-medium">{reviews.length} Avaliações</span>
          </div>

          <div className="text-4xl font-bold text-gray-900 mb-8">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
          </div>

          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 mb-8 space-y-4">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-green-600" />
              <span className="font-semibold">{product.stock} unidades em estoque</span>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Compra Protegida pelo Sistema</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-gray-600" />
              <span className="font-semibold">Entrega Digital Imediata</span>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock === 0}
              className="flex-grow py-5 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <ShoppingCart className="w-6 h-6" />
              {isAddingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
            </button>
          </div>

          <div className="mt-12">
            <h3 className="text-lg font-bold text-gray-900 mb-3 underline decoration-blue-500 decoration-4 underline-offset-4">Descrição</h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {Object.keys(product.attributes || {}).length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Especificações</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(product.attributes).map(([key, value]) => (
                  <div key={key} className="flex flex-col p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <span className="text-xs font-bold text-gray-400 uppercase">{key}</span>
                    <span className="text-gray-900 font-semibold">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-8">Avaliações da Comunidade</h2>
          
          <div className="space-y-2">
            {reviews.length === 0 ? (
              <div className="py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-500 font-medium">Este produto ainda não recebeu avaliações.</p>
              </div>
            ) : (
              reviews.map(review => <ReviewCard key={review._id} review={review} />)
            )}
          </div>
        </div>
        
        <div>
          {isAuthenticated ? (
            <ReviewForm onSubmit={handleReviewSubmit} isSubmitting={isSubmittingReview} />
          ) : (
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center">
              <h3 className="font-bold text-blue-900 mb-2">Comprou este produto?</h3>
              <p className="text-sm text-blue-700 mb-4">Faça login para compartilhar sua experiência com outros acadêmicos.</p>
              <button 
                onClick={() => navigate('/auth/login')}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
              >
                Fazer Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
