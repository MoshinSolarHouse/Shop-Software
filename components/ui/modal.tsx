'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className={cn('relative z-10 w-full max-w-lg rounded-lg border border-gray-200 bg-white p-5 shadow-lg', className)}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
