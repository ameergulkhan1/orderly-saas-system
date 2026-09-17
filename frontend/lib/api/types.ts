export type UserRole = 'OWNER' | 'ADMIN' | 'STAFF';
export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';
export type ProductStatus = 'ACTIVE' | 'ARCHIVED';
export type CustomerStatus = 'ACTIVE' | 'ARCHIVED';

export type OrderStatus =
  | 'NEW'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED_DELIVERY'
  | 'RETURNED';

export type PaymentMethod =
  | 'COD'
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'EASYPAISA'
  | 'JAZZCASH'
  | 'CARD'
  | 'OTHER';

export type PaymentStatus =
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type DeliveryStatus =
  | 'PENDING'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETURNED';

export type InvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'EXPIRED'
  | 'CANCELLED';

export type InventoryTransactionType =
  | 'RESTOCK'
  | 'SALE'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'DAMAGE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  businessId: string;
  lastLoginAt?: string | null;
  createdAt: string;
}

export interface Business {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  currency: string;
  timezone: string;
  ownerId: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  status: CustomerStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku?: string | null;
  description?: string | null;
  category?: string | null;
  price: string;
  costPrice?: string | null;
  currentStock: number;
  lowStockThreshold: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  productName: string;
  sku?: string | null;
  createdAt: string;
}

export interface Order {
  id: string;
  businessId: string;
  customerId: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: string;
  discount: string;
  deliveryFee: string;
  total: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  customerName: string;
  customerPhone: string;
  notes?: string | null;
  items?: OrderItem[];
  customer?: Customer;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  businessId: string;
  orderId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string | null;
  notes?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface Delivery {
  id: string;
  businessId: string;
  orderId: string;
  courier?: string | null;
  trackingNumber?: string | null;
  status: DeliveryStatus;
  deliveryFee: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  failedAt?: string | null;
  returnedAt?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface Invitation {
  id: string;
  businessId: string;
  invitedBy: string;
  email: string;
  name: string;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}

export interface InventoryTransaction {
  id: string;
  businessId: string;
  productId: string;
  orderId?: string | null;
  type: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  createdAt: string;
  product?: {
    name: string;
    sku?: string | null;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

/* ============================================================
 * Input types (payloads sent to the API)
 *
 * These differ from the response types above because the API
 * accepts numbers where it returns strings (e.g. Prisma Decimal
 * serialization). Keeping them separate lets forms send numbers
 * without fighting the response type.
 * ============================================================ */

export interface ProductCreateInput {
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price: number;
  costPrice?: number;
  currentStock?: number;
  lowStockThreshold?: number;
}

export type ProductUpdateInput = Partial<ProductCreateInput> & {
  status?: ProductStatus;
};

export interface CustomerCreateInput {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  notes?: string;
}

export type CustomerUpdateInput = Partial<CustomerCreateInput> & {
  status?: CustomerStatus;
};

export interface OrderCreateInput {
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
  paymentMethod: string;
  deliveryFee?: number;
  notes?: string;
  advancePayment?: number;
  discount?: number;
}

export interface PaymentCreateInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface PaymentRecordInput extends PaymentCreateInput {
  status: PaymentStatus;
}

export interface DeliveryCreateInput {
  orderId: string;
  courier?: string;
  trackingNumber?: string;
  deliveryFee?: number;
  notes?: string;
}

export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
}