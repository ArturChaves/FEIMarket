import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  variant?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'slate';
  icon: LucideIcon;
  trend?: {
    value: number;
    isUp: boolean;
  };
}

const VARIANTS = {
  indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  amber: 'text-amber-600 bg-amber-50 border-amber-100',
  rose: 'text-rose-600 bg-rose-50 border-rose-100',
  slate: 'text-slate-600 bg-slate-50 border-slate-100',
};

export const StatsCard = ({ label, value, variant = 'slate', icon: Icon, trend }: StatsCardProps) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group transition-all hover:border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg border ${VARIANTS[variant].split(' ').slice(0, 2).join(' ')}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-xl font-bold text-slate-900">{value}</h3>
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          {trend.isUp ? (
            <TrendingUp className="w-3 h-3 text-emerald-500" />
          ) : (
            <TrendingDown className="w-3 h-3 text-rose-500" />
          )}
          <span className={`text-[10px] font-bold ${trend.isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.value}%
          </span>
          <span className="text-[10px] text-slate-400 font-medium">vs. período anterior</span>
        </div>
      )}
    </div>
  );
};
