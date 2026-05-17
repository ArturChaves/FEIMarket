import React, { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { ImageUploader } from '@/components/ImageUploader';
import { Package, Tag, Layers, Settings, FileText, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const CATEGORIES = ['Hardware', 'Software', 'Livros', 'Serviços', 'Eletrônicos', 'Outros'];

export default function Publish() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    category: 'Hardware',
  });
  
  const [attributes, setAttributes] = useState<{ key: string, value: string }[]>([]);
  const [images, setImages] = useState<File[]>([]);

  const addAttribute = () => setAttributes([...attributes, { key: '', value: '' }]);
  const removeAttribute = (index: number) => setAttributes(attributes.filter((_, i) => i !== index));
  const updateAttribute = (index: number, key: string, value: string) => {
    const newAttrs = [...attributes];
    newAttrs[index] = { key, value };
    setAttributes(newAttrs);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (images.length === 0) return alert('Pelo menos uma imagem é obrigatória.');

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append('userId', user.id);
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category', formData.category);
      
      const attrsObj: Record<string, string> = {};
      attributes.forEach(attr => {
        if (attr.key && attr.value) attrsObj[attr.key] = attr.value;
      });
      data.append('attributes', JSON.stringify(attrsObj));
      
      images.forEach(image => data.append('images', image));

      await api.products.create(data);
      alert('Produto publicado com sucesso!');
      navigate('/my-products');
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar produto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-extrabold text-gray-900 tracking-tight">Anunciar Produto</h1>
          <p className="text-gray-500 font-medium mt-1">Crie um anúncio de destaque e alcance milhares de compradores.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs font-bold bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full border border-indigo-100 uppercase tracking-widest">
          <Sparkles className="w-4 h-4" /> Destaque Garantido
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 space-y-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-4">
              <FileText className="w-6 h-6 text-blue-600" /> Informações Básicas
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Título do Anúncio</label>
                <input
                  required
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
                  placeholder="Ex: iPhone 15 Pro Max - 256GB Platinum"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Descrição Detalhada</label>
                <textarea
                  required
                  rows={5}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all resize-none"
                  placeholder="Descreva o que está vendendo, o estado do conteúdo, ano de produção, etc."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Categoria</label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  <select
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl appearance-none focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Preço (R$)</label>
                <input
                  required
                  type="number"
                  step="0.01"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Estoque</label>
                <input
                  required
                  type="number"
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                  placeholder="1"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-8 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <Settings className="w-6 h-6 text-gray-600" /> Atributos Adicionais
            </h3>
            
            <div className="space-y-4">
              {attributes.map((attr, index) => (
                <div key={index} className="flex gap-4 items-center animate-in fade-in slide-in-from-left-2 transition-all">
                  <input
                    type="text"
                    className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Chave (Ex: Páginas)"
                    value={attr.key}
                    onChange={(e) => updateAttribute(index, e.target.value, attr.value)}
                  />
                  <input
                    type="text"
                    className="flex-1 p-3 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Valor (Ex: 120)"
                    value={attr.value}
                    onChange={(e) => updateAttribute(index, attr.key, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeAttribute(index)}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <ChevronRight className="w-5 h-5 rotate-45 transform" />
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                onClick={addAttribute}
                className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-800 py-2"
              >
                <PlusCircle className="w-5 h-5" /> Adicionar campo dinâmico
              </button>
            </div>
          </div>
          
          <div className="p-8 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-6">
              <PlusCircle className="w-6 h-6 text-blue-600" /> Galeria de Imagens
            </h3>
            <ImageUploader onImagesChange={setImages} />
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-5 bg-white border-2 border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Confirmar e Publicar
                <CheckCircle2 className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function PlusCircle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
  );
}
