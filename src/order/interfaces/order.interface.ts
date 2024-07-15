export enum OrderStatus {
  PLACED = 'PLACED',
  CONFIRMED = 'CONFIRMED',
  PREPARED = 'PREPARED',
  SHIPPED = 'SHIPPED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  RETURN_INITIATED = 'RETURN_INITIATED',
  RETURNED = 'RETURNED',
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: number;
  quantity: number;
  price: number;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById?: string;
  lastUpdatedById?: string;
}

export interface Order {
  id: string;
  entryDate: Date;
  deliveryDate?: Date;
  deliveryAddress: string;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById?: string;
  lastUpdatedById?: string;
  OrderItem: OrderItem[];
}
