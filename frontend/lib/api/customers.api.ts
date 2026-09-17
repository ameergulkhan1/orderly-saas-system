// lib/api/customers.api.ts

import { apiFetch, buildQuery } from "./client";
import { toArray, toObject } from "./normalize";
import type { Customer, PaginationParams, CustomerStatus, Order } from "./types";

export const customersAPI = {
  list: async (
    params?: PaginationParams & { search?: string; status?: CustomerStatus }
  ) => {
    const res = await apiFetch<any>(`/customers${buildQuery(params)}`);
    return {
      success: res.success,
      data: toArray<Customer>(res.data, ["customers"]),
      error: res.error,
    };
  },

  get: async (id: string) => {
    const res = await apiFetch<any>(`/customers/${id}`);
    return {
      success: res.success,
      data: toObject<
        Customer & {
          stats: {
            totalOrders: number;
            totalSpent: number;
            averageOrder: number;
          };
        }
      >(res.data, ["customer"]),
      error: res.error,
    };
  },

  create: (data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
    notes?: string;
  }) =>
    apiFetch<Customer>("/customers", {
      method: "POST",
      json: data,
    }),

  update: (id: string, data: Partial<Customer>) =>
    apiFetch<Customer>(`/customers/${id}`, {
      method: "PATCH",
      json: data,
    }),

  delete: (id: string) => apiFetch(`/customers/${id}`, { method: "DELETE" }),

  getOrders: async (id: string, params?: PaginationParams) => {
    const res = await apiFetch<any>(
      `/customers/${id}/orders${buildQuery(params)}`
    );
    return {
      success: res.success,
      data: toArray<Order>(res.data, ["orders"]),
      error: res.error,
    };
  },

  getStats: async (id: string) => {
    const res = await apiFetch<any>(`/customers/${id}/stats`);
    return {
      success: res.success,
      data: toObject<{
        totalOrders: number;
        totalSpent: number;
        averageOrder: number;
      }>(res.data, ["stats"]),
      error: res.error,
    };
  },

  search: async (query: string) => {
    const res = await apiFetch<any>(`/customers${buildQuery({ search: query })}`);
    return {
      success: res.success,
      data: toArray<Customer>(res.data, ["customers"]),
      error: res.error,
    };
  },
};