"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { productsAPI } from "@/lib/api/products.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  Edit,
  Trash2,
  DollarSign,
  Boxes,
  AlertCircle,
  CheckCircle,
  XCircle,
  Tag,
  FileText,
  Plus,
} from "lucide-react";

type Product = {
  id: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  category?: string | null;
  price: string | number;
  costPrice?: string | number | null;
  currentStock: number;
  lowStockThreshold: number;
  status: "ACTIVE" | "ARCHIVED";
  createdAt?: string;
  updatedAt?: string;
};

function deriveStockStatus(stock: number, threshold: number) {
  if (stock === 0)
    return {
      label: "Out of Stock",
      color: "bg-red-100 text-red-700",
      icon: <XCircle className="h-4 w-4 text-red-600" />,
    };
  if (stock <= threshold)
    return {
      label: "Low Stock",
      color: "bg-yellow-100 text-yellow-700",
      icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
    };
  return {
    label: "In Stock",
    color: "bg-green-100 text-green-700",
    icon: <CheckCircle className="h-4 w-4 text-green-600" />,
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await productsAPI.get(id);
        if (res.success && res.data) {
          setProduct(res.data as Product);
        } else {
          setError(res.error?.message || "Product not found");
        }
      } catch (err: any) {
        setError(err?.error?.message || err?.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this product? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await productsAPI.delete(id);
      if (!res.success) {
        alert(res.error?.message || "Failed to delete product");
        return;
      }
      router.push("/dashboard/products");
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/products"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Products
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Product not found"}
        </div>
      </div>
    );
  }

  const price = Number(product.price ?? 0);
  const cost = Number(product.costPrice ?? 0);
  const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
  const stockStatus = deriveStockStatus(
    product.currentStock,
    product.lowStockThreshold
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard/products"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Products
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            {product.name}
          </h1>
          <p className="text-sm text-gray-500">
            {product.sku ? `SKU: ${product.sku}` : "No SKU"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/products/${id}/edit`}>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Product Info Card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Package className="h-10 w-10" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">
                  {product.name}
                </h2>
                <Badge className={`${stockStatus.color} border-0 flex items-center gap-1`}>
                  {stockStatus.icon}
                  {stockStatus.label}
                </Badge>
                <Badge className="bg-gray-100 text-gray-700 border-0">
                  {product.status}
                </Badge>
              </div>
              <div className="mt-1 space-y-1">
                {product.category && (
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <Tag className="h-4 w-4 text-gray-400" />
                    {product.category}
                  </p>
                )}
                {product.sku && (
                  <p className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4 text-gray-400" />
                    {product.sku}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
            <div className="rounded-lg bg-blue-50 p-3 text-center min-w-[100px]">
              <p className="text-2xl font-bold text-blue-600">
                Rs. {price.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Selling Price</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center min-w-[100px]">
              <p className="text-2xl font-bold text-purple-600">
                Rs. {cost.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Cost Price</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center min-w-[100px]">
              <p className="text-2xl font-bold text-green-600">
                {margin.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600">Margin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <FileText className="mr-2 h-5 w-5 text-blue-600" />
              Description
            </h3>
            {product.description ? (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No description added.
              </p>
            )}
          </div>

          {/* Pricing Breakdown */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <DollarSign className="mr-2 h-5 w-5 text-blue-600" />
              Pricing Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Selling Price</span>
                <span className="font-semibold text-gray-900">
                  Rs. {price.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cost Price</span>
                <span className="font-medium text-gray-900">
                  Rs. {cost.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm">
                <span className="text-gray-500">Profit per Unit</span>
                <span
                  className={
                    price - cost >= 0
                      ? "font-semibold text-green-600"
                      : "font-semibold text-red-600"
                  }
                >
                  Rs. {(price - cost).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Margin</span>
                <span className="font-medium text-gray-900">
                  {margin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-6">
          {/* Inventory Card */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
              <Boxes className="mr-2 h-5 w-5 text-blue-600" />
              Inventory
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Stock</span>
                <span className="font-semibold text-gray-900">
                  {product.currentStock} units
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Low Stock Threshold</span>
                <span className="font-medium text-gray-900">
                  {product.lowStockThreshold} units
                </span>
              </div>
              <div className="border-t pt-3">
                <Badge
                  className={`${stockStatus.color} border-0 w-full justify-center py-1 flex items-center gap-1`}
                >
                  {stockStatus.icon}
                  {stockStatus.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border bg-gradient-to-r from-blue-50 to-purple-50 p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-medium text-gray-700">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2">
              <Link href={`/dashboard/products/${id}/edit`}>
                <Button
                  variant="outline"
                  className="w-full justify-center border-blue-200 bg-white hover:bg-blue-50"
                >
                  <Edit className="mr-2 h-4 w-4 text-blue-600" />
                  Edit Product
                </Button>
              </Link>
              <Link href={`/dashboard/orders/new?productId=${product.id}`}>
                <Button
                  variant="outline"
                  className="w-full justify-center border-green-200 bg-white hover:bg-green-50"
                >
                  <Plus className="mr-2 h-4 w-4 text-green-600" />
                  Create Order With This
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-center border-red-200 bg-white hover:bg-red-50 text-red-600"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Deleting..." : "Delete Product"}
              </Button>
            </div>
          </div>

          {/* Product Stats */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">Product Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge className="bg-gray-100 text-gray-700 border-0">
                  {product.status}
                </Badge>
              </div>
              {product.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">
                    {product.category}
                  </span>
                </div>
              )}
              {product.sku && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">SKU</span>
                  <span className="font-medium text-gray-900 font-mono">
                    {product.sku}
                  </span>
                </div>
              )}
              {product.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Added</span>
                  <span className="font-medium text-gray-900">
                    {new Date(product.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {product.updatedAt && product.updatedAt !== product.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Updated</span>
                  <span className="font-medium text-gray-900">
                    {new Date(product.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}