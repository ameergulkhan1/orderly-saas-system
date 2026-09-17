"use client";

import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { Charts } from "@/components/dashboard/Charts";
import { LowStock } from "@/components/dashboard/LowStock";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Good morning, Ayesha 👋 Here's what's happening with your business today.
          </p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow duration-200">
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Charts */}
      <Charts />

      {/* Recent Orders & Low Stock */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <div>
          <LowStock />
        </div>
      </div>
    </div>
  );
}