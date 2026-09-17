"use client";

import { useState } from "react";
import { Check, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for testing the waters",
    features: [
      "20 orders/month",
      "Basic dashboard",
      "1 user",
      "Customer management",
      "Product management",
      "Email support",
    ],
    buttonText: "Start Free",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Starter",
    price: "999",
    description: "For growing businesses",
    features: [
      "500 orders/month",
      "Inventory management",
      "Customer history",
      "WhatsApp tools",
      "2 users",
      "Basic reports",
      "Priority support",
    ],
    buttonText: "Start Free Trial",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Business",
    price: "1,999",
    description: "For serious sellers",
    features: [
      "Unlimited orders",
      "Advanced analytics",
      "5 users",
      "COD insights",
      "Return management",
      "Premium support",
      "Setup assistance",
    ],
    buttonText: "Contact Sales",
    buttonVariant: "outline" as const,
    popular: false,
  },
];

export function Pricing() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="mb-4 inline-flex items-center rounded-full bg-green-100 px-4 py-1.5 text-sm font-medium text-green-700">
              💰 Pricing
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-gray-600">
              Start free. Upgrade as you grow. No hidden fees.
            </p>
          </motion.div>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`text-sm font-medium transition-colors ${
                billingCycle === "monthly" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Monthly
            </button>
            <div
              className="relative h-8 w-14 cursor-pointer rounded-full bg-gray-200 transition-colors"
              onClick={() =>
                setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")
              }
            >
              <div
                className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all ${
                  billingCycle === "yearly" ? "left-7" : "left-1"
                }`}
              />
            </div>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`text-sm font-medium transition-colors ${
                billingCycle === "yearly" ? "text-gray-900" : "text-gray-500"
              }`}
            >
              Yearly
              <span className="ml-1.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => {
            const annualPrice = parseInt(plan.price) * 12 * 0.8;
            const displayPrice =
              billingCycle === "yearly" && plan.price !== "0"
                ? Math.round(annualPrice / 12)
                : plan.price;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative rounded-2xl border ${
                  plan.popular
                    ? "border-blue-500 bg-gradient-to-b from-blue-50 to-white shadow-xl shadow-blue-200/50"
                    : "border-gray-200 bg-white shadow-sm hover:shadow-lg"
                } p-8 transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-blue-200">
                    <Star className="mr-1 inline h-3 w-3" />
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-4 flex items-baseline">
                    {plan.price !== "0" && billingCycle === "yearly" && (
                      <span className="mr-2 text-sm font-medium text-gray-400 line-through">
                        Rs.{plan.price}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price === "0" ? "Free" : `Rs.${displayPrice}`}
                    </span>
                    {plan.price !== "0" && (
                      <span className="ml-2 text-sm text-gray-500">
                        /{billingCycle === "yearly" ? "mo" : "month"}
                      </span>
                    )}
                  </div>
                  {billingCycle === "yearly" && plan.price !== "0" && (
                    <p className="mt-1 text-sm text-green-600">
                      Billed annually (Rs.{Math.round(annualPrice)}/year)
                    </p>
                  )}
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.buttonText === "Contact Sales" ? "/contact" : "/register"}>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
                        : plan.buttonVariant === "outline"
                        ? "border-blue-600 text-blue-600 hover:bg-blue-50"
                        : ""
                    }`}
                    variant={plan.buttonVariant}
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                </Link>

                {plan.popular && (
                  <div className="mt-4 flex items-center justify-center gap-1 text-xs text-gray-500">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    No credit card required
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            All plans include 30-day money-back guarantee. Need a custom plan?{" "}
            <a href="#" className="font-medium text-blue-600 hover:underline">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}