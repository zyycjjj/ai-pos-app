import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';

export function ReceiptsScreen() {
  return (
    <Screen>
      <Text className="text-3xl font-semibold text-pos-ink">Receipts</Text>
      <View className="mt-6 rounded-pos border border-pos-line bg-pos-surface p-5">
        <Text className="text-base text-pos-muted">80mm ESC/POS receipt previews and print actions go here.</Text>
      </View>
    </Screen>
  );
}
