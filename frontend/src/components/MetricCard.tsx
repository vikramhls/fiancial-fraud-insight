import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: number;
  trendLabel?: string;
  color: 'blue' | 'red' | 'amber' | 'green' | 'purple' | 'indigo';
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-gradient-to-br from-blue-500 to-blue-700',
    accent: 'text-blue-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-gradient-to-br from-red-500 to-red-700',
    accent: 'text-red-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'bg-gradient-to-br from-amber-500 to-amber-700',
    accent: 'text-amber-600',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-gradient-to-br from-emerald-500 to-emerald-700',
    accent: 'text-emerald-600',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-gradient-to-br from-purple-500 to-purple-700',
    accent: 'text-purple-600',
  },
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'bg-gradient-to-br from-indigo-500 to-indigo-700',
    accent: 'text-indigo-600',
  },
};

export default function MetricCard({ title, value, icon, trend, trendLabel, color }: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <div className="card p-5 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {value}
          </p>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend > 0 ? (
                <TrendingUp size={13} className="text-emerald-500" />
              ) : trend < 0 ? (
                <TrendingDown size={13} className="text-red-500" />
              ) : (
                <Minus size={13} className="text-gray-400" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-gray-500'
                }`}
              >
                {trend > 0 ? '+' : ''}
                {trend}%
              </span>
              {trendLabel && (
                <span className="text-xs text-[var(--color-text-muted)] ml-1">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        <div
          className={`w-11 h-11 rounded-xl ${colors.icon} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}
        >
          <span className="text-white">{icon}</span>
        </div>
      </div>
    </div>
  );
}
