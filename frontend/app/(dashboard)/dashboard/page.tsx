"use client";

import { StatsCards } from "@/components/dashboard/StatsCards";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { Charts } from "@/components/dashboard/Charts";
import { LowStock } from "@/components/dashboard/LowStock";
import { Button } from "@/components/ui/button";
import { FaGithub, FaLinkedin, FaPlus } from "react-icons/fa";
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

          {/* Developer Credit */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-semibold text-gray-700">
              Ameer Gul Khan
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">
              Full-Stack Software Developer
            </span>
            <span className="text-gray-400">•</span>
            <a
              href="https://github.com/ameergulkhan1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-500 transition-colors hover:text-blue-600"
            >
              <FaGithub className="h-3.5 w-3.5" />
              GitHub
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="https://linkedin.com/in/your-profile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-gray-500 transition-colors hover:text-blue-600"
            >
              <FaLinkedin className="h-3.5 w-3.5" />
              LinkedIn
            </a>
          </div>
        </div>

        <Link href="/dashboard/orders/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow duration-200">
            <FaPlus className="mr-2 h-3.5 w-3.5" />
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