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
import {
  type AiGeneratedCampaign,
  type AiGeneratedMenu,
  useGenerateAiCampaign,
  useGenerateAiMenu,
  useImportAiMenu,
} from '@/services/businessApi';
import { tokens } from '@/theme';

type Workflow = 'menu' | 'campaign';

type MenuFormState = {
  businessType: string;
  cuisine: string;
  priceRange: string;
  brandTone: string;
  notes: string;
};

type CampaignFormState = {
  goal: string;
  timeWindow: string;
  focusCategory: string;
  notes: string;
};

const initialMenuForm: MenuFormState = {
  businessType: 'Coffee shop',
  cuisine: 'espresso, milk tea, seasonal drinks, pastries',
  priceRange: '$4-$12',
  brandTone: 'warm, modern, fast counter service',
  notes: 'Include a few products with ice, sweetness, and topping modifiers.',
};

const initialCampaignForm: CampaignFormState = {
  goal: 'Increase afternoon sales',
  timeWindow: '2pm-5pm',
  focusCategory: 'Cold drinks',
  notes: 'Need a low-cost campaign with high conversion.',
};

export function AiCreateScreen() {
  const { t } = useI18n();
  const money = useCurrency();
  const [workflow, setWorkflow] = useState<Workflow>('menu');
  const [menuForm, setMenuForm] = useState<MenuFormState>(initialMenuForm);
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>(initialCampaignForm);
  const [menu, setMenu] = useState<AiGeneratedMenu | null>(null);
  const [campaign, setCampaign] = useState<AiGeneratedCampaign | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const generateMenu = useGenerateAiMenu();
  const importMenu = useImportAiMenu();
  const generateCampaign = useGenerateAiCampaign();

  const hasMenuInput = useMemo(() => Object.values(menuForm).some((value) => value.trim().length > 0), [menuForm]);
  const hasCampaignInput = useMemo(() => Object.values(campaignForm).some((value) => value.trim().length > 0), [campaignForm]);

  const generateMenuPreview = async () => {
    setError(null);
    setMessage(null);
    if (!hasMenuInput) {
      setError(t('ai.menu.errorMissingInput'));
      return;
    }

    try {
      const result = await generateMenu.mutateAsync(menuForm);
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

  const generateCampaignPreview = async () => {
    setError(null);
    setMessage(null);
    try {
      const result = await generateCampaign.mutateAsync(campaignForm);
      setCampaign(result.campaign);
    } catch {
      setError(t('ai.campaign.errorGenerateFailed'));
    }
  };

  return (
    <AppScreen>
      <View style={styles.root}>
        <Surface style={styles.inputPanel}>
          <WorkflowTabs workflow={workflow} onChange={setWorkflow} />

          {workflow === 'menu' ? (
            <MenuInputPanel
              disabled={!hasMenuInput || generateMenu.isPending}
              error={error}
              form={menuForm}
              importing={importMenu.isPending}
              loading={generateMenu.isPending}
              menu={menu}
              message={message}
              onGenerate={generateMenuPreview}
              onImport={importProducts}
              onUpdate={setMenuForm}
            />
          ) : (
            <CampaignInputPanel
              disabled={!hasCampaignInput || generateCampaign.isPending}
              error={error}
              form={campaignForm}
              loading={generateCampaign.isPending}
              onGenerate={generateCampaignPreview}
              onUpdate={setCampaignForm}
            />
          )}
        </Surface>

        <Surface variant="elevated" shadow="soft" style={styles.previewPanel}>
          {workflow === 'menu' ? <MenuPreview money={money} menu={menu} /> : <CampaignPreview campaign={campaign} money={money} />}
        </Surface>
      </View>
    </AppScreen>
  );
}

function WorkflowTabs({ workflow, onChange }: { workflow: Workflow; onChange: (workflow: Workflow) => void }) {
  const { t } = useI18n();

  return (
    <View style={styles.workflowTabs}>
      <Pressable
        android_ripple={{ color: tokens.colors.accentMuted }}
        onPress={() => onChange('menu')}
        style={[styles.workflowTab, workflow === 'menu' && styles.workflowTabActive]}
      >
        <Text style={[styles.workflowTabText, workflow === 'menu' && styles.workflowTabTextActive]}>{t('ai.menu.title')}</Text>
      </Pressable>
      <Pressable
        android_ripple={{ color: tokens.colors.accentMuted }}
        onPress={() => onChange('campaign')}
        style={[styles.workflowTab, workflow === 'campaign' && styles.workflowTabActive]}
      >
        <Text style={[styles.workflowTabText, workflow === 'campaign' && styles.workflowTabTextActive]}>{t('ai.campaign.title')}</Text>
      </Pressable>
    </View>
  );
}

function MenuInputPanel({
  disabled,
  error,
  form,
  importing,
  loading,
  menu,
  message,
  onGenerate,
  onImport,
  onUpdate,
}: {
  disabled: boolean;
  error: string | null;
  form: MenuFormState;
  importing: boolean;
  loading: boolean;
  menu: AiGeneratedMenu | null;
  message: string | null;
  onGenerate: () => void;
  onImport: () => void;
  onUpdate: (form: MenuFormState) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <Text style={styles.eyebrow}>{t('ai.menu.eyebrow')}</Text>
      <Text style={styles.title}>{t('ai.menu.title')}</Text>
      <Text style={styles.description}>{t('ai.menu.description')}</Text>

      <View style={styles.formGrid}>
        <Field label={t('ai.menu.businessType')} value={form.businessType} onChangeText={(value) => onUpdate({ ...form, businessType: value })} />
        <Field label={t('ai.menu.cuisine')} value={form.cuisine} onChangeText={(value) => onUpdate({ ...form, cuisine: value })} />
        <Field label={t('ai.menu.priceRange')} value={form.priceRange} onChangeText={(value) => onUpdate({ ...form, priceRange: value })} />
        <Field label={t('ai.menu.brandTone')} value={form.brandTone} onChangeText={(value) => onUpdate({ ...form, brandTone: value })} />
      </View>

      <Field label={t('ai.menu.notes')} multiline value={form.notes} onChangeText={(value) => onUpdate({ ...form, notes: value })} />

      <PanelMessages error={error} message={message} />

      <View style={styles.actions}>
        <AppButton disabled={disabled} loading={loading} onPress={onGenerate}>
          {loading ? t('ai.menu.generating') : t('ai.menu.generate')}
        </AppButton>
        <AppButton disabled={!menu || importing} loading={importing} onPress={onImport} variant="secondary">
          {importing ? t('ai.menu.importing') : t('ai.menu.import')}
        </AppButton>
      </View>
    </>
  );
}

function CampaignInputPanel({
  disabled,
  error,
  form,
  loading,
  onGenerate,
  onUpdate,
}: {
  disabled: boolean;
  error: string | null;
  form: CampaignFormState;
  loading: boolean;
  onGenerate: () => void;
  onUpdate: (form: CampaignFormState) => void;
}) {
  const { t } = useI18n();

  return (
    <>
      <Text style={styles.eyebrow}>{t('ai.campaign.eyebrow')}</Text>
      <Text style={styles.title}>{t('ai.campaign.title')}</Text>
      <Text style={styles.description}>{t('ai.campaign.description')}</Text>

      <View style={styles.formGrid}>
        <Field label={t('ai.campaign.goal')} value={form.goal} onChangeText={(value) => onUpdate({ ...form, goal: value })} />
        <Field label={t('ai.campaign.timeWindow')} value={form.timeWindow} onChangeText={(value) => onUpdate({ ...form, timeWindow: value })} />
        <Field
          label={t('ai.campaign.focusCategory')}
          value={form.focusCategory}
          onChangeText={(value) => onUpdate({ ...form, focusCategory: value })}
        />
      </View>

      <Field label={t('ai.campaign.notes')} multiline value={form.notes} onChangeText={(value) => onUpdate({ ...form, notes: value })} />

      <PanelMessages error={error} message={null} />

      <View style={styles.actions}>
        <AppButton disabled={disabled} loading={loading} onPress={onGenerate}>
          {loading ? t('ai.campaign.generating') : t('ai.campaign.generate')}
        </AppButton>
      </View>
    </>
  );
}

function PanelMessages({ error, message }: { error: string | null; message: string | null }) {
  return (
    <>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {message ? <Text style={styles.successText}>{message}</Text> : null}
    </>
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

function MenuPreview({ money, menu }: { money: (value: number) => string; menu: AiGeneratedMenu | null }) {
  const { t } = useI18n();

  return (
    <>
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
    </>
  );
}

function CampaignPreview({ campaign, money }: { campaign: AiGeneratedCampaign | null; money: (value: number) => string }) {
  const { t } = useI18n();

  return (
    <>
      <View style={styles.previewHeader}>
        <View>
          <Text style={styles.previewLabel}>{t('ai.campaign.preview')}</Text>
          <Text style={styles.previewTitle}>{campaign ? campaign.campaignName : t('ai.campaign.emptyPreview')}</Text>
        </View>
        {campaign ? (
          <StatusPill value={campaign.provider === 'mock' ? 'Mock Draft' : 'DeepSeek Draft'} tone={campaign.provider === 'mock' ? 'neutral' : 'success'} />
        ) : null}
      </View>

      {campaign ? (
        <>
          <View style={styles.metrics}>
            <MetricCard label={t('orders.metrics.paidOrders')} value={String(campaign.salesSummary.totalOrders)} />
            <MetricCard label={t('sell.metrics.todaySales')} value={money(campaign.salesSummary.totalRevenue)} tone="accent" />
            <MetricCard label={t('ai.campaign.targetProducts')} value={String(campaign.targetProducts.length)} />
          </View>

          <ScrollView contentContainerStyle={styles.previewList} showsVerticalScrollIndicator={false}>
            <InfoBlock label={t('ai.campaign.goal')} value={campaign.goal} />
            <InfoBlock label={t('ai.campaign.discount')} value={`${campaign.discountType} ${campaign.discountValue}`} />
            <InfoBlock label={t('ai.campaign.timeWindow')} value={campaign.timeWindow} />
            <InfoBlock label={t('ai.campaign.bannerCopy')} value={campaign.bannerCopy} />
            <InfoBlock label={t('ai.campaign.staffMessage')} value={campaign.staffMessage} />
            <View style={styles.sectionBlock}>
              <Text style={styles.infoLabel}>{t('ai.campaign.targetProducts')}</Text>
              <View style={styles.categoryRow}>
                {campaign.targetProducts.map((product) => (
                  <View key={product} style={styles.categoryChip}>
                    <Text style={styles.categoryText}>{product}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.sectionBlock}>
              <Text style={styles.infoLabel}>{t('ai.campaign.executionNotes')}</Text>
              {campaign.executionNotes.map((note) => (
                <Text key={note} style={styles.noteText}>
                  {note}
                </Text>
              ))}
            </View>
          </ScrollView>
        </>
      ) : (
        <View style={styles.emptyPreview}>
          <EmptyState title={t('ai.campaign.preview')} description={t('ai.campaign.emptyPreview')} />
        </View>
      )}
    </>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
  workflowTabs: {
    minHeight: 44,
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surfaceMuted,
    padding: tokens.spacing.xs,
    marginBottom: tokens.spacing.lg,
  },
  workflowTab: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius.sm,
  },
  workflowTabActive: {
    backgroundColor: tokens.colors.surface,
    borderWidth: 1,
    borderColor: tokens.colors.lineStrong,
  },
  workflowTabText: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
  },
  workflowTabTextActive: {
    color: tokens.colors.ink,
    fontWeight: '700',
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
  sectionBlock: {
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
    gap: tokens.spacing.sm,
  },
  infoLabel: {
    ...tokens.typography.label,
    color: tokens.colors.accent,
  },
  infoValue: {
    ...tokens.typography.body,
    color: tokens.colors.ink,
  },
  noteText: {
    ...tokens.typography.body,
    color: tokens.colors.ink,
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
