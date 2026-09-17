import { PrismaClient } from '@prisma/client';
import { HttpError } from '../../lib/httpError';

type OrderStatus = 'NEW' | 'CONFIRMED' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED_DELIVERY' | 'RETURNED';
type PaymentMethod = 'COD' | 'CASH' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH' | 'CARD' | 'OTHER';
type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'FAILED' | 'REFUNDED';
type DeliveryStatus = 'PENDING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'FAILED' | 'RETURNED';

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  NEW: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['READY_TO_SHIP', 'CANCELLED'],
  READY_TO_SHIP: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'FAILED_DELIVERY'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  FAILED_DELIVERY: ['RETURNED', 'SHIPPED'],
  RETURNED: []
};

const DELIVERY_STATUS_MAP: Record<OrderStatus, DeliveryStatus | null> = {
  NEW: null,
  CONFIRMED: null,
  PROCESSING: null,
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'FAILED',
  FAILED_DELIVERY: 'FAILED',
  RETURNED: 'RETURNED'
};

const STATUS_TIMESTAMP_FIELD: Record<OrderStatus, string | null> = {
  NEW: null,
  CONFIRMED: 'confirmedAt',
  PROCESSING: null,
  READY_TO_SHIP: null,
  SHIPPED: 'shippedAt',
  DELIVERED: 'deliveredAt',
  CANCELLED: 'cancelledAt',
  FAILED_DELIVERY: null,
  RETURNED: 'returnedAt'
};

export class OrderService {
  constructor(private prisma: PrismaClient) {}

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
    
    if (!allowedTransitions) {
      throw new HttpError(400, `Invalid status: ${currentStatus}`);
    }

    if (!allowedTransitions.includes(newStatus)) {
      throw new HttpError(
        400,
        `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${allowedTransitions.join(', ')}`
      );
    }
  }

  private getStatusTimestampField(status: OrderStatus): string | null {
    return STATUS_TIMESTAMP_FIELD[status] || null;
  }

  private getDeliveryStatus(orderStatus: OrderStatus): DeliveryStatus | null {
    return DELIVERY_STATUS_MAP[orderStatus] || null;
  }

  async createOrder(businessId: string, userId: string, data: {
    customer: { name: string; phone: string; email?: string; address?: string; city?: string };
    items: { productId: string; quantity: number; price?: number }[];
    paymentMethod: PaymentMethod;
    deliveryFee?: number;
    notes?: string;
    advancePayment?: number;
    discount?: number;
  }) {
    const productIds = data.items.map(item => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        businessId,
        status: 'ACTIVE'
      }
    });

    if (products.length !== data.items.length) {
      throw new HttpError(400, 'Some products are invalid or inactive');
    }

    for (const item of data.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new HttpError(400, `Product ${item.productId} not found`);
      }
      if (product.currentStock < item.quantity) {
        throw new HttpError(400, `Insufficient stock for ${product.name}. Available: ${product.currentStock}`);
      }
    }

    let customer = await this.prisma.customer.findFirst({
      where: {
        businessId,
        phone: data.customer.phone
      }
    });

    if (!customer) {
      customer = await this.prisma.customer.create({
        data: {
          businessId,
          name: data.customer.name,
          phone: data.customer.phone,
          email: data.customer.email,
          address: data.customer.address,
          city: data.customer.city
        }
      });
    }

    let subtotal = 0;
    const orderItems = data.items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      const price = item.price || Number(product.price);
      const total = price * item.quantity;
      subtotal += total;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: total,
        productName: product.name,
        sku: product.sku
      };
    });

    const discount = data.discount || 0;
    const deliveryFee = data.deliveryFee || 0;
    const total = subtotal - discount + deliveryFee;

    const orderNumber = await this.generateOrderNumber(businessId);

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          businessId,
          customerId: customer.id,
          orderNumber,
          status: 'NEW',
          subtotal,
          discount,
          deliveryFee,
          total,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.advancePayment && data.advancePayment > 0 ? 'PARTIAL' : 'PENDING',
          deliveryAddress: data.customer.address,
          deliveryCity: data.customer.city,
          customerName: data.customer.name,
          customerPhone: data.customer.phone,
          notes: data.notes,
          items: {
            create: orderItems
          }
        },
        include: {
          items: true
        }
      });

      if (data.advancePayment && data.advancePayment > 0) {
        await tx.payment.create({
          data: {
            businessId,
            orderId: order.id,
            amount: data.advancePayment,
            method: data.paymentMethod,
            status: 'PAID',
            paidAt: new Date(),
            notes: 'Advance payment'
          }
        });
      }

      for (const item of data.items) {
        const product = products.find(p => p.id === item.productId)!;
        const previousStock = Number(product.currentStock);
        const newStock = previousStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: newStock
          }
        });

        await tx.inventoryTransaction.create({
          data: {
            businessId,
            productId: item.productId,
            orderId: order.id,
            type: 'SALE',
            quantity: -item.quantity,
            previousStock,
            newStock,
            reason: `Order ${order.orderNumber}`
          }
        });
      }

      await tx.delivery.create({
        data: {
          businessId,
          orderId: order.id,
          status: 'PENDING',
          deliveryFee
        }
      });

      return order;
    });

    return this.getOrderById(result.id, businessId);
  }

  async getOrders(businessId: string, query: { 
    status?: string; 
    paymentStatus?: string;
    customerId?: string; 
    search?: string; 
    page?: number; 
    limit?: number 
  }) {
    const { status, paymentStatus, customerId, search, page = 1, limit = 20 } = query;

    const where: any = { businessId };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search } }
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          },
          items: {
            take: 3
          },
          payments: true,
          delivery: true,
          _count: {
            select: { items: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.order.count({ where })
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getOrderById(id: string, businessId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        businessId
      },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true
              }
            }
          }
        },
        payments: true,
        delivery: true
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    return order;
  }

  async updateOrder(id: string, businessId: string, data: any) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) {
      throw new HttpError(400, 'Cannot update completed order');
    }

    return this.prisma.order.update({
      where: { id },
      data
    });
  }

  async updateOrderStatus(id: string, businessId: string, userId: string, data: { status: OrderStatus; notes?: string }) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        businessId
      },
      include: {
        delivery: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    this.validateStatusTransition(order.status as OrderStatus, data.status);

    if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) {
      throw new HttpError(400, `Cannot transition from terminal status: ${order.status}`);
    }

    const updateData: any = { status: data.status };
    const timestampField = this.getStatusTimestampField(data.status);
    if (timestampField) {
      updateData[timestampField] = new Date();
    }

    if (data.status === 'DELIVERED' && order.paymentMethod === 'COD') {
      updateData.paymentStatus = 'PAID';
    }

    const deliveryStatus = this.getDeliveryStatus(data.status);
    if (order.delivery && deliveryStatus) {
      await this.prisma.delivery.update({
        where: { id: order.delivery.id },
        data: { status: deliveryStatus }
      });
    }

    if (data.status === 'CANCELLED' && order.status !== 'CANCELLED') {
      await this.restoreInventory(order.id, businessId);
    }

    if (data.status === 'RETURNED' && order.status !== 'RETURNED') {
      await this.restoreInventory(order.id, businessId);
    }

    return this.prisma.order.update({
      where: { id },
      data: updateData
    });
  }

  // ✅ NEW: Cancel Order
  async cancelOrder(id: string, businessId: string, userId: string, reason: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    if (['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.status)) {
      throw new HttpError(400, `Order in ${order.status} status cannot be cancelled`);
    }

    if (!['NEW', 'CONFIRMED', 'PROCESSING'].includes(order.status)) {
      throw new HttpError(400, 'Order cannot be cancelled at this stage');
    }

    return this.updateOrderStatus(id, businessId, userId, { 
      status: 'CANCELLED', 
      notes: `Cancelled: ${reason}` 
    });
  }

  async deleteOrder(id: string, businessId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    if (order.status !== 'NEW') {
      throw new HttpError(400, 'Only new orders can be deleted');
    }

    return this.prisma.order.delete({
      where: { id }
    });
  }

  async duplicateOrder(id: string, businessId: string, userId: string) {
    const originalOrder = await this.prisma.order.findFirst({
      where: {
        id,
        businessId
      },
      include: {
        items: true,
        customer: true
      }
    });

    if (!originalOrder) {
      throw new HttpError(404, 'Order not found');
    }

    const newOrderNumber = await this.generateOrderNumber(businessId);

    const duplicate = await this.prisma.order.create({
      data: {
        businessId,
        customerId: originalOrder.customerId,
        orderNumber: newOrderNumber,
        status: 'NEW',
        subtotal: originalOrder.subtotal,
        discount: originalOrder.discount,
        deliveryFee: originalOrder.deliveryFee,
        total: originalOrder.total,
        paymentMethod: originalOrder.paymentMethod as PaymentMethod,
        paymentStatus: 'PENDING',
        deliveryAddress: originalOrder.deliveryAddress,
        deliveryCity: originalOrder.deliveryCity,
        customerName: originalOrder.customerName,
        customerPhone: originalOrder.customerPhone,
        notes: `Duplicated from ${originalOrder.orderNumber}`,
        items: {
          create: originalOrder.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            productName: item.productName,
            sku: item.sku
          }))
        }
      },
      include: {
        items: true,
        customer: true
      }
    });

    await this.prisma.delivery.create({
      data: {
        businessId,
        orderId: duplicate.id,
        status: 'PENDING',
        deliveryFee: duplicate.deliveryFee || 0
      }
    });

    return duplicate;
  }

  // ✅ NEW: Get Order Items
  async getOrderItems(id: string, businessId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    return this.prisma.orderItem.findMany({
      where: { orderId: id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    });
  }

  async getOrderTimeline(id: string, businessId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    const timeline = [
      { status: 'Order Created', date: order.createdAt, completed: true },
      { status: 'Confirmed', date: order.confirmedAt, completed: !!order.confirmedAt },
      { status: 'Processing', date: null, completed: order.status !== 'NEW' && order.status !== 'CONFIRMED' },
      { status: 'Ready to Ship', date: null, completed: order.status === 'READY_TO_SHIP' || order.status === 'SHIPPED' || order.status === 'DELIVERED' },
      { status: 'Shipped', date: order.shippedAt, completed: !!order.shippedAt },
      { status: 'Delivered', date: order.deliveredAt, completed: !!order.deliveredAt }
    ];

    if (order.cancelledAt) {
      timeline.push({ status: 'Cancelled', date: order.cancelledAt, completed: true });
    }

    if (order.returnedAt) {
      timeline.push({ status: 'Returned', date: order.returnedAt, completed: true });
    }

    return timeline;
  }

  // ✅ NEW: Get Order Status History
  async getOrderStatusHistory(id: string, businessId: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        businessId
      }
    });

    if (!order) {
      throw new HttpError(404, 'Order not found');
    }

    const history = [];
    
    const statuses: { status: string; date: Date | null }[] = [
      { status: 'NEW', date: order.createdAt },
      { status: 'CONFIRMED', date: order.confirmedAt },
      { status: 'PROCESSING', date: order.createdAt },
      { status: 'READY_TO_SHIP', date: order.shippedAt || null },
      { status: 'SHIPPED', date: order.shippedAt },
      { status: 'DELIVERED', date: order.deliveredAt },
      { status: 'CANCELLED', date: order.cancelledAt },
      { status: 'RETURNED', date: order.returnedAt }
    ];

    return statuses.filter(s => s.date).map(s => ({
      status: s.status,
      date: s.date
    }));
  }

  async generateInvoice(id: string, businessId: string) {
    const order = await this.getOrderById(id, businessId);
    const business = await this.prisma.business.findUnique({
      where: { id: businessId }
    });

    return {
      invoice: {
        number: `INV-${order.orderNumber.replace('#', '')}`,
        date: order.createdAt,
        business: {
          name: business?.name,
          phone: business?.phone,
          email: business?.email,
          address: business?.address
        },
        customer: {
          name: order.customerName,
          phone: order.customerPhone,
          address: order.deliveryAddress
        },
        items: order.items.map(item => ({
          name: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.totalPrice
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryFee: order.deliveryFee,
        total: order.total,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus
      }
    };
  }

  private async generateOrderNumber(businessId: string): Promise<string> {
    const lastOrder = await this.prisma.order.findFirst({
      where: { businessId },
      orderBy: { createdAt: 'desc' }
    });

    const lastNumber = lastOrder?.orderNumber ? parseInt(lastOrder.orderNumber.replace('#', '')) : 1000;
    return `#${(lastNumber + 1).toString()}`;
  }

  private async restoreInventory(orderId: string, businessId: string) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId }
    });

    for (const item of orderItems) {
      const product = await this.prisma.product.findFirst({
        where: {
          id: item.productId,
          businessId
        }
      });

      if (product) {
        const previousStock = Number(product.currentStock);
        const newStock = previousStock + item.quantity;

        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            currentStock: newStock
          }
        });

        await this.prisma.inventoryTransaction.create({
          data: {
            businessId,
            productId: item.productId,
            orderId,
            type: 'RETURN',
            quantity: item.quantity,
            previousStock,
            newStock,
            reason: `Order restoration - ${orderId}`
          }
        });
      }
    }
  }
}