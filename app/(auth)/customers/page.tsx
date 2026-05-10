'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '@/lib/shop-context';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable } from '@/components/ui/data-table';
import { formatPKR } from '@/lib/utils';
import { generateCustomerLedger, generatePaymentReceipt, openPrintWindow } from '@/lib/invoice';
import { toast } from 'sonner';
import { Plus, Pencil, Eye, Download } from 'lucide-react';

export default function CustomersPage() {
  const { activeShopId, activeShop } = useShop();
  const { hasPermission } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerCustomer, setLedgerCustomer] = useState<any>(null);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerPayments, setLedgerPayments] = useState<any[]>([]);

  useEffect(() => { if (activeShopId) loadCustomers(); }, [activeShopId]);

  async function loadCustomers() {
    if (!activeShopId) return;
    const res = await apiFetch(`/api/customers?shopId=${activeShopId}`);
    if (res.success) setCustomers(res.data);
  }

  function openAdd() { setEditing(null); setForm({ name: '', phone: '', address: '' }); setModalOpen(true); }
  function openEdit(c: any) { setEditing(c); setForm({ name: c.name, phone: c.phone || '', address: c.address || '' }); setModalOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Customer name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, shopId: activeShopId };
      if (editing) {
        const res = await apiFetch(`/api/customers/${editing._id}`, { method: 'PUT', body: JSON.stringify(form) });
        if (res.success) toast.success('Customer updated'); else toast.error(res.message);
      } else {
        const res = await apiFetch('/api/customers', { method: 'POST', body: JSON.stringify(payload) });
        if (res.success) toast.success('Customer added'); else toast.error(res.message);
      }
      setModalOpen(false); loadCustomers();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  async function openLedger(customer: any) {
    setLedgerCustomer(customer); setLedgerOpen(true);
    const [salesRes, paymentsRes] = await Promise.all([
      apiFetch(`/api/sales?shopId=${activeShopId}`),
      apiFetch(`/api/payments?shopId=${activeShopId}&partyId=${customer._id}`),
    ]);
    const entries: any[] = []; let balance = 0;
    const allItems = [
      ...(salesRes.data || []).filter((s: any) => s.customerId?._id === customer._id || s.customerId === customer._id).map((s: any) => ({ date: s.date, type: 'sale', amount: s.totalAmount, desc: `Sale #${s._id?.slice(0,8)}` })),
      ...(paymentsRes.data || []).map((p: any) => ({ date: p.date, type: 'payment', amount: p.amount, desc: `Payment #${p._id?.slice(0,8)}` })),
    ].sort((a, b) => a.date.localeCompare(b.date));
    for (const item of allItems) {
      if (item.type === 'sale') { balance += item.amount; entries.push({ ...item, debit: item.amount, credit: 0, balance }); }
      else { balance -= item.amount; entries.push({ ...item, debit: 0, credit: item.amount, balance }); }
    }
    setLedgerEntries(entries);
    setLedgerPayments(paymentsRes.data || []);
  }

  function downloadLedger() {
    if (!ledgerCustomer) return;
    const shopName = activeShop?.name || 'Shop';
    const shopType = activeShop?.type || '';
    const html = generateCustomerLedger(ledgerCustomer, ledgerEntries, shopName, shopType);
    openPrintWindow(html, `Ledger-${ledgerCustomer.name}`);
  }

  function downloadPaymentReceipt(payment: any) {
    const shopName = activeShop?.name || 'Shop';
    const shopType = activeShop?.type || '';
    const html = generatePaymentReceipt(payment, shopName, shopType, ledgerCustomer?.name);
    openPrintWindow(html, `Receipt-${payment._id?.slice(0, 8)}`);
  }

  const filtered = customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone || '').includes(search));
  const columns = [
    { key: 'name', label: 'Name', render: (row: any) => <span className="font-medium">{row.name}</span> },
    { key: 'phone', label: 'Phone', render: (row: any) => row.phone || '-' },
    { key: 'totalDue', label: 'Total Due', render: (row: any) => <span className={row.totalDue > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatPKR(row.totalDue)}</span> },
    { key: 'actions', label: '', render: (row: any) => (
      <div className="flex gap-1">
        <button onClick={(e) => { e.stopPropagation(); openLedger(row); }} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600"><Eye className="w-3 h-3" /></button>
        {hasPermission('customers', 'update') && <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil className="w-3 h-3" /></button>}
      </div>
    )},
  ];
  const ledgerColumns = [
    { key: 'date', label: 'Date' },
    { key: 'desc', label: 'Description' },
    { key: 'debit', label: 'Debit', render: (row: any) => row.debit ? formatPKR(row.debit) : '-' },
    { key: 'credit', label: 'Credit', render: (row: any) => row.credit ? formatPKR(row.credit) : '-' },
    { key: 'balance', label: 'Balance', render: (row: any) => <span className={row.balance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>{formatPKR(row.balance)}</span> },
  ];

  if (!activeShopId) return <div className="text-center py-12 text-sm text-gray-400">Select a shop first</div>;

  return (
    <div>
      <PageHeader title="Customers" description="Manage your customers" action={
        hasPermission('customers', 'create') ? <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Add Customer</Button> : undefined
      } />
      <div className="mb-3"><SearchInput value={search} onChange={setSearch} placeholder="Search customers..." className="w-64" /></div>
      <DataTable columns={columns} data={filtered} emptyMessage="No customers found" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="space-y-3">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="text-sm h-9" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Phone</label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="text-sm h-9" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Address</label><textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </Modal>
      <Modal open={ledgerOpen} onClose={() => setLedgerOpen(false)} title={ledgerCustomer ? `${ledgerCustomer.name} - Ledger` : 'Ledger'} className="max-w-2xl">
        <div className="flex items-center justify-between mb-3">
          {ledgerCustomer && <div className="text-xs font-medium">Current Due: <span className="text-red-600">{formatPKR(ledgerCustomer.totalDue)}</span></div>}
          <Button size="sm" variant="outline" className="text-xs h-7" onClick={downloadLedger}><Download className="w-3 h-3 mr-1" /> Download Ledger</Button>
        </div>
        <DataTable columns={ledgerColumns} data={ledgerEntries} emptyMessage="No transactions found" />
        {ledgerPayments.length > 0 && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">Payment Receipts</h4>
            <div className="space-y-1">
              {ledgerPayments.map((p: any) => (
                <div key={p._id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-gray-50">
                  <span className="text-gray-600">{new Date(p.date).toLocaleDateString()} - {p.method} - {formatPKR(p.amount)}</span>
                  <button onClick={() => downloadPaymentReceipt(p)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Download Receipt"><Download className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
