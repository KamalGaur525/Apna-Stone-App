import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Ban, CheckCircle, RefreshCcw,
  Loader2, Phone, X, Calendar, Users, Check,
} from 'lucide-react';
import { useGuests } from '../hooks/useGuests';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

// ─── Types ─────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'pending' | 'completed';

type ConfirmState =
  | { type: 'payment'; id: number; name: string }
  | { type: 'status';  id: number; name: string; isActive: boolean };

// ─── Constants ─────────────────────────────────────────────────────────────────

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all',       label: 'All'       },
  { value: 'pending',   label: 'Pending'   },
  { value: 'completed', label: 'Completed' },
];

const ITEMS_PER_PAGE = 5;

// ─── Avatar Helpers ────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  try {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((w) => (w && w[0] ? w[0].toUpperCase() : '')).join('') || '?';
  } catch {
    return '?';
  }
}

const AVATAR_PALETTE = [
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-orange-100 text-orange-700',
];

function avatarColor(id: number | null | undefined): string {
  return AVATAR_PALETTE[(id ?? 0) % AVATAR_PALETTE.length];
}

// ─── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
  return (
    <tr>
      <td colSpan={4}>
        <div className="flex flex-col items-center justify-center gap-4 py-20 px-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center ring-1 ring-stone-200">
              <Users size={28} className="text-stone-400" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white ring-1 ring-stone-200 flex items-center justify-center">
              <X size={10} className="text-stone-400" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-stone-700 tracking-tight">
              {isFiltered ? 'No matching guests' : 'No guests registered yet'}
            </p>
            <p className="text-xs text-stone-400">
              {isFiltered
                ? 'Try adjusting your search or filters.'
                : 'Guests will appear here once added.'}
            </p>
          </div>
          {isFiltered && (
            <button
              onClick={onClear}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-4 decoration-amber-400/60 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsOnPage: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
}

function Pagination({
  currentPage, totalPages, totalItems, itemsOnPage, onPrev, onNext, onPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end   = start + itemsOnPage - 1;

  const rangeSet = new Set<number>([1, totalPages]);
  for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    if (i >= 1 && i <= totalPages) rangeSet.add(i);
  }
  const sorted = Array.from(rangeSet).sort((a, b) => a - b);
  const pages: (number | '...')[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) pages.push('...');
    pages.push(p);
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-stone-100 bg-stone-50/40">
      <p className="text-xs text-stone-400 tabular-nums order-2 sm:order-1">
        Showing{' '}
        <span className="font-semibold text-stone-700">{start}–{end}</span>
        {' '}of{' '}
        <span className="font-semibold text-stone-700">{totalItems}</span>{' '}
        guests
      </p>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
        >
          ← Prev
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`el-${i}`} className="px-1 text-xs text-stone-400 select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
                  p === currentPage
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <span className="sm:hidden text-xs text-stone-500 tabular-nums px-2 font-medium">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function Guests() {
  const {
    guests, isLoading, error,
    refetch, toggleGuestStatus, approvePayment, isProcessing,
  } = useGuests();

  const [searchTerm, setSearchTerm]     = useState('');
  const [filter, setFilter]             = useState<FilterType>('all');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (val: FilterType) => {
    setFilter(val);
    setCurrentPage(1);
  };

  const counts = useMemo(() => ({
    all:       guests.length,
    pending:   guests.filter((g) => g.payment_status === 'pending').length,
    completed: guests.filter((g) => g.payment_status === 'paid' || g.payment_status === 'completed').length,
  }), [guests]);

  // ── FIX: Safe Search + Real Filter Logic ────────────────────────────────────
  const filteredGuests = useMemo(() => {
    let result = guests;

    // 1. Apply Status Filter
    if (filter !== 'all') {
      // Handle backend returning 'paid' or 'completed' depending on your setup
      result = result.filter(g => 
        filter === 'completed' 
          ? (g.payment_status === 'completed' || g.payment_status === 'paid') 
          : g.payment_status === filter
      );
    }

    // 2. Apply Search Filter Safely
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter((g) => {
        // Safe checks: fallback to empty string if null
        const nameMatch = (g.name || '').toLowerCase().includes(q);
        const phoneMatch = (g.phone || '').includes(q);
        
        // Use type assertion if location exists on guest object, otherwise safely ignore
        const locationStr = (g as any).location || '';
        const locMatch = locationStr.toLowerCase().includes(q);

        return nameMatch || phoneMatch || locMatch;
      });
    }

    return result;
  }, [guests, searchTerm, filter]);

  const totalPages      = Math.max(1, Math.ceil(filteredGuests.length / ITEMS_PER_PAGE));
  const safePage        = Math.min(currentPage, totalPages);
  const paginatedGuests = filteredGuests.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleAction = async () => {
    if (!confirmState) return;
    setIsSubmitting(true);
    try {
      const res =
        confirmState.type === 'payment'
          ? await approvePayment(confirmState.id)
          : await toggleGuestStatus(confirmState.id, confirmState.isActive);

      if (res.success) {
        toast.success(
          confirmState.type === 'payment'
            ? `Payment approved for ${confirmState.name}`
            : `${confirmState.name} has been ${confirmState.isActive ? 'blocked' : 'unblocked'}`
        );
        setConfirmState(null);
      } else {
        toast.error(res.message || 'Operation failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
          <Loader2 className="animate-spin text-amber-500" size={22} />
        </div>
        <div className="text-center space-y-0.5">
          <p className="text-sm font-semibold text-stone-700">Loading guests</p>
          <p className="text-xs text-stone-400">Fetching the latest data…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-16 px-8 bg-red-50/50 rounded-2xl border border-red-100">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
          <X size={20} className="text-red-500" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-red-700">Failed to load guests</p>
          <p className="text-xs text-red-400 max-w-xs">{error.message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white rounded-xl hover:bg-stone-700 active:scale-95 transition-all text-xs font-bold tracking-wide shadow-sm"
        >
          <RefreshCcw size={13} /> Try again
        </button>
      </div>
    );
  }

  const isFiltered = !!searchTerm.trim() || filter !== 'all';

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Guest Management</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {guests.length} total
            {isFiltered && filteredGuests.length !== guests.length && (
              <span className="text-amber-600 font-semibold"> · {filteredGuests.length} shown</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-white border border-stone-200 rounded-xl px-1 py-1 flex gap-0.5 shadow-sm">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleFilterChange(value)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === value
                    ? 'bg-stone-900 text-white shadow'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                {label}
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
                  filter === value ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>

           <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-800 text-sm placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 hover:border-stone-300 transition-all duration-200"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50/50 border-b border-stone-200">
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Guest
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                  Payment
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest hidden sm:table-cell">
                  Subscription
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {paginatedGuests.length === 0 ? (
                <EmptyState
                  isFiltered={isFiltered}
                  onClear={() => { handleSearchChange(''); handleFilterChange('all'); }}
                />
              ) : (
                paginatedGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center text-xs font-bold select-none ${avatarColor(guest.id)}`}>
                          {getInitials(guest.name ?? '')}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-900 truncate leading-tight">
                            {guest.name || 'Unknown Guest'}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-stone-400 shrink-0" />
                            <span className="text-xs text-stone-400 tabular-nums">
                              {guest.phone ?? '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <Badge status={guest.payment_status} />
                    </td>

                    <td className="px-5 py-4 hidden sm:table-cell">
                      {guest.expiry_date ? (
                        <div>
                          <p className="text-sm font-semibold text-stone-700 capitalize leading-tight">
                            {guest.plan_type ?? '—'}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar size={11} className="text-stone-400 shrink-0" />
                            <span className="text-xs text-stone-400 tabular-nums">
                              {new Date(guest.expiry_date).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-stone-100 text-stone-500 text-[10px] uppercase font-bold tracking-wider">
                          No active plan
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {guest.payment_status === 'pending' && (
                          <button
                            onClick={() => setConfirmState({
                              type: 'payment',
                              id: guest.id,
                              name: guest.name || 'this guest',
                            })}
                            aria-label={`Approve payment for ${guest.name}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 active:scale-95 transition-all"
                          >
                            <Check size={12} />
                            <span className="hidden sm:inline">Approve</span>
                          </button>
                        )}

                        <button
                          disabled={isProcessing(guest.id)}
                          onClick={() => setConfirmState({
                            type: 'status',
                            id: guest.id,
                            name: guest.name || 'this guest',
                            isActive: Boolean(guest.is_active),
                          })}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                            guest.is_active
                              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                        >
                          {isProcessing(guest.id) ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : guest.is_active ? (
                            <Ban size={12} />
                          ) : (
                            <CheckCircle size={12} />
                          )}
                          <span className="hidden sm:inline">
                            {guest.is_active ? 'Block' : 'Unblock'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredGuests.length}
          itemsOnPage={paginatedGuests.length}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPage={(p) => setCurrentPage(p)}
        />
      </div>

      {confirmState && (
        <Modal
          isOpen
          title={
            confirmState.type === 'payment'
              ? 'Approve Payment?'
              : confirmState.isActive
              ? 'Block Guest?'
              : 'Unblock Guest?'
          }
          onCancel={() => !isSubmitting && setConfirmState(null)}
          onConfirm={handleAction}
          isConfirmLoading={isSubmitting}
          confirmText={
            isSubmitting
              ? 'Processing…'
              : confirmState.type === 'payment'
              ? 'Yes, Approve'
              : confirmState.isActive
              ? 'Yes, Block'
              : 'Yes, Unblock'
          }
          isDestructive={confirmState.type === 'status' && confirmState.isActive}
        >
          <p className="text-sm text-stone-600 leading-relaxed">
            {confirmState.type === 'payment' ? (
              <>
                Confirm you have received payment from{' '}
                <span className="font-semibold text-stone-800">{confirmState.name}</span>.
                This will activate their subscription immediately.
              </>
            ) : (
              <>
                Are you sure you want to{' '}
                <span className="font-semibold text-stone-800">
                  {confirmState.isActive ? 'block' : 'unblock'}
                </span>{' '}
                <span className="font-semibold text-stone-800">{confirmState.name}</span>?
                {confirmState.isActive
                  ? ' They will lose access to the marketplace.'
                  : ' They will regain access to the marketplace.'}
              </>
            )}
          </p>
        </Modal>
      )}
    </div>
  );
}