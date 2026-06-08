import { ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCurrency } from '@/hooks/useCurrency';
import { useCartStore } from '@/stores/cartStore';

import { getCheckoutTotals } from '../sell/checkoutMath';

const TAX_RATE = 0.08;

export function CustomerDisplayScreen() {
  const money = useCurrency();
  const lines = useCartStore((state) => state.lines);
  const { subtotal, tax, total } = getCheckoutTotals(lines, TAX_RATE);

  return (
    <Screen>
      <View className="flex-1 flex-row gap-8">
        <View className="flex-1 justify-center">
          <Text className="text-lg font-semibold text-pos-accent">AI POS Store</Text>
          <Text className="mt-4 text-5xl font-semibold text-pos-ink">
            {lines.length === 0 ? 'Welcome' : 'Review your order'}
          </Text>
          <Text className="mt-4 max-w-xl text-xl text-pos-muted">
            {lines.length === 0 ? 'Your order will appear here as the cashier adds items.' : 'Please confirm the items and total.'}
          </Text>
        </View>

        <View className="w-[420px] rounded-pos border border-pos-line bg-pos-surface p-6">
          <Text className="text-2xl font-semibold text-pos-ink">Order</Text>
          <View className="my-5 h-px bg-pos-line" />
          {lines.length === 0 ? (
            <View className="flex-1 justify-center">
              <Text className="text-center text-base text-pos-muted">No items yet</Text>
            </View>
          ) : (
            <ScrollView className="flex-1">
              <View className="gap-4">
                {lines.map((line) => (
                  <View key={line.productId} className="flex-row justify-between gap-4">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-pos-ink">{line.name}</Text>
                      <Text className="mt-1 text-base text-pos-muted">Qty {line.quantity}</Text>
                    </View>
                    <Text className="text-lg font-semibold text-pos-ink">{money(line.unitPrice * line.quantity)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <View className="mt-5 gap-2">
            <SummaryRow label="Subtotal" value={money(subtotal)} />
            <SummaryRow label="Tax" value={money(tax)} />
            <View className="my-2 h-px bg-pos-line" />
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-semibold text-pos-ink">Total</Text>
              <Text className="text-4xl font-semibold text-pos-ink">{money(total)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-base text-pos-muted">{label}</Text>
      <Text className="text-base font-semibold text-pos-ink">{value}</Text>
    </View>
  );
}
