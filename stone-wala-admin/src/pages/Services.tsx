import { useState, useRef, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import {
  Briefcase, Plus, Edit2, Trash2, Loader2, RefreshCcw, AlertCircle,
  Phone, Image as ImageIcon, X, Search, ChevronLeft, ChevronRight, Layers
} from 'lucide-react';
import Modal from '../components/Modal';
import { useServices, type ServiceProvider } from '../hooks/useServices';

// ─── Constants ──────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 6;

type ModalMode = 'addType' | 'addProvider' | 'editProvider' | 'deleteType' | 'deleteProvider' | null;

const getMediaUrl = (path?: string | null) => {
  if (!path) return '/placeholder.png';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `http://localhost:5000${cleanPath}`;
};

// ─── Pagination ─────────────────────────────────────────────────────────────────
function Pagination({
  currentPage, totalPages, totalItems, itemsOnPage, onPrev, onNext, onPage,
}: {
  currentPage: number; totalPages: number; totalItems: number; itemsOnPage: number;
  onPrev: () => void; onNext: () => void; onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = start + itemsOnPage - 1;

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-2xl mt-6 shadow-sm">
      <p className="text-xs text-slate-400 tabular-nums order-2 sm:order-1 tracking-wide">
        Showing{' '}
        <span className="font-semibold text-slate-700">{start}–{end}</span>{' '}
        of{' '}
        <span className="font-semibold text-slate-700">{totalItems}</span>{' '}
        groups
      </p>
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        >
          <ChevronLeft size={13} /> Prev
        </button>
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={i} className="w-8 text-center text-xs text-slate-300 select-none">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  p === currentPage
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>
        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function Services() {
  const {
    types, groupedProviders, isLoading, error, refetch,
    addServiceType, deleteServiceType, addProvider, updateProvider, deleteProvider, isProcessing,
  } = useServices();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [selectedTypeName, setSelectedTypeName] = useState('');

  const [typeName, setTypeName] = useState('');
  const [providerForm, setProviderForm] = useState({ name: '', phone: '', description: '', service_type_id: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return groupedProviders;
    return groupedProviders.filter(group =>
      group.type_name.toLowerCase().includes(q) ||
      group.providers.some(p => p.name.toLowerCase().includes(q) || p.phone.includes(q))
    );
  }, [groupedProviders, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const closeModal = () => {
    if (isSubmitting) return;
    setModalMode(null);
    setTypeName('');
    setProviderForm({ name: '', phone: '', description: '', service_type_id: '' });
    setImageFile(null);
    setImagePreview(null);
    setSelectedProvider(null);
    setSelectedTypeId(null);
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddType = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!typeName.trim()) return toast.error('Service type name is required');
    setIsSubmitting(true);
    const res = await addServiceType(typeName);
    setIsSubmitting(false);
    if (res.success) { toast.success('Added successfully'); closeModal(); }
    else toast.error(res.message);
  };

  const handleSaveProvider = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!providerForm.service_type_id) return toast.error('Select a service category');
    if (!providerForm.name.trim() || !providerForm.phone.trim()) return toast.error('Name and Phone are required');

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('service_type_id', providerForm.service_type_id);
    formData.append('name', providerForm.name.trim());
    formData.append('phone', providerForm.phone.trim());
    if (providerForm.description) formData.append('description', providerForm.description.trim());
    if (imageFile) formData.append('image', imageFile);

    let res;
    if (modalMode === 'addProvider') res = await addProvider(formData);
    else if (modalMode === 'editProvider' && selectedProvider) res = await updateProvider(selectedProvider.id, formData);

    setIsSubmitting(false);
    if (res?.success) { toast.success('Saved successfully'); closeModal(); }
    else toast.error(res?.message || 'Operation failed');
  };

  const handleDeleteConfirm = async () => {
    setIsSubmitting(true);
    let res;
    if (modalMode === 'deleteType' && selectedTypeId) res = await deleteServiceType(selectedTypeId);
    else if (modalMode === 'deleteProvider' && selectedProvider) res = await deleteProvider(selectedProvider.id);
    setIsSubmitting(false);
    if (res?.success) { toast.success('Deleted successfully'); closeModal(); }
    else toast.error(res?.message || 'Delete failed');
  };

  // ─── Loading State ────────────────────────────────────────────────────────────
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <Loader2 className="animate-spin text-amber-500" size={28} />
      <p className="text-sm text-slate-400 font-medium tracking-wide">Loading services…</p>
    </div>
  );

  // ─── Error State ──────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <div>
        <p className="font-semibold text-slate-800 text-sm">Failed to load services</p>
        <p className="text-xs text-slate-400 mt-1">Something went wrong on our end.</p>
      </div>
      <button
        onClick={() => refetch()}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 active:scale-95 transition-all duration-150 shadow-sm"
      >
        <RefreshCcw size={13} /> Try again
      </button>
    </div>
  );

  // ─── Main Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-7 animate-in fade-in duration-500">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <Layers size={15} className="text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Industry Services</h1>
          </div>
          <p className="text-sm text-slate-400 pl-0.5">
            Manage service categories and their assigned providers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-64 group">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors duration-150"
            />
            <input
              type="text"
              placeholder="Search by name, category, phone…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/50 transition-all duration-200 shadow-sm"
            />
          </div>

          {/* Add Category */}
          <button
            onClick={() => setModalMode('addType')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all duration-150 shadow-sm"
          >
            <Plus size={14} />
            Category
          </button>

          {/* Add Provider */}
          <button
            onClick={() => setModalMode('addProvider')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-400 text-white rounded-xl font-semibold text-sm hover:bg-amber-500 active:scale-95 transition-all duration-150 shadow-sm shadow-amber-200"
          >
            <Plus size={14} />
            Provider
          </button>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {paginatedData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
            <Briefcase size={22} className="text-slate-300" />
          </div>
          <div>
            <p className="font-semibold text-slate-600 text-sm">
              {searchTerm ? 'No results found' : 'No services yet'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {searchTerm ? 'Try a different search term.' : 'Add a category to get started.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {paginatedData.map((group) => (
              <div
                key={group.type_id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md hover:border-slate-300/60 transition-all duration-200"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                      <Briefcase size={13} className="text-amber-500" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight">{group.type_name}</h3>
                    <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-semibold">
                      {group.providers.length} {group.providers.length === 1 ? 'provider' : 'providers'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTypeId(group.type_id);
                      setSelectedTypeName(group.type_name);
                      setModalMode('deleteType');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all duration-150"
                    title="Delete category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Provider List */}
                <div className="p-3">
                  {group.providers.length === 0 ? (
                    <div className="flex flex-col items-center py-4 gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center">
                        <Plus size={14} className="text-slate-300" />
                      </div>
                      <p className="text-xs text-slate-400">No providers in this category</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100/80">
                      {group.providers.map((provider) => (
                        <li
                          key={provider.id}
                          className="flex items-start gap-3.5 p-3 rounded-xl hover:bg-slate-50/70 transition-colors duration-150 group/item"
                        >
                          {/* Avatar */}
                          <div className="relative shrink-0">
                            <img
                              src={getMediaUrl(provider.photo_url)}
                              alt={provider.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shadow-sm"
                              onError={(e) => ((e.target as HTMLImageElement).src = '/placeholder.png')}
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0 py-0.5">
                            <h4 className="font-semibold text-slate-900 text-sm truncate leading-snug">
                              {provider.name}
                            </h4>
                            <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                              <Phone size={10} className="text-slate-400 shrink-0" />
                              <span className="tabular-nums">{provider.phone}</span>
                            </p>
                            {provider.description && (
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 leading-relaxed">
                                {provider.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-150">
                            <button
                              onClick={() => {
                                setProviderForm({
                                  name: provider.name,
                                  phone: provider.phone,
                                  description: provider.description || '',
                                  service_type_id: group.type_id.toString(),
                                });
                                setImagePreview(getMediaUrl(provider.photo_url));
                                setSelectedProvider(provider);
                                setModalMode('editProvider');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 active:scale-90 transition-all duration-150"
                              title="Edit provider"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => { setSelectedProvider(provider); setModalMode('deleteProvider'); }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all duration-150"
                              title="Delete provider"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filteredData.length}
            itemsOnPage={paginatedData.length}
            onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
            onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            onPage={p => setCurrentPage(p)}
          />
        </>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      {/* Add Service Type */}
      {modalMode === 'addType' && (
        <Modal
          isOpen
          title="Add Service Category"
          onCancel={closeModal}
          onConfirm={handleAddType}
          confirmText="Add Category"
          isConfirmLoading={isSubmitting}
        >
          <form onSubmit={handleAddType} className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Category Name
            </label>
            <input
              autoFocus
              type="text"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              placeholder="e.g., Transportation, Polishing…"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/60 focus:bg-white transition-all duration-200"
            />
          </form>
        </Modal>
      )}

      {/* Add / Edit Provider */}
      {(modalMode === 'addProvider' || modalMode === 'editProvider') && (
        <Modal
          isOpen
          title={modalMode === 'addProvider' ? 'Add Provider' : 'Edit Provider'}
          onCancel={closeModal}
          onConfirm={handleSaveProvider}
          confirmText="Save Provider"
          isConfirmLoading={isSubmitting}
        >
          <form onSubmit={handleSaveProvider} className="space-y-4">
            {/* Photo + top fields row */}
            <div className="flex gap-4">
              {/* Photo Uploader */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-[72px] h-[72px] rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden hover:border-amber-400 hover:bg-amber-50/50 group transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <ImageIcon size={20} className="text-slate-300 group-hover:text-amber-400 transition-colors duration-200" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl">
                    <Edit2 size={14} className="text-white" />
                  </div>
                </button>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Photo</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Category + Name */}
              <div className="flex-1 space-y-3">
                <select
                  value={providerForm.service_type_id}
                  onChange={(e) => setProviderForm({ ...providerForm, service_type_id: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/60 focus:bg-white appearance-none transition-all duration-200"
                >
                  <option value="" disabled>Select category…</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input
                  type="text"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm({ ...providerForm, name: e.target.value })}
                  placeholder="Provider name"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/60 focus:bg-white transition-all duration-200"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="relative">
              <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                value={providerForm.phone}
                onChange={(e) => setProviderForm({ ...providerForm, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/60 focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Description */}
            <textarea
              value={providerForm.description}
              onChange={(e) => setProviderForm({ ...providerForm, description: e.target.value })}
              placeholder="Brief description (optional)…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400/60 focus:bg-white resize-none h-20 transition-all duration-200"
            />
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {(modalMode === 'deleteType' || modalMode === 'deleteProvider') && (
        <Modal
          isOpen
          title="Confirm Deletion"
          onCancel={closeModal}
          onConfirm={handleDeleteConfirm}
          confirmText="Delete Forever"
          isDestructive
          isConfirmLoading={isSubmitting}
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <Trash2 size={16} className="text-red-500" />
            </div>
            <div>
              {modalMode === 'deleteType' ? (
                <p className="text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete the{' '}
                  <span className="font-semibold text-slate-900">{selectedTypeName}</span>{' '}
                  category? This action cannot be undone.
                </p>
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-semibold text-slate-900">{selectedProvider?.name}</span>?{' '}
                  This action cannot be undone.
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}