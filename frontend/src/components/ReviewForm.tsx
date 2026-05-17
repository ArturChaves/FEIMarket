import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => void;
  isSubmitting?: boolean;
}

export const ReviewForm = ({ onSubmit, isSubmitting }: ReviewFormProps) => {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(rating, comment);
      setComment('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Avaliando este produto</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sua nota</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform active:scale-90"
            >
              <Star 
                className={`w-8 h-8 ${
                  (hoveredRating || rating) >= star ? 'text-yellow-500 fill-current' : 'text-gray-300'
                }`} 
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Seu comentário</label>
        <textarea
          required
          rows={4}
          className="w-full p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
          placeholder="O que você achou do produto?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !comment.trim()}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Enviando...' : (
          <>
            Publicar Avaliação
            <Send className="w-5 h-5" />
          </>
        )}
      </button>
    </form>
  );
};
