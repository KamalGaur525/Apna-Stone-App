import { useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  Clock,
  RefreshCcw,
  AlertTriangle,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import { useDashboard } from '../hooks/useDashboard';

export default function Dashboard() {
  const { data, isLoading, isRefetching, error, refetch } = useDashboard();

  const {
    totalVendors = 0,
    totalGuests = 0,
    totalProducts = 0,
    pendingProducts = 0,
  } = data || {};

  const stats = useMemo(() => [
    {
      title: 'Total Vendors',
      value: totalVendors,
      icon: UserCheck,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Guests',
      value: totalGuests,
      icon: Users,
      color: 'bg-emerald-500',
    },
    {
      title: 'Total Products',
      value: totalProducts,
      icon: Package,
      color: 'bg-indigo-500',
    },
    {
      title: 'Pending Review',
      value: pendingProducts,
      icon: Clock,
      color: 'bg-amber-500',
    },
  ], [totalVendors, totalGuests, totalProducts, pendingProducts]);

  // ── Error State ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white border border-red-100 rounded-3xl shadow-xl shadow-red-100/60 p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={26} className="text-red-500" strokeWidth={2} />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1.5">
            Failed to load data
          </h3>
          <p className="text-stone-500 text-sm mb-6 leading-relaxed">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => refetch()}
            className="group w-full flex items-center justify-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl font-semibold text-sm shadow-md shadow-red-600/25 transition-all duration-200"
          >
            <RefreshCcw size={15} className="group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {/* ── Page Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              Dashboard
            </h1>
            {pendingProducts > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 text-[11px] font-bold rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
                {pendingProducts} Pending
              </span>
            )}
          </div>
          <p className="text-stone-400 text-sm mt-1 font-medium">
            {isLoading || isRefetching
              ? 'Syncing latest statistics…'
              : 'Real-time overview for Stone Wala.'}
          </p>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={isRefetching || isLoading}
          aria-label="Refresh dashboard statistics"
          className="group shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-sm"
        >
          <RefreshCcw
            size={15}
            className={`transition-transform duration-500 ${
              isRefetching || isLoading
                ? 'animate-spin text-amber-500'
                : 'group-hover:rotate-180'
            }`}
          />
          Refresh
        </button>
      </header>

      {/* ── Stat Cards ── */}
      <section
        aria-label="Key statistics"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
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
      </section>

      {/* ── Welcome Banner ── */}
      <section
        aria-label="Platform overview"
        className="relative bg-stone-950 rounded-3xl overflow-hidden shadow-2xl shadow-stone-900/30"
      >
        {/* Ambient glow blob */}
        <div
          className="absolute -top-16 -right-16 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 31px,#fff 31px,#fff 32px),repeating-linear-gradient(90deg,transparent,transparent 31px,#fff 31px,#fff 32px)',
          }}
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-8 p-8 sm:p-10">
          {/* Text content */}
          <div className="flex-1 max-w-lg">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              <span className="text-amber-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                Command Center
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug mb-3">
              Manage your marketplace{' '}
              <span className="text-amber-400">effortlessly.</span>
            </h2>
            <p className="text-stone-400 text-sm leading-relaxed">
              Review pending vendor products, manage user accounts, and monitor
              guest subscriptions — all from one central hub.
            </p>
          </div>

          {/* Stat summary strip */}
          <div className="shrink-0 flex sm:flex-col gap-4 sm:gap-3 flex-wrap">
            {[
              { label: 'Vendors', value: totalVendors },
              { label: 'Products', value: totalProducts },
              { label: 'Guests', value: totalGuests },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-start sm:items-end">
                <span className="text-2xl font-black text-white tabular-nums">
                  {isLoading ? '—' : value}
                </span>
                <span className="text-[11px] text-stone-500 font-semibold uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative icon — clipped by overflow-hidden */}
        <LayoutDashboard
          size={260}
          className="absolute -bottom-8 right-4 text-stone-800/50 rotate-6 pointer-events-none select-none hidden md:block"
          aria-hidden="true"
        />
      </section>
    </div>
  );
}