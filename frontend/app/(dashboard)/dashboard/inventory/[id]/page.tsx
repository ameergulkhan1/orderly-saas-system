"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { inventoryAPI } from "@/lib/api/inventory.api";
import { productsAPI } from "@/lib/api/products.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/lib/api/types";
import {
  ArrowLeft,
  Package,
  Boxes,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Save,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  History,
} from "lucide-react";

type StockStatus = "In Stock" | "Low Stock" | "Out of Stock";

const STATUS_COLORS: Record<StockStatus, string> = {
  "In Stock": "bg-green-100 text-green-700",
  "Low Stock": "bg-yellow-100 text-yellow-700",
  "Out of Stock": "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<StockStatus, React.ReactNode> = {
  "In Stock": <CheckCircle className="h-4 w-4" />,
  "Low Stock": <AlertCircle className="h-4 w-4" />,
  "Out of Stock": <XCircle className="h-4 w-4" />,
};

function deriveStockStatus(stock: number, threshold: number): StockStatus {
  if (stock === 0) return "Out of Stock";
  if (stock <= threshold) return "Low Stock";
  return "In Stock";
}

type AdjustmentType =
  | "RESTOCK"
  | "ADJUSTMENT"
  | "SALE"
  | "RETURN"
  | "DAMAGE";

const ADJUSTMENT_LABELS: Record<AdjustmentType, string> = {
  RESTOCK: "Restock",
  ADJUSTMENT: "Manual Adjustment",
  SALE: "Sale",
  RETURN: "Return",
  DAMAGE: "Damage / Loss",
};

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // "Set exact" mode
  const [setQuantity, setSetQuantity] = useState<number>(0);

  // "Adjust by" mode
  const [adjustBy, setAdjustBy] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<AdjustmentType>("RESTOCK");
  const [reason, setReason] = useState("");

  const [activeMode, setActiveMode] = useState<"set" | "adjust">("set");

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await productsAPI.get(id);
        if (res.success && res.data) {
          const p = res.data as Product;
          setProduct(p);
          setSetQuantity(p.currentStock ?? 0);
        } else {
          setError(res.error?.message || "Product not found");
        }
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load product"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const refreshProduct = async () => {
    if (!product) return;
    const res = await productsAPI.get(product.id);
    if (res.success && res.data) {
      setProduct(res.data as Product);
    }
  };

  const handleSetStock = async () => {
    if (!product) return;
    if (setQuantity < 0) {
      alert("Quantity cannot be negative");
      return;
    }

    setSaving(true);
    try {
      const res = await inventoryAPI.updateStock(product.id, {
        quantity: setQuantity,
        reason: reason || "Manual stock set",
      });

      if (!res.success) {
        alert(res.error?.message || "Failed to update stock");
        return;
      }

      await refreshProduct();
      setReason("");
      alert(`Stock set to ${setQuantity}`);
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!product) return;
    if (adjustBy === 0) {
      alert("Adjustment cannot be zero");
      return;
    }
    if (!reason.trim()) {
      alert("Please provide a reason for the adjustment");
      return;
    }

    setSaving(true);
    try {
      const res = await inventoryAPI.adjust(product.id, {
        adjustment: adjustBy,
        reason: reason.trim(),
        type: adjustType,
      });

      if (!res.success) {
        alert(res.error?.message || "Failed to adjust stock");
        return;
      }

      await refreshProduct();
      setAdjustBy(0);
      setReason("");
      alert("Stock adjusted successfully");
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to adjust stock");
    } finally {
      setSaving(false);
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
          href="/dashboard/inventory"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Inventory
        </Link>
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Product not found"}
        </div>
      </div>
    );
  }

  const status = deriveStockStatus(
    product.currentStock,
    product.lowStockThreshold
  );

  const previewSet = setQuantity;
  const previewAdjust = product.currentStock + adjustBy;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Inventory
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">
            Manage Stock — {product.name}
          </h1>
          <p className="text-sm text-gray-500">
            {product.sku ? `SKU: ${product.sku}` : "No SKU"}
          </p>
        </div>
        <Link href={`/dashboard/products/${product.id}`}>
          <Button
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View Product
          </Button>
        </Link>
      </div>

      {/* Current Stock Card */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Package className="h-10 w-10" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Stock</p>
              <div className="flex items-center gap-3">
                <p className="text-3xl font-bold text-gray-900">
                  {product.currentStock}
                </p>
                <Badge
                  className={`${STATUS_COLORS[status]} border-0 flex items-center gap-1`}
                >
                  {STATUS_ICONS[status]}
                  {status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Low stock threshold: {product.lowStockThreshold} units
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="rounded-lg bg-blue-50 p-3 text-center min-w-[100px]">
              <p className="text-xs text-gray-600">Selling Price</p>
              <p className="text-lg font-bold text-blue-600">
                Rs. {Number(product.price).toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-3 text-center min-w-[100px]">
              <p className="text-xs text-gray-600">Threshold</p>
              <p className="text-lg font-bold text-purple-600">
                {product.lowStockThreshold}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveMode("set")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeMode === "set"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Set Exact Quantity
        </button>
        <button
          onClick={() => setActiveMode("adjust")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            activeMode === "adjust"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          Adjust by Amount
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Set Quantity Mode */}
          {activeMode === "set" && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <Boxes className="mr-2 h-5 w-5 text-blue-600" />
                Set Exact Quantity
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="setQuantity">New Stock Quantity</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSetQuantity(Math.max(0, setQuantity - 1))
                      }
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="setQuantity"
                      type="number"
                      min="0"
                      value={setQuantity}
                      onChange={(e) =>
                        setSetQuantity(parseInt(e.target.value) || 0)
                      }
                      className="h-11 text-center text-lg font-semibold"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setSetQuantity(setQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="setReason">Reason (optional)</Label>
                  <Input
                    id="setReason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Physical stock count"
                    className="mt-1 h-11"
                  />
                </div>

                {previewSet !== product.currentStock && (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm">
                    <p className="text-gray-600">
                      Preview:{" "}
                      <span className="font-semibold text-gray-900">
                        {product.currentStock}
                      </span>{" "}
                      →{" "}
                      <span className="font-semibold text-blue-600">
                        {previewSet}
                      </span>{" "}
                      <span
                        className={
                          previewSet > product.currentStock
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        (
                        {previewSet > product.currentStock ? "+" : ""}
                        {previewSet - product.currentStock})
                      </span>
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSetStock}
                  disabled={saving || setQuantity === product.currentStock}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Set Stock"}
                </Button>
              </div>
            </div>
          )}

          {/* Adjust by Amount Mode */}
          {activeMode === "adjust" && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <RefreshCw className="mr-2 h-5 w-5 text-blue-600" />
                Adjust Stock by Amount
              </h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="adjustBy">
                    Adjustment (+/- units)
                  </Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdjustBy(adjustBy - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input
                      id="adjustBy"
                      type="number"
                      value={adjustBy}
                      onChange={(e) =>
                        setAdjustBy(parseInt(e.target.value) || 0)
                      }
                      className="h-11 text-center text-lg font-semibold"
                      placeholder="e.g. 10 or -5"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAdjustBy(adjustBy + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Use negative numbers to decrease (e.g. -5 for damage)
                  </p>
                </div>

                <div>
                  <Label>Adjustment Type</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                    {(Object.keys(ADJUSTMENT_LABELS) as AdjustmentType[]).map(
                      (type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setAdjustType(type)}
                          className={`rounded-lg border p-3 text-sm font-medium transition-all ${
                            adjustType === type
                              ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500"
                              : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {ADJUSTMENT_LABELS[type]}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="adjustReason">Reason *</Label>
                  <Input
                    id="adjustReason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Received new batch from supplier"
                    className="mt-1 h-11"
                    required
                  />
                </div>

                {adjustBy !== 0 && (
                  <div className="rounded-lg bg-blue-50 p-3 text-sm">
                    <p className="text-gray-600">
                      Preview:{" "}
                      <span className="font-semibold text-gray-900">
                        {product.currentStock}
                      </span>{" "}
                      →{" "}
                      <span
                        className={`font-semibold ${
                          previewAdjust < 0
                            ? "text-red-600"
                            : "text-blue-600"
                        }`}
                      >
                        {Math.max(previewAdjust, 0)}
                      </span>{" "}
                      <span
                        className={
                          adjustBy > 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        ({adjustBy > 0 ? "+" : ""}
                        {adjustBy})
                      </span>
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleAdjustStock}
                  disabled={saving || adjustBy === 0 || !reason.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Adjusting..." : "Adjust Stock"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-6">
          {/* Quick Stock Actions */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center font-semibold text-gray-900">
              <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
              Quick Stock Levels
            </h3>
            <div className="space-y-2">
              {[10, 25, 50, 100].map((qty) => (
                <Button
                  key={qty}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    setActiveMode("set");
                    setSetQuantity(qty);
                  }}
                >
                  <span>Set to {qty}</span>
                  <span className="text-xs text-gray-500">
                    {qty > product.currentStock
                      ? `+${qty - product.currentStock}`
                      : qty === product.currentStock
                      ? "same"
                      : `${qty - product.currentStock}`}
                  </span>
                </Button>
              ))}
              <Button
                variant="outline"
                className="w-full justify-between border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => {
                  setActiveMode("set");
                  setSetQuantity(0);
                }}
              >
                <span>Clear Stock (0)</span>
                <span className="text-xs">
                  {0 - product.currentStock}
                </span>
              </Button>
            </div>
          </div>

          {/* Product Info */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-gray-900">
              Product Info
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Product</span>
                <span className="font-medium text-gray-900 truncate max-w-[140px]">
                  {product.name}
                </span>
              </div>
              {product.sku && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">SKU</span>
                  <span className="font-mono text-xs text-gray-900">
                    {product.sku}
                  </span>
                </div>
              )}
              {product.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">
                    {product.category}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge
                  className={`${STATUS_COLORS[status]} border-0`}
                >
                  {status}
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
              <Link href={`/dashboard/products/${product.id}`}>
                <Button
                  variant="outline"
                  className="w-full justify-center border-blue-200 bg-white hover:bg-blue-50"
                >
                  <ExternalLink className="mr-2 h-4 w-4 text-blue-600" />
                  View Product
                </Button>
              </Link>
              <Link href={`/dashboard/products/${product.id}/edit`}>
                <Button
                  variant="outline"
                  className="w-full justify-center border-purple-200 bg-white hover:bg-purple-50"
                >
                  <Package className="mr-2 h-4 w-4 text-purple-600" />
                  Edit Product
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-center border-gray-300 bg-white hover:bg-gray-50"
                onClick={() => router.push("/dashboard/inventory")}
              >
                <ArrowLeft className="mr-2 h-4 w-4 text-gray-600" />
                Back to Inventory
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}