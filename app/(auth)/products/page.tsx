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
import { toast } from 'sonner';
import { Plus, Pencil, Package, TriangleAlert as AlertTriangle, Image as ImageIcon } from 'lucide-react';

export default function ProductsPage() {
  const { activeShopId } = useShop();
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', categoryId: '', unit: 'piece', costPrice: '', salePrice: '', stock: '', lowStockThreshold: '5', images: [] as string[], imageMethod: 'url', currentImage: '' });

  useEffect(() => { if (activeShopId) { loadProducts(); loadCategories(); } }, [activeShopId]);

  async function loadProducts() {
    if (!activeShopId) return;
    const res = await apiFetch(`/api/products?shopId=${activeShopId}`);
    if (res.success) setProducts(res.data);
  }
  async function loadCategories() {
    if (!activeShopId) return;
    const res = await apiFetch(`/api/categories?shopId=${activeShopId}`);
    if (res.success) setCategories(res.data);
  }

  function openAdd() { setEditing(null); setForm({ name: '', categoryId: '', unit: 'piece', costPrice: '', salePrice: '', stock: '', lowStockThreshold: '5', images: [], imageMethod: 'url', currentImage: '' }); setModalOpen(true); }
  function openEdit(p: any) { setEditing(p); setForm({ name: p.name, categoryId: p.categoryId?._id || p.categoryId || '', unit: p.unit, costPrice: String(p.costPrice), salePrice: String(p.salePrice), stock: String(p.stock), lowStockThreshold: String(p.lowStockThreshold), images: p.images || [], imageMethod: 'url', currentImage: '' }); setModalOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('Product name is required'); return; }
    setSaving(true);
    try {
      const payload = { shopId: activeShopId, name: form.name, categoryId: form.categoryId, unit: form.unit, costPrice: parseFloat(form.costPrice) || 0, salePrice: parseFloat(form.salePrice) || 0, stock: parseFloat(form.stock) || 0, lowStockThreshold: parseFloat(form.lowStockThreshold) || 5, images: form.images };
      if (editing) {
        const res = await apiFetch(`/api/products/${editing._id}`, { method: 'PUT', body: JSON.stringify(payload) });
        if (res.success) toast.success('Product updated'); else toast.error(res.message);
      } else {
        const res = await apiFetch('/api/products', { method: 'POST', body: JSON.stringify(payload) });
        if (res.success) toast.success('Product created'); else toast.error(res.message);
      }
      setModalOpen(false); loadProducts();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  async function toggleActive(p: any) {
    const res = await apiFetch(`/api/products/${p._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !p.isActive }) });
    if (res.success) { toast.success(p.isActive ? 'Product deactivated' : 'Product activated'); loadProducts(); }
    else toast.error(res.message);
  }

  function addImage() {
    if (form.currentImage && !form.images.includes(form.currentImage)) {
      setForm({ ...form, images: [...form.images, form.currentImage], currentImage: '' });
    }
  }
  function removeImage(idx: number) {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || (p.categoryId?._id || p.categoryId) === categoryFilter;
    return matchSearch && matchCategory;
  });

  const columns = [
    { key: 'image', label: '', render: (row: any) => row.images?.[0] ? <img src={row.images[0]} alt="" className="w-8 h-8 rounded object-cover" /> : <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center"><Package className="w-4 h-4 text-gray-400" /></div> },
    { key: 'name', label: 'Name', render: (row: any) => <div className="flex items-center gap-1.5"><span className="font-medium">{row.name}</span>{row.stock <= row.lowStockThreshold && <AlertTriangle className="w-3 h-3 text-yellow-500" />}</div> },
    { key: 'category', label: 'Category', render: (row: any) => row.categoryId?.name || '-' },
    { key: 'costPrice', label: 'Cost', render: (row: any) => formatPKR(row.costPrice) },
    { key: 'salePrice', label: 'Sale', render: (row: any) => formatPKR(row.salePrice) },
    { key: 'stock', label: 'Stock', render: (row: any) => <span className={row.stock <= row.lowStockThreshold ? 'text-red-600 font-medium' : ''}>{row.stock}{row.stock <= row.lowStockThreshold ? ' (Low)' : ''}</span> },
    { key: 'actions', label: '', render: (row: any) => (
      <div className="flex gap-1">
        {hasPermission('products', 'update') && <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><Pencil className="w-3 h-3" /></button>}
        {hasPermission('products', 'delete') && <button onClick={(e) => { e.stopPropagation(); toggleActive(row); }} className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 text-xs">{row.isActive ? 'Deactivate' : 'Activate'}</button>}
      </div>
    )},
  ];

  if (!activeShopId) return <div className="text-center py-12 text-sm text-gray-400">Select a shop first</div>;

  return (
    <div>
      <PageHeader title="Products" description="Manage your product inventory" action={
        hasPermission('products', 'create') ? <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-8" onClick={openAdd}><Plus className="w-3.5 h-3.5 mr-1" /> Add Product</Button> : undefined
      } />
      <div className="flex flex-wrap gap-2 mb-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products..." className="w-64" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500">
          <option value="">All Categories</option>
          {categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage="No products found" />
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} className="max-w-xl">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><label className="block text-xs font-medium text-gray-700 mb-1">Product Name</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. 3-core cable" className="text-sm h-9" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Category</label><select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"><option value="">Select</option>{categories.map((c: any) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Unit</label><select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"><option value="piece">Piece</option><option value="meter">Meter</option><option value="kg">Kg</option><option value="set">Set</option><option value="box">Box</option><option value="roll">Roll</option></select></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Cost Price</label><Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="text-sm h-9" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Sale Price</label><Input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })} className="text-sm h-9" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Stock</label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="text-sm h-9" /></div>
            <div><label className="block text-xs font-medium text-gray-700 mb-1">Low Stock Threshold</label><Input type="number" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} className="text-sm h-9" /></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Product Images</label>
            <div className="flex gap-2 mb-2">
              <button type="button" onClick={() => setForm({ ...form, imageMethod: 'url' })} className={`px-3 py-1 text-xs rounded-md border ${form.imageMethod === 'url' ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600'}`}>External URL</button>
              <button type="button" onClick={() => setForm({ ...form, imageMethod: 'upload' })} className={`px-3 py-1 text-xs rounded-md border ${form.imageMethod === 'upload' ? 'bg-green-50 border-green-300 text-green-700' : 'border-gray-200 text-gray-600'}`}>Upload File</button>
            </div>
            <div className="flex gap-2">
              {form.imageMethod === 'url' ? (
                <Input value={form.currentImage} onChange={(e) => setForm({ ...form, currentImage: e.target.value })} placeholder="https://example.com/image.jpg" className="text-sm h-9 flex-1" />
              ) : (
                <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = (ev) => setForm({ ...form, currentImage: ev.target?.result as string }); reader.readAsDataURL(file); } }} className="flex-1 text-xs" />
              )}
              <Button size="sm" variant="outline" className="text-xs h-9 border-green-600 text-green-600" onClick={addImage}>Add</Button>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative"><img src={img} alt="" className="w-12 h-12 rounded object-cover" /><button onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">x</button></div>
              ))}
            </div>
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
