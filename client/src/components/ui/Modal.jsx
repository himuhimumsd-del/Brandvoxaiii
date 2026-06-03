// client/src/components/ui/Modal.jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title = '',
  children,
  className = ''
}) {
  // Listen for keyboard ESC keypresses to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg glass-premium rounded-xl p-6 max-h-[90vh] overflow-y-auto hover-scale ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-4">
          <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Dynamic Modal Content */}
        <div className="text-sm text-white/80">{children}</div>
      </div>
    </div>
  );
}
