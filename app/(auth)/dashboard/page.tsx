'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '@/lib/shop-context';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { SummaryCard } from '@/components/ui/summary-card';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { formatPKR, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ShoppingCart, Users, TrendingUp, Plus } from 'lucide-react';

export default function DashboardPage() {
  const { activeShopId, activeShop } = useShop();
  const { hasPermission } = useAuth();
  const [data, setData] = useState({ todaySales: 0, customerDues: 0, totalProfit: 0, recentSales: [] as any[] });

  useEffect(() => { if (activeShopId) loadDashboard(); }, [activeShopId]);

  async function loadDashboard() {
    if (!activeShopId) return;
    const today = new Date().toISOString().slice(0, 10);
    try {
      const [salesRes, custRes, profitRes] = await Promise.all([
        apiFetch(`/api/sales?shopId=${activeShopId}&dateFrom=${today}&dateTo=${today}`),
        apiFetch(`/api/reports?shopId=${activeShopId}&type=customer-dues`),
        apiFetch(`/api/reports?shopId=${activeShopId}&type=profit`),
      ]);
      const todaySales = (salesRes.data || []).reduce((s: number, r: any) => s + (r.totalAmount || 0), 0);
      const customerDues = (custRes.data || []).reduce((s: number, r: any) => s + (r.totalDue || 0), 0);
      const totalProfit = (profitRes.data || []).reduce((s: number, r: any) => s + (r.profit || 0), 0);
      const recentSales = (salesRes.data || []).slice(0, 5);
      setData({ todaySales, customerDues, totalProfit, recentSales });
    } catch {}
  }

  if (!activeShopId) return <div className="flex items-center justify-center h-64"><p className="text-sm text-gray-400">Please select or create a shop to get started.</p></div>;

  return (
    <div>
      <PageHeader title={activeShop ? `${activeShop.name} Dashboard` : 'Dashboard'} description={activeShop?.type || ''} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <SummaryCard title="Today's Sales" value={formatPKR(data.todaySales)} icon={<ShoppingCart className="w-5 h-5" />} />
        <SummaryCard title="Customer Dues" value={formatPKR(data.customerDues)} icon={<Users className="w-5 h-5" />} />
        {hasPermission('reports', 'read') && <SummaryCard title="Estimated Profit" value={formatPKR(data.totalProfit)} icon={<TrendingUp className="w-5 h-5" />} />}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {hasPermission('sales', 'create') && <Link href="/sales/new"><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"><Plus className="w-3.5 h-3.5 mr-1" /> New Sale</Button></Link>}
        {hasPermission('products', 'create') && <Link href="/products"><Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 text-xs h-8"><Plus className="w-3.5 h-3.5 mr-1" /> Add Product</Button></Link>}
        {hasPermission('customers', 'create') && <Link href="/customers"><Button size="sm" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50 text-xs h-8"><Plus className="w-3.5 h-3.5 mr-1" /> Add Customer</Button></Link>}
      </div>
      <div className="rounded-lg border border-gray-200 p-4">
        <h3 className="text-xs font-semibold text-gray-700 mb-3">Recent Sales</h3>
        {data.recentSales.length === 0 ? <p className="text-xs text-gray-400">No recent sales</p> : (
          <div className="space-y-2">
            {data.recentSales.map((sale: any) => (
              <Link key={sale._id} href={`/sales/${sale._id}`} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 text-xs">
                <div>
                  <span className="text-gray-700 font-medium">{sale.isWalkIn ? 'Walk-in' : sale.customerId?.name || 'Customer'}</span>
                  <span className="text-gray-400 ml-2">{formatDate(sale.date)}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-900 font-medium">{formatPKR(sale.totalAmount)}</span>
                  {sale.dueAmount > 0 && <span className="ml-2 text-red-600">Due: {formatPKR(sale.dueAmount)}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
