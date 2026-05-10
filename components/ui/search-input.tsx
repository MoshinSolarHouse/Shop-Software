'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search...', className }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-md border border-gray-200 bg-white pl-8 pr-3 py-1.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500" />
    </div>
  );
}
