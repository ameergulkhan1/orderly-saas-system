"use client";

import { ArrowRight, CheckCircle, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-12 md:pt-32 md:pb-20">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white pointer-events-none" />
      
      {/* Decorative Circles */}
      <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-6 inline-flex items-center rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-sm text-blue-600 backdrop-blur">
              🚀 Built for Pakistani sellers
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Manage your online orders
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                without the WhatsApp chaos.
              </span>
            </h1>

            <p className="mb-8 text-lg text-gray-600">
              Track orders, manage customers, and grow your business—all from one
              simple dashboard. Built for WhatsApp & Instagram sellers.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all duration-300 group">
                  Start Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="border-gray-300 hover:border-blue-500">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-xs font-semibold text-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">200+</span> sellers trust us
              </div>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                4.9/5 rating
              </div>
            </div>
          </motion.div>

          {/* Right Content - Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="rounded-2xl border bg-white p-6 shadow-2xl shadow-blue-200/30">
              {/* Dashboard Header */}
              <div className="mb-6 flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Ayesha Collection</h3>
                  <p className="text-sm text-gray-500">Good evening, Ayesha 👋</p>
                </div>
                <div className="flex gap-2">
                  <div className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    🔔
                  </div>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    AK
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mb-6 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">37</div>
                  <div className="text-xs font-medium text-gray-600">Orders</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">18</div>
                  <div className="text-xs font-medium text-gray-600">Pending</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">Rs.84.5K</div>
                  <div className="text-xs font-medium text-gray-600">Revenue</div>
                </div>
              </div>

              {/* Recent Orders */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-gray-700">Recent Orders</h4>
                <div className="space-y-2">
                  {[
                    { id: "#1045", name: "Ahmed", amount: "Rs.3,500", status: "Processing" },
                    { id: "#1044", name: "Bilal", amount: "Rs.2,200", status: "Shipped" },
                    { id: "#1043", name: "Sara", amount: "Rs.5,200", status: "Delivered" },
                  ].map((order, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-gray-50/80 p-3 hover:bg-gray-100/80 transition-colors"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.id} • {order.name}
                        </div>
                        <div
                          className={`text-xs font-medium ${
                            order.status === "Delivered"
                              ? "text-green-600"
                              : order.status === "Shipped"
                              ? "text-blue-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {order.status}
                        </div>
                      </div>
                      <div className="font-semibold text-gray-900">{order.amount}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-2 -right-2 h-20 w-20 rounded-full bg-purple-100/40 blur-2xl -z-10" />
              <div className="absolute -top-2 -left-2 h-20 w-20 rounded-full bg-blue-100/40 blur-2xl -z-10" />
            </div>

            {/* Floating Badges */}
            <div className="absolute -right-4 -top-4 hidden lg:block">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Save 2.5 hrs/day</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 hidden lg:block">
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">100% Secure</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}