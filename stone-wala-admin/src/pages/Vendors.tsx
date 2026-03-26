import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Ban, CheckCircle, RefreshCcw,
  Loader2, Phone, X, Building2, Users
} from 'lucide-react';
import { useVendors } from '../hooks/useVendors';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import type {  Tier } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type ConfirmState = {
  vendorId: number;
  isActive: boolean;
  firmName: string;
};

// ─── Tier Config ──────────────────────────────────────────────────────────────

const TIER_STYLES: Record<Tier, { bg: string; text: string; dot: string }> = {
  stone_seller: { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  factory:      { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  godown:       { bg: 'bg-stone-100', text: 'text-stone-700',  dot: 'bg-stone-500'  },
};

function TierBadge({ tier }: { tier: Tier }) {
  const style = TIER_STYLES[tier] ?? TIER_STYLES.godown;
  const label = tier.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
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
        className="w-10 h-10 rounded-xl object-cover border border-stone-200"
      />
    );
  }
  return (
    <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 font-bold uppercase border border-stone-200 text-sm">
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
          <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
            <Users size={26} className="text-stone-400" />
          </div>
          <p className="text-stone-600 font-semibold">
            {isFiltered ? 'No vendors match your search' : 'No vendors registered yet'}
          </p>
          {isFiltered && (
            <button
              onClick={onClear}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium underline underline-offset-2"
            >
              Clear search
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function Vendors() {
  const { vendors, isLoading, error, refetch, toggleVendorStatus, isProcessing } = useVendors();
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="animate-spin text-amber-500" size={36} />
        <p className="text-sm text-stone-500 font-medium">Loading vendors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 bg-red-50 rounded-3xl border border-red-100">
        <p className="text-red-600 font-semibold mb-2">Failed to load vendors</p>
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Registered Vendors</h1>
          <p className="text-sm text-stone-500 mt-0.5">
            {vendors.length} total vendors 
            {searchTerm && <span> (Filtered: {filteredVendors.length})</span>}
          </p>
        </div>

        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input
            type="text"
            placeholder="Search firm, phone or GST…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Vendor & Firm</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">GST Number</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredVendors.length === 0 ? (
                <EmptyState isFiltered={!!searchTerm.trim()} onClear={() => setSearchTerm('')} />
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <VendorAvatar name={vendor.firm_name} logoUrl={vendor.logo_url} />
                        <div>
                          <p className="font-semibold text-stone-900 leading-tight">{vendor.firm_name}</p>
                          <div className="mt-1"><TierBadge tier={vendor.tier} /></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-stone-600 uppercase">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={14} className="text-stone-400" />
                        {vendor.gst_number || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <Phone size={14} className="text-stone-400" />
                        {vendor.phone || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4"><Badge status={vendor.is_active ? 'active' : 'blocked'} /></td>
                    <td className="px-6 py-4 text-right">
                      <button
                        disabled={isProcessing(vendor.id) || isSubmitting}
                        onClick={() => setConfirmState({
                          vendorId: vendor.id,
                          isActive: Boolean(vendor.is_active),
                          firmName: vendor.firm_name,
                        })}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          vendor.is_active 
                            ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                            : 'text-green-700 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {isProcessing(vendor.id) ? <Loader2 className="animate-spin" size={14} /> : vendor.is_active ? <Ban size={14} /> : <CheckCircle size={14} />}
                        {vendor.is_active ? 'Block' : 'Unblock'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
          <p className="text-sm text-stone-600 leading-relaxed">
            Are you sure you want to <strong>{confirmState.isActive ? 'block' : 'unblock'} {confirmState.firmName}</strong>?
            {confirmState.isActive 
              ? ' They will lose access to the portal and their products will be hidden from guests.' 
              : ' They will regain full access to their portal immediately.'}
          </p>
        )}
      </Modal>
    </div>
  );
}