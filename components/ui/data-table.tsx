'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  keyField?: string;
  onRowClick?: (row: any) => void;
  emptyMessage?: string;
}

export function DataTable({ columns, data, keyField = 'id', onRowClick, emptyMessage = 'No data found' }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th key={col.key} className={cn('px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider', col.className)}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr><td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-gray-400">{emptyMessage}</td></tr>
          ) : (
            data.map((row, idx) => (
              <tr key={String(row[keyField]) || idx} onClick={() => onRowClick?.(row)}
                className={cn(idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50', onRowClick && 'cursor-pointer hover:bg-green-50/30')}>
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-3 py-2 text-xs text-gray-700', col.className)}>
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
