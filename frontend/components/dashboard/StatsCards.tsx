"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  DollarSign,
  Clock,
  AlertCircle,
} from "lucide-react";
import { dashboardAPI } from "@/lib/api/dashboard.api";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, change, isPositive, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
          <p className="mt-1 text-lg sm:text-2xl font-bold text-gray-900 truncate">{value}</p>
          <div className="mt-1 flex items-center gap-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
            )}
            <span className={isPositive ? "text-xs sm:text-sm text-green-600" : "text-xs sm:text-sm text-red-600"}>
              {change}
            </span>
          </div>
        </div>
        <div className={`rounded-xl p-2 sm:p-3 ${color} shrink-0`}>{icon}</div>
      </div>
    </div>
  );
}

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  lowStock: number;
  todayOrders: number;
  todayRevenue: number;
  totalCustomers: number;
  totalProducts: number;
};

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await dashboardAPI.stats();

        if (!res.success || !res.data) {
          setError(res.error?.message || "Failed to load stats");
          return;
        }

        // Debug — remove after verifying
        console.log("[dashboard stats] response:", res.data);

        // Normalize: backend may return { totalRevenue } or { revenue },
        // { pendingOrders } or { pending }, etc.
        const s: any = res.data;
        setStats({
          totalOrders: Number(s.totalOrders ?? s.orders ?? 0),
          totalRevenue: Number(
            s.totalRevenue ?? s.revenue ?? s.todayRevenue ?? 0
          ),
          pendingOrders: Number(s.pendingOrders ?? s.pending ?? 0),
          lowStock: Number(s.lowStock ?? s.lowStockCount ?? 0),
          todayOrders: Number(s.todayOrders ?? 0),
          todayRevenue: Number(s.todayRevenue ?? 0),
          totalCustomers: Number(s.totalCustomers ?? 0),
          totalProducts: Number(s.totalProducts ?? 0),
        });
      } catch (err: any) {
        setError(err?.error?.message || err?.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "No stats available"}
      </div>
    );
  }

  // Prefer today's numbers when the API provides them; fall back to totals
  const todaysOrders = stats.todayOrders || stats.totalOrders;
  const todaysRevenue = stats.todayRevenue || stats.totalRevenue;

  const cards = [
    {
      title: "Today's Orders",
      value: String(todaysOrders ?? 0),
      change: "—",
      isPositive: true,
      icon: <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 text-white" />,
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Today's Revenue",
      value: `Rs.${todaysRevenue.toLocaleString()}`,
      change: "—",
      isPositive: true,
      icon: <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />,
      color: "bg-gradient-to-br from-green-500 to-green-600",
    },
    {
      title: "Pending Orders",
      value: String(stats.pendingOrders ?? 0),
      change: "—",
      isPositive: false,
      icon: <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white" />,
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
    {
      title: "Low Stock",
      value: String(stats.lowStock ?? 0),
      change: stats.lowStock > 0 ? "⚠️ Review" : "All good",
      isPositive: false,
      icon: <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />,
      color: "bg-gradient-to-br from-red-500 to-red-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
      {cards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}