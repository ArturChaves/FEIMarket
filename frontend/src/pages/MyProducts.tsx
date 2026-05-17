import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { ProductGrid } from '@/components/ProductGrid';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { Link } from 'react-router-dom';
import { Plus, Package, Info } from 'lucide-react';
import { toast } from 'react-toastify';

export default function MyProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMyProducts = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Assuming a search by seller_id on the list endpoint (or similar logic)
      const data = await api.products.list({ seller_id: user.id, limit: 100 });
      // The backend filters by seller_id in reality, here we mock it by filtering if needed
      // but let's assume the API handles it as per contract search params
      setProducts(data.products.filter(p => p.seller_id === user.id));
    } catch (err) {
      console.error('Failed to load my products', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMyProducts();
  }, [loadMyProducts]);

  const handleToggleActive = async (id: string) => {
    if (!user) return;
    const product = products.find(p => p._id === id);
    if (!product) return;
    
    try {
      await api.products.update(id, { userId: user.id, is_active: !product.is_active });
      loadMyProducts();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar status do produto.');
    }
  };

  const handleEdit = (id: string) => {
    // Navigate to edit page or open modal
    toast.info(`Edição do produto ${id} não implementada - Reutilizaria o form de Publish.`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-gray-900 tracking-tight">Meus Produtos</h1>
          <p className="text-gray-500 font-medium mt-1">Gerencie seu catálogo de ativos acadêmicos ativos e inativos.</p>
        </div>
        <Link 
          to="/publish" 
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" /> Publicar Novo
        </Link>
      </div>

      <div className="mb-10 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-4">
        <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 text-sm">Controle de Inventário</h4>
          <p className="text-xs text-blue-700/80 leading-relaxed max-w-2xl mt-0.5">
            Produtos inativos não aparecem na busca pública, mas permanecem no seu perfil. 
            Todas as alterações são sincronizadas entre o cache Redis e a persistência MongoDB.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-gray-100 space-y-4">
              <LoadingSkeleton className="aspect-square rounded-2xl" />
              <LoadingSkeleton className="h-4 w-1/3" />
              <LoadingSkeleton className="h-6 w-full" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-32 text-center bg-gray-50 rounded-[40px] border-2 border-dashed border-gray-200 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-gray-300 mb-8 border border-gray-100 rotate-12">
              <Package className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Seu catálogo está vazio</h2>
            <p className="text-gray-500 mb-8 max-w-xs mx-auto">Comece a monetizar seu conhecimento publicando seu primeiro recurso acadêmico.</p>
            <Link to="/publish" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              Criar Primeiro Anúncio <Plus className="w-5 h-5" />
            </Link>
          </div>
        </div>
      ) : (
        <ProductGrid 
          products={products} 
          showAdminActions={true} 
          onEdit={handleEdit}
          onToggleActive={handleToggleActive}
        />
      )}
    </div>
  );
}
