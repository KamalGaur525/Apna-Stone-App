import { useState } from 'react';
import toast from 'react-hot-toast';  
import { useProducts } from '../hooks/useProducts';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { Check, X, Eye, Loader2, PackageSearch, RefreshCcw } from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-amber-500" size={40} />
      </div>
    );
  }

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">Pending Reviews</h1>

      {products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-stone-300">
          <PackageSearch className="mx-auto text-stone-300 mb-4" size={48} />
          <p className="text-stone-500 font-medium">No products pending for review!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-stone-200 rounded-3xl p-5 flex gap-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <img
                src={product.image_url || '/placeholder.png'}
                alt={product.name}
                className="w-32 h-32 rounded-2xl object-cover bg-stone-50 border border-stone-100 shrink-0"
              />

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-lg text-stone-900 line-clamp-1">
                      {product.name}
                    </h3>
                    <Badge status="pending" />
                  </div>
                  <p className="text-sm text-stone-500 mt-1">
                    Vendor:{' '}
                    <span className="font-medium text-stone-700">{product.firm_name}</span>
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5 capitalize">
                    {product.category_id} • {product.sub_category}
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 bg-stone-100 text-stone-700 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors"
                  >
                    <Eye size={16} /> Details
                  </button>

                  <button
                    disabled={isProcessing(product.id)}
                    onClick={() =>
                      setRejectModal({ isOpen: true, id: product.id, reason: '' })
                    }
                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    {isProcessing(product.id) ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <><X size={16} /> Reject</>
                    )}
                  </button>

                  <button
                    disabled={isProcessing(product.id)}
                    onClick={() => handleApprove(product.id)}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isProcessing(product.id) ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <><Check size={16} /> Approve</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      <Modal
        isOpen={rejectModal.isOpen}
        title="Reject Product"
        onCancel={() => setRejectModal({ isOpen: false, id: 0, reason: '' })}
        onConfirm={handleRejectSubmit}
        confirmText="Reject"
        isDestructive
      >
        <textarea
          className="w-full p-4 rounded-xl border border-stone-200 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm min-h-[100px] resize-none"
          placeholder="Reason for rejection (e.g., Blur images, incorrect category...)"
          value={rejectModal.reason}
          onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
        />
      </Modal>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          title="Product Details"
          onCancel={() => setSelectedProduct(null)}
          onConfirm={() => setSelectedProduct(null)}
          confirmText="Close"
          isDestructive={false}
        >
          <div className="space-y-4">
            <img
              src={selectedProduct.image_url || '/placeholder.png'}
              alt={selectedProduct.name}
              className="w-full h-48 object-cover rounded-xl border border-stone-100"
            />
            <p className="text-sm text-stone-600 leading-relaxed">
              {selectedProduct.description || 'No description provided.'}
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}