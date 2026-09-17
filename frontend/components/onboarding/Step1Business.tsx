"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const categories = [
  { id: "clothing", label: "👗 Clothing", icon: "👗" },
  { id: "cosmetics", label: "💄 Cosmetics", icon: "💄" },
  { id: "food", label: "🍕 Food", icon: "🍕" },
  { id: "electronics", label: "📱 Electronics", icon: "📱" },
  { id: "jewelry", label: "💍 Jewelry", icon: "💍" },
  { id: "other", label: "📦 Other", icon: "📦" },
];

interface Step1BusinessProps {
  onNext: (data: any) => void;
  initialData?: any;
}

export function Step1Business({ onNext, initialData }: Step1BusinessProps) {
  const [formData, setFormData] = useState({
    businessName: initialData?.businessName || "",
    category: initialData?.category || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.businessName && formData.category) {
      onNext(formData);
    }
  };

  const isValid = formData.businessName && formData.category;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="businessName" className="text-sm font-medium text-gray-700">
          Business Name
        </Label>
        <Input
          id="businessName"
          placeholder="Ayesha Collection"
          className="mt-1 h-11"
          value={formData.businessName}
          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          This will be displayed on your dashboard and orders
        </p>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Business Category</Label>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setFormData({ ...formData, category: category.id })}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg border p-4 transition-all duration-200",
                formData.category === category.id
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="text-2xl">{category.icon}</span>
              <span className="text-sm font-medium">{category.label}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next Step →
      </button>
    </form>
  );
}