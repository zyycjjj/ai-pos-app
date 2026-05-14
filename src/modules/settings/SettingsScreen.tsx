import { Text, View } from 'react-native';

import { Screen } from '@/components/Screen';

export function SettingsScreen() {
  return (
    <Screen>
      <Text className="text-3xl font-semibold text-pos-ink">Settings</Text>
      <View className="mt-6 rounded-pos border border-pos-line bg-pos-surface p-5">
        <Text className="text-base text-pos-muted">Currency, tax, tip, language, and printer settings.</Text>
      </View>
    </Screen>
  );
}
