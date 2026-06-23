import { apiClient } from '@/services/apiClient';
import type { ProductModifierGroup } from '@/types/modifiers';

export type ProductDto = {
  id: string;
  name: string;
  category: string | null;
  price: number;
  currency: string;
  isActive: boolean;
  modifierGroups: ProductModifierGroup[];
};

export async function listProducts() {
  const { data } = await apiClient.get<ProductDto[]>('/api/products');
  return data;
}

export async function listActiveProducts() {
  const { data } = await apiClient.get<ProductDto[]>('/api/products/active');
  return data;
}
