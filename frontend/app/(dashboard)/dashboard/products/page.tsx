"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  Package,
  Edit,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { productsAPI } from "@/lib/api/products.api";
import { arrayFrom } from "@/lib/api/arrayFrom";

type Product = {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  status: string;
  category: string;
};

const statusFilters = ["All", "In Stock", "Low Stock", "Out of Stock"];
const statusColors: Record<string, string> = {
  "In Stock": "bg-green-100 text-green-700",
  "Low Stock": "bg-yellow-100 text-yellow-700",
  "Out of Stock": "bg-red-100 text-red-700",
};
const statusIcons: Record<string, React.ReactNode> = {
  "In Stock": <CheckCircle className="h-4 w-4 text-green-600" />,
  "Low Stock": <AlertCircle className="h-4 w-4 text-yellow-600" />,
  "Out of Stock": <XCircle className="h-4 w-4 text-red-600" />,
};

function deriveStatus(stock: number, lowStockThreshold = 5): string {
  if (stock === 0) return "Out of Stock";
  if (stock <= lowStockThreshold) return "Low Stock";
  return "In Stock";
}

export default function ProductsPage() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productsAPI.list({ limit: 100 });
        const list = arrayFrom<any>(res, ["products"]);

        console.log("[products] response:", res, "→ list:", list);

        if (!res.success && list.length === 0) {
          setError(res.error?.message || "Failed to load products");
          return;
        }

        setProducts(
          list.map((p: any) => {
            const stock = Number(p.currentStock ?? p.stock ?? 0);
            const threshold = Number(p.lowStockThreshold ?? 5);
            return {
              id: String(p.id),
              name: p.name ?? "Unnamed",
              sku: p.sku ?? "-",
              price: Number(p.price ?? 0),
              cost: Number(p.costPrice ?? p.cost ?? 0),
              stock,
              status: deriveStatus(stock, threshold),
              category: p.category ?? "Uncategorized",
            };
          })
        );
      } catch (err: any) {
        setError(
          err?.error?.message || err?.message || "Failed to load products"
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesStatus =
          selectedStatus === "All" || product.status === selectedStatus;
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(q) ||
          product.sku.toLowerCase().includes(q);
        return matchesStatus && matchesSearch;
      }),
    [products, selectedStatus, searchQuery]
  );

  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.status === "In Stock").length;
    const lowStock = products.filter((p) => p.status === "Low Stock").length;
    const outStock = products.filter((p) => p.status === "Out of Stock").length;
    return { total, inStock, lowStock, outStock };
  }, [products]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await productsAPI.delete(id);
      if (!res.success) {
        alert(res.error?.message || "Failed to delete product");
        return;
      }
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-sm text-gray-600">Manage your product inventory</p>
        </div>
        <Link href="/dashboard/products/new">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-shadow duration-200">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Total Products", value: stats.total, icon: Package, color: "text-blue-600" },
          { label: "In Stock", value: stats.inStock, icon: CheckCircle, color: "text-green-600" },
          { label: "Low Stock", value: stats.lowStock, icon: AlertCircle, color: "text-yellow-600" },
          { label: "Out of Stock", value: stats.outStock, icon: XCircle, color: "text-red-600" },
        ].map((stat, index) => (
          <div key={index} className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search products by name or SKU..."
            className="pl-9 bg-white border-gray-200 focus:border-blue-500 h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
                selectedStatus === status
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-sm font-medium text-gray-600">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-100 to-purple-100">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-600">
                      {product.sku}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      Rs. {product.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      Rs. {product.cost.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      <span
                        className={
                          product.stock === 0
                            ? "text-red-600"
                            : product.stock <= 5
                            ? "text-yellow-600"
                            : "text-gray-900"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${statusColors[product.status] ?? "bg-gray-100 text-gray-700"} border-0 flex items-center gap-1 w-fit`}
                      >
                        {statusIcons[product.status]}
                        {product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Link href={`/dashboard/products/${product.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-gray-100">
                            <Eye className="h-4 w-4 text-gray-400" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50">
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-red-50"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}