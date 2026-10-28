export type Category = {
  id: number;
  name: string;
  description?: string | null;
};

export type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stockQuantity: number;
  categoryId: number;
};

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: number;
  orderDate: string;
  status: number | string;
  totalAmount: number;
  userId: number;
  phoneNumber?: string | null;
  shippingAddress?: string | null;
  orderItems: OrderItem[];
};

export type JwtUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
};

export type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

export type PagedResult<T> = {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};
