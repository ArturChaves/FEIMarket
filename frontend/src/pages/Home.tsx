import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';
import { SearchBar } from '@/components/SearchBar';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductGridSkeleton } from '@/components/LoadingSkeleton';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, ShieldCheck, ShoppingBag, Package, Zap } from 'lucide-react';

import { useSearchParams } from 'react-router-dom';
import { Select } from '@/components/Select';
import { SORT_OPTIONS } from '@/lib/constants';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [searchParams, setSearchParams] = useSearchParams();

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = searchParams.get('q') || '';
      const cat = searchParams.get('cat') || '';
      const minPrice = searchParams.get('min') || '';
      const maxPrice = searchParams.get('max') || '';
      const sortBy = searchParams.get('sort') || 'recent';
      const page = searchParams.get('page') || '1';
      
      const data = await api.products.list({ 
        search: q, 
        category: cat,
        minPrice,
        maxPrice,
        sortBy,
        page: page, 
        limit: 8 
      });
      setProducts(data.products);
      setPagination({ 
        page: data.page, 
        totalPages: data.totalPages 
      });
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white min-h-screen">
      <section className="p-8 w-full max-w-full">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight">
              {searchParams.get('q') ? `Busca: "${searchParams.get('q')}"` : 
               searchParams.get('cat') ? `Categoria: ${searchParams.get('cat')}` : 'Descubra Ofertas'}
            </h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
              Mercado Atualizado em Tempo Real
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
               <span className="text-xs font-bold text-slate-500">{products.length} de {pagination.page * 8} produtos</span>
               <div className="h-4 w-px bg-slate-200"></div>
               <span className="text-[10px] font-bold text-indigo-600 uppercase">Página {pagination.page}</span>
            </div>
            
            <Select 
              value={searchParams.get('sort') || 'recent'}
              onChange={(val) => {
                const params = new URLSearchParams(searchParams);
                params.set('sort', val);
                setSearchParams(params);
              }}
              options={SORT_OPTIONS}
              buttonClassName="!bg-white !border-slate-200 !rounded-2xl !text-xs !font-bold !text-slate-600 hover:!bg-slate-50"
            />
          </div>
        </div>

        {isLoading ? (
          <ProductGridSkeleton />
        ) : products.length > 0 ? (
          <>
            <ProductGrid products={products} />
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>
                
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => handlePageChange(i + 1)}
                    className={`w-12 h-12 rounded-xl font-bold transition-all ${
                      pagination.page === i + 1 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' 
                        : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-32 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
            <Package className="w-24 h-24 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-900 mb-2">Nada por aqui!</h3>
            <p className="text-slate-400 font-medium">Não encontramos produtos com esses filtros no momento.</p>
            <button 
              onClick={() => setSearchParams({})}
              className="mt-8 px-8 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              Limpar Filtros
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
