"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { paymentsAPI } from "@/lib/api/payments.api";
import { ordersAPI } from "@/lib/api/orders.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Payment, PaymentMethod, PaymentStatus, Order } from "@/lib/api/types";
import {
  ArrowLeft,
  CreditCard,
  User,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

type PaymentDetail = Payment & {
  order?: {
    id?: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  };
  customer?: {
    name?: string;
    phone?: string;
    email?: string;
  };
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [orderPayments, setOrderPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        // 1) Load the payment
        const res = await paymentsAPI.get(id);
        if (!res.success || !res.data) {
          setError(res.error?.message || "Payment not found");
          return;
        }

        const p = res.data as PaymentDetail;
        setPayment(p);

        // 2) Determine the order ID (either from nested order or top-level)
        const orderId = p.order?.id ?? (p as any).orderId;
        if (!orderId) return;

        // 3) Load the order + all its payments (for accurate outstanding calc)
        const [orderRes, orderPaymentsRes] = await Promise.all([
          ordersAPI.get(orderId),
          paymentsAPI.byOrder(orderId),
        ]);

        if (orderRes.success && orderRes.data) {
          setOrder(orderRes.data as Order);
        }
        if (orderPaymentsRes.success && Array.isArray(orderPaymentsRes.data)) {
          setOrderPayments(orderPaymentsRes.data);
        }
      } catch (err: any) {
        setError(err?.error?.message || err?.message || "Failed to load payment");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/payments"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Payments
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Payment not found"}
        </div>
      </div>
    );
  }

  const amount = Number(payment.amount ?? 0);
  const orderId = payment.order?.id ?? (payment as any).orderId ?? "";
  const orderNumber =
    order?.orderNumber ?? payment.order?.orderNumber ?? "—";
  const customerName =
    order?.customerName ??
    payment.order?.customerName ??
    payment.customer?.name ??
    "Unknown";
  const customerPhone =
    order?.customerPhone ??
    payment.order?.customerPhone ??
    payment.customer?.phone ??
    "—";
  const customerEmail =
    payment.order?.customerEmail ?? payment.customer?.email ?? "—";
  const method = payment.method as PaymentMethod;
  const status = payment.status as PaymentStatus;

  // Order payment summary (accurate outstanding)
  const orderTotal = Number(order?.total ?? 0);
  const orderPaid = orderPayments
    .filter((p) => String(p.status).toUpperCase() === "PAID")
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
  const orderRemaining = Math.max(orderTotal - orderPaid, 0);
  const orderPaymentStatus = String(
    order?.paymentStatus ??
      (orderRemaining <= 0 ? "PAID" : orderPaid > 0 ? "PARTIAL" : "PENDING")
  ).toUpperCase();

  const orderPaymentStatusColors: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    PARTIAL: "bg-blue-100 text-blue-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard/payments"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Payments
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Payment Details
          </h1>
          <p className="text-sm text-gray-500 font-mono">
            ID: {payment.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {orderId && (
            <Link href={`/dashboard/orders/${orderId}`}>
              <Button
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Order
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            className="border-gray-300"
            onClick={() => window.print()}
          >
            <FileText className="mr-2 h-4 w-4" />
            Print Receipt
          </Button>
        </div>
      </div>

      {/* Payment Info Card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-500 text-white">
              <DollarSign className="h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">
                  Rs. {amount.toLocaleString()}
                </h2>
                <Badge
                  className={`${statusColors[status] ?? "bg-gray-100 text-gray-700"} border-0 flex items-center gap-1`}
                >
                  {statusIcons[status]}
                  {status}
                </Badge>
                <Badge
                  className={`${methodColors[method] ?? "bg-gray-100 text-gray-700"} border-0`}
                >
                  {methodLabels[method] ?? method}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Paid on {formatDate(payment.createdAt)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="rounded-lg bg-blue-50 p-3 text-center min-w-[100px]">
              <p className="text-lg font-bold text-blue-600">
                {orderNumber !== "—" ? `#${orderNumber}` : "—"}
              </p>
              <p className="text-xs text-gray-600">Order</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center min-w-[100px]">
              <p className="text-lg font-bold text-purple-600 font-mono truncate max-w-[120px]">
                {payment.reference ?? "—"}
              </p>
              <p className="text-xs text-gray-600">Reference</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Payment Summary — NEW */}
      {order && orderTotal > 0 && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="flex items-center text-lg font-semibold text-gray-900">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              Order Payment Summary
            </h3>
            <Link href={`/dashboard/orders/${orderId}`}>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                View Order →
              </Button>
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-1">Order Total</p>
              <p className="text-lg font-bold text-gray-900">
                Rs. {orderTotal.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
              <p className="text-lg font-bold text-green-600">
                Rs. {orderPaid.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4">
              <p className="text-xs text-gray-500 mb-1">Remaining</p>
              <p className="text-lg font-bold text-red-600">
                Rs. {orderRemaining.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <Badge
                className={`${orderPaymentStatusColors[orderPaymentStatus] ?? "bg-gray-100 text-gray-700"} border-0 mt-1`}
              >
                {orderPaymentStatus}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Info */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
              Payment Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-semibold text-gray-900">
                  Rs. {amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Method</p>
                <p className="font-medium text-gray-900">
                  {methodLabels[method] ?? method}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge
                  className={`${statusColors[status] ?? "bg-gray-100 text-gray-700"} border-0 flex items-center gap-1 w-fit`}
                >
                  {statusIcons[status]}
                  {status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Reference</p>
                <p className="font-medium text-gray-900 font-mono">
                  {payment.reference || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(payment.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Paid At</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(payment.paidAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <User className="mr-2 h-5 w-5 text-blue-600" />
              Customer Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {customerPhone}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {customerEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {payment.notes && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <FileText className="mr-2 h-5 w-5 text-blue-600" />
                Notes
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {payment.notes}
              </p>
            </div>
          )}

          {/* All Payments on This Order */}
          {orderPayments.length > 1 && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
                All Payments on This Order ({orderPayments.length})
              </h3>
              <div className="space-y-2">
                {orderPayments.map((p) => {
                  const pAmount = Number(p.amount ?? 0);
                  const pStatus = String(p.status).toUpperCase() as PaymentStatus;
                  const pMethod = String(p.method) as PaymentMethod;
                  const isCurrent = p.id === payment.id;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        isCurrent ? "bg-blue-50 border-blue-200" : "bg-gray-50"
                      }`}
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          Rs. {pAmount.toLocaleString()}
                          {isCurrent && (
                            <span className="ml-2 text-xs text-blue-600 font-normal">
                              (this payment)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {methodLabels[pMethod] ?? pMethod} ·{" "}
                          {formatDate(p.createdAt)}
                          {p.reference ? ` · ${p.reference}` : ""}
                        </p>
                      </div>
                      <Badge
                        className={`${statusColors[pStatus] ?? "bg-gray-100 text-gray-700"} border-0 flex items-center gap-1`}
                      >
                        {statusIcons[pStatus]}
                        {pStatus}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <DollarSign className="mr-2 h-5 w-5 text-blue-600" />
              Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-gray-900">
                  Rs. {amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Method</span>
                <span className="font-medium text-gray-900">
                  {methodLabels[method] ?? method}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge
                  className={`${statusColors[status] ?? "bg-gray-100 text-gray-700"} border-0`}
                >
                  {status}
                </Badge>
              </div>
              {payment.reference && (
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-mono text-xs text-gray-900 truncate max-w-[140px]">
                    {payment.reference}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              {orderId && (
                <Link href={`/dashboard/orders/${orderId}`}>
                  <Button
                    variant="outline"
                    className="w-full justify-center border-blue-200 bg-white hover:bg-blue-50"
                  >
                    <ExternalLink className="mr-2 h-4 w-4 text-blue-600" />
                    View Order
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                className="w-full justify-center border-green-200 bg-white hover:bg-green-50"
                onClick={() => window.print()}
              >
                <FileText className="mr-2 h-4 w-4 text-green-600" />
                Print Receipt
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center border-gray-300 bg-white hover:bg-gray-50"
                onClick={() => router.push("/dashboard/payments")}
              >
                <ArrowLeft className="mr-2 h-4 w-4 text-gray-600" />
                Back to Payments
              </Button>
            </div>
          </div>

          {/* Meta */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Metadata</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Payment ID</span>
                <span className="font-mono text-xs text-gray-900 truncate max-w-[140px]">
                  {payment.id}
                </span>
              </div>
              {orderId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order ID</span>
                  <span className="font-mono text-xs text-gray-900 truncate max-w-[140px]">
                    {orderId}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="font-medium text-gray-900">
                  {formatDate(payment.createdAt)}
                </span>
              </div>
              {payment.paidAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Paid</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(payment.paidAt)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}