import { useState, useRef, useMemo } from 'react';
import type { ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import {
  Briefcase, Plus, Edit2, Trash2, Loader2, RefreshCcw, AlertCircle, 
  Phone, Image as ImageIcon, X, Search
} from 'lucide-react';
import Modal from '../components/Modal';
import { useServices, type ServiceProvider } from '../hooks/useServices';

// ─── Constants ─────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 6; // Ek page par kitni categories dikhani hain

type ModalMode = 'addType' | 'addProvider' | 'editProvider' | 'deleteType' | 'deleteProvider' | null;

const getMediaUrl = (path?: string | null) => {
  if (!path) return '/placeholder.png'; 
  if (path.startsWith('http')) return path; 
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `http://localhost:5000${cleanPath}`; 
};

// ─── Pagination Component ──────────────────────────────────────────────────────
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-stone-600/20 bg-white rounded-2xl mt-6">
      <p className="text-xs text-stone-400 tabular-nums order-2 sm:order-1">
        Showing <span className="font-semibold text-stone-700">{start}–{end}</span> of <span className="font-semibold text-stone-700">{totalItems}</span> groups
      </p>
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button onClick={onPrev} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-600 disabled:opacity-40 transition-all shadow-sm">← Prev</button>
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) => p === '...' ? <span key={i} className="px-1 text-xs text-stone-400">…</span> : (
            <button key={p} onClick={() => onPage(p as number)} className={`w-8 h-8 rounded-lg text-xs font-semibold ${p === currentPage ? 'bg-stone-900 text-white shadow-sm' : 'bg-white border border-stone-200 text-stone-600'}`}>{p}</button>
          ))}
        </div>
        <button onClick={onNext} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-stone-200 text-stone-600 disabled:opacity-40 transition-all shadow-sm">Next →</button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Services() {
  const {
    types, groupedProviders, isLoading, error, refetch,
    addServiceType, deleteServiceType, addProvider, updateProvider, deleteProvider, isProcessing
  } = useServices();

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selection States
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [selectedTypeName, setSelectedTypeName] = useState(''); 

  // Form States
  const [typeName, setTypeName] = useState('');
  const [providerForm, setProviderForm] = useState({ name: '', phone: '', description: '', service_type_id: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Search Logic ---
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return groupedProviders;
    return groupedProviders.filter(group => 
      group.type_name.toLowerCase().includes(q) || 
      group.providers.some(p => p.name.toLowerCase().includes(q) || p.phone.includes(q))
    );
  }, [groupedProviders, searchTerm]);

  // --- Pagination Logic ---
  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  // --- Handlers ---
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

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-amber-500" size={32} /></div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle size={32} className="text-red-500 mb-3" />
      <p className="text-red-700 font-bold">Failed to load services</p>
      <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Industry Services</h1>
          <p className="text-sm text-stone-400 mt-0.5">Manage service categories and providers.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text"
              placeholder="Search category, name or phone..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500/20 text-sm outline-none"
            />
          </div>

          <button onClick={() => setModalMode('addType')} className="px-4 py-2 bg-stone-800 text-white rounded-xl font-bold hover:bg-stone-950 transition-all text-sm">
            + Category
          </button>
          <button onClick={() => setModalMode('addProvider')} className="px-4 py-2 bg-amber-400 text-white rounded-xl font-bold hover:bg-amber-500 transition-all shadow-sm text-sm">
            + Provider
          </button>
        </div>
      </div>

      {/* Content Grid */}
      {paginatedData.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-stone-300">
          <Briefcase size={40} className="mx-auto text-stone-300 mb-3" />
          <p className="font-semibold text-stone-600">{searchTerm ? 'No results found' : 'No services found.'}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {paginatedData.map((group) => (
              <div key={group.type_id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="bg-stone-50 border-b border-stone-100 p-4 px-5 flex items-center justify-between">
                  <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2">
                    <Briefcase size={18} className="text-amber-500" />
                    {group.type_name}
                  </h3>
                  <button onClick={() => { setSelectedTypeId(group.type_id); setSelectedTypeName(group.type_name); setModalMode('deleteType'); }} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                </div>
                <div className="p-2">
                  {group.providers.length === 0 ? ( <p className="text-center text-sm text-stone-400 py-6">No providers.</p> ) : (
                    <ul className="divide-y divide-stone-100">
                      {group.providers.map(provider => (
                        <li key={provider.id} className="p-3 hover:bg-stone-50/50 rounded-xl transition-colors flex items-start gap-4">
                          <img src={getMediaUrl(provider.photo_url)} alt={provider.name} className="w-14 h-14 rounded-xl object-cover border border-stone-200 bg-stone-100 shrink-0" onError={(e) => (e.target as HTMLImageElement).src = '/placeholder.png'} />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-stone-900 truncate">{provider.name}</h4>
                            <p className="text-sm text-stone-500 flex items-center gap-1 mt-0.5"><Phone size={12}/> {provider.phone}</p>
                            {provider.description && <p className="text-xs text-stone-400 mt-1 line-clamp-1">{provider.description}</p>}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button onClick={() => { 
                              setProviderForm({ name: provider.name, phone: provider.phone, description: provider.description || '', service_type_id: group.type_id.toString() });
                              setImagePreview(getMediaUrl(provider.photo_url)); setSelectedProvider(provider); setModalMode('editProvider');
                            }} className="p-1.5 text-stone-400 hover:text-amber-600 bg-stone-50 rounded-lg"><Edit2 size={14}/></button>
                            <button onClick={() => { setSelectedProvider(provider); setModalMode('deleteProvider'); }} className="p-1.5 text-stone-400 hover:text-red-600 bg-stone-50 rounded-lg"><Trash2 size={14}/></button>
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
            currentPage={safePage} totalPages={totalPages} totalItems={filteredData.length} itemsOnPage={paginatedData.length}
            onPrev={() => setCurrentPage(p => Math.max(1, p - 1))}
            onNext={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            onPage={p => setCurrentPage(p)}
          />
        </>
      )}

      {/* --- Modals --- */}
      {modalMode === 'addType' && (
        <Modal isOpen title="Add Service Category" onCancel={closeModal} onConfirm={handleAddType} confirmText="Add Category" isConfirmLoading={isSubmitting}>
          <form onSubmit={handleAddType}>
            <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Category Name</label>
            <input autoFocus type="text" value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="e.g., Transportation, Polishing..." className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500/20 outline-none" />
          </form>
        </Modal>
      )}

      {(modalMode === 'addProvider' || modalMode === 'editProvider') && (
        <Modal isOpen title={modalMode === 'addProvider' ? 'Add Provider' : 'Edit Provider'} onCancel={closeModal} onConfirm={handleSaveProvider} confirmText="Save" isConfirmLoading={isSubmitting}>
          <form onSubmit={handleSaveProvider} className="space-y-4">
            <div className="flex gap-4">
              <div className="shrink-0 flex flex-col items-center">
                <div onClick={() => fileInputRef.current?.click()} className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone-300 flex items-center justify-center bg-stone-50 overflow-hidden cursor-pointer relative group">
                  {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="Preview"/> : <ImageIcon className="text-stone-400" />}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16} className="text-white"/></div>
                </div>
                <span className="text-[10px] font-bold text-stone-400 mt-2 uppercase">Photo</span>
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              <div className="flex-1 space-y-4">
                <select value={providerForm.service_type_id} onChange={(e) => setProviderForm({...providerForm, service_type_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border text-sm outline-none bg-white">
                  <option value="" disabled>Select Category</option>
                  {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <input type="text" value={providerForm.name} onChange={(e) => setProviderForm({...providerForm, name: e.target.value})} placeholder="Provider Name" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" />
              </div>
            </div>
            <input type="tel" value={providerForm.phone} onChange={(e) => setProviderForm({...providerForm, phone: e.target.value})} placeholder="Phone Number" className="w-full px-3 py-2 rounded-lg border text-sm outline-none" />
            <textarea value={providerForm.description} onChange={(e) => setProviderForm({...providerForm, description: e.target.value})} placeholder="Details..." className="w-full px-3 py-2 rounded-lg border text-sm resize-none h-20 outline-none" />
          </form>
        </Modal>
      )}

      {(modalMode === 'deleteType' || modalMode === 'deleteProvider') && (
        <Modal isOpen title="Confirm Deletion" onCancel={closeModal} onConfirm={handleDeleteConfirm} confirmText="Delete Forever" isDestructive isConfirmLoading={isSubmitting}>
          {modalMode === 'deleteType' ? (
            <p className="text-sm">Delete category <b className="text-stone-900">{selectedTypeName}</b> permanently?</p>
          ) : (
            <p className="text-sm">Delete provider <b className="text-stone-900">{selectedProvider?.name}</b> permanently?</p>
          )}
        </Modal>
      )}
    </div>
  );
}