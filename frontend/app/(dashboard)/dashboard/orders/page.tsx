"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Eye,
  Download,
  MoreVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ordersAPI } from "@/lib/api/orders.api";
import { arrayFrom } from "@/lib/api/arrayFrom";

type Order = {
  id: string;
  orderNumber: string;
  customer: string;
  items: number;
  amount: number;
  status: string;
  date: string;
};

const statusFilters = ["All", "New", "Processing", "Shipped", "Delivered", "Returned", "Cancelled"];

const statusColors: Record<string, string> = {
  Processing: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  Shipped: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  Delivered: "bg-green-100 text-green-700",
  DELIVERED: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-700",
  Returned: "bg-purple-100 text-purple-700",
  RETURNED: "bg-purple-100 text-purple-700",
  New: "bg-gray-100 text-gray-700",
  NEW: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  READY_TO_SHIP: "bg-cyan-100 text-cyan-700",
  FAILED_DELIVERY: "bg-red-100 text-red-700",
};

export default function OrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ordersAPI.list({ limit: 100 });
        const list = arrayFrom<any>(res, ["orders"]);

        console.log("[orders] response:", res, "→ list:", list);

        if (!res.success && list.length === 0) {
          setError(res.error?.message || "Failed to load orders");
          return;
        }

        setOrders(
          list.map((o: any) => ({
            id: String(o.id),
            orderNumber: String(o.orderNumber ?? o.id ?? ""),
            customer: o.customerName ?? o.customer?.name ?? "Unknown",
            items: o.items?.length ?? o.itemsCount ?? o.totalItems ?? 0,
            amount: Number(o.total ?? o.amount ?? 0),
            status: o.status ?? "NEW",
            date: o.createdAt
              ? new Date(o.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : o.date ?? "-",
          }))
        );
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load orders"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const matchesStatus =
          selectedStatus === "All" ||
          order.status.toUpperCase() === selectedStatus.toUpperCase();
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          order.customer.toLowerCase().includes(q) ||
          order.orderNumber.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      }),
    [orders, selectedStatus, searchQuery]
  );

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) =>
      ["NEW", "CONFIRMED", "PROCESSING"].includes(o.status.toUpperCase())
    ).length;
    const shipped = orders.filter((o) => o.status.toUpperCase() === "SHIPPED").length;
    const delivered = orders.filter((o) => o.status.toUpperCase() === "DELIVERED").length;
    const returned = orders.filter((o) => o.status.toUpperCase() === "RETURNED").length;
    return { total, pending, shipped, delivered, returned };
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600">Manage all your orders in one place</p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow duration-200">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { label: "Total Orders", value: stats.total, color: "text-blue-600" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          { label: "Shipped", value: stats.shipped, color: "text-blue-600" },
          { label: "Delivered", value: stats.delivered, color: "text-green-600" },
          { label: "Returned", value: stats.returned, color: "text-red-600" },
        ].map((stat, index) => (
          <div key={index} className="rounded-lg border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search orders by ID or customer..."
            className="pl-9 bg-white border-gray-200 focus:border-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Orders Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm font-medium text-gray-600">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-center">Items</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    Loading orders...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/orders/${order.id}`}>
                        <span className="font-medium text-blue-600 hover:underline">
                          #{order.orderNumber}
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {order.customer}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {order.items}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      Rs. {order.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${statusColors[order.status] ?? "bg-gray-100 text-gray-700"} border-0`}
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{order.date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/orders/${order.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-gray-100"
                          >
                            <Eye className="h-4 w-4 text-gray-400" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-gray-100"
                          onClick={() => window.print()}
                        >
                          <Download className="h-4 w-4 text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-gray-100"
                        >
                          <MoreVertical className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}