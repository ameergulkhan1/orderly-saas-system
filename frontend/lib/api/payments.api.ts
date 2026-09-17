// lib/api/payments.api.ts

import { apiFetch, buildQuery } from "./client";
import { toArray, toObject } from "./normalize";
import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaginationParams,
} from "./types";

export const paymentsAPI = {
  list: async (
    params?: PaginationParams & {
      orderId?: string;
      status?: PaymentStatus;
      method?: PaymentMethod;
    }
  ) => {
    const res = await apiFetch<any>(`/payments${buildQuery(params)}`);
    return {
      success: res.success,
      data: toArray<Payment>(res.data, ["payments"]),
      error: res.error,
    };
  },

  get: async (id: string) => {
    const res = await apiFetch<any>(`/payments/${id}`);
    return {
      success: res.success,
      data: toObject<Payment>(res.data, ["payment"]),
      error: res.error,
    };
  },

  create: (data: {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    reference?: string;
    notes?: string;
  }) =>
    apiFetch<Payment>("/payments", {
      method: "POST",
      json: data,
    }),

  record: (data: {
    orderId: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    reference?: string;
    notes?: string;
  }) =>
    apiFetch<Payment>("/payments/record", {
      method: "POST",
      json: data,
    }),

  update: (id: string, data: Partial<Payment>) =>
    apiFetch<Payment>(`/payments/${id}`, {
      method: "PATCH",
      json: data,
    }),

  summary: async () => {
    const res = await apiFetch<any>("/payments/summary");
    return {
      success: res.success,
      data: toObject<{
        totalReceived: number;
        totalPending: number;
        totalCOD: number;
        totalFailed: number;
        totalRefunded: number;
      }>(res.data, ["summary"]),
      error: res.error,
    };
  },

  methods: async () => {
    const res = await apiFetch<any>("/payments/methods");
    return {
      success: res.success,
      data: toArray<{ method: string; total: number; count: number }>(
        res.data,
        ["methods"]
      ),
      error: res.error,
    };
  },

  byOrder: async (orderId: string) => {
    const res = await apiFetch<any>(`/payments/order/${orderId}`);
    return {
      success: res.success,
      data: toArray<Payment>(res.data, ["payments"]),
      error: res.error,
    };
  },
};