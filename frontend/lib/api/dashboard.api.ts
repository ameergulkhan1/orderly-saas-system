import { apiFetch } from './client';
import type { Order } from './types';

export const dashboardAPI = {
  stats: () =>
    apiFetch<{
      totalOrders: number;
      totalRevenue: number;
      pendingOrders: number;
      lowStock: number;
      todayOrders: number;
      todayRevenue: number;
      totalCustomers: number;
      totalProducts: number;
    }>('/dashboard/stats'),

  recentOrders: (limit = 5) =>
    apiFetch<Order[]>(`/dashboard/recent-orders?limit=${limit}`),

  revenueChart: (period: 'week' | 'month' | 'year' = 'week') =>
    apiFetch<{ date: string; revenue: number; orders: number }[]>(
      `/dashboard/revenue-chart?period=${period}`
    ),

  lowStock: (limit = 5) =>
    apiFetch(`/dashboard/low-stock?limit=${limit}`),

  orderStatus: () =>
    apiFetch<{ status: string; count: number; percentage: number }[]>(
      '/dashboard/order-status'
    ),

  today: () =>
    apiFetch<{
      todayOrders: number;
      todayRevenue: number;
      pendingOrders: number;
      lowStock: number;
    }>('/dashboard/today')
};