'use client';

import React, { useEffect, useState } from 'react';
import { useShop } from '@/lib/shop-context';
import { useAuth } from '@/lib/auth-context';
import { apiFetch } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { SummaryCard } from '@/components/ui/summary-card';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { formatPKR, formatDate } from '@/lib/utils';
import { generateSaleInvoice, generateCustomerLedger, openPrintWindow } from '@/lib/invoice';
import { ShoppingCart, TrendingUp, Users, Download } from 'lucide-react';

type ReportTab = 'sales' | 'profit' | 'customer-dues';

export default function ReportsPage() {
  const { activeShopId, activeShop } = useShop();
  const { hasPermission, payload } = useAuth();
  const [tab, setTab] = useState<ReportTab>('sales');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [salesData, setSalesData] = useState<any[]>([]);
  const [profitData, setProfitData] = useState<any[]>([]);
  const [customerDues, setCustomerDues] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalSales: 0, totalProfit: 0, totalCustDue: 0 });

  const isSalesMan = payload?.role === 'sales-man';

  useEffect(() => { if (activeShopId) loadReports(); }, [activeShopId, period]);

  async function loadReports() {
    if (!activeShopId) return;
    const today = new Date();
    let dateFrom = today.toISOString().slice(0, 10);
    if (period === 'weekly') { const d = new Date(today); d.setDate(d.getDate() - 7); dateFrom = d.toISOString().slice(0, 10); }
    else if (period === 'monthly') { const d = new Date(today); d.setMonth(d.getMonth() - 1); dateFrom = d.toISOString().slice(0, 10); }
    const [salesRes, profitRes, custRes] = await Promise.all([
      apiFetch(`/api/reports?shopId=${activeShopId}&type=sales&dateFrom=${dateFrom}`),
      apiFetch(`/api/reports?shopId=${activeShopId}&type=profit&dateFrom=${dateFrom}`),
      apiFetch(`/api/reports?shopId=${activeShopId}&type=customer-dues`),
    ]);
    if (salesRes.success) setSalesData(salesRes.data || []);
    if (profitRes.success) setProfitData(profitRes.data || []);
    if (custRes.success) setCustomerDues(custRes.data || []);
    setSummary({
      totalSales: (salesRes.data || []).reduce((s: number, r: any) => s + (r.totalAmount || 0), 0),
      totalProfit: (profitRes.data || []).reduce((s: number, r: any) => s + (r.profit || 0), 0),
      totalCustDue: (custRes.data || []).reduce((s: number, r: any) => s + (r.totalDue || 0), 0),
    });
  }

  function downloadReportPDF() {
    const shopName = activeShop?.name || 'Shop';
    const tabLabel = tab === 'sales' ? 'Sales Report' : tab === 'profit' ? 'Profit Report' : 'Customer Dues Report';
    const periodLabel = period.charAt(0).toUpperCase() + period.slice(1);
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let tableRows = '';
    if (tab === 'sales') {
      tableRows = salesData.map(r => `<tr><td>${formatDate(r.date)}</td><td>${r.isWalkIn ? 'Walk-in' : r.customerId?.name || '-'}</td><td style="text-align:right">${formatPKR(r.totalAmount)}</td><td style="text-align:right;color:${r.dueAmount > 0 ? '#dc2626' : '#16a34a'}">${formatPKR(r.dueAmount)}</td></tr>`).join('');
    } else if (tab === 'profit') {
      tableRows = profitData.map(r => `<tr><td>${formatDate(r.date)}</td><td style="text-align:right">${formatPKR(r.revenue)}</td><td style="text-align:right">${formatPKR(r.cost)}</td><td style="text-align:right;color:${r.profit >= 0 ? '#16a34a' : '#dc2626'};font-weight:600">${formatPKR(r.profit)}</td></tr>`).join('');
    } else {
      tableRows = customerDues.map(r => `<tr><td>${r.name}</td><td>${r.phone || '-'}</td><td style="text-align:right;color:#dc2626;font-weight:600">${formatPKR(r.totalDue)}</td></tr>`).join('');
    }

    const headers = tab === 'sales' ? '<th>Date</th><th>Customer</th><th style="text-align:right">Total</th><th style="text-align:right">Due</th>'
      : tab === 'profit' ? '<th>Date</th><th style="text-align:right">Revenue</th><th style="text-align:right">Cost</th><th style="text-align:right">Profit</th>'
      : '<th>Customer</th><th>Phone</th><th style="text-align:right">Due</th>';

    const summaryRow = tab === 'sales' ? `<div style="margin-top:16px;padding:10px 16px;background:#f0fdf4;border-radius:6px;display:flex;justify-content:space-between"><span style="font-weight:600">Total Sales</span><span style="font-weight:700;color:#16a34a">${formatPKR(summary.totalSales)}</span></div>`
      : tab === 'profit' ? `<div style="margin-top:16px;padding:10px 16px;background:#f0fdf4;border-radius:6px;display:flex;justify-content:space-between"><span style="font-weight:600">Total Profit</span><span style="font-weight:700;color:#16a34a">${formatPKR(summary.totalProfit)}</span></div>`
      : `<div style="margin-top:16px;padding:10px 16px;background:#fef2f2;border-radius:6px;display:flex;justify-content:space-between"><span style="font-weight:600">Total Dues</span><span style="font-weight:700;color:#dc2626">${formatPKR(summary.totalCustDue)}</span></div>`;

    const html = `<!DOCTYPE html><html><head><title>${tabLabel}</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; padding: 40px; }
      .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #16a34a; padding-bottom: 16px; }
      .shop-name { font-size: 22px; font-weight: 700; color: #16a34a; }
      .report-title { font-size: 14px; color: #6b7280; margin-top: 4px; }
      .meta { text-align: right; font-size: 12px; color: #6b7280; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { background: #f9fafb; padding: 10px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb; }
      td { padding: 10px 16px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
      tr:nth-child(even) { background: #f9fafb; }
      .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
      @media print { body { padding: 20px; } }
    </style></head><body>
      <div class="header">
        <div><div class="shop-name">${shopName}</div><div class="report-title">${tabLabel} &mdash; ${periodLabel}</div></div>
        <div class="meta"><div>Generated: ${date}</div><div>BizManager</div></div>
      </div>
      <table><thead><tr>${headers}</tr></thead><tbody>${tableRows || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;padding:24px">No data</td></tr>'}</tbody></table>
      ${summaryRow}
      <div class="footer">This report was auto-generated by BizManager &bull; ${shopName}</div>
    </body></html>`;

    openPrintWindow(html, tabLabel);
  }

  function downloadSaleInvoice(sale: any) {
    const shopName = activeShop?.name || 'Shop';
    const shopType = activeShop?.type || '';
    const html = generateSaleInvoice(sale, shopName, shopType);
    openPrintWindow(html, `Invoice-${(sale._id || '').slice(0, 8)}`);
  }

  function downloadCustomerStatement(customer: any) {
    const shopName = activeShop?.name || 'Shop';
    const shopType = activeShop?.type || '';
    const html = generateCustomerLedger(customer, [], shopName, shopType);
    openPrintWindow(html, `Statement-${customer.name}`);
  }

  if (!hasPermission('reports', 'read')) return <div className="text-center py-12 text-sm text-gray-400">You don't have permission to view reports</div>;
  if (!activeShopId) return <div className="text-center py-12 text-sm text-gray-400">Select a shop first</div>;

  const tabs: { key: ReportTab; label: string }[] = [
    { key: 'sales', label: 'Sales' },
    ...(isSalesMan ? [] : [{ key: 'profit' as ReportTab, label: 'Profit' }]),
    { key: 'customer-dues', label: 'Customer Dues' },
  ];

  const salesColumns = [
    { key: 'date', label: 'Date' },
    { key: 'customer', label: 'Customer', render: (row: any) => row.isWalkIn ? 'Walk-in' : row.customerId?.name || '-' },
    ...(!isSalesMan ? [{ key: 'totalAmount', label: 'Total', render: (row: any) => formatPKR(row.totalAmount) }] : []),
    { key: 'dueAmount', label: 'Due', render: (row: any) => <span className={row.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}>{formatPKR(row.dueAmount)}</span> },
    { key: 'invoice', label: '', render: (row: any) => (
      <button onClick={() => downloadSaleInvoice(row)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 inline-flex" title="Download Invoice"><Download className="w-3 h-3" /></button>
    )},
  ];

  const profitColumns = [
    { key: 'date', label: 'Date' },
    { key: 'revenue', label: 'Revenue', render: (row: any) => formatPKR(row.revenue) },
    { key: 'cost', label: 'Cost', render: (row: any) => formatPKR(row.cost) },
    { key: 'profit', label: 'Profit', render: (row: any) => <span className={row.profit >= 0 ? 'text-green-600 font-medium' : 'text-red-600'}>{formatPKR(row.profit)}</span> },
  ];

  const custDueColumns = [
    { key: 'name', label: 'Customer', render: (row: any) => <span className="font-medium">{row.name}</span> },
    { key: 'phone', label: 'Phone' },
    { key: 'totalDue', label: 'Due', render: (row: any) => <span className="text-red-600 font-medium">{formatPKR(row.totalDue)}</span> },
    { key: 'statement', label: '', render: (row: any) => (
      <button onClick={() => downloadCustomerStatement(row)} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 inline-flex" title="Download Statement"><Download className="w-3 h-3" /></button>
    )},
  ];

  return (
    <div>
      <PageHeader title="Reports" description="Business analytics" action={<Button size="sm" variant="outline" className="text-xs h-7" onClick={downloadReportPDF}><Download className="w-3 h-3 mr-1" /> Download Report</Button>} />

      {!isSalesMan && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <SummaryCard title="Total Sales" value={formatPKR(summary.totalSales)} icon={<ShoppingCart className="w-5 h-5" />} />
          <SummaryCard title="Estimated Profit" value={formatPKR(summary.totalProfit)} icon={<TrendingUp className="w-5 h-5" />} />
          <SummaryCard title="Customer Dues" value={formatPKR(summary.totalCustDue)} icon={<Users className="w-5 h-5" />} />
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {tabs.map((t) => <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 text-xs font-medium transition-colors ${tab === t.key ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>{t.label}</button>)}
        </div>
        {(tab === 'sales' || tab === 'profit') && <select value={period} onChange={(e) => setPeriod(e.target.value as any)} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select>}
      </div>
      {tab === 'sales' && <DataTable columns={salesColumns} data={salesData} emptyMessage="No sales data" />}
      {tab === 'profit' && !isSalesMan && <DataTable columns={profitColumns} data={profitData} emptyMessage="No profit data" />}
      {tab === 'customer-dues' && <DataTable columns={custDueColumns} data={customerDues} emptyMessage="No customer dues" />}
    </div>
  );
}
