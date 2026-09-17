"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { productsAPI } from "@/lib/api/products.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await productsAPI.get(id as string);
        if (res.success && res.data) {
          setFormData(res.data);
        } else {
          setError(res.error?.message || "Failed to load product");
        }
      } catch (err: any) {
        setError(err?.error?.message || err?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await productsAPI.update(id as string, {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category,
        price: formData.price as any,
        costPrice: formData.costPrice ? (Number(formData.costPrice) as any) : undefined,
        currentStock: Number(formData.currentStock),
        lowStockThreshold: Number(formData.lowStockThreshold),
      });

      if (!res.success) {
        setError(res.error?.message || "Failed to update");
        return;
      }

      router.push("/dashboard/products");
    } catch (err: any) {
      setError(err?.error?.message || err?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!formData) return <p>Not found</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Edit Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
        <div>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>SKU</Label>
            <Input
              value={formData.sku || ""}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Category</Label>
            <Input
              value={formData.category || ""}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Price</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Cost Price</Label>
            <Input
              type="number"
              value={formData.costPrice || ""}
              onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
              className="mt-1"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Stock</Label>
            <Input
              type="number"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
              className="mt-1"
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
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}