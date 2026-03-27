import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  isLoading?: boolean;
}

export default function StatCard({ title, value, icon: Icon, color, isLoading }: StatCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl p-5 border border-stone-200/80 shadow-sm hover:shadow-md hover:border-amber-300/80 transition-all duration-200 overflow-hidden flex items-center gap-4">

      {/* Subtle hover shimmer in top-right */}
      <div
        className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-300 pointer-events-none"
        style={{ background: 'inherit' }}
        aria-hidden="true"
      />

      {/* Icon badge */}
      <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${color}`}>
        <Icon size={20} className="text-white" strokeWidth={2} />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-stone-500 text-[11px] font-bold uppercase tracking-widest truncate">
          {title}
        </p>

        {isLoading ? (
          <div className="h-7 w-14 bg-stone-100 animate-pulse rounded-lg mt-1.5" />
        ) : (
          <p className="text-stone-900 text-2xl font-black tabular-nums mt-0.5 leading-none">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}