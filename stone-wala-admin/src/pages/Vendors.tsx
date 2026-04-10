import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Ban, CheckCircle, RefreshCcw,
  Loader2, Phone, X, Building2, Users
} from 'lucide-react';
import { useVendors } from '../hooks/useVendors';
import Badge from '../components/Badge';
import Modal from '../components/Modal'; 

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfirmState = {
  vendorId: number;
  isActive: boolean;
  firmName: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 4; 

// ─── Tier Config ──────────────────────────────────────────────────────────────

const TIER_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  stone_seller: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  factory:      { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  godown:       { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

function TierBadge({ tier }: { tier?: string | null }) {
  const normalizedTier = (tier || 'unassigned').toLowerCase().replace(/ /g, '_');
  const style = TIER_STYLES[normalizedTier] ?? {
    bg: 'bg-stone-100', text: 'text-stone-700', dot: 'bg-stone-500'
  };
  const label = normalizedTier.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {label}
    </span>
  );
}

// ─── Vendor Avatar ─────────────────────────────────────────────────────────────

function VendorAvatar({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="w-12 h-12 rounded-lg object-cover border border-stone-200 shrink-0"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 font-bold uppercase border border-stone-200 text-sm shrink-0">
      {name.charAt(0)}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ isFiltered, onClear }: { isFiltered: boolean; onClear: () => void }) {
  return (
    <tr>
      <td colSpan={5} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
            <Users size={20} className="text-stone-400" strokeWidth={1.5} />
          </div>
          <p className="text-stone-500 text-sm font-semibold">
            {isFiltered ? 'No vendors match your search' : 'No vendors registered yet'}
          </p>
          {isFiltered && (
            <button
              onClick={onClear}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-2 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────

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
        vendors
      </p>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          aria-label="Previous page"
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
                aria-label={`Go to page ${p}`}
                aria-current={p === currentPage ? 'page' : undefined}
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
          aria-label="Next page"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Vendors() {
  const { vendors, isLoading, error, refetch, toggleVendorStatus, isProcessing } = useVendors();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── UI-only: pagination state ──────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);

  // ── Search change resets to page 1 ────────────────────────────────────────
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const filteredVendors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.firm_name.toLowerCase().includes(q) ||
        v.phone?.includes(q) ||
        v.gst_number?.toLowerCase().includes(q)
    );
  }, [vendors, searchTerm]);

  // ── Pagination derived values ──────────────────────────────────────────────
  const totalPages       = Math.max(1, Math.ceil(filteredVendors.length / ITEMS_PER_PAGE));
  const safePage         = Math.min(currentPage, totalPages);
  const paginatedVendors = filteredVendors.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleToggleStatus = async () => {
    if (!confirmState) return;
    const { vendorId, isActive, firmName } = confirmState;
    setIsSubmitting(true);
    try {
      const res = await toggleVendorStatus(vendorId, isActive);
      if (res.success) {
        toast.success(`${firmName} has been ${isActive ? 'blocked' : 'unblocked'}.`);
        setConfirmState(null);
      } else {
        toast.error(res.message || 'Update failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-md shadow-amber-900/20">
            <Users size={18} className="text-stone-950" strokeWidth={2.5} />
          </div>
          <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4">
        <div className="bg-white border border-red-100 rounded-3xl shadow-xl shadow-red-100/60 p-8 max-w-sm w-full text-center">
          <p className="text-stone-600 text-sm font-semibold mb-1">Failed to load vendors</p>
          <p className="text-stone-400 text-xs mb-5">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="group w-full flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-150"
          >
            <RefreshCcw size={15} className="group-hover:rotate-180 transition-transform duration-500" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Vendors</h1>
          <p className="text-stone-400 text-sm mt-0.5 font-medium">
            {vendors.length} Registered Vendors
            {searchTerm && (
              <span className="text-amber-500"> · {filteredVendors.length} filtered</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search firm, phone or GST…"
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

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            aria-label="Refresh vendors"
            className="group shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:shadow-md text-sm font-semibold shadow-sm transition-all duration-200"
          >
            <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </button>
        </div>
      </header>

      {/* ── Table Card ── */}
      <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-5 py-3.5 text-[11px] font-black text-stone-400 uppercase tracking-widest">
                  Vendor & Firm
                </th>
                <th className="px-5 py-3.5 text-[11px] font-black text-stone-400 uppercase tracking-widest hidden md:table-cell">
                  GST Number
                </th>
                <th className="px-5 py-3.5 text-[11px] font-black text-stone-400 uppercase tracking-widest hidden sm:table-cell">
                  Contact
                </th>
                <th className="px-5 py-3.5 text-[11px] font-black text-stone-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-5 py-3.5 text-[11px] font-black text-stone-400 uppercase tracking-widest text-right">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {paginatedVendors.length === 0 ? (
                <EmptyState
                  isFiltered={!!searchTerm.trim()}
                  onClear={() => handleSearchChange('')}
                />
              ) : (
                paginatedVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-stone-50/70 transition-colors "
                  >
                    {/* Vendor & Firm */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <VendorAvatar name={vendor.firm_name} logoUrl={vendor.logo_url} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-stone-900 leading-tight truncate">
                            {vendor.firm_name}
                          </p>
                          <div className="mt-1">
                            <TierBadge tier={vendor.tier} />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* GST */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono">
                        <Building2 size={15} className="text-stone-400 shrink-0" />
                        {vendor.gst_number || <span className="text-stone-300">—</span>}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-xs text-stone-500">
                        <Phone size={15} className="text-stone-400 shrink-0" />
                        {vendor.phone || <span className="text-stone-300">—</span>}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <Badge status={vendor.is_active ? 'active' : 'blocked'} />
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        disabled={isProcessing(vendor.id) || isSubmitting}
                        onClick={() =>
                          setConfirmState({
                            vendorId: vendor.id,
                            isActive: Boolean(vendor.is_active),
                            firmName: vendor.firm_name,
                          })
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                          vendor.is_active
                            ? 'text-red-600 bg-red-50 hover:bg-red-100'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {isProcessing(vendor.id) ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : vendor.is_active ? (
                          <Ban size={13} strokeWidth={2} />
                        ) : (
                          <CheckCircle size={13} strokeWidth={2} />
                        )}
                        {vendor.is_active ? 'Block' : 'Unblock'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredVendors.length}
          itemsOnPage={paginatedVendors.length}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPage={(p) => setCurrentPage(p)}
        />
      </div>

      {/* ── Confirm Modal ── */}
      <Modal
        isOpen={confirmState !== null}
        title={confirmState?.isActive ? 'Block Vendor?' : 'Unblock Vendor?'}
        onCancel={() => !isSubmitting && setConfirmState(null)}
        onConfirm={handleToggleStatus}
        confirmText={confirmState?.isActive ? 'Yes, Block' : 'Yes, Unblock'}
        isDestructive={confirmState?.isActive}
        isConfirmLoading={isSubmitting}
      >
        {confirmState && (
          <p className="text-sm text-stone-500 leading-relaxed">
            Are you sure you want to{' '}
            <span className="font-semibold text-stone-800">
              {confirmState.isActive ? 'block' : 'unblock'} {confirmState.firmName}
            </span>?{' '}
            {confirmState.isActive
              ? 'They will lose access to the portal and their products will be hidden from guests.'
              : 'They will regain full access to their portal immediately.'}
          </p>
        )}
      </Modal>
    </div>
  );
}