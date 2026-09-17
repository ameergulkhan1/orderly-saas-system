"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { deliveriesAPI } from "@/lib/api/deliveries.api";
import type { Delivery, DeliveryStatus } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Truck,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  ExternalLink,
  MoreVertical,
  TrendingUp,
} from "lucide-react";

type RowDelivery = Delivery & {
  order?: {
    id?: string;
    orderNumber?: string;
    customerName?: string;
  };
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  READY_TO_SHIP: "bg-cyan-100 text-cyan-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  RETURNED: "bg-purple-100 text-purple-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  RETURNED: "Returned",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock className="h-3.5 w-3.5" />,
  READY_TO_SHIP: <Package className="h-3.5 w-3.5" />,
  SHIPPED: <Truck className="h-3.5 w-3.5" />,
  DELIVERED: <CheckCircle className="h-3.5 w-3.5" />,
  FAILED: <XCircle className="h-3.5 w-3.5" />,
  RETURNED: <AlertCircle className="h-3.5 w-3.5" />,
};

const STATUS_FILTERS: Array<"All" | DeliveryStatus> = [
  "All",
  "PENDING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
  "FAILED",
  "RETURNED",
];

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<RowDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"All" | DeliveryStatus>("All");

  const fetchDeliveries = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await deliveriesAPI.list({ limit: 100 });
      if (res.success && Array.isArray(res.data)) {
        setDeliveries(res.data as RowDelivery[]);
      } else if (res.error) {
        setError(res.error.message || "Failed to load deliveries");
      }
    } catch (err: any) {
      setError(
        err?.error?.message || err?.message || "Failed to load deliveries"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const matchesStatus =
        selectedStatus === "All" ||
        String(d.status).toUpperCase() === selectedStatus;
      const q = searchQuery.toLowerCase();
      const orderNumber = String(d.order?.orderNumber ?? "");
      const customer = String(d.order?.customerName ?? "");
      const tracking = String(d.trackingNumber ?? "");
      const courier = String(d.courier ?? "");
      const matchesSearch =
        orderNumber.toLowerCase().includes(q) ||
        customer.toLowerCase().includes(q) ||
        tracking.toLowerCase().includes(q) ||
        courier.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [deliveries, selectedStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = deliveries.length;
    const inTransit = deliveries.filter((d) =>
      ["READY_TO_SHIP", "SHIPPED"].includes(String(d.status).toUpperCase())
    ).length;
    const delivered = deliveries.filter(
      (d) => String(d.status).toUpperCase() === "DELIVERED"
    ).length;
    const pending = deliveries.filter(
      (d) => String(d.status).toUpperCase() === "PENDING"
    ).length;
    return { total, inTransit, delivered, pending };
  }, [deliveries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deliveries</h1>
          <p className="text-sm text-gray-600">
            Track and manage all your shipments
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total Deliveries",
            value: stats.total,
            icon: Truck,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Pending",
            value: stats.pending,
            icon: Clock,
            color: "text-yellow-600",
            bg: "bg-yellow-50",
          },
          {
            label: "In Transit",
            value: stats.inTransit,
            icon: TrendingUp,
            color: "text-cyan-600",
            bg: "bg-cyan-50",
          },
          {
            label: "Delivered",
            value: stats.delivered,
            icon: CheckCircle,
            color: "text-green-600",
            bg: "bg-green-50",
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
            placeholder="Search by order, customer, courier or tracking..."
            className="pl-9 bg-white border-gray-200 focus:border-blue-500 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                selectedStatus === status
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status === "All" ? "All" : STATUS_LABELS[status] ?? status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Deliveries Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm font-medium text-gray-600">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Courier</th>
                <th className="px-4 py-3">Tracking</th>
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
                    Loading deliveries...
                  </td>
                </tr>
              ) : filteredDeliveries.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No deliveries found
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((d) => {
                  const statusUpper = String(d.status).toUpperCase();
                  const orderId = d.order?.id ?? d.orderId;
                  const orderNumber = d.order?.orderNumber ?? d.orderId ?? "—";
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        {orderId ? (
                          <Link href={`/dashboard/orders/${orderId}`}>
                            <span className="font-medium text-blue-600 hover:underline">
                              #{orderNumber}
                            </span>
                          </Link>
                        ) : (
                          <span className="font-medium text-gray-500">
                            #{orderNumber}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {d.order?.customerName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {d.courier || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">
                        {d.trackingNumber || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={`${STATUS_COLORS[statusUpper] ?? "bg-gray-100 text-gray-700"} border-0 flex items-center gap-1 w-fit`}
                        >
                          {STATUS_ICONS[statusUpper]}
                          {STATUS_LABELS[statusUpper] ?? statusUpper}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/dashboard/deliveries/${d.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-gray-100"
                            >
                              <Eye className="h-4 w-4 text-gray-400" />
                            </Button>
                          </Link>
                          {orderId && (
                            <Link href={`/dashboard/orders/${orderId}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-blue-50"
                              >
                                <ExternalLink className="h-4 w-4 text-blue-500" />
                              </Button>
                            </Link>
                          )}
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