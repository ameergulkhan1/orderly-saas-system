"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Send,
  Printer,
  Truck,
  Clock,
  CheckCircle,
  Package,
  User,
  MapPin,
  CreditCard,
  MoreVertical,
  X,
} from "lucide-react";
import { ordersAPI } from "@/lib/api/orders.api";
import type { OrderStatus } from "@/lib/api/types";

type OrderItem = {
  name: string;
  size?: string;
  sku?: string;
  quantity: number;
  price: number;
};

type TimelineEvent = {
  status: string;
  completed: boolean;
  date: string;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  payment: {
    method: string;
    total: number;
    paid: number;
    remaining: number;
    status: string;
  };
  delivery: {
    courier: string;
    tracking: string;
    status: string;
  };
  timeline: TimelineEvent[];
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
  Returned: "bg-purple-100 text-purple-700",
  RETURNED: "bg-purple-100 text-purple-700",
  New: "bg-gray-100 text-gray-700",
  NEW: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  READY_TO_SHIP: "bg-cyan-100 text-cyan-700",
  FAILED_DELIVERY: "bg-red-100 text-red-700",
};

const STATUS_FLOW: Record<string, string[]> = {
  NEW: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_TO_SHIP", "CANCELLED"],
  READY_TO_SHIP: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "FAILED_DELIVERY"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  FAILED_DELIVERY: ["RETURNED", "SHIPPED"],
  RETURNED: [],
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  READY_TO_SHIP: "Ready to Ship",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  FAILED_DELIVERY: "Failed Delivery",
  RETURNED: "Returned",
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const loadOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const [orderRes, timelineRes] = await Promise.all([
        ordersAPI.get(orderId),
        ordersAPI.timeline(orderId),
      ]);

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.error?.message || "Order not found");
      }

      const o: any = orderRes.data;
      const timelineList: any[] =
        timelineRes.success && Array.isArray(timelineRes.data)
          ? timelineRes.data
          : [];

      // ---- Items ----
      const items: OrderItem[] = Array.isArray(o.items)
        ? o.items.map((it: any): OrderItem => {
            const qty: number = Number(it?.quantity ?? 1);
            const unit: number = Number(it?.unitPrice ?? it?.price ?? 0);
            const lineTotal: number =
              it?.totalPrice !== undefined && it?.totalPrice !== null
                ? Number(it.totalPrice)
                : unit * qty;

            return {
              name: String(it?.productName ?? it?.name ?? "Item"),
              size: it?.size ?? undefined,
              sku: it?.sku ?? undefined,
              quantity: qty,
              price: lineTotal,
            };
          })
        : [];

      // ---- Payment ----
      const paymentsArr: any[] = Array.isArray(o.payments) ? o.payments : [];
      const paid: number = paymentsArr
        .filter((p) => String(p?.status ?? "").toUpperCase() === "PAID")
        .reduce((sum: number, p: any) => sum + Number(p?.amount ?? 0), 0);

      const total: number = Number(o.total ?? 0);
      const remaining: number = Math.max(total - paid, 0);

      // ---- Timeline ----
      const timeline: TimelineEvent[] =
        timelineList.length > 0
          ? timelineList.map((t: any) => ({
              status: String(t?.status ?? "Update"),
              completed: Boolean(t?.completed) || Boolean(t?.date),
              date: t?.date
                ? new Date(t.date).toLocaleString()
                : t?.completed
                ? "Completed"
                : "Pending",
            }))
          : [
              {
                status: "Order Created",
                completed: true,
                date: o.createdAt
                  ? new Date(o.createdAt).toLocaleString()
                  : "—",
              },
              {
                status: String(o.status ?? "Processing"),
                completed: true,
                date: "In Progress",
              },
            ];

      const detail: OrderDetail = {
        id: String(o.id),
        orderNumber: String(o.orderNumber ?? o.id ?? ""),
        status: String(o.status ?? "New"),
        createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString() : "—",
        customer: {
          name: String(o.customerName ?? o.customer?.name ?? "Unknown"),
          phone: String(o.customerPhone ?? o.customer?.phone ?? "—"),
          email: String(o.customer?.email ?? "—"),
          address: String(
            o.deliveryAddress ?? o.customer?.address ?? o.deliveryCity ?? "—"
          ),
        },
        items,
        subtotal: Number(o.subtotal ?? 0),
        deliveryFee: Number(o.deliveryFee ?? 0),
        discount: Number(o.discount ?? 0),
        total,
        payment: {
          method: String(o.paymentMethod ?? paymentsArr[0]?.method ?? "COD"),
          total,
          paid,
          remaining,
          status: String(
            o.paymentStatus ??
              (remaining <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "PENDING")
          ),
        },
        delivery: {
          courier: String(o.delivery?.courier ?? ""),
          tracking: String(o.delivery?.trackingNumber ?? ""),
          status: String(o.delivery?.status ?? o.status ?? "Not Shipped"),
        },
        timeline,
      };

      setOrder(detail);
    } catch (err: any) {
      setError(err?.error?.message || err?.message || "Failed to load order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: string, notes: string) => {
    if (!order) return;
    setUpdating(true);
    try {
      const res = await ordersAPI.updateStatus(order.id, {
        status: newStatus.toUpperCase() as OrderStatus,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      } as any);
      if (!res.success) {
        alert(res.error?.message || "Failed to update status");
        return;
      }
      setShowStatusModal(false);
      await loadOrder();
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!order) return;
    try {
      const res = await ordersAPI.invoice(order.id);
      if (!res.success) {
        window.print();
        return;
      }
      const payload: any = res.data;
      if (typeof payload === "string" && payload.startsWith("http")) {
        window.open(payload, "_blank");
      } else if (payload?.url) {
        window.open(payload.url, "_blank");
      } else {
        window.print();
      }
    } catch {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Orders
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Order not found"}
        </div>
      </div>
    );
  }

  const whatsappNumber = order.customer.phone.replace(/\D/g, "");
  const nextStatuses = STATUS_FLOW[order.status.toUpperCase()] ?? [];
  const canUpdateStatus = nextStatuses.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Orders
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Order #{order.orderNumber}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={() =>
              window.open(`https://wa.me/${whatsappNumber}`, "_blank")
            }
          >
            <Send className="mr-2 h-4 w-4" />
            Send WhatsApp
          </Button>
          <Button
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={handlePrintInvoice}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
            onClick={() => setShowStatusModal(true)}
            disabled={updating || !canUpdateStatus}
          >
            <Truck className="mr-2 h-4 w-4" />
            Update Status
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Badge */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500">Order Status</span>
                <div className="mt-1">
                  <Badge
                    className={`${statusColors[order.status] ?? "bg-gray-100 text-gray-700"} border-0 text-sm px-4 py-1.5`}
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">Order Date</span>
                <p className="text-sm font-medium text-gray-900">
                  {order.createdAt}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <User className="mr-2 h-5 w-5 text-blue-600" />
              Customer Information
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{order.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">
                  {order.customer.phone}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">
                  {order.customer.email}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Delivery Address</p>
                <p className="font-medium text-gray-900 flex items-start gap-2">
                  <MapPin className="mt-1 h-4 w-4 text-gray-400" />
                  {order.customer.address}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <Package className="mr-2 h-5 w-5 text-blue-600" />
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.length === 0 ? (
                <p className="text-sm text-gray-500">No items</p>
              ) : (
                order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.size ? `Size: ${item.size} • ` : ""}
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      Rs. {item.price.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">
                    Rs. {order.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery Fee</span>
                  <span className="text-gray-900">
                    Rs. {order.deliveryFee.toLocaleString()}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-gray-900">
                      - Rs. {order.discount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total</span>
                  <span className="text-blue-600">
                    Rs. {order.total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Payment Details */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <CreditCard className="mr-2 h-5 w-5 text-blue-600" />
              Payment Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Method</span>
                <span className="text-sm font-medium text-gray-900">
                  {order.payment.method}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-sm font-semibold text-gray-900">
                  Rs. {order.payment.total.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Paid</span>
                <span className="text-sm font-semibold text-green-600">
                  Rs. {order.payment.paid.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium text-gray-900">
                  Remaining
                </span>
                <span className="text-sm font-bold text-red-600">
                  Rs. {order.payment.remaining.toLocaleString()}
                </span>
              </div>
              <div className="mt-2">
                <Badge className="bg-yellow-100 text-yellow-700 border-0 w-full justify-center py-1">
                  {order.payment.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <Truck className="mr-2 h-5 w-5 text-blue-600" />
              Delivery Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Courier</span>
                <span className="text-sm font-medium text-gray-900">
                  {order.delivery.courier || "Not assigned"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tracking</span>
                <span className="text-sm font-medium text-gray-900">
                  {order.delivery.tracking || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <Badge className="bg-gray-100 text-gray-700 border-0">
                  {order.delivery.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Order Timeline
            </h3>
            <div className="space-y-0">
              {order.timeline.map((item, index) => (
                <div key={index} className="relative flex gap-4 pb-4 last:pb-0">
                  {index < order.timeline.length - 1 && (
                    <div className="absolute left-4 top-8 h-full w-0.5 bg-gray-200" />
                  )}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    {item.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        item.completed ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {item.status}
                    </p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full justify-center border-blue-200 bg-white hover:bg-blue-50"
                onClick={() =>
                  window.open(`https://wa.me/${whatsappNumber}`, "_blank")
                }
              >
                <Send className="mr-2 h-4 w-4 text-blue-600" />
                Send WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center border-green-200 bg-white hover:bg-green-50"
                onClick={handlePrintInvoice}
              >
                <Printer className="mr-2 h-4 w-4 text-green-600" />
                Print Invoice
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center border-purple-200 bg-white hover:bg-purple-50"
                onClick={() => setShowStatusModal(true)}
                disabled={!canUpdateStatus}
              >
                <MoreVertical className="mr-2 h-4 w-4 text-purple-600" />
                Update Status
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <UpdateStatusModal
          order={order}
          onClose={() => setShowStatusModal(false)}
          onSubmit={handleUpdateStatus}
          saving={updating}
        />
      )}
    </div>
  );
}

function UpdateStatusModal({
  order,
  onClose,
  onSubmit,
  saving,
}: {
  order: OrderDetail;
  onClose: () => void;
  onSubmit: (status: string, notes: string) => void;
  saving: boolean;
}) {
  const currentStatus = String(order.status).toUpperCase();
  const options = STATUS_FLOW[currentStatus] ?? [];

  const [selected, setSelected] = useState<string>(options[0] ?? "");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Update Order Status
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Order #{order.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current status */}
        <div className="mb-4 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-500">Current Status</p>
          <div className="mt-1">
            <Badge
              className={`${statusColors[currentStatus] ?? "bg-gray-100 text-gray-700"} border-0`}
            >
              {STATUS_LABELS[currentStatus] ?? currentStatus}
            </Badge>
          </div>
        </div>

        {/* Options */}
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-gray-700">
            Move to status
          </p>
          <div className="space-y-2">
            {options.length === 0 ? (
              <p className="text-sm text-gray-500">
                No further transitions available.
              </p>
            ) : (
              options.map((status) => {
                const isSelected = selected === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setSelected(status)}
                    disabled={saving}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                          isSelected ? "border-blue-600" : "border-gray-300"
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <Badge
                        className={`${statusColors[status] ?? "bg-gray-100 text-gray-700"} border-0`}
                      >
                        {STATUS_LABELS[status] ?? status}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Notes */}
        {options.length > 0 && (
          <div className="mb-5">
            <label
              htmlFor="status-notes"
              className="text-sm font-medium text-gray-700"
            >
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              id="status-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note about this status change..."
              rows={2}
              disabled={saving}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => onSubmit(selected, notes)}
            disabled={saving || !selected || options.length === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
          >
            {saving ? "Updating..." : "Confirm Update"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}