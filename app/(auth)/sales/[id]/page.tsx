'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '@/lib/shop-context';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/ui/data-table';
import { formatPKR, formatDate, todayStr } from '@/lib/utils';
import { generateSaleInvoice, generatePaymentReceipt, openPrintWindow } from '@/lib/invoice';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { ArrowLeft, DollarSign, Download } from 'lucide-react';
import Link from 'next/link';

export default function SaleDetailPage() {
  const { activeShopId, activeShop } = useShop();
  const { hasPermission, payload } = useAuth();
  const params = useParams();
  const saleId = params.id as string;
  const [sale, setSale] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payDate, setPayDate] = useState(todayStr());
  const [payNotes, setPayNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const isSalesMan = payload?.role === 'sales-man';

  useEffect(() => { if (saleId) loadSale(); }, [saleId]);

  async function loadSale() {
    const [saleRes, paymentsRes] = await Promise.all([apiFetch(`/api/sales/${saleId}`), apiFetch(`/api/payments?shopId=${activeShopId}&referenceId=${saleId}`)]);
    if (saleRes.success) setSale(saleRes.data);
    if (paymentsRes.success) setPayments(paymentsRes.data);
  }

  async function recordPayment() {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return; }
    if (amount > sale.dueAmount) { toast.error('Amount exceeds due'); return; }
    setSaving(true);
    try {
      const res = await apiFetch('/api/payments', { method: 'POST', body: JSON.stringify({ shopId: activeShopId, partyId: sale.customerId?._id || sale.customerId, partyType: 'customer', referenceType: 'sale', referenceId: saleId, amount, method: payMethod, date: payDate, notes: payNotes }) });
      if (res.success) { toast.success('Payment recorded'); setPaymentModal(false); setPayAmount(''); loadSale(); }
      else toast.error(res.message);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  function downloadInvoice() {
    if (!sale) return;
    const shopName = activeShop?.name || 'Shop';
    const shopType = activeShop?.type || '';
    const html = generateSaleInvoice(sale, shopName, shopType);
    openPrintWindow(html, `Invoice-${saleId.slice(0, 8)}`);
  }

  function downloadPaymentReceipt(payment: any) {
    const shopName = activeShop?.name || 'Shop';
    const shopType = activeShop?.type || '';
    const customerName = sale?.isWalkIn ? 'Walk-in' : sale?.customerId?.name;
    const html = generatePaymentReceipt(payment, shopName, shopType, customerName);
    openPrintWindow(html, `Receipt-${payment._id?.slice(0, 8)}`);
  }

  if (!sale) return <div className="text-center py-12 text-sm text-gray-400">Loading...</div>;

  const itemColumns = [
    { key: 'product', label: 'Product', render: (row: any) => row.productId?.name || '-' },
    { key: 'qty', label: 'Qty' },
    ...(!isSalesMan ? [{ key: 'unitPrice', label: 'Unit Price', render: (row: any) => formatPKR(row.unitPrice) }] : []),
    { key: 'total', label: 'Total', render: (row: any) => formatPKR(row.total) },
  ];
  const paymentColumns = [
    { key: 'date', label: 'Date', render: (row: any) => formatDate(row.date) },
    { key: 'amount', label: 'Amount', render: (row: any) => formatPKR(row.amount) },
    { key: 'method', label: 'Method' },
    { key: 'actions', label: '', render: (row: any) => (
      <button onClick={() => downloadPaymentReceipt(row)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 inline-flex" title="Download Receipt"><Download className="w-3 h-3" /></button>
    )},
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/sales" className="p-1 rounded hover:bg-gray-100 text-gray-400"><ArrowLeft className="w-4 h-4" /></Link>
        <PageHeader title={`Sale #${saleId.slice(0, 8)}`} description={formatDate(sale.date)} />
        <div className="ml-auto">
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={downloadInvoice}>
            <Download className="w-3 h-3 mr-1" /> Invoice PDF
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{sale.isWalkIn ? 'Walk-in' : sale.customerId?.name || '-'}</span></div>
        {!isSalesMan && <div><span className="text-gray-500">Total:</span> <span className="font-semibold">{formatPKR(sale.totalAmount)}</span></div>}
        {!isSalesMan && <div><span className="text-gray-500">Received:</span> <span className="font-medium text-green-600">{formatPKR(sale.receivedAmount)}</span></div>}
        <div><span className="text-gray-500">Due:</span> <span className={`font-semibold ${sale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatPKR(sale.dueAmount)}</span></div>
      </div>
      <div className="mb-4"><h3 className="text-xs font-semibold text-gray-700 mb-2">Items</h3><DataTable columns={itemColumns} data={sale.items || []} emptyMessage="No items" /></div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2"><h3 className="text-xs font-semibold text-gray-700">Payments</h3>{sale.dueAmount > 0 && hasPermission('payments', 'create') && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7" onClick={() => setPaymentModal(true)}><DollarSign className="w-3 h-3 mr-1" /> Record Payment</Button>}</div>
        <DataTable columns={paymentColumns} data={payments} emptyMessage="No payments" />
      </div>
      <Modal open={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment">
        <div className="space-y-3">
          <div className="text-xs text-gray-500">Due: <span className="text-red-600 font-medium">{formatPKR(sale.dueAmount)}</span></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Amount</label><Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="text-sm h-9" min="0" step="any" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Method</label><select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"><option value="cash">Cash</option><option value="bank">Bank</option><option value="other">Other</option></select></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Date</label><input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setPaymentModal(false)}>Cancel</Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={recordPayment} disabled={saving}>{saving ? 'Saving...' : 'Record'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
