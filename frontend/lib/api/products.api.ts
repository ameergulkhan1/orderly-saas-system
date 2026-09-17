// lib/api/products.api.ts

import { apiFetch, buildQuery } from "./client";
import { toArray, toObject } from "./normalize";
import type { Product, PaginationParams, ProductStatus } from "./types";

export const productsAPI = {
  list: async (
    params?: PaginationParams & {
      search?: string;
      category?: string;
      status?: ProductStatus;
    }
  ) => {
    const res = await apiFetch<any>(`/products${buildQuery(params)}`);
    return {
      success: res.success,
      data: toArray<Product>(res.data, ["products"]),
      error: res.error,
    };
  },

  get: async (id: string) => {
    const res = await apiFetch<any>(`/products/${id}`);
    return {
      success: res.success,
      data: toObject<Product>(res.data, ["product"]),
      error: res.error,
    };
  },

  create: (data: {
    name: string;
    sku?: string;
    description?: string;
    category?: string;
    price: number;
    costPrice?: number;
    currentStock?: number;
    lowStockThreshold?: number;
  }) =>
    apiFetch<Product>("/products", {
      method: "POST",
      json: data,
    }),

  update: (id: string, data: Partial<Product>) =>
    apiFetch<Product>(`/products/${id}`, {
      method: "PATCH",
      json: data,
    }),

  delete: (id: string) => apiFetch(`/products/${id}`, { method: "DELETE" }),

  lowStock: async () => {
    const res = await apiFetch<any>("/products/low-stock");
    return {
      success: res.success,
      data: toArray<Product>(res.data, ["products"]),
      error: res.error,
    };
  },

  categories: async () => {
    const res = await apiFetch<any>("/products/categories");
    return {
      success: res.success,
      data: toArray<string>(res.data, ["categories"]),
      error: res.error,
    };
  },

  getInventory: async (id: string) => {
    const res = await apiFetch<any>(`/products/${id}/inventory`);
    return {
      success: res.success,
      data: toObject<{ currentStock: number; lowStockThreshold: number }>(
        res.data,
        ["inventory"]
      ),
      error: res.error,
    };
  },
};