import { Pressable, ScrollView, Text, View } from 'react-native';

import { useFindManyProduct } from '@/_/hook';
import { MetricTile } from '@/components/MetricTile';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useCurrency } from '@/hooks/useCurrency';
import { useCreateCheckoutOrder, useMarkOrderPaid, useTodaySummary } from '@/services/businessApi';
import { useCartStore } from '@/stores/cartStore';

export function SellScreen() {
  const money = useCurrency();
  const productsQuery = useFindManyProduct({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  const summaryQuery = useTodaySummary();
  const createOrder = useCreateCheckoutOrder();
  const markPaid = useMarkOrderPaid();
  const { addLine, clear, lines, removeLine } = useCartStore();

  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const tax = Number((subtotal * 0.0825).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const checkout = async () => {
    if (lines.length === 0) {
      return;
    }

    const order = await createOrder.mutateAsync({
      items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      tax,
      currency: 'USD',
    });
    await markPaid.mutateAsync(order.id);
    clear();
  };

  return (
    <Screen>
      <View className="flex-1 flex-row gap-6">
        <View className="flex-[2]">
          <Text className="text-3xl font-semibold text-pos-ink">Sell</Text>
          <Text className="mt-2 max-w-2xl text-base text-pos-muted">Fast checkout for the MVP payment and receipt loop.</Text>

          <View className="mt-6 flex-row gap-4">
            <MetricTile label="Today" value={money(summaryQuery.data?.salesTotal ?? 0)} tone="accent" />
            <MetricTile label="Orders" value={String(summaryQuery.data?.orderCount ?? 0)} />
            <MetricTile label="Avg ticket" value={money(summaryQuery.data?.averageTicket ?? 0)} tone="warm" />
          </View>

          <ScrollView className="mt-6" contentContainerClassName="flex-row flex-wrap gap-4">
            {(productsQuery.data ?? []).map((product) => (
              <Pressable
                key={product.id}
                className="w-44 rounded-pos border border-pos-line bg-pos-surface p-5 active:opacity-80"
                onPress={() =>
                  addLine({
                    productId: product.id,
                    name: product.name,
                    quantity: 1,
                    unitPrice: Number(product.price),
                  })
                }
              >
                <Text className="text-lg font-semibold text-pos-ink">{product.name}</Text>
                <Text className="mt-1 text-sm text-pos-muted">{product.category ?? 'Menu'}</Text>
                <Text className="mt-3 text-base text-pos-muted">{money(Number(product.price))}</Text>
              </Pressable>
            ))}
            {!productsQuery.isLoading && productsQuery.data?.length === 0 ? (
              <Text className="text-base text-pos-muted">No active products yet.</Text>
            ) : null}
          </ScrollView>
        </View>

        <View className="w-80 rounded-pos border border-pos-line bg-pos-surface p-5">
          <Text className="text-xl font-semibold text-pos-ink">Current order</Text>
          <View className="my-5 h-px bg-pos-line" />
          {lines.length === 0 ? (
            <Text className="text-base text-pos-muted">Add products to start checkout.</Text>
          ) : (
            <View className="gap-3">
              {lines.map((line) => (
                <Pressable key={line.productId} className="flex-row items-center justify-between" onPress={() => removeLine(line.productId)}>
                  <View>
                    <Text className="text-base font-medium text-pos-ink">{line.name}</Text>
                    <Text className="text-sm text-pos-muted">Qty {line.quantity}</Text>
                  </View>
                  <Text className="text-base text-pos-ink">{money(line.unitPrice * line.quantity)}</Text>
                </Pressable>
              ))}
              <View className="mt-3 h-px bg-pos-line" />
              <View className="flex-row justify-between">
                <Text className="text-sm text-pos-muted">Subtotal</Text>
                <Text className="text-sm text-pos-ink">{money(subtotal)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-pos-muted">Tax</Text>
                <Text className="text-sm text-pos-ink">{money(tax)}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-base font-semibold text-pos-ink">Total</Text>
                <Text className="text-base font-semibold text-pos-ink">{money(total)}</Text>
              </View>
            </View>
          )}
          <View className="mt-auto">
            <PrimaryButton disabled={lines.length === 0 || createOrder.isPending || markPaid.isPending} onPress={checkout}>
              Mark paid
            </PrimaryButton>
          </View>
        </View>
      </View>
    </Screen>
  );
}
