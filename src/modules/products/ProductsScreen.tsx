import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';

export function ProductsScreen() {
  return (
    <Screen>
      <Text className="text-3xl font-semibold text-pos-ink">Products</Text>
      <View className="mt-6 rounded-pos border border-pos-line bg-pos-surface">
        {['Espresso', 'Latte', 'Croissant'].map((name) => (
          <View key={name} className="flex-row items-center justify-between border-b border-pos-line px-5 py-4 last:border-b-0">
            <Text className="text-base font-medium text-pos-ink">{name}</Text>
            <Text className="text-sm text-pos-muted">Active</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
