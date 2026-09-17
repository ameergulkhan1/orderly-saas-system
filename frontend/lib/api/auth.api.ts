// lib/api/auth.api.ts

import {
  apiFetch,
  setTokens,
  setStoredUser,
  setStoredBusiness,
  clearTokens,
} from "./client";
import type { User, Business } from "./types";

export interface AuthPayload {
  user: User;
  business: Business;
  tokens: { accessToken: string; refreshToken: string };
}

export const authAPI = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    businessName: string;
    phone: string;
  }) => {
    const res = await apiFetch<AuthPayload>("/auth/register", {
      method: "POST",
      json: data,
      skipAuth: true,
    });

    if (res.success && res.data) {
      setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
      setStoredUser(res.data.user);
      setStoredBusiness(res.data.business);
    }
    return res;
  },

  login: async (data: { email: string; password: string }) => {
    const res = await apiFetch<AuthPayload>("/auth/login", {
      method: "POST",
      json: data,
      skipAuth: true,
    });

    if (res.success && res.data) {
      setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
      setStoredUser(res.data.user);
      setStoredBusiness(res.data.business);
    }
    return res;
  },

  /**
   * Sign in with a Google ID token from Firebase.
   * Backend verifies the token, finds the existing user, returns your own JWT.
   */
  googleLogin: async (data: { idToken: string }) => {
    const res = await apiFetch<AuthPayload>("/auth/google", {
      method: "POST",
      json: data,
      skipAuth: true,
    });

    if (res.success && res.data) {
      setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
      setStoredUser(res.data.user);
      setStoredBusiness(res.data.business);
    }
    return res;
  },

  /**
   * Sign up with a Google ID token from Firebase.
   * Backend verifies the token, creates the user + business if missing,
   * returns your own JWT.
   */
  googleRegister: async (data: {
    idToken: string;
    businessName?: string;
    phone?: string;
  }) => {
    const res = await apiFetch<AuthPayload>("/auth/google/register", {
      method: "POST",
      json: data,
      skipAuth: true,
    });

    if (res.success && res.data) {
      setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
      setStoredUser(res.data.user);
      setStoredBusiness(res.data.business);
    }
    return res;
  },

  logout: async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      clearTokens();
    }
  },

  me: () =>
    apiFetch<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      business: Business;
    }>("/auth/me"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiFetch("/auth/change-password", {
      method: "PATCH",
      json: data,
    }),

  refreshToken: (refreshToken: string) =>
    apiFetch<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh-token",
      {
        method: "POST",
        json: { refreshToken },
        skipAuth: true,
      }
    ),

  forgotPassword: (data: { email: string }) =>
    apiFetch("/auth/forgot-password", {
      method: "POST",
      json: data,
      skipAuth: true,
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiFetch("/auth/reset-password", {
      method: "POST",
      json: data,
      skipAuth: true,
    }),
};