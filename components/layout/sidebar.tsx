'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, ShoppingCart, Users, ChartBar as BarChart3, Store, ChevronLeft, ChevronRight, FolderOpen, Shield } from 'lucide-react';

const navGroups = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, resource: 'dashboard', action: 'read' },
      { href: '/shops', label: 'Shops', icon: Store, resource: 'shops', action: 'read' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { href: '/categories', label: 'Categories', icon: FolderOpen, resource: 'categories', action: 'read' },
      { href: '/products', label: 'Products', icon: Package, resource: 'products', action: 'read' },
    ],
  },
  {
    label: 'Transactions',
    items: [
      { href: '/sales', label: 'Sales', icon: ShoppingCart, resource: 'sales', action: 'read' },
    ],
  },
  {
    label: 'Parties',
    items: [
      { href: '/customers', label: 'Customers', icon: Users, resource: 'customers', action: 'read' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/reports', label: 'Reports', icon: BarChart3, resource: 'reports', action: 'read' },
    ],
  },
  {
    label: 'Admin',
    items: [
      { href: '/users', label: 'Users', icon: Users, resource: 'users', action: 'read' },
      { href: '/permissions', label: 'Permissions', icon: Shield, resource: 'permissions', action: 'read' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn('flex flex-col border-r border-gray-200 bg-white transition-all duration-200 h-screen sticky top-0', collapsed ? 'w-16' : 'w-52')}>
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
        {!collapsed && <span className="text-sm font-semibold text-green-700">BizManager</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded hover:bg-gray-100 text-gray-500">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => hasPermission(item.resource, item.action));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-2">
              {!collapsed && <div className="px-3 py-1 text-xs font-medium text-gray-400 uppercase tracking-wider">{group.label}</div>}
              {visibleItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link key={item.href} href={item.href} className={cn('flex items-center gap-2 px-3 py-1.5 mx-1 rounded-md text-sm transition-colors', isActive ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')} title={collapsed ? item.label : undefined}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
