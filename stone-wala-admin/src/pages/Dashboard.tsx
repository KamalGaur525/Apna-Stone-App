import { useMemo } from 'react';
import { LayoutDashboard, Users, UserCheck, Package, Clock, RefreshCcw } from 'lucide-react';
import StatCard from '../components/StatCard';
import { useDashboard } from '../hooks/useDashboard';

export default function Dashboard() {
  const { data, isLoading, isRefetching, error, refetch } = useDashboard();

  const stats = useMemo(() => [
    {
      title: 'Total Vendors',
      value: data?.totalVendors ?? 0,
      icon: UserCheck,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Guests',
      value: data?.totalGuests ?? 0,
      icon: Users,
      color: 'bg-green-600',
    },
    {
      title: 'Total Products',
      value: data?.totalProducts ?? 0,
      icon: Package,
      color: 'bg-indigo-600',
    },
    {
      title: 'Pending Review',
      value: data?.pendingProducts ?? 0,
      icon: Clock,
      color: 'bg-amber-500',
    },
  ], [data]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
          <p className="text-red-600 font-medium mb-4">{error.message}</p>
          <button
            onClick={refetch}
            className="mx-auto flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-all active:scale-95"
          >
            <RefreshCcw size={18} /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Dashboard Overview
            </h1>
            {(data?.pendingProducts ?? 0) > 0 && (
              <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                {data!.pendingProducts} pending
              </span>
            )}
          </div>
          <p className="text-stone-500 text-sm mt-0.5">
            {isLoading ? 'Loading statistics...' : 'Real-time statistics for Stone Wala.'}
          </p>
        </div>

        <button
          onClick={refetch}
          disabled={isRefetching || isLoading}
          className={`p-2.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm active:scale-90 ${
            isRefetching || isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="Refresh Stats"
        >
          <RefreshCcw
            size={20}
            className={isRefetching || isLoading ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Welcome Banner */}
      <div className="bg-stone-950 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-stone-200">
        <div className="relative z-10 max-w-xl">
          <h2 className="text-3xl font-bold mb-4">
            Manage your marketplace effortlessly.
          </h2>
          <p className="text-stone-400 leading-relaxed">
            Check pending products from vendors, manage user accounts, and monitor
            guest subscriptions all from one place.
          </p>
        </div>
        <LayoutDashboard
          className="absolute -right-8 -bottom-8 text-stone-900 opacity-50 rotate-12"
          size={240}
        />
      </div>
    </div>
  );
}