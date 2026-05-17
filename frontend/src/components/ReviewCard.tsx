import { Review } from '@/types';
import { Star, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReviewCardProps {
  review: Review;
  [key: string]: any;
}

export const ReviewCard = ({ review }: ReviewCardProps) => {
  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{review.user_name || 'Usuário'}</h4>
            <p className="text-xs text-gray-500">
              {format(new Date(review.created_at), "dd 'de' MMM. 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-200'}`} 
            />
          ))}
        </div>
      </div>
      <p className="text-gray-700 leading-relaxed italic">
        "{review.comment}"
      </p>
    </div>
  );
};
