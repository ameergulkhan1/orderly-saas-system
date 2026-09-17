import { apiFetch, buildQuery } from "./client";
import { toArray, toObject, toPagination, type Pagination } from "./normalize";
import type { Order, OrderStatus, PaymentStatus, PaginationParams } from "./types";

export interface OrdersListResult {
  orders: Order[];
  pagination?: Pagination;
}

export const ordersAPI = {
  list: async (
    params?: PaginationParams & {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      customerId?: string;
      search?: string;
    }
  ): Promise<{
    success: boolean;
    data: Order[];
    pagination?: Pagination;
    error?: { message: string };
  }> => {
    const res = await apiFetch<any>(`/orders${buildQuery(params)}`);
    return {
      success: res.success,
      data: toArray<Order>(res.data, ["orders"]),
      pagination: toPagination(res.data),
      error: res.error,
    };
  },

  get: async (id: string) => {
    const res = await apiFetch<any>(`/orders/${id}`);
    return {
      success: res.success,
      data: toObject<Order>(res.data, ["order"]),
      error: res.error,
    };
  },

  create: (data: {
    customer: {
      name: string;
      phone: string;
      email?: string;
      address?: string;
      city?: string;
    };
    items: { productId: string; quantity: number; price?: number }[];
    paymentMethod: string;
    deliveryFee?: number;
    notes?: string;
    advancePayment?: number;
    discount?: number;
  }) =>
    apiFetch<Order>("/orders", { method: "POST", json: data }),

  update: (id: string, data: Partial<Order>) =>
    apiFetch<Order>(`/orders/${id}`, { method: "PATCH", json: data }),

  updateStatus: (id: string, data: { status: OrderStatus; notes?: string }) =>
    apiFetch<Order>(`/orders/${id}/status`, { method: "PATCH", json: data }),

  cancel: (id: string, reason: string) =>
    apiFetch<Order>(`/orders/${id}/cancel`, { method: "POST", json: { reason } }),

  timeline: async (id: string) => {
    const res = await apiFetch<any>(`/orders/${id}/timeline`);
    return {
      success: res.success,
      data: toArray<{ status: string; date: string | null; completed: boolean }>(
        res.data,
        ["timeline", "events"]
      ),
      error: res.error,
    };
  },

  invoice: (id: string) =>
    apiFetch<{ url?: string; html?: string }>(`/orders/${id}/invoice`),
};