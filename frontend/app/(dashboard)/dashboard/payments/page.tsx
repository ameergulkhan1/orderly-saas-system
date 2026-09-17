"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  TrendingUp,
  Search,
  Eye,
  Download,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { paymentsAPI } from "@/lib/api/payments.api";
import { ordersAPI } from "@/lib/api/orders.api";
import type { Payment, PaymentMethod, PaymentStatus, Order } from "@/lib/api/types";

type RowPayment = {
  id: string;
  orderId: string;
  orderNumber: string;
  customer: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  transactionId: string;
};

const statusColors: Record<string, string> = {
  PAID: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  PARTIAL: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-purple-100 text-purple-700",
};

const statusIcons: Record<string, React.ReactNode> = {
  PAID: <CheckCircle className="h-4 w-4 text-green-600" />,
  PENDING: <Clock className="h-4 w-4 text-yellow-600" />,
  PARTIAL: <AlertCircle className="h-4 w-4 text-blue-600" />,
  FAILED: <XCircle className="h-4 w-4 text-red-600" />,
  REFUNDED: <XCircle className="h-4 w-4 text-purple-600" />,
};

const methodColors: Record<string, string> = {
  COD: "bg-gray-100 text-gray-700",
  CASH: "bg-green-100 text-green-700",
  BANK_TRANSFER: "bg-blue-100 text-blue-700",
  EASYPAISA: "bg-orange-100 text-orange-700",
  JAZZCASH: "bg-purple-100 text-purple-700",
  CARD: "bg-indigo-100 text-indigo-700",
  OTHER: "bg-gray-100 text-gray-700",
};

const methodLabels: Record<string, string> = {
  COD: "COD",
  CASH: "Cash",
  BANK_TRANSFER: "Bank Transfer",
  EASYPAISA: "Easypaisa",
  JAZZCASH: "JazzCash",
  CARD: "Card",
  OTHER: "Other",
};

const statusFilters: Array<"All" | PaymentStatus> = [
  "All",
  "PAID",
  "PENDING",
  "PARTIAL",
  "FAILED",
  "REFUNDED",
];

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"All" | PaymentStatus>("All");
  const [payments, setPayments] = useState<RowPayment[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [serverSummary, setServerSummary] = useState({
    totalReceived: 0,
    totalCOD: 0,
    totalFailed: 0,
    totalRefunded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [listRes, sumRes, ordersRes] = await Promise.all([
          paymentsAPI.list({ limit: 100 }),
          paymentsAPI.summary(),
          ordersAPI.list({ limit: 100 }),
        ]);

        if (listRes.success && Array.isArray(listRes.data)) {
          setPayments(
            listRes.data.map((p: Payment & any) => ({
              id: String(p.id),
              orderId: String(p.orderId ?? p.order?.id ?? ""),
              orderNumber: String(
                p.order?.orderNumber ?? p.orderNumber ?? "-"
              ),
              customer: String(
                p.order?.customerName ??
                  p.customerName ??
                  p.customer?.name ??
                  "Unknown"
              ),
              amount: Number(p.amount ?? 0),
              method: (p.method ?? "OTHER") as PaymentMethod,
              status: (p.status ?? "PENDING") as PaymentStatus,
              date: p.createdAt
                ? new Date(p.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "-",
              transactionId: String(p.reference ?? "-"),
            }))
          );
        } else if (listRes.error) {
          setError(listRes.error.message || "Failed to load payments");
        }

        if (sumRes.success && sumRes.data) {
          setServerSummary({
            totalReceived: Number(sumRes.data.totalReceived ?? 0),
            totalCOD: Number(sumRes.data.totalCOD ?? 0),
            totalFailed: Number(sumRes.data.totalFailed ?? 0),
            totalRefunded: Number(sumRes.data.totalRefunded ?? 0),
          });
        }

        if (ordersRes.success && Array.isArray(ordersRes.data)) {
          setOrders(ordersRes.data);
        }
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load payments"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Compute outstanding from orders — the true "pending" amount
  const summary = useMemo(() => {
    // For each order, subtract recorded payments from total
    const paymentsByOrder = payments.reduce<Record<string, number>>((acc, p) => {
      if (p.orderId && p.status === "PAID") {
        acc[p.orderId] = (acc[p.orderId] ?? 0) + p.amount;
      }
      return acc;
    }, {});

    let pending = 0;
    for (const order of orders) {
      const orderTotal = Number(order.total ?? 0);
      const paid = paymentsByOrder[order.id] ?? 0;
      const remaining = Math.max(orderTotal - paid, 0);

      // Only count as pending if the order is not cancelled/returned
      const status = String(order.status ?? "").toUpperCase();
      if (status === "CANCELLED" || status === "RETURNED") continue;

      pending += remaining;
    }

    return {
      totalReceived: serverSummary.totalReceived,
      totalPending: pending,
      totalCOD: serverSummary.totalCOD,
      totalFailed: serverSummary.totalFailed,
      totalRefunded: serverSummary.totalRefunded,
    };
  }, [payments, orders, serverSummary]);

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const matchesStatus =
          selectedStatus === "All" || payment.status === selectedStatus;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          payment.customer.toLowerCase().includes(q) ||
          payment.orderNumber.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      }),
    [payments, selectedStatus, searchQuery]
  );

  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const codCount = payments.filter((p) => p.method === "COD").length;
  const ordersWithBalance = orders.filter((o) => {
    const orderTotal = Number(o.total ?? 0);
    const paid = payments
      .filter((p) => p.orderId === o.id && p.status === "PAID")
      .reduce((s, p) => s + p.amount, 0);
    return orderTotal - paid > 0;
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-600">Track and manage all payments</p>
        </div>
        <Button
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow duration-200"
          onClick={() => window.print()}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Received</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                Rs. {summary.totalReceived.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="mt-1 text-xs text-green-600">
            {paidCount} {paidCount === 1 ? "payment" : "payments"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="mt-2 text-3xl font-bold text-yellow-600">
                Rs. {summary.totalPending.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-yellow-50 p-3">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="mt-1 text-xs text-yellow-600">
            ⚠️ {ordersWithBalance} {ordersWithBalance === 1 ? "order" : "orders"} with balance
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">COD Orders</p>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                Rs. {summary.totalCOD.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3">
              <CreditCard className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-1 text-xs text-purple-600">
            {codCount} COD {codCount === 1 ? "order" : "orders"}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by order or customer..."
            className="pl-9 bg-white border-gray-200 focus:border-blue-500 h-11"
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
              {status === "All" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Payments Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm font-medium text-gray-600">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      {payment.orderId ? (
                        <Link href={`/dashboard/orders/${payment.orderId}`}>
                          <span className="font-medium text-blue-600 hover:underline">
                            #{payment.orderNumber}
                          </span>
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-500">
                          #{payment.orderNumber}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {payment.customer}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      Rs. {payment.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${methodColors[payment.method] ?? "bg-gray-100 text-gray-700"} border-0`}
                      >
                        {methodLabels[payment.method] ?? payment.method}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${statusColors[payment.status] ?? "bg-gray-100 text-gray-700"} border-0 flex items-center gap-1 w-fit`}
                      >
                        {statusIcons[payment.status]}
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{payment.date}</td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">
                      {payment.transactionId}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/payments/${payment.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                            <Eye className="h-4 w-4 text-gray-400" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
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