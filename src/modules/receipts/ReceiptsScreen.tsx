import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCurrency } from '@/hooks/useCurrency';
import { useCheckoutOrders, useReceipt } from '@/services/businessApi';

export function ReceiptsScreen() {
  const money = useCurrency();
  const ordersQuery = useCheckoutOrders('PAID');
  const latestPaidOrder = useMemo(() => ordersQuery.data?.[0], [ordersQuery.data]);
  const receiptQuery = useReceipt(latestPaidOrder?.id);
  const receipt = receiptQuery.data;

  return (
    <Screen>
      <Text className="text-3xl font-semibold text-pos-ink">Receipts</Text>
      <View className="mt-6 w-96 rounded-pos border border-pos-line bg-pos-surface p-5">
        {!receipt ? (
          <Text className="text-base text-pos-muted">Paid receipt previews will appear after checkout.</Text>
        ) : (
          <View>
            <Text className="text-center text-xl font-semibold text-pos-ink">{receipt.store.name}</Text>
            <Text className="mt-2 text-center text-sm text-pos-muted">{receipt.order.orderNumber}</Text>
            <View className="my-5 h-px bg-pos-line" />
            <View className="gap-3">
              {receipt.items.map((item) => (
                <View key={item.name} className="flex-row justify-between">
                  <Text className="text-base text-pos-ink">
                    {item.quantity} x {item.name}
                  </Text>
                  <Text className="text-base text-pos-ink">{money(item.lineTotal)}</Text>
                </View>
              ))}
            </View>
            <View className="my-5 h-px bg-pos-line" />
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-pos-muted">Subtotal</Text>
                <Text className="text-sm text-pos-ink">{money(receipt.totals.subtotal)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-pos-muted">Tax</Text>
                <Text className="text-sm text-pos-ink">{money(receipt.totals.tax)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-base font-semibold text-pos-ink">Total</Text>
                <Text className="text-base font-semibold text-pos-ink">{money(receipt.totals.total)}</Text>
              </View>
            </View>
            <Text className="mt-6 text-center text-sm text-pos-muted">{receipt.footer.message}</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}
