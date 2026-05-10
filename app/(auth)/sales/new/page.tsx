'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '@/lib/shop-context';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatPKR, todayStr } from '@/lib/utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

interface SaleItem { productId: string; name: string; qty: string; unitPrice: string; total: number; }

export default function NewSalePage() {
  const { activeShopId } = useShop();
  const { hasPermission } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [isWalkIn, setIsWalkIn] = useState(true);
  const [date, setDate] = useState(todayStr());
  const [receivedAmount, setReceivedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleItem[]>([]);

  useEffect(() => {
    if (activeShopId) {
      apiFetch(`/api/customers?shopId=${activeShopId}`).then(r => r.success && setCustomers(r.data));
      apiFetch(`/api/products?shopId=${activeShopId}`).then(r => r.success && setProducts(r.data));
    }
  }, [activeShopId]);

  function addItem() { setItems([...items, { productId: '', name: '', qty: '1', unitPrice: '0', total: 0 }]); }
  function updateItem(index: number, field: string, value: string) {
    const updated = [...items]; (updated[index] as any)[field] = value;
    if (field === 'productId') { const p = products.find((p: any) => p._id === value); if (p) { updated[index].name = p.name; updated[index].unitPrice = String(p.salePrice); updated[index].total = parseFloat(updated[index].qty || '0') * p.salePrice; } }
    if (field === 'qty' || field === 'unitPrice') { updated[index].total = parseFloat(updated[index].qty || '0') * parseFloat(updated[index].unitPrice || '0'); }
    setItems(updated);
  }
  function removeItem(index: number) { setItems(items.filter((_, i) => i !== index)); }

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const received = parseFloat(receivedAmount) || 0;
  const dueAmount = totalAmount - received;

  async function handleSave() {
    if (items.length === 0 || items.some((i) => !i.productId)) { toast.error('Add at least one product'); return; }
    setSaving(true);
    try {
      const payload = { shopId: activeShopId, customerId: isWalkIn ? null : customerId || null, items: items.map(i => ({ productId: i.productId, qty: parseFloat(i.qty), unitPrice: parseFloat(i.unitPrice), total: i.total })), totalAmount, receivedAmount: received, dueAmount, date, notes, isWalkIn };
      const res = await apiFetch('/api/sales', { method: 'POST', body: JSON.stringify(payload) });
      if (res.success) { toast.success('Sale recorded'); router.push('/sales'); }
      else toast.error(res.message);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  if (!activeShopId) return <div className="text-center py-12 text-sm text-gray-400">Select a shop first</div>;
  if (!hasPermission('sales', 'create')) return <div className="text-center py-12 text-sm text-gray-400">You don't have permission to create sales</div>;

  return (
    <div className="max-w-3xl">
      <PageHeader title="New Sale" />
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Customer</label><div className="flex items-center gap-2 mb-1"><label className="flex items-center gap-1 text-xs text-gray-600"><input type="checkbox" checked={isWalkIn} onChange={(e) => setIsWalkIn(e.target.checked)} className="rounded border-gray-300" /> Walk-in</label></div>{!isWalkIn && <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"><option value="">Select</option>{customers.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}</select>}</div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" /></div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2"><label className="text-xs font-medium text-gray-700">Items</label><Button size="sm" variant="outline" className="text-xs h-7 border-green-600 text-green-600" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add Item</Button></div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">{idx === 0 && <span className="text-xs text-gray-500">Product</span>}<select value={item.productId} onChange={(e) => updateItem(idx, 'productId', e.target.value)} className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"><option value="">Select</option>{products.map((p: any) => <option key={p._id} value={p._id}>{p.name} (Stock: {p.stock})</option>)}</select></div>
                <div className="col-span-2">{idx === 0 && <span className="text-xs text-gray-500">Qty</span>}<input type="number" value={item.qty} onChange={(e) => updateItem(idx, 'qty', e.target.value)} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" min="0" step="any" /></div>
                <div className="col-span-3">{idx === 0 && <span className="text-xs text-gray-500">Unit Price</span>}<input type="number" value={item.unitPrice} onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" min="0" step="any" /></div>
                <div className="col-span-2">{idx === 0 && <span className="text-xs text-gray-500">Total</span>}<div className="px-2 py-1.5 text-xs font-medium text-gray-700">{formatPKR(item.total)}</div></div>
                <div className="col-span-1">{idx === 0 && <span className="text-xs text-gray-500">&nbsp;</span>}<button onClick={() => removeItem(idx)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button></div>
              </div>
            ))}
            {items.length === 0 && <p className="text-xs text-gray-400 py-2">No items added yet</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" /></div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs"><span className="text-gray-500">Total:</span><span className="font-semibold">{formatPKR(totalAmount)}</span></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Received</label><input type="number" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" min="0" step="any" /></div>
            <div className="flex justify-between text-xs"><span className="text-gray-500">Due:</span><span className={`font-semibold ${dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatPKR(dueAmount)}</span></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => router.push('/sales')}>Cancel</Button>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Record Sale'}</Button>
        </div>
      </div>
    </div>
  );
}
