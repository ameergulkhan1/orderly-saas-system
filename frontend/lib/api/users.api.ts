// lib/api/users.api.ts

import { apiFetch, buildQuery } from "./client";
import { toArray, toObject } from "./normalize";
import type { User, PaginationParams, UserRole, UserStatus } from "./types";

export const usersAPI = {
  list: async (
    params?: PaginationParams & { role?: UserRole; status?: UserStatus }
  ) => {
    const res = await apiFetch<any>(`/users${buildQuery(params)}`);
    return {
      success: res.success,
      data: toArray<User>(res.data, ["users"]),
      error: res.error,
    };
  },

  get: async (id: string) => {
    const res = await apiFetch<any>(`/users/${id}`);
    return {
      success: res.success,
      data: toObject<User>(res.data, ["user"]),
      error: res.error,
    };
  },

  create: (data: {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "STAFF";
  }) =>
    apiFetch<User>("/users/create", {
      method: "POST",
      json: data,
    }),

  update: (id: string, data: { name?: string; email?: string }) =>
    apiFetch<User>(`/users/${id}`, {
      method: "PATCH",
      json: data,
    }),

  updateStatus: (id: string, status: "ACTIVE" | "SUSPENDED") =>
    apiFetch<User>(`/users/${id}/status`, {
      method: "PATCH",
      json: { status },
    }),

  delete: (id: string) => apiFetch(`/users/${id}`, { method: "DELETE" }),
};