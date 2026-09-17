// lib/api/deliveries.api.ts

import { apiFetch, buildQuery } from "./client";
import { toArray, toObject } from "./normalize";
import type { Delivery, DeliveryStatus, PaginationParams } from "./types";

export const deliveriesAPI = {
  list: async (
    params?: PaginationParams & {
      status?: DeliveryStatus;
      orderId?: string;
    }
  ) => {
    const res = await apiFetch<any>(`/deliveries${buildQuery(params)}`);
    return {
      success: res.success,
      data: toArray<Delivery>(res.data, ["deliveries"]),
      error: res.error,
    };
  },

  get: async (id: string) => {
    const res = await apiFetch<any>(`/deliveries/${id}`);
    return {
      success: res.success,
      data: toObject<Delivery>(res.data, ["delivery"]),
      error: res.error,
    };
  },

  create: (data: {
    orderId: string;
    courier?: string;
    trackingNumber?: string;
    deliveryFee?: number;
    notes?: string;
  }) =>
    apiFetch<Delivery>("/deliveries", {
      method: "POST",
      json: data,
    }),

  update: (id: string, data: Partial<Delivery>) =>
    apiFetch<Delivery>(`/deliveries/${id}`, {
      method: "PATCH",
      json: data,
    }),

  updateStatus: (id: string, status: DeliveryStatus) =>
    apiFetch<Delivery>(`/deliveries/${id}/status`, {
      method: "PATCH",
      json: { status },
    }),

  updateTracking: (
    id: string,
    data: { trackingNumber: string; courier: string }
  ) =>
    apiFetch<Delivery>(`/deliveries/${id}/tracking`, {
      method: "PATCH",
      json: data,
    }),

  byOrder: async (orderId: string) => {
    const res = await apiFetch<any>(`/deliveries/order/${orderId}`);
    return {
      success: res.success,
      data: toObject<Delivery>(res.data, ["delivery"]),
      error: res.error,
    };
  },

  statusSummary: async () => {
    const res = await apiFetch<any>("/deliveries/status-summary");
    return {
      success: res.success,
      data: toArray<{ status: string; count: number; percentage: number }>(
        res.data,
        ["summary", "statusSummary"]
      ),
      error: res.error,
    };
  },
};