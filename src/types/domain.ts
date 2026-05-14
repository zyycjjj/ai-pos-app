export type Product = {
  id: string;
  name: string;
  price: number;
  category?: string;
  isActive: boolean;
};

export type OrderStatus = 'OPEN' | 'PAID' | 'CANCELLED';

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
};
