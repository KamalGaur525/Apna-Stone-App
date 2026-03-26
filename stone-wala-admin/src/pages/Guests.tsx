import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Ban, CheckCircle, RefreshCcw,
  Loader2, Phone, X, Calendar, Users, Check
} from 'lucide-react';
import { useGuests } from '../hooks/useGuests';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

// ─── Types ─────────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'pending' | 'completed';

type ConfirmState =
  | { type: 'payment'; id: number; name: string }
  | { type: 'status';  id: number; name: string; isActive: boolean };

// ─── Filter Tab Config — no hardcoding labels ──────────────────────────────────

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'all',       label: 'All'       },
  { value: 'pending',   label: 'Pending'   },
  { value: 'completed', label: 'Completed' },
];

// ─── Empty State ────────────────────────────────────────────────────────────────

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
  return (
    <tr>
      <td colSpan={4} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
            <Users size={26} className="text-stone-400" />
          </div>
          <p className="text-stone-600 font-semibold">
            {isFiltered ? 'No guests match your search' : 'No guests registered yet'}
          </p>
          {isFiltered && (
            <button
              onClick={onClear}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      </td>
    </tr>
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

  // ── Filter counts (dynamic — never hardcoded) ─────────────────────────────

  const counts = useMemo(() => ({
    all:       guests.length,
    pending:   guests.filter((g) => g.payment_status === 'pending').length,
    completed: guests.filter((g) => g.payment_status === 'completed').length,
  }), [guests]);

  // ── Search + Filter ───────────────────────────────────────────────────────

  const filteredGuests = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return guests.filter((g) => {
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.phone?.includes(q);
      const matchesFilter =
        filter === 'all' || g.payment_status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [guests, searchTerm, filter]);

  // ── Action Handler ────────────────────────────────────────────────────────

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

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="animate-spin text-amber-500" size={36} />
        <p className="text-sm text-stone-500">Loading guests...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="text-center p-12 bg-red-50 rounded-3xl border border-red-100">
        <p className="text-red-600 font-semibold mb-2">Failed to load guests</p>
        <p className="text-red-400 text-sm mb-5">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors text-sm font-medium"
        >
          <RefreshCcw size={16} /> Retry
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Guest Management</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {guests.length} total
            {searchTerm.trim() && filteredGuests.length !== guests.length && (
              <span className="text-amber-600 font-medium"> · {filteredGuests.length} shown</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          {/* Filter Tabs — dynamic from FILTERS config */}
          <div className="bg-white border border-stone-200 rounded-xl px-1 py-1 flex shadow-sm">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === value
                    ? 'bg-stone-950 text-white shadow-md'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                {label}
                {/* Dynamic count badge */}
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  filter === value ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                }`}>
                  {counts[value]}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              size={16}
            />
            <input
              type="text"
              placeholder="Search name or phone..."
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 outline-none text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search guests"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Guest Details</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredGuests.length === 0 ? (
                <EmptyState
                  isFiltered={!!searchTerm.trim() || filter !== 'all'}
                  onClear={() => { setSearchTerm(''); setFilter('all'); }}
                />
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-stone-50/50 transition-colors">

                    {/* Guest Details */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-stone-900">{guest.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-1">
                        <Phone size={12} className="shrink-0" />
                        {guest.phone ?? '—'}
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="px-6 py-4">
                      <Badge status={guest.payment_status} />
                    </td>

                    {/* Subscription */}
                    <td className="px-6 py-4">
                      {guest.expiry_date ? (
                        <div className="text-sm">
                          <p className="font-medium text-stone-700 capitalize">
                            {guest.plan_type ?? '—'}
                          </p>
                          <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                            <Calendar size={12} className="shrink-0" />
                            Exp: {new Date(guest.expiry_date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400">No active plan</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">

                        {/* Approve Payment — only shown when pending */}
                        {guest.payment_status === 'pending' && (
                          <button
                            onClick={() => setConfirmState({
                              type: 'payment',
                              id: guest.id,
                              name: guest.name,
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            aria-label={`Approve payment for ${guest.name}`}
                            title="Approve Payment"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                        )}

                        {/* Block / Unblock */}
                        <button
                          disabled={isProcessing(guest.id)}
                          onClick={() => setConfirmState({
                            type: 'status',
                            id: guest.id,
                            name: guest.name,
                            isActive: Boolean(guest.is_active),
                          })}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                            guest.is_active
                              ? 'text-red-600 bg-red-50 hover:bg-red-100'
                              : 'text-green-700 bg-green-50 hover:bg-green-100'
                          }`}
                          aria-label={`${guest.is_active ? 'Block' : 'Unblock'} ${guest.name}`}
                          title={guest.is_active ? 'Block Guest' : 'Unblock Guest'}
                        >
                          {isProcessing(guest.id) ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : guest.is_active ? (
                            <Ban size={14} />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          {guest.is_active ? 'Block' : 'Unblock'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
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
                Confirm you have received{' '}
                <span className="font-semibold text-stone-800">₹500</span> from{' '}
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