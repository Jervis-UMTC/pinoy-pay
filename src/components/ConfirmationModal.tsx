import React, { Fragment, useEffect, useState } from 'react';
import { X, Check, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'success';
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: ConfirmationModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to allow render before animation starts
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      // Wait for animation to finish before hiding
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}
        onClick={variant === 'default' ? onCancel : undefined}
      />

      {/* Modal Card */}
      <div
        className={`bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 ${isAnimating ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'}`}
      >
        {/* Header */}
        <div className={`${variant === 'success' ? 'bg-green-600' : 'bg-[#1e3a8a]'} p-6 text-white flex gap-3 items-center transition-colors`}>
          <div className="bg-white/20 p-2 rounded-full">
            {variant === 'success' ? (
              <CheckCircle2 size={24} className="text-white" />
            ) : (
              <AlertCircle size={24} className="text-[#FDD723]" />
            )}
          </div>
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-slate-600 text-sm leading-relaxed mb-6">
            {message}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {variant === 'default' && onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors border border-slate-200"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={onConfirm}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${variant === 'success'
                  ? 'bg-green-600 shadow-green-200 hover:bg-green-700 w-full'
                  : 'bg-[#1e3a8a] shadow-blue-900/20 hover:bg-blue-900'
                }`}
            >
              <Check size={18} />
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
