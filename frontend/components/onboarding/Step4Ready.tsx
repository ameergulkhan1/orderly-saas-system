"use client";

import { CheckCircle, Sparkles, Rocket, ShoppingBag } from "lucide-react";

interface Step4ReadyProps {
  onComplete: () => void;
  data: {
    businessName: string;
    category: string;
    productName: string;
    customerName?: string;
  };
}

export function Step4Ready({ onComplete, data }: Step4ReadyProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">You're ready! 🎉</h2>
        <p className="mt-2 text-gray-600">
          Your store has been set up successfully. You can now start managing your orders.
        </p>
      </div>

      <div className="rounded-lg border bg-gray-50 p-6">
        <h3 className="mb-4 font-semibold text-gray-900">Setup Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Rocket className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{data.businessName}</p>
              <p className="text-xs text-gray-500">{data.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium">{data.productName}</p>
              <p className="text-xs text-gray-500">First product added</p>
            </div>
          </div>
          {data.customerName && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{data.customerName}</p>
                <p className="text-xs text-gray-500">First customer added</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 text-center">
        <p className="text-sm text-gray-700">
          💡 Tip: You can always add more products and customers from your dashboard.
        </p>
      </div>

      <button
        onClick={onComplete}
        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-medium text-white transition-all hover:shadow-lg"
      >
        Go to Dashboard →
      </button>
    </div>
  );
}