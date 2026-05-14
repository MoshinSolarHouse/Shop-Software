'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { formatPKR } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function SupplierLedgerPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadLedger();
  }, [supplierId]);

  async function loadLedger() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/suppliers/${supplierId}/ledger`);
      if (res.success) {
        setData(res.data);
      } else {
        toast.error(res.message || 'Failed to load ledger');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Supplier not found</p>
        <Link href="/suppliers">
          <Button size="sm" variant="outline">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Suppliers
          </Button>
        </Link>
      </div>
    );
  }

  const { supplier, ledger, summary } = data;

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (row: any) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.type === 'Purchase' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {row.type}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row: any) => row.description,
    },
    {
      key: 'debit',
      label: 'Debit (Owed)',
      render: (row: any) => (row.debit > 0 ? <span className="text-red-600 font-medium">{formatPKR(row.debit)}</span> : '-'),
    },
    {
      key: 'credit',
      label: 'Credit (Paid)',
      render: (row: any) => (row.credit > 0 ? <span className="text-green-600 font-medium">{formatPKR(row.credit)}</span> : '-'),
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (row: any) => (
        <span className={`font-medium ${row.balance > 0 ? 'text-red-600' : row.balance < 0 ? 'text-green-600' : 'text-gray-600'}`}>
          {formatPKR(row.balance)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/suppliers" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 mb-2 text-sm">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Suppliers
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Ledger</h1>
          <p className="text-gray-600 text-sm">{supplier.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Total Purchases</p>
          <p className="text-2xl font-bold text-red-600">{formatPKR(summary.totalPurchases)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-green-600">{formatPKR(summary.totalPayments)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">Current Balance</p>
          <p className={`text-2xl font-bold ${summary.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {formatPKR(summary.balance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{summary.balance > 0 ? 'Amount Owed' : 'Overpaid'}</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">Transaction Ledger</h3>
        </div>
        <DataTable columns={columns} data={ledger} emptyMessage="No transactions found" />
      </Card>
    </div>
  );
}
