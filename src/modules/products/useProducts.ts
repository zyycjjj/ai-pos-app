import { useQuery } from '@tanstack/react-query';

import { listActiveProducts, listProducts } from './products.service';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: listProducts,
  });
}

export function useActiveProducts() {
  return useQuery({
    queryKey: ['products', 'active'],
    queryFn: listActiveProducts,
  });
}

