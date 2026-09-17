"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { productsAPI } from "@/lib/api/products.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    price: "",
    costPrice: "",
    currentStock: "",
    lowStockThreshold: "5",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      name: formData.name,
      sku: formData.sku || undefined,
      description: formData.description || undefined,
      category: formData.category || undefined,
      price: Number(formData.price),
      costPrice: formData.costPrice ? Number(formData.costPrice) : undefined,
      currentStock: Number(formData.currentStock) || 0,
      lowStockThreshold: Number(formData.lowStockThreshold) || 5,
    };

    try {
      const res = await productsAPI.create(payload);

      if (!res.success) {
        const details = res.error?.details;
        const detailMsg =
          Array.isArray(details) && details.length > 0
            ? (details as any[])
                .map((d) => `${d.field ?? "field"}: ${d.message ?? "invalid"}`)
                .join(" · ")
            : undefined;

        setError(detailMsg || res.error?.message || "Failed to create product");
        return;
      }

      router.push("/dashboard/products");
    } catch (err: any) {
      setError(
        err?.error?.message || err?.message || "Failed to create product"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Add New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <div>
          <Label>Product Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Black 2 Piece"
            className="mt-1"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>SKU</Label>
            <Input
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="BP-002"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Input
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="Clothing"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label>Description</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Premium black 2-piece suit"
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Price (Rs.) *</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="3500"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>Cost Price (Rs.)</Label>
            <Input
              type="number"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              placeholder="2200"
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Initial Stock *</Label>
            <Input
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
              placeholder="16"
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>Low Stock Threshold</Label>
            <Input
              type="number"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}