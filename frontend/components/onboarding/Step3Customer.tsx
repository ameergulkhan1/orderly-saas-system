"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

interface Step3CustomerProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export function Step3Customer({ onNext, onBack, initialData }: Step3CustomerProps) {
  const [formData, setFormData] = useState({
    customerName: initialData?.customerName || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
  });

  const [skip, setSkip] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (skip || (formData.customerName && formData.phone)) {
      onNext(skip ? { skipped: true } : formData);
    }
  };

  const isValid = formData.customerName && formData.phone;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-4">
        <UserPlus className="h-5 w-5 text-blue-600" />
        <p className="text-sm text-blue-700">
          Add your first customer to get started. You can always add more later.
        </p>
      </div>

      <div>
        <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
          Customer Name
        </Label>
        <Input
          id="customerName"
          placeholder="Ahmed Khan"
          className="mt-1 h-11"
          value={formData.customerName}
          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
          Phone Number
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="0300XXXXXXX"
          className="mt-1 h-11"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="address" className="text-sm font-medium text-gray-700">
          Address (Optional)
        </Label>
        <Input
          id="address"
          placeholder="Satellite Town, Rawalpindi"
          className="mt-1 h-11"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="skip"
          checked={skip}
          onChange={(e) => setSkip(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <Label htmlFor="skip" className="text-sm text-gray-600">
          Skip this step for now
        </Label>
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-gray-300 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!skip && !isValid}
          className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {skip ? "Skip & Continue →" : "Next Step →"}
        </button>
      </div>
    </form>
  );
}