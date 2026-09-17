import { apiFetch, buildQuery } from './client';

export const reportsAPI = {
  revenue: (params?: { period?: string; from?: string; to?: string }) =>
    apiFetch(`/reports/revenue${buildQuery(params)}`),

  orders: (params?: { period?: string; from?: string; to?: string }) =>
    apiFetch(`/reports/orders${buildQuery(params)}`),

  products: (params?: { period?: string; from?: string; to?: string }) =>
    apiFetch(`/reports/products${buildQuery(params)}`),

  customers: (params?: { period?: string; from?: string; to?: string }) =>
    apiFetch(`/reports/customers${buildQuery(params)}`),

  topProducts: (limit = 10, period = 'month') =>
    apiFetch(`/reports/top-products?limit=${limit}&period=${period}`),

  topCustomers: (limit = 10, period = 'month') =>
    apiFetch(`/reports/top-customers?limit=${limit}&period=${period}`),

  orderStatus: () => apiFetch('/reports/order-status')
};