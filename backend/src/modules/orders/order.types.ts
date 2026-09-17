// Define types locally instead of importing from @prisma/client
type OrderStatus = 'NEW' | 'CONFIRMED' | 'PROCESSING' | 'READY_TO_SHIP' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED_DELIVERY' | 'RETURNED';
type PaymentMethod = 'COD' | 'CASH' | 'BANK_TRANSFER' | 'EASYPAISA' | 'JAZZCASH' | 'CARD' | 'OTHER';
type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface CreateOrderInput {
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
    city?: string;
  };
  items: {
    productId: string;
    quantity: number;
    price?: number;
  }[];
  paymentMethod: PaymentMethod;
  deliveryFee?: number;
  notes?: string;
  advancePayment?: number;
  discount?: number;
}

export interface UpdateOrderInput {
  paymentMethod?: PaymentMethod;
  deliveryAddress?: string;
  deliveryCity?: string;
  notes?: string;
  discount?: number;
  deliveryFee?: number;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  notes?: string;
}

export interface OrderQueryParams {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface OrderTimelineEvent {
  status: string;
  date: Date | null;
  completed: boolean;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
}

export interface InvoiceData {
  invoice: {
    number: string;
    date: Date;
    business: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
    };
    customer: {
      name: string;
      phone: string;
      address?: string;
    };
    items: {
      name: string;
      sku?: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }[];
    subtotal: number;
    discount: number;
    deliveryFee: number;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
  };
}