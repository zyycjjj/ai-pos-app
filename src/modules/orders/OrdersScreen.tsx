import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';

export function OrdersScreen() {
  return (
    <Screen>
      <Text className="text-3xl font-semibold text-pos-ink">Orders</Text>
      <View className="mt-6 rounded-pos border border-pos-line bg-pos-surface p-5">
        <Text className="text-base text-pos-muted">Paid order history will live here.</Text>
      </View>
    </Screen>
  );
}
