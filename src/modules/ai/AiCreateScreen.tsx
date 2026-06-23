import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { MetricCard } from '@/components/MetricCard';
import { StatusPill } from '@/components/StatusPill';
import { Surface } from '@/components/Surface';
import { useCurrency } from '@/hooks/useCurrency';
import { useI18n } from '@/i18n/useI18n';
import { type AiGeneratedMenu, useGenerateAiMenu, useImportAiMenu } from '@/services/businessApi';
import { tokens } from '@/theme';

type FormState = {
  businessType: string;
  cuisine: string;
  priceRange: string;
  brandTone: string;
  notes: string;
};

const initialForm: FormState = {
  businessType: 'Coffee shop',
  cuisine: 'espresso, milk tea, seasonal drinks, pastries',
  priceRange: '$4-$12',
  brandTone: 'warm, modern, fast counter service',
  notes: 'Include a few products with ice, sweetness, and topping modifiers.',
};

export function AiCreateScreen() {
  const { t } = useI18n();
  const money = useCurrency();
  const [form, setForm] = useState<FormState>(initialForm);
  const [menu, setMenu] = useState<AiGeneratedMenu | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generateMenu = useGenerateAiMenu();
  const importMenu = useImportAiMenu();

  const hasInput = useMemo(() => Object.values(form).some((value) => value.trim().length > 0), [form]);

  const generate = async () => {
    setError(null);
    setMessage(null);
    if (!hasInput) {
      setError(t('ai.menu.errorMissingInput'));
      return;
    }

    try {
      const result = await generateMenu.mutateAsync(form);
      setMenu(result.menu);
    } catch {
      setError(t('ai.menu.errorGenerateFailed'));
    }
  };

  const importProducts = async () => {
    if (!menu) {
      return;
    }

    setError(null);
    setMessage(null);
    try {
      const result = await importMenu.mutateAsync(menu);
      setMessage(t('ai.menu.importSuccess', { created: result.summary.created, skipped: result.summary.skipped }));
    } catch {
      setError(t('ai.menu.errorImportFailed'));
    }
  };

  return (
    <AppScreen>
      <View style={styles.root}>
        <Surface style={styles.inputPanel}>
          <Text style={styles.eyebrow}>{t('ai.menu.eyebrow')}</Text>
          <Text style={styles.title}>{t('ai.menu.title')}</Text>
          <Text style={styles.description}>{t('ai.menu.description')}</Text>

          <View style={styles.formGrid}>
            <Field label={t('ai.menu.businessType')} value={form.businessType} onChangeText={(value) => setForm({ ...form, businessType: value })} />
            <Field label={t('ai.menu.cuisine')} value={form.cuisine} onChangeText={(value) => setForm({ ...form, cuisine: value })} />
            <Field label={t('ai.menu.priceRange')} value={form.priceRange} onChangeText={(value) => setForm({ ...form, priceRange: value })} />
            <Field label={t('ai.menu.brandTone')} value={form.brandTone} onChangeText={(value) => setForm({ ...form, brandTone: value })} />
          </View>

          <Field
            label={t('ai.menu.notes')}
            multiline
            value={form.notes}
            onChangeText={(value) => setForm({ ...form, notes: value })}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.successText}>{message}</Text> : null}

          <View style={styles.actions}>
            <AppButton disabled={!hasInput || generateMenu.isPending} loading={generateMenu.isPending} onPress={generate}>
              {generateMenu.isPending ? t('ai.menu.generating') : t('ai.menu.generate')}
            </AppButton>
            <AppButton disabled={!menu || importMenu.isPending} loading={importMenu.isPending} onPress={importProducts} variant="secondary">
              {importMenu.isPending ? t('ai.menu.importing') : t('ai.menu.import')}
            </AppButton>
          </View>
        </Surface>

        <Surface variant="elevated" shadow="soft" style={styles.previewPanel}>
          <View style={styles.previewHeader}>
            <View>
              <Text style={styles.previewLabel}>{t('ai.menu.preview')}</Text>
              <Text style={styles.previewTitle}>{menu ? `${menu.provider} / ${menu.model}` : t('ai.menu.emptyPreview')}</Text>
            </View>
            {menu ? <StatusPill value={menu.provider === 'mock' ? 'Mock' : 'DeepSeek'} tone={menu.provider === 'mock' ? 'neutral' : 'success'} /> : null}
          </View>

          {menu ? (
            <>
              <View style={styles.metrics}>
                <MetricCard label={t('ai.menu.categories')} value={String(menu.categories.length)} />
                <MetricCard label={t('ai.menu.products')} value={String(menu.products.length)} tone="accent" />
                <MetricCard
                  label={t('ai.menu.modifiers', { count: 0 })}
                  value={String(menu.products.reduce((sum, product) => sum + product.modifierGroups.length, 0))}
                />
              </View>

              <ScrollView contentContainerStyle={styles.previewList} showsVerticalScrollIndicator={false}>
                <View style={styles.categoryRow}>
                  {menu.categories.map((category) => (
                    <View key={category.name} style={styles.categoryChip}>
                      <Text style={styles.categoryText}>{category.name}</Text>
                    </View>
                  ))}
                </View>
                {menu.products.map((product) => (
                  <ProductPreviewCard key={`${product.category}-${product.name}`} money={money} product={product} />
                ))}
              </ScrollView>
            </>
          ) : (
            <View style={styles.emptyPreview}>
              <EmptyState title={t('ai.menu.preview')} description={t('ai.menu.emptyPreview')} />
            </View>
          )}
        </Surface>
      </View>
    </AppScreen>
  );
}

function Field({
  label,
  multiline,
  onChangeText,
  value,
}: {
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={tokens.colors.subtle}
        style={[styles.input, multiline && styles.notesInput]}
        value={value}
      />
    </View>
  );
}

function ProductPreviewCard({ money, product }: { money: (value: number) => string; product: AiGeneratedMenu['products'][number] }) {
  const { t } = useI18n();
  const modifierCount = product.modifierGroups.length;

  return (
    <Pressable android_ripple={{ color: tokens.colors.accentMuted }} style={styles.productCard}>
      <View style={styles.productMain}>
        <Text numberOfLines={2} style={styles.productName}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={styles.productCategory}>
          {product.category}
        </Text>
        {product.description ? (
          <Text numberOfLines={2} style={styles.productDescription}>
            {product.description}
          </Text>
        ) : null}
      </View>
      <View style={styles.productSide}>
        <Text style={styles.priceLabel}>{t('ai.menu.price')}</Text>
        <Text style={styles.productPrice}>{money(product.price)}</Text>
        {modifierCount > 0 ? <Text style={styles.modifierText}>{t('ai.menu.modifiers', { count: modifierCount })}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    gap: tokens.navigation.workspaceGap,
  },
  inputPanel: {
    width: 430,
    padding: tokens.spacing.lg,
  },
  eyebrow: {
    ...tokens.typography.label,
    color: tokens.colors.accent,
    textTransform: 'uppercase',
  },
  title: {
    ...tokens.typography.display,
    color: tokens.colors.ink,
    marginTop: tokens.spacing.xs,
  },
  description: {
    ...tokens.typography.body,
    color: tokens.colors.muted,
    marginTop: tokens.spacing.xs,
  },
  formGrid: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.lg,
  },
  field: {
    gap: tokens.spacing.xs,
  },
  fieldLabel: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  input: {
    minHeight: tokens.spacing.touchTargetMin,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surfaceElevated,
    color: tokens.colors.ink,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    ...tokens.typography.body,
  },
  notesInput: {
    minHeight: 88,
    marginTop: tokens.spacing.md,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.lg,
  },
  errorText: {
    ...tokens.typography.caption,
    color: tokens.colors.danger,
    marginTop: tokens.spacing.md,
  },
  successText: {
    ...tokens.typography.caption,
    color: tokens.colors.success,
    marginTop: tokens.spacing.md,
  },
  previewPanel: {
    flex: 1,
    minWidth: 0,
    padding: tokens.spacing.xl,
  },
  previewHeader: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  previewLabel: {
    ...tokens.typography.label,
    color: tokens.colors.accent,
    textTransform: 'uppercase',
  },
  previewTitle: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
    marginTop: tokens.spacing.xs,
  },
  metrics: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.lg,
  },
  previewList: {
    gap: tokens.spacing.md,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.xl,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  categoryChip: {
    minHeight: 34,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surfaceMuted,
    paddingHorizontal: tokens.spacing.md,
  },
  categoryText: {
    ...tokens.typography.caption,
    color: tokens.colors.ink,
  },
  productCard: {
    minHeight: 106,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
  },
  productMain: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  productCategory: {
    ...tokens.typography.caption,
    color: tokens.colors.accent,
    marginTop: tokens.spacing.xs,
  },
  productDescription: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
    marginTop: tokens.spacing.sm,
  },
  productSide: {
    width: 150,
    alignItems: 'flex-end',
  },
  priceLabel: {
    ...tokens.typography.caption,
    color: tokens.colors.subtle,
  },
  productPrice: {
    ...tokens.typography.numeric,
    color: tokens.colors.ink,
    marginTop: tokens.spacing.xs,
  },
  modifierText: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
    marginTop: tokens.spacing.sm,
    textAlign: 'right',
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
