import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useConfirmMenuDraft, useCreateMenuDraft, type AiMenuDraft } from '@/services/businessApi';

export function AiCreateScreen() {
  const [prompt, setPrompt] = useState('coffee truck menu with espresso, latte, seasonal drinks, and pastries');
  const [draft, setDraft] = useState<AiMenuDraft | null>(null);
  const createDraft = useCreateMenuDraft();
  const confirmDraft = useConfirmMenuDraft();

  const generate = async () => {
    const result = await createDraft.mutateAsync({ prompt, currency: 'USD' });
    setDraft(result);
  };

  const confirm = async () => {
    if (!draft) {
      return;
    }
    await confirmDraft.mutateAsync(draft.id);
    setDraft({ ...draft, status: 'CONFIRMED' });
  };

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
          onChangeText={setPrompt}
          placeholder="Example: coffee truck menu with espresso, latte, seasonal drinks, and pastries..."
          placeholderTextColor="#8C8A82"
          value={prompt}
        />
        <View className="mt-5 w-44">
          <PrimaryButton disabled={prompt.trim().length < 8 || createDraft.isPending} onPress={generate}>
            Generate draft
          </PrimaryButton>
        </View>

        {draft ? (
          <View className="mt-8 rounded-pos border border-pos-line bg-pos-surface p-5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-semibold text-pos-ink">Draft menu</Text>
              <Text className="text-sm font-semibold text-pos-muted">{draft.status}</Text>
            </View>
            <View className="mt-4 gap-3">
              {draft.structuredJson.items.map((item) => (
                <View key={item.name} className="flex-row justify-between">
                  <View>
                    <Text className="text-base font-medium text-pos-ink">{item.name}</Text>
                    <Text className="text-sm text-pos-muted">{item.category}</Text>
                  </View>
                  <Text className="text-base text-pos-ink">${item.price.toFixed(2)}</Text>
                </View>
              ))}
            </View>
            <View className="mt-5 w-44">
              <PrimaryButton disabled={draft.status !== 'DRAFT' || confirmDraft.isPending} onPress={confirm}>
                Confirm menu
              </PrimaryButton>
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}
