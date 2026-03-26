import { useEffect, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
  confirmText?: string;
  isDestructive?: boolean;
  isConfirmLoading?: boolean; // Add this
}

export default function Modal({
  isOpen,
  title,
  onConfirm,
  onCancel,
  children,
  confirmText = 'Confirm',
  isDestructive = true,
  isConfirmLoading = false, // Add this
}: ModalProps) {
  
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-stone-900 mb-4">{title}</h2>
        <div className="mb-8">{children}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isConfirmLoading}
            className="px-6 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-sm font-semibold transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isConfirmLoading}
            className={`px-6 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-lg active:scale-95 ${
              isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-stone-900 hover:bg-stone-800'
            } disabled:opacity-70`}
          >
            {isConfirmLoading && <Loader2 size={16} className="animate-spin" />}
            {isConfirmLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}