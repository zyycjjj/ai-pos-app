import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCurrency } from '@/hooks/useCurrency';

import { useProducts } from './useProducts';

export function ProductsScreen() {
  const money = useCurrency();
  const productsQuery = useProducts();
  const products = productsQuery.data ?? [];

  return (
    <Screen>
      <Text className="text-3xl font-semibold text-pos-ink">Products</Text>
      <Text className="mt-2 max-w-2xl text-base text-pos-muted">
        Menu items confirmed from AI drafts or maintained through ZenStack CRUD.
      </Text>

      <View className="mt-6 rounded-pos border border-pos-line bg-pos-surface">
        {productsQuery.isLoading ? (
          <View className="px-5 py-8">
            <Text className="text-base text-pos-muted">Loading products...</Text>
          </View>
        ) : products.length === 0 ? (
          <View className="px-5 py-8">
            <Text className="text-base text-pos-muted">No products yet. Generate a menu draft to start.</Text>
          </View>
        ) : (
          products.map((product) => (
            <View
              key={product.id}
              className="flex-row items-center justify-between border-b border-pos-line px-5 py-4 last:border-b-0"
            >
              <View>
                <Text className="text-base font-medium text-pos-ink">{product.name}</Text>
                <Text className="mt-1 text-sm text-pos-muted">{product.category ?? 'Uncategorized'}</Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-semibold text-pos-ink">{money(Number(product.price))}</Text>
                <Text className="mt-1 text-sm text-pos-muted">{product.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}
