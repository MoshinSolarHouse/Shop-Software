'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '@/lib/shop-context';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { formatPKR } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';
import { Plus, Eye, Trash2, ShoppingCart, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PurchasesPage() {
  const { activeShopId } = useShop();
  const { hasPermission } = useAuth();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [supplier, setSupplier] = useState('');
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeShopId) {
      loadSuppliers();
      loadPurchases();
    }
  }, [activeShopId]);

  async function loadPurchases() {
    if (!activeShopId) return;
    setLoading(true);
    try {
      let url = `/api/purchases?shopId=${activeShopId}`;
      if (supplier) url += `&supplierId=${supplier}`;
      const res = await apiFetch(url);
      if (res.success) setPurchases(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSuppliers() {
    if (!activeShopId) return;
    try {
      const res = await apiFetch(`/api/suppliers?shopId=${activeShopId}`);
      if (res.success) setSuppliers(res.data);
    } catch (err: any) {
      console.error('Failed to load suppliers:', err);
    }
  }

  async function handleDelete(purchase: any) {
    if (!confirm('Are you sure? This will revert stock changes.')) return;
    try {
      const res = await apiFetch(`/api/purchases/${purchase._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success('Purchase deleted');
        loadPurchases();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const filtered = purchases.filter((p) => {
    const matchSearch = p.referenceNo?.toLowerCase().includes(search.toLowerCase()) || p._id.toString().includes(search);
    const matchSupplier = !supplier || p.supplierId?._id === supplier;
    return matchSearch && matchSupplier;
  });

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row: any) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'referenceNo',
      label: 'Reference #',
      render: (row: any) => (
        <div className="flex items-center gap-1">
          <ShoppingCart className="w-3 h-3 text-gray-400" />
          {row.referenceNo || row._id.toString().slice(0, 8)}
        </div>
      ),
    },
    {
      key: 'supplier',
      label: 'Supplier',
      render: (row: any) => row.supplierId?.name || '-',
    },
    {
      key: 'items',
      label: 'Items',
      render: (row: any) => row.items?.length || 0,
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (row: any) => <span className="font-medium">{formatPKR(row.totalAmount)}</span>,
    },
    {
      key: 'paidAmount',
      label: 'Paid',
      render: (row: any) => <span className="text-green-600">{formatPKR(row.paidAmount)}</span>,
    },
    {
      key: 'dueAmount',
      label: 'Due',
      render: (row: any) => (
        <span className={row.dueAmount > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
          {row.dueAmount > 0 ? formatPKR(row.dueAmount) : 'Paid'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row: any) => (
        <div className="flex gap-1">
          <Link href={`/purchases/${row._id}`} className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600" title="View Details">
            <Eye className="w-3 h-3" />
          </Link>
          {hasPermission('purchases', 'delete') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
              title="Delete Purchase"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      ),
    },
  ];

  if (!activeShopId) {
    return <div className="text-center py-12 text-sm text-gray-400">Select a shop first</div>;
  }

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Manage stock purchases from suppliers"
        action={
          hasPermission('purchases', 'create') ? (
            <Link href="/purchases/new">
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8">
                <Plus className="w-3.5 h-3.5 mr-1" /> New Purchase
              </Button>
            </Link>
          ) : undefined
        }
      />

      <div className="flex flex-wrap gap-2 mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by reference #..."
          className="w-80"
        />
        <select
          value={supplier}
          onChange={(e) => {
            setSupplier(e.target.value);
            setSearch('');
          }}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="">All Suppliers</option>
          {suppliers.map((s: any) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading purchases...</div>
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage="No purchases found" />
      )}
    </div>
  );
}
