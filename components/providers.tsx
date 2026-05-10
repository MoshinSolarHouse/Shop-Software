'use client';

import React from 'react';
import { AuthProvider } from '@/lib/auth-context';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px' } }} />
    </AuthProvider>
  );
}
