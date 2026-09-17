// Order Status
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

export const OrderStatusValues = {
  NEW: 'NEW',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  READY_TO_SHIP: 'READY_TO_SHIP',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED_DELIVERY: 'FAILED_DELIVERY',
  RETURNED: 'RETURNED'
};

// Payment Method
export type PaymentMethod = 
  | 'COD' 
  | 'CASH' 
  | 'BANK_TRANSFER' 
  | 'EASYPAISA' 
  | 'JAZZCASH' 
  | 'CARD' 
  | 'OTHER';

// Payment Status
export type PaymentStatus = 
  | 'PENDING' 
  | 'PARTIAL' 
  | 'PAID' 
  | 'FAILED' 
  | 'REFUNDED';

// Delivery Status
export type DeliveryStatus = 
  | 'PENDING' 
  | 'READY_TO_SHIP' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'FAILED' 
  | 'RETURNED';

// Inventory Transaction Type
export type InventoryTransactionType = 
  | 'RESTOCK' 
  | 'SALE' 
  | 'RETURN' 
  | 'ADJUSTMENT' 
  | 'DAMAGE';