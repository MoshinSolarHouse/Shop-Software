'use client';

import React from 'react';
import { useShop } from '@/lib/shop-context';
import { useAuth } from '@/lib/auth-context';
import { Store, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { shops, activeShop, setActiveShopId } = useShop();
  const { user, logout, payload } = useAuth();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  function handleSignOut() {
    logout();
    toast.success('Signed out');
    router.push('/login');
  }

  const roleLabel = payload?.role ? payload.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
      <div className="flex items-center gap-3">
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50 transition-colors">
            <Store className="w-4 h-4 text-green-600" />
            <span className="font-medium text-gray-800">{activeShop ? activeShop.name : 'Select Shop'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-md border border-gray-200 bg-white shadow-lg py-1">
                {shops.filter((s) => s.isActive).map((shop) => (
                  <button key={shop._id} onClick={() => { setActiveShopId(shop._id); setOpen(false); }} className={cn('flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50', activeShop?._id === shop._id && 'bg-green-50 text-green-700 font-medium')}>
                    <Store className="w-3.5 h-3.5" />
                    <div><div>{shop.name}</div><div className="text-xs text-gray-400">{shop.type}</div></div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">{user?.name || user?.email}</span>
        <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-medium">{roleLabel}</span>
        <button onClick={handleSignOut} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors">
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>
    </header>
  );
}
