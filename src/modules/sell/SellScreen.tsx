import { ScrollView, Text, View } from 'react-native';

import { MetricTile } from '@/components/MetricTile';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useCurrency } from '@/hooks/useCurrency';

const sampleProducts = [
  { id: 'espresso', name: 'Espresso', price: 3.5 },
  { id: 'latte', name: 'Latte', price: 5 },
  { id: 'croissant', name: 'Croissant', price: 4.25 },
  { id: 'cold-brew', name: 'Cold Brew', price: 5.5 },
];

export function SellScreen() {
  const money = useCurrency();

  return (
    <Screen>
      <View className="flex-1 flex-row gap-6">
        <View className="flex-[2]">
          <Text className="text-3xl font-semibold text-pos-ink">Sell</Text>
          <Text className="mt-2 max-w-2xl text-base text-pos-muted">
            Fast product selection for the MVP checkout loop.
          </Text>

          <View className="mt-6 flex-row gap-4">
            <MetricTile label="Today" value="$348.50" tone="accent" />
            <MetricTile label="Orders" value="23" />
            <MetricTile label="Avg ticket" value="$15.15" tone="warm" />
          </View>

          <ScrollView className="mt-6" contentContainerClassName="flex-row flex-wrap gap-4">
            {sampleProducts.map((product) => (
              <View key={product.id} className="w-44 rounded-pos border border-pos-line bg-pos-surface p-5">
                <Text className="text-lg font-semibold text-pos-ink">{product.name}</Text>
                <Text className="mt-3 text-base text-pos-muted">{money(product.price)}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className="w-80 rounded-pos border border-pos-line bg-pos-surface p-5">
          <Text className="text-xl font-semibold text-pos-ink">Current order</Text>
          <View className="my-5 h-px bg-pos-line" />
          <Text className="text-base text-pos-muted">Add products to start checkout.</Text>
          <View className="mt-auto">
            <PrimaryButton>Mark paid</PrimaryButton>
          </View>
        </View>
      </View>
    </Screen>
  );
}
