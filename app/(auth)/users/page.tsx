'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useShop } from '@/lib/shop-context';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Pencil, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface UserRecord {
  _id: string;
  name: string;
  email: string;
  role: string;
  shopIds: string[];
  permissions: Record<string, string[]>;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { hasPermission, payload } = useAuth();
  const { shops } = useShop();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales-man', shopIds: [] as string[] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setLoading(true);
    const res = await apiFetch('/api/users');
    if (res.success) setUsers(res.data || []);
    setLoading(false);
  }

  function openCreate() {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'sales-man', shopIds: [] });
    setDialogOpen(true);
  }

  function openEdit(user: UserRecord) {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role, shopIds: user.shopIds || [] });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name || !form.email) { toast.error('Name and email are required'); return; }
    if (!editUser && !form.password) { toast.error('Password is required for new users'); return; }
    setSaving(true);
    try {
      if (editUser) {
        const body: any = { name: form.name, email: form.email, role: form.role, shopIds: form.shopIds };
        if (form.password) body.password = form.password;
        const res = await apiFetch(`/api/users/${editUser._id}`, { method: 'PUT', body: JSON.stringify(body) });
        if (res.success) { toast.success('User updated'); loadUsers(); setDialogOpen(false); }
        else toast.error(res.message || 'Update failed');
      } else {
        const res = await apiFetch('/api/users', { method: 'POST', body: JSON.stringify(form) });
        if (res.success) { toast.success('User created'); loadUsers(); setDialogOpen(false); }
        else toast.error(res.message || 'Create failed');
      }
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  async function handleDelete(user: UserRecord) {
    if (!confirm(`Deactivate ${user.name}?`)) return;
    const res = await apiFetch(`/api/users/${user._id}`, { method: 'DELETE' });
    if (res.success) { toast.success('User deactivated'); loadUsers(); }
    else toast.error(res.message || 'Delete failed');
  }

  function toggleShop(shopId: string) {
    setForm(prev => ({
      ...prev,
      shopIds: prev.shopIds.includes(shopId)
        ? prev.shopIds.filter(id => id !== shopId)
        : [...prev.shopIds, shopId],
    }));
  }

  const roleColors: Record<string, string> = {
    'super-admin': 'bg-amber-50 text-amber-700 border-amber-200',
    'admin': 'bg-blue-50 text-blue-700 border-blue-200',
    'sales-man': 'bg-green-50 text-green-700 border-green-200',
  };

  const columns = [
    { key: 'name', label: 'Name', render: (row: UserRecord) => <span className="font-medium text-gray-900">{row.name}</span> },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role', render: (row: UserRecord) => (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${roleColors[row.role] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
        <Shield className="w-3 h-3" />
        {row.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    )},
    { key: 'shops', label: 'Shops', render: (row: UserRecord) => {
      const userShops = shops.filter(s => row.shopIds?.includes(s._id));
      return userShops.length > 0 ? userShops.map(s => s.name).join(', ') : <span className="text-gray-400 text-xs">None</span>;
    }},
    { key: 'status', label: 'Status', render: (row: UserRecord) => (
      <Badge variant={row.isActive ? 'default' : 'secondary'} className={row.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500'}>
        {row.isActive ? 'Active' : 'Inactive'}
      </Badge>
    )},
    { key: 'actions', label: '', render: (row: UserRecord) => {
      if (row._id === payload?.userId) return null;
      return (
        <div className="flex items-center gap-1">
          {hasPermission('users', 'update') && <button onClick={() => openEdit(row)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>}
          {hasPermission('users', 'delete') && row.isActive && <button onClick={() => handleDelete(row)} className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>
      );
    }},
  ];

  if (!hasPermission('users', 'read')) return <div className="text-center py-12 text-sm text-gray-400">You don't have permission to view users</div>;

  return (
    <div>
      <PageHeader title="User Management" description="Manage users and their roles" action={hasPermission('users', 'create') ? <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs h-7" onClick={openCreate}><UserPlus className="w-3 h-3 mr-1" /> Add User</Button> : undefined} />

      <DataTable columns={columns} data={users} emptyMessage="No users found" />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editUser ? 'Edit User' : 'Create User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" className="text-sm h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@example.com" className="text-sm h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editUser ? 'Leave blank to keep current' : 'At least 6 characters'} className="text-sm h-9" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger className="text-sm h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {payload?.role === 'super-admin' && <SelectItem value="super-admin">Super Admin</SelectItem>}
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sales-man">Sales Man</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Shop Access</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {shops.filter(s => s.isActive).map(shop => (
                  <button key={shop._id} type="button" onClick={() => toggleShop(shop._id)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${form.shopIds.includes(shop._id) ? 'bg-green-50 border-green-300 text-green-700 font-medium' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    {shop.name}
                  </button>
                ))}
                {shops.filter(s => s.isActive).length === 0 && <span className="text-xs text-gray-400">No shops available</span>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="text-sm h-8">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white text-sm h-8">
              {saving ? 'Saving...' : editUser ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
