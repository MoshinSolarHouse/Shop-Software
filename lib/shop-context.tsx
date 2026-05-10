'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';

interface Shop {
  id: string;
  _id: string;
  name: string;
  type: string;
  description: string;
  isActive: boolean;
}

interface ShopContextType {
  shops: Shop[];
  activeShop: Shop | null;
  activeShopId: string | null;
  setActiveShopId: (id: string | null) => void;
  refreshShops: () => Promise<void>;
  loading: boolean;
}

const ShopContext = createContext<ShopContextType>({
  shops: [],
  activeShop: null,
  activeShopId: null,
  setActiveShopId: () => {},
  refreshShops: async () => {},
  loading: true,
});

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [activeShopId, setActiveShopIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setActiveShopId = useCallback((id: string | null) => {
    setActiveShopIdState(id);
    if (id) localStorage.setItem('activeShopId', id);
    else localStorage.removeItem('activeShopId');
  }, []);

  const refreshShops = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/shops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        const shopList = data.data.map((s: any) => ({ ...s, id: s._id }));
        setShops(shopList);
        if (!activeShopId && shopList.length > 0) {
          const saved = localStorage.getItem('activeShopId');
          const found = saved && shopList.find((s: Shop) => s._id === saved || s.id === saved);
          setActiveShopId(found ? found._id : shopList[0]._id);
        }
      }
    } catch {}
    setLoading(false);
  }, [token, activeShopId, setActiveShopId]);

  useEffect(() => {
    refreshShops();
  }, [token]);

  const activeShop = shops.find((s) => s._id === activeShopId) || null;

  return (
    <ShopContext.Provider value={{ shops, activeShop, activeShopId, setActiveShopId, refreshShops, loading }}>
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
