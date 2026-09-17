"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface Step2ProductProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export function Step2Product({ onNext, onBack, initialData }: Step2ProductProps) {
  const [formData, setFormData] = useState({
    productName: initialData?.productName || "",
    price: initialData?.price || "",
    stock: initialData?.stock || "",
    image: initialData?.image || null,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setFormData({ ...formData, image: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image: null });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.productName && formData.price && formData.stock) {
      onNext(formData);
    }
  };

  const isValid = formData.productName && formData.price && formData.stock;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="productName" className="text-sm font-medium text-gray-700">
          Product Name
        </Label>
        <Input
          id="productName"
          placeholder="Black Premium 2 Piece"
          className="mt-1 h-11"
          value={formData.productName}
          onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price" className="text-sm font-medium text-gray-700">
            Price (Rs.)
          </Label>
          <Input
            id="price"
            type="number"
            placeholder="3500"
            className="mt-1 h-11"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="stock" className="text-sm font-medium text-gray-700">
            Stock Quantity
          </Label>
          <Input
            id="stock"
            type="number"
            placeholder="17"
            className="mt-1 h-11"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium text-gray-700">Product Image</Label>
        <div className="mt-2">
          {imagePreview ? (
            <div className="relative inline-block">
              <Image
                src={imagePreview}
                alt="Product preview"
                width={120}
                height={120}
                className="rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-blue-500 hover:bg-blue-50">
              <Upload className="h-8 w-8 text-gray-400" />
              <span className="mt-2 text-sm text-gray-600">Click to upload image</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          )}
        </div>
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
          disabled={!isValid}
          className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-medium text-white transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step →
        </button>
      </div>
    </form>
  );
}