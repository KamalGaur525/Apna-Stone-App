import { useEffect, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
  confirmText?: string;
  isDestructive?: boolean;
  isConfirmLoading?: boolean;
}

export default function Modal({
  isOpen,
  title,
  onConfirm,
  onCancel,
  children,
  confirmText = 'Confirm',
  isDestructive = true,
  isConfirmLoading = false,
}: ModalProps) {

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <h2
            id="modal-title"
            className="text-sm font-semibold text-stone-900"
          >
            {title}
          </h2>
          <button
            onClick={onCancel}
            disabled={isConfirmLoading}
            aria-label="Close"
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        {children && (
          <div className="px-5 py-4 text-sm text-stone-600 leading-relaxed">
            {children}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stone-200">
          <button
            onClick={onCancel}
            disabled={isConfirmLoading}
            className="px-4 py-2 rounded-lg border border-stone-300 bg-white text-stone-700 text-sm font-medium hover:bg-stone-50 active:bg-stone-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirmLoading}
            className={`px-4 py-2 rounded-lg text-white text-sm font-medium flex items-center gap-1.5 transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
                : 'bg-stone-800 hover:bg-stone-900 active:bg-black'
            }`}
          >
            {isConfirmLoading && <Loader2 size={14} className="animate-spin" />}
            {isConfirmLoading ? 'Processing…' : confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}