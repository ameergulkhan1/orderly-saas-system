"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { deliveriesAPI } from "@/lib/api/deliveries.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Delivery, DeliveryStatus } from "@/lib/api/types";
import {
  ArrowLeft,
  Truck,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  User,
  MapPin,
  Phone,
  FileText,
  ExternalLink,
} from "lucide-react";

const NEXT_STATUS: Record<string, DeliveryStatus[]> = {
  PENDING: ["READY_TO_SHIP"],
  READY_TO_SHIP: ["SHIPPED"],
  SHIPPED: ["DELIVERED", "FAILED"],
  DELIVERED: [],
  FAILED: ["RETURNED"],
  RETURNED: [],
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
  PENDING: <Clock className="h-4 w-4" />,
  READY_TO_SHIP: <Package className="h-4 w-4" />,
  SHIPPED: <Truck className="h-4 w-4" />,
  DELIVERED: <CheckCircle className="h-4 w-4" />,
  FAILED: <XCircle className="h-4 w-4" />,
  RETURNED: <AlertCircle className="h-4 w-4" />,
};

// Progress step order for the timeline
const STATUS_FLOW: DeliveryStatus[] = [
  "PENDING",
  "READY_TO_SHIP",
  "SHIPPED",
  "DELIVERED",
];

type DeliveryDetail = Delivery & {
  order?: {
    id?: string;
    orderNumber?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    deliveryCity?: string;
  };
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

export default function DeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await deliveriesAPI.get(id);
        if (res.success && res.data) {
          const d = res.data as DeliveryDetail;
          setDelivery(d);
          setCourier(d.courier ?? "");
          setTrackingNumber(d.trackingNumber ?? "");
          setNotes(d.notes ?? "");
        } else {
          setError(res.error?.message || "Delivery not found");
        }
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load delivery"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSaveTracking = async () => {
    if (!delivery) return;
    setSaving(true);
    try {
      const res = await deliveriesAPI.updateTracking(delivery.id, {
        trackingNumber,
        courier,
      });
      if (!res.success) {
        alert(res.error?.message || "Failed to save tracking");
        return;
      }
      alert("Tracking information saved");
      // Refresh
      const refreshed = await deliveriesAPI.get(delivery.id);
      if (refreshed.success && refreshed.data) {
        setDelivery(refreshed.data as DeliveryDetail);
      }
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to save tracking");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (status: DeliveryStatus) => {
    if (!delivery) return;
    if (!confirm(`Move delivery to ${STATUS_LABELS[status] ?? status}?`)) return;
    setUpdatingStatus(true);
    try {
      const res = await deliveriesAPI.updateStatus(delivery.id, status);
      if (!res.success) {
        alert(res.error?.message || "Failed to update status");
        return;
      }
      const refreshed = await deliveriesAPI.get(delivery.id);
      if (refreshed.success && refreshed.data) {
        setDelivery(refreshed.data as DeliveryDetail);
      }
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/deliveries"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Deliveries
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Delivery not found"}
        </div>
      </div>
    );
  }

  const statusUpper = String(delivery.status).toUpperCase();
  const nextStatuses = NEXT_STATUS[statusUpper] ?? [];
  const orderId = delivery.order?.id ?? delivery.orderId;
  const orderNumber = delivery.order?.orderNumber ?? "—";

  // Progress index for timeline
  const currentIndex = STATUS_FLOW.indexOf(statusUpper as DeliveryStatus);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard/deliveries"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Deliveries
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Delivery — Order #{orderNumber}
          </h1>
          <p className="text-sm text-gray-500 font-mono">
            ID: {delivery.id}
          </p>
        </div>
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
      </div>

      {/* Status Card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {STATUS_ICONS[statusUpper]}
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Status</p>
              <div className="mt-1">
                <Badge
                  className={`${STATUS_COLORS[statusUpper] ?? "bg-gray-100 text-gray-700"} border-0 text-sm px-4 py-1.5 flex items-center gap-2 w-fit`}
                >
                  {STATUS_ICONS[statusUpper]}
                  {STATUS_LABELS[statusUpper] ?? statusUpper}
                </Badge>
              </div>
            </div>
          </div>

          {nextStatuses.length > 0 && (
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <p className="text-xs font-medium text-gray-500">
                Move to next status
              </p>
              <div className="flex flex-wrap gap-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    onClick={() => handleUpdateStatus(s)}
                    disabled={updatingStatus}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
                  >
                    {STATUS_ICONS[s]}
                    <span className="ml-2">{STATUS_LABELS[s] ?? s}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Progress timeline */}
        {statusUpper !== "FAILED" && statusUpper !== "RETURNED" && (
          <div className="mt-6 flex items-center gap-2">
            {STATUS_FLOW.map((s, i) => (
              <div key={s} className="flex flex-1 items-center">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                    i <= currentIndex
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {i < currentIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    STATUS_ICONS[s]
                  )}
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      i < currentIndex ? "bg-blue-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}
        {statusUpper !== "FAILED" && statusUpper !== "RETURNED" && (
          <div className="mt-2 flex items-center gap-2">
            {STATUS_FLOW.map((s) => (
              <div
                key={s}
                className="flex-1 text-center text-xs text-gray-500"
              >
                {STATUS_LABELS[s]}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Form */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <Truck className="mr-2 h-5 w-5 text-blue-600" />
              Courier & Tracking
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="courier">Courier</Label>
                <Input
                  id="courier"
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="e.g. TCS, Leopards, Pakistan Post"
                  className="mt-1 h-11"
                />
              </div>
              <div>
                <Label htmlFor="tracking">Tracking Number</Label>
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. 123456789012"
                  className="mt-1 h-11"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any delivery notes for the courier or customer"
                  className="mt-1 h-11"
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleSaveTracking}
                  disabled={saving}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Tracking Info"}
                </Button>
              </div>
            </div>
          </div>

          {/* Order & Customer Info */}
          {delivery.order && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                Order & Customer
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-500">Order</p>
                  <p className="font-medium text-gray-900">
                    #{delivery.order.orderNumber ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">
                    {delivery.order.customerName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {delivery.order.customerPhone ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium text-gray-900">
                    {delivery.order.deliveryCity ?? "—"}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Delivery Address</p>
                  <p className="font-medium text-gray-900 flex items-start gap-2">
                    <MapPin className="mt-1 h-4 w-4 text-gray-400" />
                    {delivery.order.deliveryAddress ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-6">
          {/* Delivery Timeline */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Created</span>
                <span className="font-medium text-gray-900">
                  {formatDate(delivery.createdAt)}
                </span>
              </div>
              {delivery.shippedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Shipped</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(delivery.shippedAt)}
                  </span>
                </div>
              )}
              {delivery.deliveredAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Delivered</span>
                  <span className="font-medium text-green-600">
                    {formatDate(delivery.deliveredAt)}
                  </span>
                </div>
              )}
              {delivery.failedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Failed</span>
                  <span className="font-medium text-red-600">
                    {formatDate(delivery.failedAt)}
                  </span>
                </div>
              )}
              {delivery.returnedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Returned</span>
                  <span className="font-medium text-purple-600">
                    {formatDate(delivery.returnedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Fee */}
          {delivery.deliveryFee && Number(delivery.deliveryFee) > 0 && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Fee</h3>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {Number(delivery.deliveryFee).toLocaleString()}
              </p>
            </div>
          )}

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
                className="w-full justify-center border-gray-300 bg-white hover:bg-gray-50"
                onClick={() => router.push("/dashboard/deliveries")}
              >
                <ArrowLeft className="mr-2 h-4 w-4 text-gray-600" />
                Back to Deliveries
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}