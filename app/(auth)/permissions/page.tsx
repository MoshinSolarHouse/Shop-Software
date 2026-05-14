'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { RESOURCES, ACTIONS } from '@/lib/auth-client';
import { Shield, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

type RoleKey = 'super-admin' | 'admin' | 'sales-man';
type PermMap = Record<string, string[]>;

const ROLES: { key: RoleKey; label: string; color: string }[] = [
  { key: 'super-admin', label: 'Super Admin', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'admin', label: 'Admin', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'sales-man', label: 'Sales Man', color: 'bg-green-50 text-green-700 border-green-200' },
];

const RESOURCE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  shops: 'Shops',
  products: 'Products',
  categories: 'Categories',
  customers: 'Customers',
  sales: 'Sales',
  suppliers: 'Suppliers',       // ADD
  purchases: 'Purchases',       // ADD
  payments: 'Payments',
  reports: 'Reports',
  users: 'Users',
  permissions: 'Permissions',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Create',
  read: 'Read',
  update: 'Update',
  delete: 'Delete',
};

const DEFAULTS: Record<RoleKey, PermMap> = {
  'super-admin': Object.fromEntries(RESOURCES.map(r => [r, [...ACTIONS]])),
  'admin': Object.fromEntries(RESOURCES.map(r => [r, [...ACTIONS]])),
  'sales-man': {
    dashboard: ['read'],
    products: ['read'],
    categories: ['read'],
    customers: ['read', 'create'],
    sales: ['read', 'create'],
    suppliers: [],                 // ADD — no access by default
    purchases: [],                 // ADD — no access by default
    payments: ['read', 'create'],
    reports: [],
    shops: ['read'],
    users: [],
    permissions: [],
  },
};

export default function PermissionsPage() {
  const { hasPermission, payload } = useAuth();
  const [permissions, setPermissions] = useState<Record<RoleKey, PermMap>>({ ...DEFAULTS });
  const [selectedRole, setSelectedRole] = useState<RoleKey>('admin');
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const res = await apiFetch('/api/users');
    if (res.success && res.data) {
      const perms: Record<RoleKey, PermMap> = { ...DEFAULTS };
      for (const u of res.data) {
        if (u.role && u.permissions && Object.keys(u.permissions).length > 0) {
          const role = u.role as RoleKey;
          if (!perms[role] || Object.keys(u.permissions).length >= Object.keys(perms[role] || {}).length) {
            perms[role] = u.permissions;
          }
        }
      }
      setPermissions(perms);
    }
  }

  function togglePerm(role: RoleKey, resource: string, action: string) {
    if (role === 'super-admin') { toast.error('Super Admin always has full access'); return; }
    setPermissions(prev => {
      const rolePerms = { ...prev[role] };
      const actions = [...(rolePerms[resource] || [])];
      const idx = actions.indexOf(action);
      if (idx >= 0) actions.splice(idx, 1);
      else actions.push(action);
      rolePerms[resource] = actions;
      return { ...prev, [role]: rolePerms };
    });
    setDirty(true);
  }

  function resetRole(role: RoleKey) {
    setPermissions(prev => ({ ...prev, [role]: DEFAULTS[role] }));
    setDirty(true);
    toast.info('Reset to defaults');
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiFetch('/api/users');
      if (!res.success) { toast.error('Failed to load users'); setSaving(false); return; }
      const allUsers = res.data || [];
      const updates = [];
      for (const u of allUsers) {
        if (u.role === selectedRole && u.role !== 'super-admin') {
          updates.push(
            apiFetch(`/api/users/${u._id}`, {
              method: 'PUT',
              body: JSON.stringify({ permissions: permissions[selectedRole as RoleKey] }),
            })
          );
        }
      }
      await Promise.all(updates);
      toast.success(`Permissions updated for ${updates.length} ${selectedRole.replace('-', ' ')} user(s)`);
      setDirty(false);
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  if (!hasPermission('permissions', 'read')) return <div className="text-center py-12 text-sm text-gray-400">You don't have permission to view permissions</div>;

  const currentPerms = permissions[selectedRole] || {};

  return (
    <div>
      <PageHeader title="Permission Matrix" description="Manage role-based access control" />

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <Shield className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Select Role</span>
          <div className="flex gap-1 ml-2">
            {ROLES.map(r => (
              <button key={r.key} onClick={() => setSelectedRole(r.key)}
                className={`px-3 py-1 text-xs font-medium rounded-md border transition-colors ${selectedRole === r.key ? r.color + ' ring-1 ring-offset-1 ring-green-300' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                {r.label}
              </button>
            ))}
          </div>
          {dirty && hasPermission('permissions', 'update') && (
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={() => resetRole(selectedRole)} className="text-xs h-7">
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white text-xs h-7">
                <Save className="w-3 h-3 mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        {selectedRole === 'super-admin' && (
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
            Super Admin has unrestricted access to all resources and actions. This cannot be modified.
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider w-40">Resource</th>
                {ACTIONS.map(action => (
                  <th key={action} className="text-center px-3 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wider">{ACTION_LABELS[action]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RESOURCES.map((resource, ri) => (
                <tr key={resource} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  <td className="px-4 py-2.5 font-medium text-gray-800 text-sm">{RESOURCE_LABELS[resource] || resource}</td>
                  {ACTIONS.map(action => {
                    const checked = selectedRole === 'super-admin' || (currentPerms[resource] || []).includes(action);
                    const disabled = selectedRole === 'super-admin';
                    return (
                      <td key={action} className="text-center px-3 py-2.5">
                        <button
                          onClick={() => togglePerm(selectedRole, resource, action)}
                          disabled={disabled}
                          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 hover:border-gray-400'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {checked && <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
