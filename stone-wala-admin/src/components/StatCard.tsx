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
    <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-stone-500 text-sm font-medium">{title}</p>
        {isLoading ? (
          <div className="h-8 w-16 bg-stone-200 animate-pulse rounded-md mt-1" />
        ) : (
          <p className="text-stone-900 text-2xl font-bold mt-1">{value}</p>
        )}
      </div>
    </div>
  );
}