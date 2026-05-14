import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';

export function AiCreateScreen() {
  return (
    <Screen>
      <View className="max-w-4xl">
        <Text className="text-3xl font-semibold text-pos-ink">Create with AI</Text>
        <Text className="mt-2 text-base text-pos-muted">
          AI drafts structured menu data first. Merchants review before anything is written to products.
        </Text>
        <TextInput
          className="mt-8 min-h-40 rounded-pos border border-pos-line bg-pos-surface px-5 py-4 text-base text-pos-ink"
          multiline
          placeholder="Example: coffee truck menu with espresso, latte, seasonal drinks, and pastries..."
          placeholderTextColor="#8C8A82"
        />
        <View className="mt-5 w-44">
          <PrimaryButton>Generate draft</PrimaryButton>
        </View>
      </View>
    </Screen>
  );
}
