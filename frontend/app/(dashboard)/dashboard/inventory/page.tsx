"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { inventoryAPI } from "@/lib/api/inventory.api";
import type { Product } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Package,
  Boxes,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  TrendingUp,
} from "lucide-react";

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

const statusFilters: Array<"All" | StockStatus> = [
  "All",
  "In Stock",
  "Low Stock",
  "Out of Stock",
];

const STATUS_COLORS: Record<StockStatus, string> = {
  "In Stock": "bg-green-100 text-green-700",
  "Low Stock": "bg-yellow-100 text-yellow-700",
  "Out of Stock": "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<StockStatus, React.ReactNode> = {
  "In Stock": <CheckCircle className="h-3.5 w-3.5" />,
  "Low Stock": <AlertCircle className="h-3.5 w-3.5" />,
  "Out of Stock": <XCircle className="h-3.5 w-3.5" />,
};

function deriveStockStatus(stock: number, threshold: number): StockStatus {
  if (stock === 0) return "Out of Stock";
  if (stock <= threshold) return "Low Stock";
  return "In Stock";
}

export default function InventoryPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [summary, setSummary] = useState<{
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"All" | StockStatus>("All");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [invRes, sumRes] = await Promise.all([
          inventoryAPI.list({ search: search || undefined }),
          inventoryAPI.summary(),
        ]);

        if (invRes.success && Array.isArray(invRes.data)) {
          setItems(invRes.data);
        } else if (invRes.error) {
          setError(invRes.error.message || "Failed to load inventory");
        }

        if (sumRes.success && sumRes.data) {
          setSummary(sumRes.data);
        }
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load inventory"
        );
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search]);

  const filteredItems = useMemo(() => {
    return items.filter((p) => {
      if (selectedStatus === "All") return true;
      const status = deriveStockStatus(p.currentStock, p.lowStockThreshold);
      return status === selectedStatus;
    });
  }, [items, selectedStatus]);

  const stats = useMemo(() => {
    const total = summary?.totalItems ?? items.length;
    const low = summary?.lowStockCount ?? 0;
    const out = summary?.outOfStockCount ?? 0;
    const inStock = Math.max(total - low - out, 0);
    return { total, inStock, low, out };
  }, [summary, items]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-600">
            Track stock levels across all your products
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total Items",
            value: stats.total,
            icon: Boxes,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "In Stock",
            value: stats.inStock,
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Low Stock",
            value: stats.low,
            icon: AlertCircle,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
          {
            label: "Out of Stock",
            value: stats.out,
            icon: XCircle,
            color: "text-red-600",
            bg: "bg-red-50",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <div className={`rounded-lg ${stat.bg} p-1.5`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`mt-2 text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by product name or SKU..."
            className="pl-9 bg-white border-gray-200 focus:border-blue-500 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                selectedStatus === status
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Inventory Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm font-medium text-gray-600">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Threshold</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((p) => {
                  const status = deriveStockStatus(
                    p.currentStock,
                    p.lowStockThreshold
                  );
                  const stockColor =
                    p.currentStock === 0
                      ? "text-red-600"
                      : p.currentStock <= p.lowStockThreshold
                      ? "text-yellow-600"
                      : "text-gray-900";
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                            <Package className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {p.name}
                            </p>
                            {p.category && (
                              <p className="text-xs text-gray-500">
                                {p.category}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600">
                        {p.sku || "—"}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        <span className={stockColor}>{p.currentStock}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {p.lowStockThreshold}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${STATUS_COLORS[status]} border-0 flex items-center gap-1 w-fit`}
                        >
                          {STATUS_ICONS[status]}
                          {status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/dashboard/inventory/${p.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-blue-50"
                              title="Manage stock"
                            >
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/products/${p.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-gray-100"
                              title="View product"
                            >
                              <Eye className="h-4 w-4 text-gray-400" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}