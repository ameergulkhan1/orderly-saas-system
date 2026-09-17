"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Link from "next/link";
import { dashboardAPI } from "@/lib/api/dashboard.api";

type RecentOrder = {
  id: string;
  orderNumber: string;
  customer: string;
  amount: string;
  status: string;
  date: string;
};

const statusColors: Record<string, string> = {
  Processing: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  Shipped: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  Delivered: "bg-green-100 text-green-700",
  DELIVERED: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
  NEW: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  READY_TO_SHIP: "bg-cyan-100 text-cyan-700",
  FAILED_DELIVERY: "bg-red-100 text-red-700",
  RETURNED: "bg-purple-100 text-purple-700",
};

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RecentOrders() {
  const [isMobile, setIsMobile] = useState(false);
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardAPI.recentOrders(5);
        if (res.success && Array.isArray(res.data)) {
          setOrders(
            res.data.map((o: any) => ({
              id: String(o.id),
              orderNumber: String(o.orderNumber ?? o.id ?? ""),
              customer: o.customerName ?? o.customer?.name ?? "Unknown",
              amount: `Rs. ${Number(o.total ?? 0).toLocaleString()}`,
              status: o.status ?? "NEW",
              date: formatDate(o.createdAt),
            }))
          );
        } else {
          setError(res.error?.message || "Failed to load recent orders");
        }
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load recent orders"
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
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Recent Orders</h3>
        <Link href="/dashboard/orders">
          <Button variant="ghost" className="text-xs sm:text-sm text-blue-600 hover:text-blue-700">
            View All →
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-50" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          No recent orders yet.
        </p>
      ) : isMobile ? (
        // Mobile Card View
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/dashboard/orders/${order.id}`}>
                    <span className="font-medium text-blue-600 hover:underline">
                      #{order.orderNumber}
                    </span>
                  </Link>
                  <p className="font-medium text-gray-900">{order.customer}</p>
                </div>
                <Badge
                  className={`${statusColors[order.status] ?? "bg-gray-100 text-gray-700"} border-0`}
                >
                  {order.status}
                </Badge>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold text-gray-900">{order.amount}</span>
                <span className="text-xs text-gray-500">{order.date}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/dashboard/orders/${order.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Desktop Table View
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="pb-3 font-medium">Order</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 text-sm font-medium text-gray-900">
                    #{order.orderNumber}
                  </td>
                  <td className="py-3 text-sm text-gray-600">{order.customer}</td>
                  <td className="py-3 text-sm font-semibold text-gray-900">
                    {order.amount}
                  </td>
                  <td className="py-3">
                    <Badge
                      className={`${statusColors[order.status] ?? "bg-gray-100 text-gray-700"} border-0`}
                    >
                      {order.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-500">{order.date}</td>
                  <td className="py-3">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-gray-100"
                      >
                        <Eye className="h-4 w-4 text-gray-400" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}