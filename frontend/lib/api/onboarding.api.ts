import { apiFetch } from './client';

export type BusinessCategory =
  | 'clothing'
  | 'cosmetics'
  | 'food'
  | 'electronics'
  | 'jewelry'
  | 'other';

export interface CompleteOnboardingPayload {
  business: {
    businessName?: string;
    category: BusinessCategory;
  };
  product?: {
    name: string;
    price: number;
    stock: number;
    sku?: string;
  };
  customer?: {
    name: string;
    phone: string;
    address?: string;
    city?: string;
  };
}

export const onboardingAPI = {
  complete: (data: CompleteOnboardingPayload) =>
    apiFetch('/onboarding/complete', { method: 'POST', json: data }),

  status: () =>
    apiFetch<{
      completed: boolean;
      completedAt: string | null;
      directUrl: string | null;
      category: string | null;
      businessName: string;
    }>('/onboarding/status'),
};