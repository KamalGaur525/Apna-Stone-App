import { useState } from 'react';
import toast from 'react-hot-toast';
import { useProducts } from '../hooks/useProducts';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import {
  Check, X, Eye, Loader2, PackageSearch,
  RefreshCcw, Package, Trash2, ClipboardList, Pencil,
} from 'lucide-react';
import type { Product, ProductStatus } from '../types';

const stripHtml = (html: string): string => {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

type Tab = 'pending' | 'all';

// ── Detail Modal ──
function DetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <h2 className="text-base font-black text-stone-900 tracking-tight">Product Details</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors">
            <X size={15} className="text-stone-600" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <img src={product.image_url || '/placeholder.png'} alt={product.name} className="w-full h-52 object-cover rounded-2xl border border-stone-100 bg-stone-50" />

          <div className="flex items-start justify-between gap-3">
            <h3 className="font-black text-lg text-stone-900 leading-snug flex-1">{product.name}</h3>
            <Badge status={product.status} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Vendor</p>
              <p className="text-sm font-semibold text-stone-800">{product.firm_name || '—'}</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Category</p>
              <p className="text-sm font-semibold text-stone-800">{product.category_name || '—'}</p>
            </div>
            {product.sub_category && (
              <div className="bg-amber-50 rounded-xl p-3 col-span-2">
                <p className="text-[10px] font-bold text-amber-500/70 uppercase tracking-widest mb-1">Sub Category</p>
                <p className="text-sm font-semibold text-stone-800">{product.sub_category}</p>
              </div>
            )}
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Phone</p>
              <p className="text-sm font-semibold text-stone-800">{product.vendor_phone || '—'}</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-3">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Added</p>
              <p className="text-sm font-semibold text-stone-800">
                {new Date(product.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {product.rejection_reason && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Rejection Reason</p>
              <p className="text-sm text-red-700">{product.rejection_reason}</p>
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Description</p>
            {product.description ? (
              <div
                className="text-sm text-stone-600 leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-strong:text-stone-800"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            ) : (
              <p className="text-sm text-stone-400 italic">No description provided.</p>
            )}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-stone-100 shrink-0">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-stone-800 transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Status Modal ──
function EditStatusModal({
  product,
  onClose,
  onSubmit,
  isLoading,
}: {
  product: Product;
  onClose: () => void;
  onSubmit: (status: ProductStatus, reason?: string) => void;
  isLoading: boolean;
}) {
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [reason, setReason] = useState(product.rejection_reason || '');

  const statusOptions: { value: ProductStatus; label: string; color: string }[] = [
    { value: 'approved', label: 'Approved', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { value: 'pending',  label: 'Pending',  color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-50 border-red-200 text-red-700' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-black text-stone-900 tracking-tight">Edit Status</h2>
            <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{product.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors">
            <X size={15} className="text-stone-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Current status */}
          <div className="flex items-center gap-2">
            <p className="text-xs text-stone-400 font-medium">Current:</p>
            <Badge status={product.status} />
          </div>

          {/* Status selector */}
          <div>
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Change to</p>
            <div className="flex gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all duration-150 ${
                    status === opt.value
                      ? opt.color + ' ring-2 ring-offset-1 ' + (
                          opt.value === 'approved' ? 'ring-emerald-400' :
                          opt.value === 'pending'  ? 'ring-amber-400' : 'ring-red-400'
                        )
                      : 'bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reason — only for rejected */}
          {status === 'rejected' && (
            <div>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">Rejection Reason</p>
              <textarea
                className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 focus:bg-white outline-none text-sm text-stone-700 placeholder:text-stone-400 min-h-[80px] resize-none transition-all"
                placeholder="Reason for rejection…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-stone-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-semibold hover:bg-stone-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={isLoading || (status === 'rejected' && !reason.trim())}
            onClick={() => onSubmit(status, reason.trim() || undefined)}
            className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-bold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function Products() {
  const {
    pendingProducts,
    allProducts,
    isLoading,
    error,
    refetch,
    approveProduct,
    rejectProduct,
    deleteProduct,
    updateStatus,
    isProcessing,
  } = useProducts();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: 0, reason: '' });
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: 0, name: '' });

  const handleApprove = async (id: number) => {
    const res = await approveProduct(id);
    if (res.success) toast.success('Product approved!');
    else toast.error(res.message || 'Approval failed.');
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) { toast.error('Please provide a rejection reason.'); return; }
    const res = await rejectProduct(rejectModal.id, rejectModal.reason.trim());
    if (res?.success) {
      setRejectModal({ isOpen: false, id: 0, reason: '' });
      toast.success('Product rejected.');
    } else {
      toast.error(res?.message || 'Rejection failed.');
    }
  };

  const handleDeleteSubmit = async () => {
    const res = await deleteProduct(deleteModal.id);
    if (res.success) {
      setDeleteModal({ isOpen: false, id: 0, name: '' });
      toast.success('Product deleted.');
    } else {
      toast.error(res.message || 'Delete failed.');
    }
  };

  const handleEditSubmit = async (status: ProductStatus, reason?: string) => {
    if (!editProduct) return;
    setEditLoading(true);
    const res = await updateStatus(editProduct.id, status, reason);
    setEditLoading(false);
    if (res.success) {
      setEditProduct(null);
      toast.success('Status updated successfully!');
    } else {
      toast.error(res.message || 'Update failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-md shadow-amber-900/20">
            <Package size={18} className="text-stone-950" strokeWidth={2.5} />
          </div>
          <div className="w-5 h-5 border-2 border-stone-300 border-t-amber-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4">
        <div className="bg-white border border-red-100 rounded-3xl shadow-xl shadow-red-100/60 p-8 max-w-sm w-full text-center">
          <p className="text-stone-600 text-sm font-medium mb-5">{error.message}</p>
          <button onClick={refetch} className="group w-full flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-150">
            <RefreshCcw size={15} className="group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayProducts = activeTab === 'pending' ? pendingProducts : allProducts;

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {/* Header */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Products</h1>
          <p className="text-stone-400 text-sm mt-0.5 font-medium">
            {pendingProducts.length > 0 ? `${pendingProducts.length} pending review` : 'All caught up — no products pending.'}
          </p>
        </div>
        <button onClick={refetch} className="group shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:shadow-md text-sm font-semibold shadow-sm transition-all duration-200">
          <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          Refresh
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 bg-stone-100/80 p-1 rounded-2xl w-fit border border-stone-200/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">

  {/* All Products */}
  <button
    onClick={() => setActiveTab('all')}
    className={`
      relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
      transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2
      focus-visible:ring-amber-400/60 focus-visible:ring-offset-1
      ${activeTab === 'all'
        ? 'bg-white text-stone-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]'
        : 'text-stone-500 hover:text-stone-800 hover:bg-white/50'
      }
    `}
  >
    <Package size={14} strokeWidth={activeTab === 'all' ? 2.5 : 2} className="shrink-0" />
    <span>All Products</span>
    
  </button>

  {/* Pending Review */}
  <button
    onClick={() => setActiveTab('pending')}
    className={`
      relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
      transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2
      focus-visible:ring-amber-400/60 focus-visible:ring-offset-1
      ${activeTab === 'pending'
        ? 'bg-white text-stone-900 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]'
        : 'text-stone-500 hover:text-stone-800 hover:bg-white/50'
      }
    `}
  >
    <ClipboardList size={14} strokeWidth={activeTab === 'pending' ? 2.5 : 2} className="shrink-0" />
    <span>Pending Review</span>
    {pendingProducts.length > 0 && (
      <span className={`
        inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full
        text-[10px] font-black tabular-nums transition-all duration-200
        ${activeTab === 'pending'
          ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
          : 'bg-amber-100 text-amber-600'
        }
      `}>
        {pendingProducts.length}
      </span>
    )}
  </button>

</div>

      {/* Empty State */}
      {displayProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-14 text-center">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PackageSearch size={22} className="text-stone-400" strokeWidth={1.5} />
          </div>
          <p className="text-stone-500 text-sm font-semibold">
            {activeTab === 'pending' ? 'No products pending for review' : 'No products found'}
          </p>
          <p className="text-stone-400 text-xs mt-1">
            {activeTab === 'pending' ? 'New submissions from vendors will appear here.' : 'All products will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {displayProducts.map((product) => (
            <div key={product.id} className="group bg-white border border-stone-200/80 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md hover:border-amber-300/80 transition-all duration-200">
              <img src={product.image_url || '/placeholder.png'} alt={product.name} className="w-28 h-28 rounded-xl object-cover bg-stone-50 border border-stone-100 shrink-0" />

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-stone-900 line-clamp-1 leading-snug">{product.name}</h3>
                    <Badge status={product.status} />
                  </div>
                  <p className="text-xs text-stone-500 mt-1.5">
                    Vendor: <span className="font-semibold text-stone-700">{product.firm_name}</span>
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5 capitalize tracking-wide">
                    {product.category_name} · {product.sub_category}
                  </p>
                  {product.description && (
                    <p className="text-[11px] text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {stripHtml(product.description)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  {/* Details — always */}
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150"
                  >
                    <Eye size={13} strokeWidth={2} /> Details
                  </button>

                  {activeTab === 'pending' ? (
                    // Pending — Reject + Approve
                    <>
                      <button
                        disabled={isProcessing(product.id)}
                        onClick={() => setRejectModal({ isOpen: true, id: product.id, reason: '' })}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing(product.id) ? <Loader2 size={13} className="animate-spin" /> : <><X size={13} strokeWidth={2.5} /> Reject</>}
                      </button>
                      <button
                        disabled={isProcessing(product.id)}
                        onClick={() => handleApprove(product.id)}
                        className="flex-1 bg-emerald-500/25 text-emerald-600 hover:bg-emerald-700 hover:text-white py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing(product.id) ? <Loader2 size={13} className="animate-spin" /> : <><Check size={13} strokeWidth={2.5} /> Approve</>}
                      </button>
                    </>
                  ) : (
                    // All Products — Edit + Delete
                    <>
                      <button
                        disabled={isProcessing(product.id)}
                        onClick={() => setEditProduct(product)}
                        className="flex-1 bg-amber-50 text-amber-600 hover:bg-amber-100 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Pencil size={13} strokeWidth={2} /> Edit Status
                      </button>
                      <button
                        disabled={isProcessing(product.id)}
                        onClick={() => setDeleteModal({ isOpen: true, id: product.id, name: product.name })}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessing(product.id) ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} strokeWidth={2} /> Delete</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      <Modal isOpen={rejectModal.isOpen} title="Reject Product" onCancel={() => setRejectModal({ isOpen: false, id: 0, reason: '' })} onConfirm={handleRejectSubmit} confirmText="Reject" isDestructive>
        <textarea
          className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 focus:bg-white outline-none text-sm text-stone-700 placeholder:text-stone-400 min-h-[96px] resize-none transition-all"
          placeholder="Reason for rejection…"
          value={rejectModal.reason}
          onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={deleteModal.isOpen} title="Delete Product" onCancel={() => setDeleteModal({ isOpen: false, id: 0, name: '' })} onConfirm={handleDeleteSubmit} confirmText="Delete" isDestructive>
        <p className="text-sm text-stone-600 leading-relaxed">
          Are you sure you want to delete <span className="font-bold text-stone-900">"{deleteModal.name}"</span>? This action cannot be undone.
        </p>
      </Modal>

      {/* Detail Modal */}
      {selectedProduct && <DetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

      {/* Edit Status Modal */}
      {editProduct && (
        <EditStatusModal
          product={editProduct}
          onClose={() => setEditProduct(null)}
          onSubmit={handleEditSubmit}
          isLoading={editLoading}
        />
      )}
    </div>
  );
}