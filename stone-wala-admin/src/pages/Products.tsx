import { useState } from 'react';
import toast from 'react-hot-toast';
import { useProducts } from '../hooks/useProducts';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Check, X, Eye, Loader2, PackageSearch, RefreshCcw, Package } from 'lucide-react';
import type { Product } from '../types';

export default function Products() {
  const {
    products,
    isLoading,
    error,
    refetch,
    approveProduct,
    rejectProduct,
    isProcessing,
  } = useProducts();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectModal, setRejectModal] = useState({ isOpen: false, id: 0, reason: '' });

  const handleApprove = async (id: number) => {
    const res = await approveProduct(id);
    if (res.success) toast.success('Product approved successfully!');
    else toast.error(res.message || 'Approval failed.');
  };

  const handleRejectSubmit = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error('Please provide a rejection reason.');
      return;
    }
    const res = await rejectProduct(rejectModal.id, rejectModal.reason.trim());
    if (res?.success) {
      setRejectModal({ isOpen: false, id: 0, reason: '' });
      toast.success('Product rejected.');
    } else {
      toast.error(res?.message || 'Rejection failed.');
    }
  };

  // ── Loading ──
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

  // ── Error ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4">
        <div className="bg-white border border-red-100 rounded-3xl shadow-xl shadow-red-100/60 p-8 max-w-sm w-full text-center">
          <p className="text-stone-600 text-sm font-medium mb-5">{error.message}</p>
          <button
            onClick={refetch}
            className="group w-full flex items-center justify-center gap-2 px-5 py-3 bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white rounded-xl text-sm font-semibold shadow-md transition-all duration-150"
          >
            <RefreshCcw size={15} className="group-hover:rotate-180 transition-transform duration-500" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">

      {/* ── Header ── */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Pending Reviews
          </h1>
          <p className="text-stone-400 text-sm mt-0.5 font-medium">
            {products.length === 0
              ? 'All caught up — no products pending.'
              : `${products.length} product${products.length !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>

        <button
          onClick={refetch}
          aria-label="Refresh products"
          className="group shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-500 hover:text-stone-900 hover:border-stone-300 hover:shadow-md text-sm font-semibold shadow-sm transition-all duration-200"
        >
          <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
          Refresh
        </button>
      </header>

      {/* ── Empty State ── */}
      {products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-14 text-center">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <PackageSearch size={22} className="text-stone-400" strokeWidth={1.5} />
          </div>
          <p className="text-stone-500 text-sm font-semibold">No products pending for review</p>
          <p className="text-stone-400 text-xs mt-1">New submissions from vendors will appear here.</p>
        </div>
      ) : (
        // ── Product Grid ──
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white border border-stone-200/80 rounded-2xl p-4 flex gap-4 shadow-sm hover:shadow-md hover:border-stone-300/80 transition-all duration-200"
            >
              {/* Thumbnail */}
              <img
                src={product.image_url || '/placeholder.png'}
                alt={product.name}
                className="w-28 h-28 rounded-xl object-cover bg-stone-50 border border-stone-100 shrink-0"
              />

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm text-stone-900 line-clamp-1 leading-snug">
                      {product.name}
                    </h3>
                    <Badge status="pending" />
                  </div>

                  <p className="text-xs text-stone-500 mt-1.5">
                    Vendor:{' '}
                    <span className="font-semibold text-stone-700">{product.firm_name}</span>
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5 capitalize tracking-wide">
                    {product.category_id} · {product.sub_category}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150"
                  >
                    <Eye size={13} strokeWidth={2} />
                    Details
                  </button>

                  <button
                    disabled={isProcessing(product.id)}
                    onClick={() => setRejectModal({ isOpen: true, id: product.id, reason: '' })}
                    className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing(product.id) ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <><X size={13} strokeWidth={2.5} /> Reject</>
                    )}
                  </button>

                  <button
                    disabled={isProcessing(product.id)}
                    onClick={() => handleApprove(product.id)}
                    className="flex-1 bg-emerald-500/25 text-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:text-white hover:text-white  py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-700/20"
                  >
                    {isProcessing(product.id) ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <><Check size={13} strokeWidth={2.5} /> Approve</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Rejection Modal ── */}
      <Modal
        isOpen={rejectModal.isOpen}
        title="Reject Product"
        onCancel={() => setRejectModal({ isOpen: false, id: 0, reason: '' })}
        onConfirm={handleRejectSubmit}
        confirmText="Reject"
        isDestructive
      >
        <textarea
          className="w-full p-3.5 rounded-xl border border-stone-200 bg-stone-50 focus:ring-2 focus:ring-red-500/20 focus:border-red-400 focus:bg-white outline-none text-sm text-stone-700 placeholder:text-stone-400 min-h-[96px] resize-none transition-all duration-150"
          placeholder="Reason for rejection (e.g. blurry images, incorrect category…)"
          value={rejectModal.reason}
          onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
        />
      </Modal>

      {/* ── Detail Modal ── */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          title="Product Details"
          onCancel={() => setSelectedProduct(null)}
          onConfirm={() => setSelectedProduct(null)}
          confirmText="Close"
          isDestructive={false}
        >
          <div className="space-y-3">
            <img
              src={selectedProduct.image_url || '/placeholder.png'}
              alt={selectedProduct.name}
              className="w-full h-44 object-cover rounded-xl border border-stone-100 bg-stone-50"
            />
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                Description
              </p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {selectedProduct.description || 'No description provided.'}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}