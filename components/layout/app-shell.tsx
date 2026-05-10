'use client';

import React from 'react';
import { ShopProvider } from '@/lib/shop-context';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Navbar } from '@/components/layout/navbar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ShopProvider>
        <div className="flex min-h-screen bg-white">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 p-4 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </ShopProvider>
    </AuthGuard>
  );
}
