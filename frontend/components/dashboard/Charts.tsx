"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { dashboardAPI } from "@/lib/api/dashboard.api";

const FALLBACK_COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#8b5cf6", "#06b6d4"];

export function Charts() {
  const [isMobile, setIsMobile] = useState(false);

  const [revenueData, setRevenueData] = useState<{ day: string; revenue: number }[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<{ name: string; value: number; color: string }[]>([]);
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
        const [revRes, statusRes] = await Promise.all([
          dashboardAPI.revenueChart("week"),
          dashboardAPI.orderStatus(),
        ]);

        // Revenue
        if (revRes.success && Array.isArray(revRes.data)) {
          setRevenueData(
            revRes.data.map((d: any) => ({
              day:
                d.day ??
                (d.date
                  ? new Date(d.date).toLocaleDateString(undefined, { weekday: "short" })
                  : ""),
              revenue: Number(d.revenue ?? 0),
            }))
          );
        }

        // Order status
        if (statusRes.success && Array.isArray(statusRes.data)) {
          setOrderStatusData(
            statusRes.data.map((s: any, i: number) => ({
              name: s.status ?? s.name ?? "Unknown",
              value: Number(s.percentage ?? s.count ?? 0),
              color: s.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
            }))
          );
        }

        const firstError = revRes.error?.message || statusRes.error?.message;
        if (firstError) setError(firstError);
      } catch (err: any) {
        setError(err?.error?.message || err?.message || "Failed to load charts");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
      {/* Revenue Chart */}
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Revenue</h3>
          <span className="text-xs sm:text-sm text-gray-500">This week</span>
        </div>
        <div className="h-48 sm:h-64">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-red-600">
              {error}
            </div>
          ) : revenueData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No revenue data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#888" fontSize={isMobile ? 10 : 12} />
                <YAxis stroke="#888" fontSize={isMobile ? 10 : 12} />
                <Tooltip
                  formatter={(value: any) => {
                    if (typeof value === "number") {
                      return [`Rs. ${value.toLocaleString()}`, "Revenue"];
                    }
                    return [value, "Revenue"];
                  }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="#3b82f6">
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Order Status Chart */}
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-3 flex items-center justify-between sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Order Status</h3>
          <span className="text-xs sm:text-sm text-gray-500">This month</span>
        </div>
        <div className="h-48 sm:h-64">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : orderStatusData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No order data yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={orderStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={isMobile ? 40 : 60}
                  outerRadius={isMobile ? 60 : 80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) =>
                    isMobile ? `${value}%` : `${name} ${value}%`
                  }
                  labelLine={!isMobile}
                  fontSize={isMobile ? 10 : 12}
                >
                  {orderStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => {
                    if (typeof value === "number") {
                      return [`${value}%`, "Percentage"];
                    }
                    return [value, "Percentage"];
                  }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "6px 10px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}