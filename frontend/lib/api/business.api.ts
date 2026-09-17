import { apiFetch } from './client';
import type { Business } from './types';

export const businessAPI = {
  get: () => apiFetch<Business>('/business'),

  create: (data: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  }) =>
    apiFetch<Business>('/business', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getById: (id: string) => apiFetch<Business>(`/business/${id}`),

  update: (id: string, data: Partial<Business>) =>
    apiFetch<Business>(`/business/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  getSettings: (id: string) => apiFetch(`/business/${id}/settings`),

  updateSettings: (id: string, data: any) =>
    apiFetch(`/business/${id}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  getUsers: (id: string) => apiFetch(`/business/${id}/users`)
};