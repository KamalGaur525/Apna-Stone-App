import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Plus, Edit2, Trash2, FolderTree,
  Loader2, X, RefreshCcw, LayoutGrid, AlertCircle
} from 'lucide-react';
import Modal from '../components/Modal';
import { useCategories } from '../hooks/useCategories';

// ─── Constants ─────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 5;

export interface Category {
  id: number;
  name: string;
  parent_id: number | null;
}

type ModalMode = 'add' | 'edit' | 'delete' | null;

// ─── Pagination Component ──────────────────────────────────────────────────────
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-stone-100 bg-stone-50/40">
      <p className="text-xs text-stone-400 tabular-nums order-2 sm:order-1">
        Showing{' '}
        <span className="font-semibold text-stone-700">{start}–{end}</span>
        {' '}of{' '}
        <span className="font-semibold text-stone-700">{totalItems}</span>{' '}
        categories
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Categories() {
  const { categories, isLoading, error, refetch, addCategory, updateCategory, deleteCategory, isProcessing } = useCategories();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const mainCategories = useMemo(() => categories.filter(c => c.parent_id === null), [categories]);

  const getParentName = (parentId: number | null) => {
    if (!parentId) return null;
    return categories.find(c => c.id === parentId)?.name || 'Unknown Parent';
  };

  const filteredCategories = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const parentName = getParentName(c.parent_id);
      return c.name.toLowerCase().includes(q) || (parentName && parentName.toLowerCase().includes(q));
    });
  }, [categories, searchTerm]);

  // ── Pagination Logic ──
  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCategories = filteredCategories.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  // ─── HANDLERS ──────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setFormData({ name: '', isSubCategory: false, parent_id: '' });
    setSelectedCat(null);
    setModalMode('add');
  };

  const openEditModal = (cat: Category) => {
    setFormData({ name: cat.name, isSubCategory: cat.parent_id !== null, parent_id: cat.parent_id || '' });
    setSelectedCat(cat);
    setModalMode('edit');
  };

  const openDeleteModal = (cat: Category) => {
    setSelectedCat(cat);
    setModalMode('delete');
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalMode(null);
    setSelectedCat(null);
  };

  const [formData, setFormData] = useState({
    name: '',
    isSubCategory: false,
    parent_id: '' as string | number,
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || formData.name.trim().length < 2) return toast.error('Category name must be at least 2 characters');
    
    setIsSubmitting(true);
    try {
      let res;
      if (modalMode === 'add') {
        if (formData.isSubCategory && !formData.parent_id) {
          toast.error('Please select a parent category');
          setIsSubmitting(false);
          return;
        }
        res = await addCategory({
          name: formData.name.trim(),
          parent_id: formData.isSubCategory ? Number(formData.parent_id) : null,
        });
      } else if (modalMode === 'edit' && selectedCat) {
        res = await updateCategory(selectedCat.id, { name: formData.name.trim() });
      }

      if (res?.success) {
        toast.success(`Category ${modalMode === 'add' ? 'added' : 'updated'} successfully!`);
        closeModal();
      } else {
        toast.error(res?.message || 'Operation failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCat) return;
    setIsSubmitting(true);
    try {
      const res = await deleteCategory(selectedCat.id);
      if (res.success) {
        toast.success('Category deleted successfully!');
        closeModal();
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="animate-spin text-amber-500" size={32} />
        <p className="text-sm font-semibold text-stone-600">Loading Categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle size={32} className="text-red-500 mb-3" />
        <p className="text-sm font-bold text-red-700">Failed to load content</p>
        <p className="text-xs text-red-500 mb-5">{error.message}</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Content Management</h1>
          <p className="text-sm text-stone-500">Manage categories and sub-categories.</p>
        </div>
        <button onClick={openAddModal} className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 text-white rounded-xl font-bold hover:bg-amber-600 transition-all">
          <Plus size={18} /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-2 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-transparent text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => handleSearchChange('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Category Name</th>
                <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">Hierarchy</th>
                <th className="px-6 py-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-16 text-center">
                    <LayoutGrid size={32} className="mx-auto text-stone-300 mb-3" />
                    <p className="text-sm font-semibold text-stone-600">No categories found</p>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-stone-900">{cat.name}</td>
                    <td className="px-6 py-4">
                      {cat.parent_id === null ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-100 text-stone-600 text-xs font-bold">
                          <FolderTree size={12} /> Main Category
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                          Sub of: {getParentName(cat.parent_id)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(cat)} className="p-2 text-stone-400 hover:text-amber-600 transition-colors bg-stone-50 hover:bg-amber-50 rounded-lg"><Edit2 size={15} /></button>
                        <button onClick={() => openDeleteModal(cat)} className="p-2 text-stone-400 hover:text-red-600 transition-colors bg-stone-50 hover:bg-red-50 rounded-lg"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination logic applied here */}
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredCategories.length}
          itemsOnPage={paginatedCategories.length}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPage={(p) => setCurrentPage(p)}
        />
      </div>

      {/* Modals */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <Modal
          isOpen
          title={modalMode === 'add' ? 'Add New Category' : 'Edit Category'}
          onCancel={closeModal}
          onConfirm={handleSubmit}
          confirmText={modalMode === 'add' ? 'Create' : 'Save'}
          isConfirmLoading={isSubmitting}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {modalMode === 'add' && (
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Level</label>
                <div className="flex bg-stone-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setFormData({ ...formData, isSubCategory: false, parent_id: '' })} className={`flex-1 py-2 text-sm font-bold rounded-lg ${!formData.isSubCategory ? 'bg-white shadow-sm' : 'text-stone-500'}`}>Main</button>
                  <button type="button" onClick={() => setFormData({ ...formData, isSubCategory: true })} className={`flex-1 py-2 text-sm font-bold rounded-lg ${formData.isSubCategory ? 'bg-white shadow-sm' : 'text-stone-500'}`}>Sub Category</button>
                </div>
              </div>
            )}

            {formData.isSubCategory && modalMode === 'add' && (
              <div>
                <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Parent Category</label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500/20"
                >
                  <option value="" disabled>Select Parent</option>
                  {mainCategories.map(main => <option key={main.id} value={main.id}>{main.name}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-500 uppercase mb-2">Name</label>
              <input
                autoFocus
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-amber-500/20 outline-none"
                placeholder="Category Name"
              />
            </div>
            <button type="submit" className="hidden" />
          </form>
        </Modal>
      )}

      {modalMode === 'delete' && selectedCat && (
        <Modal
          isOpen
          title="Delete Category"
          onCancel={closeModal}
          onConfirm={handleDelete}
          confirmText="Delete"
          isDestructive
          isConfirmLoading={isSubmitting}
        >
          <p>Are you sure you want to delete <b>{selectedCat.name}</b>?</p>
        </Modal>
      )}
    </div>
  );
}