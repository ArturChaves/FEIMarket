import React, { useState, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';

interface SearchBarProps {
  onSearch: (params: { search: string, category: string, minPrice: string, maxPrice: string, sortBy: string }) => void;
  initialValues?: { search?: string, category?: string, minPrice?: string, maxPrice?: string, sortBy?: string };
  compact?: boolean;
}

const CATEGORIES = ['Eletrônicos', 'Livros', 'Vestuário', 'Casa & Cozinha', 'Esportes', 'Outros'];
const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais Recentes' },
  { value: 'rating', label: 'Melhor Avaliação' },
  { value: 'oldest', label: 'Mais Antigos' },
  { value: 'price_asc', label: 'Preço: Menor para Maior' },
  { value: 'price_desc', label: 'Preço: Maior para Menor' },
];

export const SearchBar = ({ onSearch, initialValues, compact }: SearchBarProps) => {
  const [search, setSearch] = useState(initialValues?.search || '');
  const [category, setCategory] = useState(initialValues?.category || '');
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice || '');
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice || '');
  const [sortBy, setSortBy] = useState(initialValues?.sortBy || 'recent');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    onSearch({ search, category, minPrice, maxPrice, sortBy });
  }, [onSearch, search, category, minPrice, maxPrice, sortBy]);

  if (compact) {
    return (
      <div className="relative w-full">
        <form onSubmit={handleSearch} className="flex bg-slate-100 rounded-xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
          <select 
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              onSearch({ search, category: e.target.value, minPrice, maxPrice, sortBy });
            }}
            className="bg-slate-200/50 px-4 py-2.5 text-sm font-medium text-slate-600 border-r border-slate-200 outline-none hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <option value="">Categorias</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="flex-1 flex items-center pr-1">
            <input
              type="text"
              className="flex-grow py-2.5 px-4 bg-transparent focus:outline-none text-slate-700 placeholder:text-slate-400 text-sm"
              placeholder="O que você está procurando?"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 rounded-lg transition-colors ${isFilterOpen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button type="submit" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>
          </div>
        </form>

        {isFilterOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Preço Mínimo</label>
              <input
                type="number"
                placeholder="R$ 0"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Preço Máximo</label>
              <input
                type="number"
                placeholder="R$ 9999"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
               <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Ordenar Mercado</label>
               <select 
                className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-slate-600"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-slate-50">
               <button 
                type="button"
                onClick={() => {
                  handleSearch();
                  setIsFilterOpen(false);
                }} 
                className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100"
               >
                 Aplicar Filtros
               </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="search-container" className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSearch} className="relative group">
        <div className="flex bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden ring-offset-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all duration-300">
          <div className="flex items-center pl-5 pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="search-input"
            type="text"
            className="flex-grow py-4 px-4 bg-transparent focus:outline-none text-gray-700 placeholder:text-gray-400"
            placeholder="Buscar produtos acadêmicos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-5 border-l border-gray-100 flex items-center gap-2 font-medium transition-colors ${
              isFilterOpen || category || minPrice || maxPrice ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-8 py-4 font-semibold hover:bg-blue-700 transition-colors"
          >
            Buscar
          </button>
        </div>

        {isFilterOpen && (
          <div className="absolute top-full left-0 right-0 mt-3 p-6 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Categoria</label>
              <select 
                id="category-filter"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preço Mínimo (R$)</label>
              <input
                id="min-price-input"
                type="number"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preço Máximo (R$)</label>
              <input
                id="max-price-input"
                type="number"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="9999"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ordenar por</label>
              <select 
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  setCategory('');
                  setMinPrice('');
                  setMaxPrice('');
                  setSortBy('recent');
                  onSearch({ search, category: '', minPrice: '', maxPrice: '', sortBy: 'recent' });
                }}
                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Limpar filtros
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSearch();
                  setIsFilterOpen(false);
                }}
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
