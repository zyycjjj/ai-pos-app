import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Printer } from 'lucide-react-native';

import { Screen } from '@/components/Screen';
import { useCurrency } from '@/hooks/useCurrency';
import { type CheckoutOrder, useCheckoutOrders, useMarkOrderPrinted } from '@/services/businessApi';
import { colors } from '@/theme/colors';

export function OrdersScreen() {
  const money = useCurrency();
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const ordersQuery = useCheckoutOrders();
  const markPrinted = useMarkOrderPrinted();
  const orders = ordersQuery.data ?? [];

  const reprint = async (order: CheckoutOrder) => {
    setPrintingOrderId(order.id);
    try {
      await markPrinted.mutateAsync(order.id);
    } finally {
      setPrintingOrderId(null);
    }
  };

  return (
    <Screen>
      <View className="mb-6 flex-row items-end justify-between">
        <View>
          <Text className="text-3xl font-semibold text-pos-ink">Orders</Text>
          <Text className="mt-2 text-base text-pos-muted">Order history with receipt print status for the terminal.</Text>
        </View>
        <View className="rounded-pos border border-pos-line bg-pos-surface px-4 py-3">
          <Text className="text-xs text-pos-muted">Paid orders</Text>
          <Text className="mt-1 text-xl font-semibold text-pos-ink">
            {orders.filter((order) => order.status === 'PAID').length}
          </Text>
        </View>
      </View>

      <View className="flex-1 rounded-pos border border-pos-line bg-pos-surface">
        {orders.length === 0 ? (
          <View className="px-5 py-8">
            <Text className="text-base text-pos-muted">Paid order history will live here.</Text>
          </View>
        ) : (
          <ScrollView>
            {orders.map((order) => (
              <View key={order.id} className="flex-row items-center justify-between border-b border-pos-line px-5 py-4 last:border-b-0">
                <View className="flex-1">
                  <View className="flex-row items-center gap-3">
                    <Text className="text-base font-semibold text-pos-ink">{order.orderNumber}</Text>
                    <StatusBadge value={order.status} />
                    <PrintBadge value={order.printStatus} />
                  </View>
                  <Text className="mt-2 text-sm text-pos-muted">{new Date(order.createdAt).toLocaleString()}</Text>
                  <Text className="mt-1 text-sm text-pos-muted">{order.items.length} items</Text>
                </View>
                <View className="items-end gap-3">
                  <Text className="text-xl font-semibold text-pos-ink">{money(order.total)}</Text>
                  <Pressable
                    className="h-10 flex-row items-center gap-2 rounded-pos bg-pos-background px-4 active:opacity-80"
                    disabled={order.status !== 'PAID' || printingOrderId === order.id}
                    onPress={() => reprint(order)}
                  >
                    <Printer color={colors.ink} size={16} />
                    <Text className="text-sm font-semibold text-pos-ink">
                      {printingOrderId === order.id ? 'Printing' : order.printStatus === 'PRINTED' ? 'Reprint' : 'Print'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Screen>
  );
}

function StatusBadge({ value }: { value: CheckoutOrder['status'] }) {
  const tone = value === 'PAID' ? 'text-pos-accent' : value === 'CANCELLED' ? 'text-pos-danger' : 'text-pos-muted';

  return (
    <View className="rounded-pos bg-pos-background px-2 py-1">
      <Text className={`text-xs font-semibold ${tone}`}>{value}</Text>
    </View>
  );
}

function PrintBadge({ value }: { value: CheckoutOrder['printStatus'] }) {
  const tone = value === 'PRINTED' ? 'text-pos-accent' : value === 'FAILED' ? 'text-pos-danger' : 'text-pos-muted';

  return (
    <View className="rounded-pos bg-pos-background px-2 py-1">
      <Text className={`text-xs font-semibold ${tone}`}>{printLabel(value)}</Text>
    </View>
  );
}

function printLabel(value: CheckoutOrder['printStatus']) {
  switch (value) {
    case 'PRINTED':
      return 'Printed';
    case 'PRINTING':
      return 'Printing';
    case 'FAILED':
      return 'Print failed';
    default:
      return 'Not printed';
  }
}
