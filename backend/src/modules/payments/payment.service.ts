import { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/httpError';

type PaymentMethod = 'COD' | 'CASH' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH' | 'CARD' | 'OTHER';
type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'FAILED' | 'REFUNDED';

export class PaymentService {
  constructor(private prisma: PrismaClient) {}

  // ============================================
  // CREATE PAYMENT FOR ORDER
  // ============================================

  async createPaymentForOrder(
    orderId: string, 
    businessId: string, 
    data: { 
      amount: number; 
      method: PaymentMethod; 
      reference?: string; 
      notes?: string 
    }
  ) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        businessId
      },
      include: {
        payments: true
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    const totalPaid = order.payments
      .filter((p: any) => p.status === 'PAID')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const orderTotal = Number(order.total);

    if (totalPaid >= orderTotal) {
      throw new HttpError(400, 'Order is already fully paid');
    }

    if (data.amount <= 0) {
      throw new HttpError(400, 'Payment amount must be greater than 0');
    }

    if (data.amount + totalPaid > orderTotal) {
      throw new HttpError(400, `Payment amount exceeds remaining balance. Remaining: ${orderTotal - totalPaid}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          businessId,
          orderId,
          amount: data.amount,
          method: data.method,
          status: 'PAID',
          reference: data.reference,
          notes: data.notes,
          paidAt: new Date()
        }
      });

      const updatedTotalPaid = await tx.payment.aggregate({
        where: {
          orderId,
          status: 'PAID'
        },
        _sum: { amount: true }
      });

      const paidAmount = Number(updatedTotalPaid._sum.amount || 0);
      let paymentStatus: PaymentStatus = 'PARTIAL';

      if (paidAmount >= orderTotal) {
        paymentStatus = 'PAID';
      } else if (paidAmount === 0) {
        paymentStatus = 'PENDING';
      }

      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus }
      });

      return payment;
    });
  }

  // ============================================
  // RECORD PAYMENT (Manual Entry)
  // ============================================

  async recordPayment(businessId: string, data: { 
    orderId: string; 
    amount: number; 
    method: PaymentMethod; 
    status: PaymentStatus;
    reference?: string; 
    notes?: string;
    paidAt?: Date;
  }) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: data.orderId,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    if (data.amount <= 0) {
      throw new HttpError(400, 'Payment amount must be greater than 0');
    }

    const orderTotal = Number(order.total);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          businessId,
          orderId: data.orderId,
          amount: data.amount,
          method: data.method,
          status: data.status,
          reference: data.reference,
          notes: data.notes,
          paidAt: data.status === 'PAID' ? (data.paidAt || new Date()) : null
        }
      });

      const totalPaid = await tx.payment.aggregate({
        where: {
          orderId: data.orderId,
          status: 'PAID'
        },
        _sum: { amount: true }
      });

      const paidAmount = Number(totalPaid._sum.amount || 0);
      let paymentStatus: PaymentStatus = 'PARTIAL';

      if (paidAmount >= orderTotal) {
        paymentStatus = 'PAID';
      } else if (paidAmount === 0) {
        paymentStatus = 'PENDING';
      }

      await tx.order.update({
        where: { id: data.orderId },
        data: { paymentStatus }
      });

      return payment;
    });
  }

  // ============================================
  // GET PAYMENTS
  // ============================================

  async getPayments(businessId: string, query: { 
    orderId?: string; 
    status?: PaymentStatus; 
    method?: PaymentMethod;
    page?: number; 
    limit?: number 
  }) {
    const { orderId, status, method, page = 1, limit = 20 } = query;

    const where: any = { businessId };

    if (orderId) {
      where.orderId = orderId;
    }

    if (status) {
      where.status = status;
    }

    if (method) {
      where.method = method;
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              customerName: true,
              total: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.payment.count({ where })
    ]);

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderPayments(orderId: string, businessId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id: orderId,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    return this.prisma.payment.findMany({
      where: {
        orderId,
        businessId
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ============================================
  // UPDATE PAYMENT
  // ============================================

  async updatePayment(id: string, businessId: string, data: { 
    status?: PaymentStatus; 
    reference?: string; 
    notes?: string 
  }) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        businessId
      },
      include: {
        order: true
      }
    });

    if (!payment) {
      throw new HttpError(404, 'Payment not found');
    }

    const orderTotal = Number(payment.order.total);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id },
        data: {
          status: data.status,
          reference: data.reference,
          notes: data.notes,
          paidAt: data.status === 'PAID' ? new Date() : (data.status === 'PENDING' ? null : payment.paidAt)
        }
      });

      if (data.status === 'PAID' || data.status === 'REFUNDED' || data.status === 'FAILED') {
        const totalPaid = await tx.payment.aggregate({
          where: {
            orderId: payment.orderId,
            status: 'PAID'
          },
          _sum: { amount: true }
        });

        const paidAmount = Number(totalPaid._sum.amount || 0);
        const order = payment.order;

        let paymentStatus: PaymentStatus = 'PARTIAL';
        if (paidAmount >= orderTotal) {
          paymentStatus = 'PAID';
        } else if (paidAmount === 0) {
          paymentStatus = 'PENDING';
        }

        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus }
        });
      }

      return updated;
    });
  }

  // ============================================
  // PAYMENT SUMMARY
  // ============================================

  async getPaymentSummary(businessId: string) {
    const [totalReceived, totalPending, totalCOD, totalFailed, totalRefunded] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { businessId, status: 'PAID' },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { businessId, status: 'PENDING' },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { businessId, method: 'COD' },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { businessId, status: 'FAILED' },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { businessId, status: 'REFUNDED' },
        _sum: { amount: true }
      })
    ]);

    return {
      totalReceived: Number(totalReceived._sum.amount || 0),
      totalPending: Number(totalPending._sum.amount || 0),
      totalCOD: Number(totalCOD._sum.amount || 0),
      totalFailed: Number(totalFailed._sum.amount || 0),
      totalRefunded: Number(totalRefunded._sum.amount || 0)
    };
  }

  async getPaymentMethodsBreakdown(businessId: string) {
    const results = await this.prisma.payment.groupBy({
      by: ['method'],
      where: { businessId },
      _sum: { amount: true },
      _count: { method: true }
    });

    return results.map(r => ({
      method: r.method,
      total: Number(r._sum.amount || 0),
      count: r._count.method
    }));
  }

  async getPaymentById(id: string, businessId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        businessId
      },
      include: {
        order: {
          include: {
            customer: true,
            items: true
          }
        }
      }
    });

    if (!payment) {
      throw new HttpError(404, 'Payment not found');
    }

    return payment;
  }
}