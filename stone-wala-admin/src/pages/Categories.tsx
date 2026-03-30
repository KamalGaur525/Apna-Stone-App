import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Search, Plus, Edit2, Trash2, FolderTree,
  Loader2, X, LayoutGrid, AlertCircle, ChevronLeft, ChevronRight, Layers
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-stone-100/80">
      <p className="text-xs text-stone-400 tabular-nums order-2 sm:order-1 tracking-wide">
        Showing{' '}
        <span className="font-semibold text-stone-600">{start}–{end}</span>
        {' '}of{' '}
        <span className="font-semibold text-stone-600">{totalItems}</span>
        {' '}categories
      </p>

      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        <button
          onClick={onPrev}
          disabled={currentPage === 1}
          aria-label="Previous page"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-800 hover:border-stone-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <ChevronLeft size={14} />
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`el-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-stone-400 select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p as number)}
                aria-label={`Go to page ${p}`}
                aria-current={p === currentPage ? 'page' : undefined}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 ${
                  p === currentPage
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-500 hover:bg-stone-50 hover:text-stone-800 hover:border-stone-300 shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Mobile page indicator */}
        <span className="sm:hidden text-xs font-medium text-stone-500 px-2">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={onNext}
          disabled={currentPage === totalPages}
          aria-label="Next page"
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-800 hover:border-stone-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
        >
          <ChevronRight size={14} />
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

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full border-2 border-stone-100" />
          <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-t-amber-500 animate-spin" />
        </div>
        <p className="text-sm font-medium text-stone-500 tracking-wide">Loading categories…</p>
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertCircle size={22} className="text-red-500" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-stone-800">Something went wrong</p>
          <p className="text-xs text-stone-400 max-w-xs">{error.message}</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-700 active:scale-95 transition-all duration-150"
        >
          Try again
        </button>
      </div>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────
  return (
    <section className="space-y-6 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Content Management</h1>
          <p className="text-sm text-stone-400">Organize your categories and sub-categories.</p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-400 text-white rounded-xl text-sm font-semibold hover:bg-amber-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 transition-all duration-150 shadow-sm shadow-amber-200 self-start sm:self-auto"
        >
          <Plus size={15} strokeWidth={2.5} />
          Add Category
        </button>
      </div>

      {/* ── Stats Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          {
            label: 'Total',
            value: categories.length,
            icon: <LayoutGrid size={14} />,
            accent: 'text-stone-700',
            bg: 'bg-stone-50',
            border: 'border-stone-200',
          },
          {
            label: 'Main',
            value: mainCategories.length,
            icon: <FolderTree size={14} />,
            accent: 'text-amber-700',
            bg: 'bg-amber-50',
            border: 'border-amber-100',
          },
          {
            label: 'Sub',
            value: categories.length - mainCategories.length,
            icon: <Layers size={14} />,
            accent: 'text-blue-700',
            bg: 'bg-blue-50',
            border: 'border-blue-100',
          },
        ].map(({ label, value, icon, accent, bg, border }) => (
          <div
            key={label}
            className={`${bg} ${border} border  rounded-xl px-4 py-3 flex items-center justify-between gap-3 last:col-span-2 sm:last:col-span-1`}
          >
            <div>
              <p className="text-xs text-stone-600 font-medium tracking-wide">{label}</p>
              <p className={`text-lg font-bold ${accent} tabular-nums leading-tight`}>{value}</p>
            </div>
            <div className={`${accent} opacity-60`}>{icon}</div>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <input
          type="search"
          placeholder="Search by name or parent…"
          aria-label="Search categories"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
        />
        {searchTerm && (
          <button
            onClick={() => handleSearchChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors duration-150"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="px-6 py-3.5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.08em] w-1/2">
                  Name
                </th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.08em]">
                  Hierarchy
                </th>
                <th className="px-6 py-3.5 text-[10px] font-bold text-stone-400 uppercase tracking-[0.08em] text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-stone-50 border border-stone-100 flex items-center justify-center">
                        <LayoutGrid size={18} className="text-stone-300" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-stone-700">
                          {searchTerm ? 'No results found' : 'No categories yet'}
                        </p>
                        <p className="text-xs text-stone-400">
                          {searchTerm ? `Nothing matched "${searchTerm}"` : 'Add your first category to get started.'}
                        </p>
                      </div>
                      {searchTerm && (
                        <button
                          onClick={() => handleSearchChange('')}
                          className="text-xs font-medium text-amber-600 hover:text-amber-700 underline-offset-2 hover:underline transition-colors"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((cat) => (
                  <tr key={cat.id} className="group hover:bg-stone-50/70 transition-colors duration-100">
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-stone-800 leading-none">{cat.name}</span>
                    </td>

                    <td className="px-6 py-4">
                      {cat.parent_id === null ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold">
                          <FolderTree size={11} strokeWidth={2.5} />
                          Main
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 ">
                          <Layers size={11} strokeWidth={2.5} />
                          {getParentName(cat.parent_id)}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5  transition-opacity duration-150">
                        <button
                          onClick={() => openEditModal(cat)}
                          aria-label={`Edit ${cat.name}`}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 active:scale-95 transition-all duration-150"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => openDeleteModal(cat)}
                          aria-label={`Delete ${cat.name}`}
                          className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 active:scale-95 transition-all duration-150"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* ── Add / Edit Modal ── */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <Modal
          isOpen
          title={modalMode === 'add' ? 'Add New Category' : 'Edit Category'}
          onCancel={closeModal}
          onConfirm={handleSubmit}
          confirmText={modalMode === 'add' ? 'Create' : 'Save changes'}
          isConfirmLoading={isSubmitting}
        >
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Level toggle — add only */}
            {modalMode === 'add' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.08em]">
                  Type
                </label>
                <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
                  {(['Main', 'Sub Category'] as const).map((label) => {
                    const isSub = label === 'Sub Category';
                    const active = formData.isSubCategory === isSub;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setFormData({ ...formData, isSubCategory: isSub, parent_id: isSub ? formData.parent_id : '' })}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150 active:scale-95 ${
                          active
                            ? 'bg-white text-stone-900 shadow-sm'
                            : 'text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Parent selector */}
            {formData.isSubCategory && modalMode === 'add' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.08em]">
                  Parent Category
                </label>
                <select
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-150 cursor-pointer"
                >
                  <option value="" disabled>Select a parent…</option>
                  {mainCategories.map(main => (
                    <option key={main.id} value={main.id}>{main.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Name field */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-[0.08em]">
                Name
              </label>
              <input
                autoFocus
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Electronics"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 focus:bg-white transition-all duration-150"
              />
            </div>

            <button type="submit" className="hidden" aria-hidden="true" />
          </form>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
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
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 size={15} className="text-red-500" />
            </div>
            <div className="pt-0.5 space-y-1">
              <p className="text-sm text-stone-700">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-stone-900">{selectedCat.name}</span>?
              </p>
              <p className="text-xs text-stone-400">This action cannot be undone.</p>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}