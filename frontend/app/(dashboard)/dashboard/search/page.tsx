"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Package, User, ShoppingBag } from "lucide-react";
import { ordersAPI } from "@/lib/api/orders.api";
import { customersAPI } from "@/lib/api/customers.api";
import { productsAPI } from "@/lib/api/products.api";
import type { Order, Customer, Product } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce the query (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch results when debounced query changes
  useEffect(() => {
    if (!debounced) {
      setOrders([]);
      setCustomers([]);
      setProducts([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [o, c, p] = await Promise.all([
          ordersAPI.list({ search: debounced, limit: 5 }),
          customersAPI.list({ search: debounced, limit: 5 }),
          productsAPI.list({ search: debounced, limit: 5 }),
        ]);
        if (o.success) setOrders(o.data);
        if (c.success) setCustomers(c.data);
        if (p.success) setProducts(p.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [debounced]);

  const total = orders.length + customers.length + products.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search</h1>
        <p className="text-sm text-gray-600">
          {debounced
            ? `${total} result${total === 1 ? "" : "s"} for "${debounced}"`
            : "Type to search across orders, customers, and products"}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search orders, customers, products..."
          className="pl-9 h-11"
        />
      </div>

      {loading && (
        <p className="text-sm text-gray-500">Searching...</p>
      )}

      {/* Orders */}
      {orders.length > 0 && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-gray-50 px-6 py-3">
            <ShoppingBag className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Orders</h2>
          </div>
          <ul className="divide-y">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/dashboard/orders/${o.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">#{o.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {o.customerName ?? "Unknown"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      Rs. {Number(o.total).toLocaleString()}
                    </p>
                    <Badge className="mt-1 bg-gray-100 text-gray-700 border-0">
                      {o.status}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Customers */}
      {customers.length > 0 && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-gray-50 px-6 py-3">
            <User className="h-4 w-4 text-purple-600" />
            <h2 className="font-semibold text-gray-900">Customers</h2>
          </div>
          <ul className="divide-y">
            {customers.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/customers/${c.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    <p className="text-sm text-gray-500">{c.phone}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Products */}
      {products.length > 0 && (
        <section className="rounded-xl border bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b bg-gray-50 px-6 py-3">
            <Package className="h-4 w-4 text-green-600" />
            <h2 className="font-semibold text-gray-900">Products</h2>
          </div>
          <ul className="divide-y">
            {products.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/products/${p.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-500">{p.sku ?? "—"}</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    Rs. {Number(p.price).toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {debounced && !loading && total === 0 && (
        <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            No results for "{debounced}"
          </p>
        </div>
      )}
    </div>
  );
}