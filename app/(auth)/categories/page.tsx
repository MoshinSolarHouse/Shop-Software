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
import { toast } from 'sonner';
import { Plus, Pencil, FolderOpen, Image as ImageIcon } from 'lucide-react';

export default function CategoriesPage() {
  const { activeShopId } = useShop();
  const { hasPermission } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', image: '', imageMethod: 'url' });

  useEffect(() => { if (activeShopId) loadCategories(); }, [activeShopId]);

  async function loadCategories() {
    if (!activeShopId) return;
    const res = await apiFetch(`/api/categories?shopId=${activeShopId}`);
    if (res.success) setCategories(res.data);
  }

  function openAdd() { setEditing(null); setForm({ name: '', image: '', imageMethod: 'url' }); setModalOpen(true); }
  function openEdit(cat: any) { setEditing(cat); setForm({ name: cat.name, image: cat.image || '', imageMethod: 'url' }); setModalOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      const payload = { shopId: activeShopId, name: form.name, image: form.image };
      if (editing) {
        const res = await apiFetch(`/api/categories/${editing._id}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (res.success) toast.success('Category updated'); else toast.error(res.message);
      } else {
        const res = await apiFetch('/api/categories', { method: 'POST', body: JSON.stringify(payload) });
        if (res.success) toast.success('Category created'); else toast.error(res.message);
      }
      setModalOpen(false); loadCategories();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  async function handleDelete(cat: any) {
    const res = await apiFetch(`/api/categories/${cat._id}`, { method: 'DELETE' });
    if (res.success) { toast.success('Category deleted'); loadCategories(); }
    else toast.error(res.message);
  }

  const columns = [
    { key: 'image', label: 'Image', render: (row: any) => row.image ? <img src={row.image} alt={row.name} className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-400" /></div> },
    { key: 'name', label: 'Name', render: (row: any) => <span className="font-medium">{row.name}</span> },
    { key: 'actions', label: '', render: (row: any) => (
      <div className="flex gap-1">
        {hasPermission('categories', 'update') && <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil className="w-3 h-3" /></button>}
        {hasPermission('categories', 'delete') && <button onClick={(e) => { e.stopPropagation(); handleDelete(row); }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 text-xs">Delete</button>}
      </div>
    )},
  ];

  if (!activeShopId) return <div className="text-center py-12 text-sm text-gray-400">Select a shop first</div>;

  return (
    <div>
      <PageHeader title="Categories" description="Manage product categories" action={
        hasPermission('categories', 'create') ? <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Add Category</Button> : undefined
      } />
      <DataTable columns={columns} data={categories} emptyMessage="No categories found" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-3">
          <div><label className="block text-xs font-medium text-gray-700 mb-1">Category Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wiring" className="text-sm h-9" /></div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Image</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setForm({ ...form, imageMethod: 'url' })} className={`px-3 py-1 text-xs rounded-md border ${form.imageMethod === 'url' ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600'}`}>External URL</button>
              <button type="button" onClick={() => setForm({ ...form, imageMethod: 'upload' })} className={`px-3 py-1 text-xs rounded-md border ${form.imageMethod === 'upload' ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600'}`}>Upload File</button>
            </div>
            {form.imageMethod === 'url' ? (
              <Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://example.com/image.jpg" className="text-sm h-9" />
            ) : (
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setForm({ ...form, image: ev.target?.result as string });
                  reader.readAsDataURL(file);
                }
              }} className="w-full text-xs" />
            )}
            {form.image && <img src={form.image} alt="Preview" className="mt-2 w-16 h-16 rounded object-cover" />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
