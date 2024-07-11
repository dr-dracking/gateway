export interface Product {
  id: number;
  name: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdById?: string;
  lastUpdatedById?: string;
}
