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
import { toast } from 'sonner';
import { Plus, Pencil, Eye, Truck } from 'lucide-react';
import Link from 'next/link';

export default function SuppliersPage() {
  const { activeShopId } = useShop();
  const { hasPermission } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (activeShopId) {
      loadSuppliers();
    }
  }, [activeShopId]);

  async function loadSuppliers() {
    if (!activeShopId) return;
    const res = await apiFetch(`/api/suppliers?shopId=${activeShopId}`);
    if (res.success) setSuppliers(res.data);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', phone: '', address: '' });
    setModalOpen(true);
  }

  function openEdit(supplier: any) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        shopId: activeShopId,
        ...form,
      };

      if (editing) {
        const res = await apiFetch(`/api/suppliers/${editing._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          toast.success('Supplier updated');
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await apiFetch('/api/suppliers', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (res.success) {
          toast.success('Supplier created');
        } else {
          toast.error(res.message);
        }
      }
      setModalOpen(false);
      loadSuppliers();
    } catch (err: any) {
      toast.error(err.message);
    }
    setSaving(false);
  }

  async function handleDelete(supplier: any) {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      const res = await apiFetch(`/api/suppliers/${supplier._id}`, {
        method: 'DELETE',
      });
      if (res.success) {
        toast.success('Supplier deleted');
        loadSuppliers();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search)
  );

  const columns = [
    {
      key: 'name',
      label: 'Supplier Name',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (row: any) => row.phone || '-',
    },
    {
      key: 'address',
      label: 'Address',
      render: (row: any) => row.address || '-',
    },
    {
      key: 'actions',
      label: '',
      render: (row: any) => (
        <div className="flex gap-1">
          <Link
            href={`/suppliers/${row._id}/ledger`}
            className="p-1 rounded hover:bg-blue-50 text-gray-400 hover:text-blue-600"
            title="View Ledger"
          >
            <Eye className="w-3 h-3" />
          </Link>
          {hasPermission('suppliers', 'update') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEdit(row);
              }}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {hasPermission('suppliers', 'delete') && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 text-xs"
            >
              Delete
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
        title="Suppliers"
        description="Manage suppliers and view their financial ledger"
        action={
          hasPermission('suppliers', 'create') ? (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
              onClick={openAdd}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Supplier
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-wrap gap-2 mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search suppliers..."
          className="w-80"
        />
      </div>
      <DataTable columns={columns} data={filtered} emptyMessage="No suppliers found" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'} className="max-w-lg">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. XYZ Electronics"
              className="text-sm h-9"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1234567890"
              className="text-sm h-9"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Street address"
              className="text-sm h-9"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
