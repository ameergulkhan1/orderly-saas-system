"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { inventoryAPI } from "@/lib/api/inventory.api";
import { productsAPI } from "@/lib/api/products.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { Product, InventoryTransaction } from "@/lib/api/types";
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
  PackagePlus,
  Truck,
  Zap,
  History,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// Types & helpers
// ─────────────────────────────────────────────────────────

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

// Matches the union in inventoryAPI.adjust exactly
type AdjustmentType =
  | "RESTOCK"
  | "SALE"
  | "RETURN"
  | "ADJUSTMENT"
  | "DAMAGE";

const ADJUSTMENT_LABELS: Record<AdjustmentType, string> = {
  RESTOCK: "Restock",
  ADJUSTMENT: "Manual Adjustment",
  SALE: "Sale",
  RETURN: "Return",
  DAMAGE: "Damage / Loss",
};

type ActiveMode = "add" | "set" | "adjust";

const QUICK_ADD_PRESETS = [5, 10, 25, 50, 100];

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function InventoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recent history (per-product transactions)
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);

  // Tabs — "add" is the default because it's the most frequent action
  const [activeMode, setActiveMode] = useState<ActiveMode>("add");

  // --- Add Stock mode ---
  const [addAmount, setAddAmount] = useState<number>(0);
  const [batchRef, setBatchRef] = useState("");

  // --- Set Exact mode ---
  const [setQuantity, setSetQuantity] = useState<number>(0);

  // --- Adjust by amount mode ---
  const [adjustBy, setAdjustBy] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<AdjustmentType>("RESTOCK");

  // Shared reason (used by set + adjust)
  const [reason, setReason] = useState("");

  // ─── Load product on mount ────────────────────────────
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

  // ─── Load recent transactions ─────────────────────────
  const loadTransactions = useCallback(async () => {
    if (!id) return;
    try {
      const res = await inventoryAPI.getProductTransactions(id, {
        limit: 5,
        page: 1,
      });
      if (res.success && res.data) {
        setTransactions(res.data);
      }
    } catch {
      // history is non-critical — swallow errors silently
    }
  }, [id]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const flashSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // ─── Add Stock (primary) ─────────────────────────────
  // Uses the adjust endpoint with a positive delta + RESTOCK type.
  // The response contains the updated Product — use it directly.
  const handleAddStock = async () => {
    if (!product) return;
    if (addAmount <= 0) {
      alert("Please enter a positive quantity to add");
      return;
    }

    setSaving(true);
    try {
      const res = await inventoryAPI.adjust(product.id, {
        adjustment: addAmount,
        reason: batchRef.trim()
          ? `Restock — ${batchRef.trim()}`
          : "Restock from supplier",
        type: "RESTOCK",
      });

      if (!res.success) {
        alert(res.error?.message || "Failed to add stock");
        return;
      }

      // res.data is the updated Product from the API
      if (res.data) {
        setProduct(res.data);
        setSetQuantity((res.data as Product).currentStock ?? 0);
      }

      flashSuccess(`Added ${addAmount} units to stock`);
      setAddAmount(0);
      setBatchRef("");
      loadTransactions();
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to add stock");
    } finally {
      setSaving(false);
    }
  };

  // ─── Set Exact ────────────────────────────────────────
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

      if (res.data) {
        setProduct(res.data);
      }

      setReason("");
      flashSuccess(`Stock set to ${setQuantity}`);
      loadTransactions();
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to update stock");
    } finally {
      setSaving(false);
    }
  };

  // ─── Adjust by amount ─────────────────────────────────
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

      if (res.data) {
        setProduct(res.data);
        setSetQuantity((res.data as Product).currentStock ?? 0);
      }

      setAdjustBy(0);
      setReason("");
      flashSuccess("Stock adjusted successfully");
      loadTransactions();
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to adjust stock");
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading / error states ───────────────────────────
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
  const previewAdd = product.currentStock + addAmount;

  // ─── Render ───────────────────────────────────────────
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

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4" />
          {successMsg}
        </div>
      )}

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

      {/* PRIMARY: Add Stock Card */}
      <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <PackagePlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Add Stock
              </h3>
              <p className="text-xs text-gray-600">
                Received a new batch from your supplier? Add it here.
              </p>
            </div>
          </div>
          <Badge className="border-0 bg-blue-600 text-white">
            <Zap className="mr-1 h-3 w-3" />
            Quick
          </Badge>
        </div>

        {/* One-click presets */}
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-600">
            Quick add
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ADD_PRESETS.map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setAddAmount((prev) => prev + qty)}
                className="flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow"
              >
                <Plus className="h-3.5 w-3.5" />
                {qty}
              </button>
            ))}
            {addAmount > 0 && (
              <button
                type="button"
                onClick={() => setAddAmount(0)}
                className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50"
              >
                <XCircle className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Custom amount + stepper */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="addAmount">Quantity to add</Label>
            <div className="mt-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAddAmount(Math.max(0, addAmount - 1))}
                disabled={addAmount <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="addAmount"
                type="number"
                min="0"
                value={addAmount}
                onChange={(e) =>
                  setAddAmount(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="h-11 text-center text-lg font-semibold"
                placeholder="0"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setAddAmount(addAmount + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="batchRef">
              Supplier / Batch reference{" "}
              <span className="text-gray-400">(optional)</span>
            </Label>
            <Input
              id="batchRef"
              value={batchRef}
              onChange={(e) => setBatchRef(e.target.value)}
              placeholder="e.g. Batch #A-2024, Karachi Textiles"
              className="mt-1 h-11"
            />
          </div>
        </div>

        {/* Preview */}
        {addAmount > 0 && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-white p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Stock preview</span>
              <div className="flex items-center gap-2 font-semibold">
                <span className="text-gray-900">
                  {product.currentStock}
                </span>
                <span className="text-gray-400">→</span>
                <span className="text-blue-600">{previewAdd}</span>
                <span className="flex items-center gap-0.5 text-green-600">
                  <TrendingUp className="h-3.5 w-3.5" />
                  +{addAmount}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Primary CTA */}
        <Button
          onClick={handleAddStock}
          disabled={saving || addAmount <= 0}
          className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 py-6 text-base font-semibold text-white hover:shadow-lg transition-shadow"
        >
          <PackagePlus className="mr-2 h-5 w-5" />
          {saving
            ? "Adding..."
            : addAmount > 0
            ? `Add ${addAmount} units to stock`
            : "Add stock"}
        </Button>
      </div>

      {/* Secondary actions */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
          Other stock actions
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveMode("set")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeMode === "set"
                ? "bg-blue-600 text-white shadow"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            Set exact quantity
          </button>
          <button
            onClick={() => setActiveMode("adjust")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              activeMode === "adjust"
                ? "bg-blue-600 text-white shadow"
                : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Adjust by amount
          </button>
        </div>
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
                  <Label htmlFor="adjustBy">Adjustment (+/- units)</Label>
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

          {activeMode === "add" && (
            <div className="rounded-xl border border-dashed bg-gray-50 p-6 text-center">
              <PackagePlus className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                Use the <strong>Add Stock</strong> panel above, or choose
                another action.
              </p>
            </div>
          )}
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-6">
          {/* Restock Presets */}
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center font-semibold text-gray-900">
              <Truck className="mr-2 h-4 w-4 text-blue-600" />
              Restock Presets
            </h3>
            <div className="space-y-2">
              {[10, 25, 50, 100, 200].map((qty) => (
                <Button
                  key={qty}
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => {
                    setActiveMode("add");
                    setAddAmount(qty);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <PackagePlus className="h-3.5 w-3.5 text-blue-600" />
                    Add {qty} units
                  </span>
                  <span className="text-xs text-green-600">
                    → {product.currentStock + qty}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Recent History */}
          {transactions.length > 0 && (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <h3 className="mb-4 flex items-center font-semibold text-gray-900">
                <History className="mr-2 h-4 w-4 text-gray-600" />
                Recent Changes
              </h3>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((t) => {
                  const positive = (t.quantity ?? 0) > 0;
                  return (
                    <div
                      key={t.id}
                      className="flex items-start justify-between gap-3 border-b border-gray-100 pb-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-700">
                          {t.type}
                        </p>
                        <p className="truncate text-[11px] text-gray-500">
                          {t.reason || "—"}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 text-xs font-semibold ${
                          positive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {positive ? "+" : ""}
                        {t.quantity}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                <Badge className={`${STATUS_COLORS[status]} border-0`}>
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