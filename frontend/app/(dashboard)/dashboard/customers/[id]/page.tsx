"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customersAPI } from "@/lib/api/customers.api";
import type { Order as APIOrder } from "@/lib/api/types";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Star,
  MessageSquare,
  Edit,
  Plus,
  Clock,
  MoreVertical,
  Send,
  CheckCircle,
  XCircle,
} from "lucide-react";

type Order = {
  id: string;
  amount: number;
  status: string;
  date: string;
};

type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  totalOrders: number;
  totalSpent: number;
  averageOrder: number;
  joined: string;
  notes: string;
  orders: Order[];
};

const statusColors: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  READY_TO_SHIP: "bg-cyan-100 text-cyan-700",
  SHIPPED: "bg-blue-100 text-blue-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  FAILED_DELIVERY: "bg-red-100 text-red-700",
  RETURNED: "bg-purple-100 text-purple-700",
};

const statusIcons: Record<string, React.ReactNode> = {
  PROCESSING: <Clock className="h-4 w-4 text-yellow-600" />,
  SHIPPED: <Clock className="h-4 w-4 text-blue-600" />,
  DELIVERED: <CheckCircle className="h-4 w-4 text-green-600" />,
  CANCELLED: <XCircle className="h-4 w-4 text-red-600" />,
};

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params?.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const [customerRes, ordersRes, statsRes] = await Promise.all([
        customersAPI.get(customerId),
        customersAPI.getOrders(customerId),
        customersAPI.getStats(customerId),
      ]);

      if (!customerRes.success || !customerRes.data) {
        throw new Error(customerRes.error?.message || "Customer not found");
      }

      const c: any = customerRes.data;
      const stats: any =
        statsRes.success && statsRes.data
          ? statsRes.data
          : c.stats ?? {};
      const ordersList: APIOrder[] =
        ordersRes.success && Array.isArray(ordersRes.data) ? ordersRes.data : [];

      const totalOrders = Number(
        stats.totalOrders ?? c.totalOrders ?? ordersList.length
      );
      const totalSpent = Number(
        stats.totalSpent ??
          c.totalSpent ??
          ordersList.reduce((s, o) => s + Number(o.total ?? 0), 0)
      );
      const averageOrder = Number(
        stats.averageOrder ??
          (totalOrders > 0 ? totalSpent / totalOrders : 0)
      );

      const profile: CustomerProfile = {
        id: String(c.id ?? customerId),
        name: String(c.name ?? "Unnamed"),
        phone: String(c.phone ?? ""),
        email: String(c.email ?? ""),
        address: String(
          [c.address, c.city].filter(Boolean).join(", ") || ""
        ),
        status: c.status === "ARCHIVED" ? "Archived" : totalOrders > 1 ? "Repeat" : "New",
        totalOrders,
        totalSpent,
        averageOrder: Math.round(averageOrder),
        joined: c.createdAt
          ? new Date(c.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "-",
        notes: c.notes ?? "",
        orders: ordersList.map((o: APIOrder) => ({
          id: o.orderNumber ?? o.id,
          amount: Number(o.total ?? 0),
          status: o.status ?? "NEW",
          date: o.createdAt
            ? new Date(o.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "-",
        })),
      };

      setCustomer(profile);
      setNotes(profile.notes);
    } catch (err: any) {
      setError(
        err?.error?.message || err?.message || "Failed to load customer"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const handleSaveNotes = async () => {
    if (!customer) return;
    setSavingNotes(true);
    try {
      const res = await customersAPI.update(customer.id, { notes });
      if (!res.success) {
        alert(res.error?.message || "Failed to save notes");
        return;
      }
      setCustomer({ ...customer, notes });
      setIsEditing(false);
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/customers"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Customers
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Customer not found"}
        </div>
      </div>
    );
  }

  const initials = customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard/customers"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Customers
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Customer Profile</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={() =>
              window.open(
                `https://wa.me/${customer.phone.replace(/\D/g, "")}`,
                "_blank"
              )
            }
          >
            <Send className="mr-2 h-4 w-4" />
            Send WhatsApp
          </Button>
          <Link href={`/dashboard/orders/new?customerId=${customer.id}`}>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </Link>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-2xl font-bold text-white">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
                <Badge className="bg-green-100 text-green-700 border-0">
                  <Star className="mr-1 h-3 w-3" />
                  {customer.status}
                </Badge>
              </div>
              <div className="mt-1 space-y-1">
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {customer.phone}
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {customer.email || "—"}
                </p>
                <p className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  {customer.address || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
            <div className="rounded-lg bg-blue-50 p-3 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-blue-600">{customer.totalOrders}</p>
              <p className="text-xs text-gray-600">Total Orders</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-purple-600">
                Rs. {customer.totalSpent.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Total Spent</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-green-600">
                Rs. {customer.averageOrder.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Avg. Order</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Order History */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50 px-6 py-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                Order History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-left text-sm font-medium text-gray-600">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {customer.orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                        No orders yet
                      </td>
                    </tr>
                  ) : (
                    customer.orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <span className="font-medium text-blue-600 hover:underline">
                              #{order.id}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{order.date}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          Rs. {order.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            className={`${statusColors[order.status] ?? "bg-gray-100 text-gray-700"} border-0 flex items-center gap-1 w-fit`}
                          >
                            {statusIcons[order.status]}
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link href={`/dashboard/orders/${order.id}`}>
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column - Notes & Actions */}
        <div className="space-y-6">
          {/* Customer Notes */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Customer Notes</h3>
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="mr-1 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setNotes(customer.notes);
                    }}
                    disabled={savingNotes}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {savingNotes ? "Saving..." : "Save"}
                  </Button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div>
                <Label htmlFor="notes" className="text-sm text-gray-600">Edit notes</Label>
                <Input
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2 h-20 resize-none"
                  placeholder="Enter notes about this customer..."
                />
              </div>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed">
                {notes || "No notes added yet."}
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/dashboard/orders/new?customerId=${customer.id}`}>
                <Button className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow">
                  <Plus className="mr-2 h-4 w-4" />
                  New Order
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-center border-green-600 text-green-600 hover:bg-green-50"
                onClick={() =>
                  window.open(
                    `https://wa.me/${customer.phone.replace(/\D/g, "")}`,
                    "_blank"
                  )
                }
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full justify-center"
                onClick={() => router.push(`/dashboard/customers/${customer.id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Customer
              </Button>
            </div>
          </div>

          {/* Customer Stats */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Customer Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer Since</span>
                <span className="font-medium text-gray-900">{customer.joined}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Orders</span>
                <span className="font-medium text-gray-900">{customer.totalOrders}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Spent</span>
                <span className="font-medium text-gray-900">
                  Rs. {customer.totalSpent.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Average Order</span>
                <span className="font-medium text-gray-900">
                  Rs. {customer.averageOrder.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer Status</span>
                <Badge className="bg-green-100 text-green-700 border-0">
                  {customer.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}