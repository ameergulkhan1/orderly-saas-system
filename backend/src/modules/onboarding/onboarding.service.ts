import { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/httpError';
import type { CompleteOnboardingInput } from './onboarding.validation';

export class OnboardingService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Runs the entire onboarding flow atomically:
   *   1. Updates the business (name + category)
   *   2. Optionally creates the first product
   *   3. Optionally creates the first customer
   *   4. Marks the business as onboarded
   *
   * Uses a single transaction — if any step fails, nothing is saved.
   * Ownership is enforced by filtering on businessId from the JWT.
   */
  async complete(businessId: string, data: CompleteOnboardingInput) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, onboardingCompletedAt: true },
    });

    if (!business) {
      throw new HttpError(404, 'Business not found', 'BUSINESS_NOT_FOUND');
    }

    // Idempotency: if already onboarded, just return the current state
    if (business.onboardingCompletedAt) {
      return {
        alreadyCompleted: true,
        business: { id: business.id, name: business.name },
      };
    }

    return this.prisma.$transaction(async (tx) => {
      // 1) Update business details
      const updatedBusiness = await tx.business.update({
        where: { id: businessId },
        data: {
          ...(data.business.businessName
            ? { name: data.business.businessName.trim() }
            : {}),
          category: data.business.category,
          onboardingCompletedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          category: true,
          onboardingCompletedAt: true,
        },
      });

      // 2) Optional first product
      let product = null;
      if (data.product) {
        product = await tx.product.create({
          data: {
            businessId,
            name: data.product.name.trim(),
            sku: data.product.sku?.trim() || null,
            price: String(data.product.price),
            currentStock: data.product.stock,
            lowStockThreshold: 5,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            name: true,
            price: true,
            currentStock: true,
          },
        });
      }

      // 3) Optional first customer
      let customer = null;
      if (data.customer) {
        customer = await tx.customer.create({
          data: {
            businessId,
            name: data.customer.name.trim(),
            phone: data.customer.phone.trim(),
            address: data.customer.address?.trim() || null,
            city: data.customer.city?.trim() || null,
            status: 'ACTIVE',
          },
          select: {
            id: true,
            name: true,
            phone: true,
          },
        });
      }

      return {
        alreadyCompleted: false,
        business: updatedBusiness,
        product,
        customer,
      };
    });
  }

  /**
   * Check if the current business has completed onboarding.
   * Cheap read used by the dashboard on first load.
   */
  async getStatus(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        category: true,
        onboardingCompletedAt: true,
      },
    });

    if (!business) {
      throw new HttpError(404, 'Business not found', 'BUSINESS_NOT_FOUND');
    }

    return {
      completed: !!business.onboardingCompletedAt,
      completedAt: business.onboardingCompletedAt,
      category: business.category,
      businessName: business.name,
    };
  }
}