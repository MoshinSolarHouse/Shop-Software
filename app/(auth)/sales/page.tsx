'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '@/lib/shop-context';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable } from '@/components/ui/data-table';
import { formatPKR, formatDate } from '@/lib/utils';
import { generateSaleInvoice, openPrintWindow } from '@/lib/invoice';
import { Plus, Eye, Download } from 'lucide-react';
import Link from 'next/link';

export default function SalesPage() {
  const { activeShopId, activeShop } = useShop();
  const { hasPermission, payload } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isSalesMan = payload?.role === 'sales-man';

  useEffect(() => { if (activeShopId) loadSales(); }, [activeShopId, dateFrom, dateTo]);

  async function loadSales() {
    if (!activeShopId) return;
    let url = `/api/sales?shopId=${activeShopId}`;
    if (dateFrom) url += `&dateFrom=${dateFrom}`;
    if (dateTo) url += `&dateTo=${dateTo}`;
    const res = await apiFetch(url);
    if (res.success) setSales(res.data);
  }

  function downloadSaleInvoice(sale: any) {
    const shopName = activeShop?.name || 'Shop';
    const shopType = activeShop?.type || '';
    const html = generateSaleInvoice(sale, shopName, shopType);
    openPrintWindow(html, `Invoice-${sale._id?.slice(0, 8)}`);
  }

  const filtered = sales.filter((s) => {
    const name = s.customerId?.name || '';
    return name.toLowerCase().includes(search.toLowerCase()) || (s.isWalkIn && 'walk-in'.includes(search.toLowerCase()));
  });

  const columns = [
    { key: 'date', label: 'Date', render: (row: any) => formatDate(row.date) },
    { key: 'customer', label: 'Customer', render: (row: any) => row.isWalkIn ? 'Walk-in' : row.customerId?.name || '-' },
    ...(!isSalesMan ? [
      { key: 'totalAmount', label: 'Total', render: (row: any) => formatPKR(row.totalAmount) },
      { key: 'receivedAmount', label: 'Received', render: (row: any) => formatPKR(row.receivedAmount) },
    ] : []),
    { key: 'dueAmount', label: 'Due', render: (row: any) => <span className={row.dueAmount > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatPKR(row.dueAmount)}</span> },
    { key: 'actions', label: '', render: (row: any) => (
      <div className="flex items-center gap-1">
        <Link href={`/sales/${row._id}`} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600 inline-flex"><Eye className="w-3 h-3" /></Link>
        <button onClick={() => downloadSaleInvoice(row)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 inline-flex" title="Download Invoice"><Download className="w-3 h-3" /></button>
      </div>
    )},
  ];

  if (!activeShopId) return <div className="text-center py-12 text-sm text-gray-400">Select a shop first</div>;

  return (
    <div>
      <PageHeader title="Sales" description="View and manage sales" action={
        hasPermission('sales', 'create') ? <Link href="/sales/new"><Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"><Plus className="w-3.5 h-3.5 mr-1" /> New Sale</Button></Link> : undefined
      } />
      <div className="flex flex-wrap gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by customer..." className="w-56" />
        <div className="flex items-center gap-1"><span className="text-xs text-gray-500">From:</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" /></div>
        <div className="flex items-center gap-1"><span className="text-xs text-gray-500">To:</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" /></div>
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage="No sales found" />
    </div>
  );
}
