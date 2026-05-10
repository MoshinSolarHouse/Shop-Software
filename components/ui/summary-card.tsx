import React from 'react';
import { cn } from '@/lib/utils';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
  trend?: string;
}

export function SummaryCard({ title, value, icon, className, trend }: SummaryCardProps) {
  return (
    <div className={cn('rounded-lg border border-gray-200 bg-white p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">{title}</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
          {trend && <p className="mt-0.5 text-xs text-gray-400">{trend}</p>}
        </div>
        {icon && <div className="text-green-600">{icon}</div>}
      </div>
    </div>
  );
}
