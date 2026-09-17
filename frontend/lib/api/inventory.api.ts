// lib/api/inventory.api.ts

import { apiFetch, buildQuery } from "./client";
import { toArray, toObject } from "./normalize";
import type { Product, InventoryTransaction, PaginationParams } from "./types";

export const inventoryAPI = {
  list: async (
    params?: PaginationParams & { search?: string; status?: string }
  ) => {
    const res = await apiFetch<any>(`/inventory${buildQuery(params)}`);
    return {
      success: res.success,
      data: toArray<Product>(res.data, ["inventory", "products"]),
      error: res.error,
    };
  },

  getByProduct: async (productId: string) => {
    const res = await apiFetch<any>(`/inventory/${productId}`);
    return {
      success: res.success,
      data: toObject<
        Product & { inventoryTransactions: InventoryTransaction[] }
      >(res.data, ["inventory", "product"]),
      error: res.error,
    };
  },

  updateStock: (productId: string, data: { quantity: number; reason?: string }) =>
    apiFetch<Product>(`/inventory/${productId}/stock`, {
      method: "PATCH",
      json: data,
    }),

  adjust: (
    productId: string,
    data: {
      adjustment: number;
      reason: string;
      type: "RESTOCK" | "SALE" | "RETURN" | "ADJUSTMENT" | "DAMAGE";
    }
  ) =>
    apiFetch<Product>(`/inventory/${productId}/adjust`, {
      method: "POST",
      json: data,
    }),

  lowStock: async () => {
    const res = await apiFetch<any>("/inventory/low-stock");
    return {
      success: res.success,
      data: toArray<Product>(res.data, ["products"]),
      error: res.error,
    };
  },

  outOfStock: async () => {
    const res = await apiFetch<any>("/inventory/out-of-stock");
    return {
      success: res.success,
      data: toArray<Product>(res.data, ["products"]),
      error: res.error,
    };
  },

  summary: async () => {
    const res = await apiFetch<any>("/inventory/summary");
    return {
      success: res.success,
      data: toObject<{
        totalItems: number;
        lowStockCount: number;
        outOfStockCount: number;
      }>(res.data, ["summary"]),
      error: res.error,
    };
  },

  transactions: async (
    params?: PaginationParams & { productId?: string; type?: string }
  ) => {
    const res = await apiFetch<any>(
      `/inventory/transactions${buildQuery(params)}`
    );
    return {
      success: res.success,
      data: toArray<InventoryTransaction>(res.data, ["transactions"]),
      error: res.error,
    };
  },

  getProductTransactions: async (
    productId: string,
    params?: PaginationParams
  ) => {
    const res = await apiFetch<any>(
      `/inventory/transactions${buildQuery({ productId, ...params })}`
    );
    return {
      success: res.success,
      data: toArray<InventoryTransaction>(res.data, ["transactions"]),
      error: res.error,
    };
  },
};