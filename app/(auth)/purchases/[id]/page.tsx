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

export default function PurchaseDetailPage() {
  const params = useParams();
  const purchaseId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [purchase, setPurchase] = useState<any>(null);

  useEffect(() => {
    loadPurchase();
  }, [purchaseId]);

  async function loadPurchase() {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/purchases/${purchaseId}`);
      if (res.success) {
        setPurchase(res.data);
      } else {
        toast.error(res.message || 'Failed to load purchase');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePayDue() {
    const due = Number(purchase?.dueAmount || 0);

    if (due <= 0) {
      toast.error('No due amount to pay');
      return;
    }

    setPaying(true);

    try {
      const res = await apiFetch(`/api/purchases/${purchaseId}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          amount: due,
          method: 'cash',
        }),
      });

      if (res.success) {
        toast.success('Payment recorded successfully');
        await loadPurchase();
      } else {
        toast.error(res.message || 'Payment failed');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Purchase not found</p>
        <Link href="/purchases">
          <Button size="sm" variant="outline">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Purchases
          </Button>
        </Link>
      </div>
    );
  }

  const dueAmount = Number(purchase.dueAmount || 0);

  const columns = [
    {
      key: 'productName',
      label: 'Product',
      render: (item: any) => item.productId?.name || '-',
    },
    {
      key: 'qty',
      label: 'Quantity',
      render: (item: any) => item.qty,
    },
    {
      key: 'unitPrice',
      label: 'Unit Price',
      render: (item: any) => formatPKR(item.unitPrice),
    },
    {
      key: 'total',
      label: 'Total',
      render: (item: any) => formatPKR(item.total),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link
            href="/purchases"
            className="flex items-center gap-1 text-gray-600 hover:text-gray-700 mb-2 text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Purchases
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Purchase Details
          </h1>
        </div>

        {/* PAY BUTTON */}
        <Button
          onClick={handlePayDue}
          disabled={dueAmount <= 0 || paying}
          className={`text-white text-sm h-9 ${
            dueAmount > 0
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {paying ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              Paying...
            </>
          ) : (
            'Pay Due'
          )}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs text-gray-600 uppercase mb-1">Date</p>
          <p className="text-lg font-semibold">
            {new Date(purchase.date).toLocaleDateString()}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-gray-600 uppercase mb-1">Supplier</p>
          <p className="text-lg font-semibold">
            {purchase.supplierId?.name || '-'}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-gray-600 uppercase mb-1">Status</p>
          <p
            className={`text-lg font-semibold ${
              purchase.status === 'paid'
                ? 'text-green-600'
                : 'text-yellow-600'
            }`}
          >
            {purchase.status}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-gray-600 uppercase mb-1">Reference</p>
          <p className="text-lg font-semibold">
            {purchase.referenceNo ||
              purchase._id.toString().slice(0, 8)}
          </p>
        </Card>
      </div>

      {/* Items */}
      <Card className="p-6 space-y-6 mb-6">
        <div>
          <h3 className="font-semibold mb-3">Purchase Items</h3>
          <DataTable
            columns={columns}
            data={purchase.items || []}
            emptyMessage="No items"
          />
        </div>

        {purchase.notes && (
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="text-gray-700 text-sm">{purchase.notes}</p>
          </div>
        )}
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-600 uppercase mb-1">
            Total Amount
          </p>
          <p className="text-2xl font-bold">
            {formatPKR(purchase.totalAmount)}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-gray-600 uppercase mb-1">
            Paid Amount
          </p>
          <p className="text-2xl font-bold text-green-600">
            {formatPKR(purchase.paidAmount || 0)}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-gray-600 uppercase mb-1">
            Due Amount
          </p>
          <p
            className={`text-2xl font-bold ${
              dueAmount > 0 ? 'text-red-600' : 'text-gray-400'
            }`}
          >
            {formatPKR(dueAmount)}
          </p>
        </Card>
      </div>
    </div>
  );
}