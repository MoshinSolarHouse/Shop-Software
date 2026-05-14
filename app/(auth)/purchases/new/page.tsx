"use client";

import React, { useEffect, useState } from "react";
import { useShop } from "@/lib/shop-context";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { formatPKR } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewPurchasePage() {
  const router = useRouter();
  const { activeShopId } = useShop();
  const { hasPermission } = useAuth();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    supplierId: "",
    date: new Date().toISOString().split("T")[0],
    referenceNo: "",
    items: [{ productId: "", qty: 0, unitPrice: 0 }],
    paidAmount: 0,
    paymentMethod: "cash",
    notes: "",
  });

  useEffect(() => {
    if (!hasPermission("purchases", "create")) {
      toast.error("You do not have permission to create purchases");
      router.push("/purchases");
      return;
    }
    if (activeShopId) {
      loadData();
    }
  }, [activeShopId]);

  async function loadData() {
    setLoadingData(true);
    try {
      const [supplierRes, productRes] = await Promise.all([
        apiFetch(`/api/suppliers?shopId=${activeShopId}`),
        apiFetch(`/api/products?shopId=${activeShopId}`),
      ]);
      if (supplierRes.success) setSuppliers(supplierRes.data);
      if (productRes.success) setProducts(productRes.data);
    } catch (err: any) {
      toast.error("Failed to load data: " + err.message);
    } finally {
      setLoadingData(false);
    }
  }

  function addItem() {
    const newItems = [...form.items, { productId: "", qty: 0, unitPrice: 0 }];
    const newTotal = newItems.reduce(
      (sum, item) => sum + (item.qty * item.unitPrice || 0),
      0,
    );
    setForm({ ...form, items: newItems, paidAmount: newTotal });
  }

  function removeItem(index: number) {
    const newItems = form.items.filter((_, i) => i !== index);
    const newTotal = newItems.reduce(
      (sum, item) => sum + (item.qty * item.unitPrice || 0),
      0,
    );
    setForm({ ...form, items: newItems, paidAmount: newTotal });
  }

  //   function addItem() {
  //     setForm({
  //       ...form,
  //       items: [...form.items, { productId: '', qty: 0, unitPrice: 0 }],
  //     });
  //   }

  //   function removeItem(index: number) {
  //     setForm({
  //       ...form,
  //       items: form.items.filter((_, i) => i !== index),
  //     });
  //   }

  //   function updateItem(index: number, field: string, value: any) {
  //     const newItems = [...form.items];
  //     newItems[index] = { ...newItems[index], [field]: value };
  //     setForm({ ...form, items: newItems });
  //   }

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Recalculate total and auto-fill paidAmount
    const newTotal = newItems.reduce(
      (sum, item) => sum + (item.qty * item.unitPrice || 0),
      0,
    );

    setForm({ ...form, items: newItems, paidAmount: newTotal });
  }

  function calculateTotalAmount() {
    return form.items.reduce(
      (sum, item) => sum + (item.qty * item.unitPrice || 0),
      0,
    );
  }

  async function handleSave() {
    if (!form.supplierId) {
      toast.error("Please select a supplier");
      return;
    }
    if (
      form.items.some(
        (item) => !item.productId || item.qty <= 0 || item.unitPrice <= 0,
      )
    ) {
      toast.error("Please fill all item details");
      return;
    }

    setSaving(true);
    try {
      const totalAmount = calculateTotalAmount();
      const payload = {
        shopId: activeShopId,
        ...form,
        items: form.items.map((item) => ({
          ...item,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
        })),
        paidAmount: Number(form.paidAmount) || 0,
        totalAmount,
        dueAmount: totalAmount - (Number(form.paidAmount) || 0),
      };

      const res = await apiFetch("/api/purchases", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success("Purchase created successfully");
        router.push("/purchases");
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const totalAmount = calculateTotalAmount();
  const dueAmount = totalAmount - form.paidAmount;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/purchases"
          className="flex items-center gap-1 text-gray-600 hover:text-gray-700 mb-2 text-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Purchases
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Create Purchase Order
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">
            Total Amount
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {formatPKR(totalAmount)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">
            Paid
          </p>
          <p className="text-2xl font-bold text-green-600">
            {formatPKR(form.paidAmount)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-gray-600 uppercase mb-1">
            Due
          </p>
          <p
            className={`text-2xl font-bold ${dueAmount > 0 ? "text-red-600" : "text-gray-400"}`}
          >
            {formatPKR(dueAmount)}
          </p>
        </Card>
      </div>

      <Card className="p-6 space-y-6">
        {/* Header Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supplier *
            </label>
            <select
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">Select Supplier</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date *
            </label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="text-sm h-10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference # (Optional)
            </label>
            <Input
              value={form.referenceNo}
              onChange={(e) =>
                setForm({ ...form, referenceNo: e.target.value })
              }
              placeholder="PO-001"
              className="text-sm h-10"
            />
          </div>
        </div>

        {/* Items Table */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Items</h3>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addItem}
              className="text-xs h-8"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Item
            </Button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Product
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Unit Price
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700">
                    Total
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => {
                  const itemTotal = item.qty * item.unitPrice;
                  return (
                    <tr
                      key={idx}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      <td className="px-4 py-2">
                        <select
                          value={item.productId}
                          onChange={(e) =>
                            updateItem(idx, "productId", e.target.value)
                          }
                          className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p._id} value={p._id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.qty || ""}
                          onChange={(e) =>
                            updateItem(idx, "qty", Number(e.target.value))
                          }
                          className="text-right text-xs h-8"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice || ""}
                          onChange={(e) =>
                            updateItem(idx, "unitPrice", Number(e.target.value))
                          }
                          className="text-right text-xs h-8"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        {formatPKR(itemTotal)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-2 text-right font-semibold text-gray-700"
                  >
                    Grand Total:
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-gray-900 text-base">
                    {formatPKR(totalAmount)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment Information */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount Paid
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.paidAmount || ""}
              onChange={(e) =>
                setForm({ ...form, paidAmount: Number(e.target.value) })
              }
              className="text-sm h-10"
              placeholder="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="credit">Credit</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Add any notes about this purchase..."
            rows={3}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Link href="/purchases">
            <Button variant="outline" size="sm" className="text-sm h-9">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700 text-white text-sm h-9"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Saving...
              </>
            ) : (
              "Create Purchase"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
