"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { dashboardAPI } from "@/lib/api/dashboard.api";

type LowStockItem = {
  id: string;
  name: string;
  stock: number;
  min: number;
};

export function LowStock() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardAPI.lowStock(5);
        if (res.success) {
          const payload: any = res.data;
          const list: any[] = Array.isArray(payload)
            ? payload
            : payload?.products ?? payload?.items ?? [];

          setItems(
            list.map((p: any) => ({
              id: String(p.id),
              name: p.name ?? "Unnamed",
              stock: Number(p.currentStock ?? p.stock ?? 0),
              min: Number(p.lowStockThreshold ?? p.min ?? 5),
            }))
          );
        } else {
          setError(res.error?.message || "Failed to load low stock items");
        }
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load low stock items"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Low Stock Alert</h3>
        </div>
        <Link href="/dashboard/inventory">
          <Button variant="ghost" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">
            View Inventory →
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2 sm:space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-50" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          All products are well stocked.
        </p>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg bg-red-50 p-3 sm:p-4"
            >
              <div>
                <p className="text-sm sm:text-base font-medium text-gray-900">
                  {item.name}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">Min: {item.min}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-sm sm:text-base font-semibold text-red-600">
                  {item.stock} left
                </span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  Low
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}