"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Download,
  Printer,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
} from "lucide-react";
import { reportsAPI } from "@/lib/api/reports.api";

const timeFilters = ["Today", "7 Days", "30 Days", "Custom"];
const reportTypes = ["Revenue", "Orders", "Products", "Customers"];

type Period = "day" | "week" | "month" | "year";

const filterToPeriod = (filter: string): Period => {
  switch (filter) {
    case "Today":
      return "day";
    case "7 Days":
      return "week";
    case "30 Days":
      return "month";
    default:
      return "month";
  }
};

const FALLBACK_COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function ReportsPage() {
  const [timeFilter, setTimeFilter] = useState("30 Days");
  const [reportType, setReportType] = useState("Revenue");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revenueData, setRevenueData] = useState<
    { day: string; revenue: number; orders: number }[]
  >([]);
  const [topProducts, setTopProducts] = useState<
    { name: string; sales: number; revenue: number }[]
  >([]);
  const [topCustomers, setTopCustomers] = useState<
    { name: string; orders: number; spent: number }[]
  >([]);
  const [orderStatusData, setOrderStatusData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrder: 0,
    returnRate: 0,
    cancelled: 0,
    returned: 0,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const period = filterToPeriod(timeFilter);

      try {
        const [revRes, ordersRes, prodRes, custRes, statusRes] = await Promise.all([
          reportsAPI.revenue({ period }),
          reportsAPI.orders({ period }),
          reportsAPI.topProducts(10, period),
          reportsAPI.topCustomers(10, period),
          reportsAPI.orderStatus(),
        ]);

        // ---------- Revenue ----------
        if (revRes.success && revRes.data) {
          const payload: any = revRes.data;
          const daily = payload.daily ?? payload.chart ?? payload.data ?? [];
          const s = payload.summary ?? {};

          setRevenueData(
            Array.isArray(daily)
              ? daily.map((d: any) => ({
                  day:
                    d.label ??
                    d.day ??
                    (d.date
                      ? new Date(d.date).toLocaleDateString(undefined, {
                          weekday: "short",
                        })
                      : ""),
                  revenue: Number(d.revenue ?? d.total ?? 0),
                  orders: Number(d.orders ?? d.count ?? 0),
                }))
              : []
          );

          setSummary((prev) => ({
            ...prev,
            totalRevenue: Number(s.totalRevenue ?? 0),
            totalOrders: Number(s.totalOrders ?? 0),
            averageOrder: Number(s.averageOrder ?? 0),
          }));
        } else if (revRes.error) {
          setError(revRes.error.message || "Failed to load revenue report");
        }

        // ---------- Orders (also derive cancelled + returned) ----------
        if (ordersRes.success && ordersRes.data) {
          const payload: any = ordersRes.data;
          const s = payload.summary ?? payload;

          const cancelled = Number(s.cancelled ?? s.cancelledOrders ?? 0);
          const returned = Number(s.returned ?? s.returnedOrders ?? 0);
          const totalOrders = Number(
            s.totalOrders ?? summary.totalOrders ?? 0
          );

          setSummary((prev) => {
            const nextTotal = totalOrders || prev.totalOrders;
            return {
              ...prev,
              cancelled,
              returned,
              returnRate:
                nextTotal > 0 ? (returned / nextTotal) * 100 : 0,
            };
          });
        }

        // ---------- Top Products ----------
        if (prodRes.success && prodRes.data) {
          const payload: any = prodRes.data;
          const list: any[] = Array.isArray(payload)
            ? payload
            : payload.products ?? [];
          setTopProducts(
            list.map((p: any) => ({
              name: p.name ?? p.productName ?? "Unnamed",
              sales: Number(p.sales ?? p.unitsSold ?? p.count ?? 0),
              revenue: Number(p.revenue ?? p.totalRevenue ?? 0),
            }))
          );
        }

        // ---------- Top Customers ----------
        if (custRes.success && custRes.data) {
          const payload: any = custRes.data;
          const list: any[] = Array.isArray(payload)
            ? payload
            : payload.customers ?? [];
          setTopCustomers(
            list.map((c: any) => ({
              name: c.name ?? c.customerName ?? "Unnamed",
              orders: Number(c.orders ?? c.totalOrders ?? 0),
              spent: Number(c.spent ?? c.totalSpent ?? 0),
            }))
          );
        }

        // ---------- Order Status ----------
        if (statusRes.success && statusRes.data) {
          const payload: any = statusRes.data;
          const list: any[] = Array.isArray(payload)
            ? payload
            : payload.statuses ?? [];
          const total = list.reduce(
            (sum, s: any) => sum + Number(s.count ?? s.value ?? 0),
            0
          );
          setOrderStatusData(
            list.map((s: any, i: number) => {
              const count = Number(s.count ?? s.value ?? 0);
              return {
                name: s.status ?? s.name ?? "Unknown",
                value:
                  total > 0
                    ? Math.round((count / total) * 100)
                    : Math.round(Number(s.percentage ?? 0)),
                color: s.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
              };
            })
          );
        }
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load report data"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeFilter]);

  const totalRevenue = useMemo(
    () => revenueData.reduce((s, d) => s + d.revenue, 0),
    [revenueData]
  );
  const totalOrders = useMemo(
    () => revenueData.reduce((s, d) => s + d.orders, 0),
    [revenueData]
  );
  const averageOrder =
    summary.averageOrder ||
    (totalOrders > 0 ? totalRevenue / totalOrders : 0);

  const revenueFormatter = (value: any) =>
    typeof value === "number"
      ? [`Rs. ${value.toLocaleString()}`, "Revenue"]
      : [`${value}`, "Revenue"];

  const ordersFormatter = (value: any) =>
    typeof value === "number"
      ? [`${value} orders`, "Orders"]
      : [`${value}`, "Orders"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-600">Business insights and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-gray-300" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
            onClick={() => window.print()}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Time Filter */}
      <div className="flex flex-wrap gap-2 rounded-xl border bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-gray-700 mr-2 flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-gray-400" />
          Time Period:
        </span>
        {timeFilters.map((filter) => (
          <button
            key={filter}
            onClick={() => setTimeFilter(filter)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              timeFilter === filter
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {filter}
          </button>
        ))}
        <button className="ml-auto rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <ChevronDown className="inline h-4 w-4" />
          Custom Range
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                Rs. {(summary.totalRevenue || totalRevenue).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <ArrowUpRight className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-600">
              {loading ? "..." : "Live data"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="mt-2 text-2xl font-bold text-purple-600">
                {summary.totalOrders || totalOrders}
              </p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3">
              <ShoppingBag className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                Rs. {Math.round(averageOrder).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Return Rate</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {summary.returnRate.toFixed(1)}%
              </p>
            </div>
            <div className="rounded-xl bg-red-50 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1">
            <ArrowDownRight className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-500">
              {summary.returned} returned
            </span>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {reportTypes.map((type) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              reportType === type
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
            <span className="text-sm text-gray-500">Daily</span>
          </div>
          <div className="h-64">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Loading...
              </div>
            ) : revenueData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    formatter={revenueFormatter}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Orders Chart */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
            <span className="text-sm text-gray-500">Daily</span>
          </div>
          <div className="h-64">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Loading...
              </div>
            ) : revenueData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    formatter={ordersFormatter}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Top Products</h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : topProducts.length === 0 ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              topProducts.slice(0, 5).map((product, index) => {
                const max = topProducts[0]?.sales || 1;
                return (
                  <div key={index} className="flex items-center gap-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">
                          {product.name}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          Rs. {product.revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${(product.sales / max) * 100}%` }}
                        />
                      </div>
                      <div className="mt-0.5 flex justify-between text-xs text-gray-500">
                        <span>{product.sales} units sold</span>
                        <span>{Math.round((product.sales / max) * 100)}% of top</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Order Status */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Order Status</h3>
          <div className="h-64">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                Loading...
              </div>
            ) : orderStatusData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                No data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={false}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, "Percentage"]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Customers */}
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Top Customers</h3>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : topCustomers.length === 0 ? (
            <p className="text-sm text-gray-400">No data</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {topCustomers.slice(0, 5).map((customer, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-4 text-center hover:shadow-md transition-shadow"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg mx-auto">
                    {customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <p className="mt-2 font-medium text-gray-900 text-sm">
                    {customer.name}
                  </p>
                  <p className="text-sm text-gray-600">{customer.orders} orders</p>
                  <p className="text-sm font-semibold text-blue-600">
                    Rs. {customer.spent.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancelled & Returned Orders */}
        <div className="rounded-xl border bg-white p-6 shadow-sm lg:col-span-2">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Cancelled Orders
              </h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">
                    {summary.cancelled}
                  </p>
                  <p className="text-sm text-gray-500">This period</p>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cancellation Rate</span>
                    <span className="font-medium text-red-600">
                      {summary.totalOrders > 0
                        ? ((summary.cancelled / summary.totalOrders) * 100).toFixed(1)
                        : "0.0"}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Returned Orders
              </h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-600">
                    {summary.returned}
                  </p>
                  <p className="text-sm text-gray-500">This period</p>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Return Rate</span>
                    <span className="font-medium text-purple-600">
                      {summary.returnRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}