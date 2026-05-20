import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCurrency } from '@/hooks/useCurrency';
import { useCheckoutOrders } from '@/services/businessApi';

export function OrdersScreen() {
  const money = useCurrency();
  const ordersQuery = useCheckoutOrders();
  const orders = ordersQuery.data ?? [];

  return (
    <Screen>
      <Text className="text-3xl font-semibold text-pos-ink">Orders</Text>
      <View className="mt-6 rounded-pos border border-pos-line bg-pos-surface p-5">
        {orders.length === 0 ? (
          <Text className="text-base text-pos-muted">Paid order history will live here.</Text>
        ) : (
          orders.map((order) => (
            <View key={order.id} className="flex-row justify-between border-b border-pos-line py-4 last:border-b-0">
              <View>
                <Text className="text-base font-semibold text-pos-ink">{order.orderNumber}</Text>
                <Text className="mt-1 text-sm text-pos-muted">{new Date(order.createdAt).toLocaleString()}</Text>
              </View>
              <View className="items-end">
                <Text className="text-base font-semibold text-pos-ink">{money(order.total)}</Text>
                <Text className="mt-1 text-sm text-pos-muted">{order.status}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}
