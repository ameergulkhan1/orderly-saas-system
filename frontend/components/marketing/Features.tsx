"use client";

import {
  ShoppingCart,
  Users,
  Package,
  CreditCard,
  Truck,
  TrendingUp,
  Clock,
  BarChart3,
  MessageSquare,
  FileCheck,
  Database,
  Globe,
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: ShoppingCart,
    title: "Order Management",
    description: "Create, track, and manage every order from WhatsApp/Instagram in one place.",
    textColor: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Users,
    title: "Customer History",
    description: "Keep complete customer history. Know their order patterns and preferences.",
    textColor: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Package,
    title: "Inventory Tracking",
    description: "Auto-update stock levels. Get alerts when products are running low.",
    textColor: "text-green-600",
    bg: "bg-green-50",
  },
  {
    icon: CreditCard,
    title: "Payment Tracking",
    description: "Track COD, advances, and full payments. Know exactly who paid what.",
    textColor: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  {
    icon: Truck,
    title: "Delivery Management",
    description: "Manage couriers, tracking numbers, and delivery statuses seamlessly.",
    textColor: "text-red-600",
    bg: "bg-red-50",
  },
  {
    icon: TrendingUp,
    title: "Business Analytics",
    description: "See revenue, best-sellers, and business performance at a glance.",
    textColor: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integration",
    description: "Send order confirmations and updates directly via WhatsApp.",
    textColor: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    icon: FileCheck,
    title: "Order Status",
    description: "Track orders from Confirmed → Shipped → Delivered with ease.",
    textColor: "text-orange-600",
    bg: "bg-orange-50",
  },
];

export function Features() {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="mb-4 inline-flex items-center rounded-full bg-blue-100 px-4 py-1.5 text-sm font-medium text-blue-700">
              ✨ Features
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Everything you need to
              <span className="block text-blue-600">manage your business</span>
            </h2>
            <p className="text-lg text-gray-600">
              Built specifically for WhatsApp and Instagram sellers in Pakistan
            </p>
          </motion.div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div
                className={`mb-4 inline-flex rounded-xl ${feature.bg} p-3 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className={`h-5 w-5 ${feature.textColor}`} />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-1 w-0 rounded-b-2xl bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}