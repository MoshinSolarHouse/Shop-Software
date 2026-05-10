import React from 'react';
import { cn } from '@/lib/utils';

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  cleared: 'bg-green-50 text-green-700 border-green-200',
  active: 'bg-green-50 text-green-700 border-green-200',
  inactive: 'bg-gray-50 text-gray-500 border-gray-200',
  loan: 'bg-orange-50 text-orange-700 border-orange-200',
  borrow: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style = statusStyles[status] || 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', style, className)}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
