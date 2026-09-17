"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { customersAPI } from "@/lib/api/customers.api";
import { arrayFrom } from "@/lib/api/arrayFrom";
import {
  Plus,
  Search,
  User,
  ShoppingBag,
  DollarSign,
  MoreVertical,
  Eye,
  MessageSquare,
  Star,
} from "lucide-react";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  orders: number;
  spent: number;
  lastOrder?: string;
  status: string;
  address?: string;
};

const statusColors: Record<string, string> = {
  Repeat: "bg-green-100 text-green-700",
  New: "bg-blue-100 text-blue-700",
  VIP: "bg-purple-100 text-purple-700",
  ACTIVE: "bg-green-100 text-green-700",
  ARCHIVED: "bg-gray-100 text-gray-700",
};

function deriveStatus(totalOrders: number, apiStatus?: string): string {
  if (apiStatus === "ARCHIVED") return "Archived";
  if (totalOrders >= 5) return "VIP";
  if (totalOrders > 1) return "Repeat";
  return "New";
}

export default function CustomersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await customersAPI.list({ limit: 100 });
        const list = arrayFrom<any>(res, ["customers"]);

        console.log("[customers] response:", res, "→ list:", list);

        if (!res.success && list.length === 0) {
          setError(res.error?.message || "Failed to load customers");
          return;
        }

        setCustomers(
          list.map((c: any) => {
            const totalOrders = Number(
              c.totalOrders ?? c._count?.orders ?? c.orders ?? 0
            );
            const totalSpent = Number(c.totalSpent ?? c.spent ?? 0);
            return {
              id: String(c.id),
              name: c.name ?? "Unnamed",
              phone: c.phone ?? "",
              email: c.email ?? "",
              orders: totalOrders,
              spent: totalSpent,
              lastOrder: c.updatedAt
                ? new Date(c.updatedAt).toLocaleDateString()
                : "-",
              status: deriveStatus(totalOrders, c.status),
              address: c.address ?? "",
            };
          })
        );
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load customers"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery) ||
          (customer.email ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [customers, searchQuery]
  );

  const summary = useMemo(() => {
    const totalCustomers = customers.length;
    const repeatCustomers = customers.filter((c) =>
      ["Repeat", "VIP"].includes(c.status)
    ).length;
    const totalOrders = customers.reduce((s, c) => s + c.orders, 0);
    const totalRevenue = customers.reduce((s, c) => s + c.spent, 0);
    return { totalCustomers, repeatCustomers, totalOrders, totalRevenue };
  }, [customers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-600">Manage your customer relationships</p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/customers/new")}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow duration-200"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          {
            label: "Total Customers",
            value: summary.totalCustomers.toLocaleString(),
            icon: User,
            color: "text-blue-600",
          },
          {
            label: "Repeat Customers",
            value: summary.repeatCustomers.toLocaleString(),
            icon: Star,
            color: "text-green-600",
          },
          {
            label: "Total Orders",
            value: summary.totalOrders.toLocaleString(),
            icon: ShoppingBag,
            color: "text-purple-600",
          },
          {
            label: "Total Revenue",
            value: `Rs. ${(summary.totalRevenue / 1000).toFixed(0)}K`,
            icon: DollarSign,
            color: "text-yellow-600",
          },
        ].map((stat, index) => (
          <div key={index} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search customers by name, phone or email..."
          className="pl-9 bg-white border-gray-200 focus:border-blue-500 h-11"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Customers Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm font-medium text-gray-600">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3 text-center">Orders</th>
                <th className="px-4 py-3">Total Spent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Order</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/customers/${customer.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 font-semibold">
                            {customer.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 hover:text-blue-600 transition-colors">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{customer.phone}</td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                      {customer.orders}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      Rs. {customer.spent.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusColors[customer.status] ?? "bg-gray-100 text-gray-700"} border-0`}>
                        {customer.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{customer.lastOrder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/customers/${customer.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                            <Eye className="h-4 w-4 text-gray-400" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-green-50"
                          onClick={() =>
                            window.open(
                              `https://wa.me/${customer.phone.replace(/\D/g, "")}`,
                              "_blank"
                            )
                          }
                        >
                          <MessageSquare className="h-4 w-4 text-green-500" />
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