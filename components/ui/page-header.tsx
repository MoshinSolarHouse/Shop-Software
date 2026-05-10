import React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({ title, description, action, className }: { title: string; description?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <div>
        <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
