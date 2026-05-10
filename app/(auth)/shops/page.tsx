'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '@/lib/shop-context';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from 'sonner';
import { Plus, Store, Pencil } from 'lucide-react';

export default function ShopsPage() {
  const { shops, refreshShops } = useShop();
  const { hasPermission } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'electric', description: '' });
  const [saving, setSaving] = useState(false);

  function openAdd() { setEditingShop(null); setForm({ name: '', type: 'electric', description: '' }); setModalOpen(true); }
  function openEdit(shop: any) { setEditingShop(shop); setForm({ name: shop.name, type: shop.type, description: shop.description || '' }); setModalOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Shop name is required'); return; }
    setSaving(true);
    try {
      if (editingShop) {
        const res = await apiFetch(`/api/shops/${editingShop._id}`, { method: 'PUT', body: JSON.stringify(form) });
        if (res.success) toast.success('Shop updated'); else toast.error(res.message);
      } else {
        const res = await apiFetch('/api/shops', { method: 'POST', body: JSON.stringify(form) });
        if (res.success) toast.success('Shop created'); else toast.error(res.message);
      }
      setModalOpen(false); refreshShops();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  async function toggleActive(shop: any) {
    const res = await apiFetch(`/api/shops/${shop._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !shop.isActive }) });
    if (res.success) { toast.success(shop.isActive ? 'Shop deactivated' : 'Shop activated'); refreshShops(); }
    else toast.error(res.message);
  }

  return (
    <div>
      <PageHeader title="Shops" description="Manage your business shops" action={
        hasPermission('shops', 'create') ? <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Add Shop</Button> : undefined
      } />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {shops.map((shop: any) => (
          <div key={shop._id} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2"><Store className="w-4 h-4 text-green-600" /><div><h3 className="text-sm font-medium text-gray-900">{shop.name}</h3><p className="text-xs text-gray-500">{shop.type}</p></div></div>
              <StatusBadge status={shop.isActive ? 'active' : 'inactive'} />
            </div>
            {shop.description && <p className="text-xs text-gray-400 mt-2">{shop.description}</p>}
            <div className="flex items-center gap-2 mt-3">
              {hasPermission('shops', 'update') && <Button size="sm" variant="outline" className="text-xs h-7 border-gray-200" onClick={() => openEdit(shop)}><Pencil className="w-3 h-3 mr-1" /> Edit</Button>}
              {hasPermission('shops', 'update') && <Button size="sm" variant="outline" className={`text-xs h-7 ${shop.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`} onClick={() => toggleActive(shop)}>{shop.isActive ? 'Deactivate' : 'Activate'}</Button>}
            </div>
          </div>
        ))}
        {shops.length === 0 && <div className="col-span-full text-center py-12 text-sm text-gray-400">No shops yet. Create your first shop to get started.</div>}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingShop ? 'Edit Shop' : 'Add Shop'}>
        <div className="space-y-3">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Shop Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Electric Store" className="text-sm h-9" /></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Shop Type</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"><option value="electric">Electric Store</option><option value="solar">Solar System Shop</option><option value="general">General</option></select></div>
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" rows={2} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingShop ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
