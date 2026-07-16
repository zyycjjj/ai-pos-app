import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Armchair, CreditCard, Plus, Sparkles } from 'lucide-react-native';

import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/StatusPill';
import { Surface } from '@/components/Surface';
import { useCurrency } from '@/hooks/useCurrency';
import { useI18n } from '@/i18n/useI18n';
import { type DiningTable, useActiveShift, useAddTableItems, useCheckoutTable, useClearTable, useDiningTables, useOpenTable } from '@/services/businessApi';
import { tokens } from '@/theme';

import { useActiveProducts } from '../products/useProducts';

export function TablesScreen() {
  const { t } = useI18n();
  const money = useCurrency();
  const tablesQuery = useDiningTables();
  const productsQuery = useActiveProducts();
  const activeShiftQuery = useActiveShift();
  const openTable = useOpenTable();
  const addItems = useAddTableItems();
  const checkoutTable = useCheckoutTable();
  const clearTable = useClearTable();
  const [guestCounts, setGuestCounts] = useState<Record<string, string>>({});
  const [lastError, setLastError] = useState<string | null>(null);

  const tables = tablesQuery.data ?? [];
  const simpleProduct = (productsQuery.data ?? []).find((product) => !product.modifierGroups.some((group) => group.required));
  const groupedTables = useMemo(() => {
    const groups = new Map<string, DiningTable[]>();
    tables.forEach((table) => {
      const key = table.areaName || t('tables.area.default');
      groups.set(key, [...(groups.get(key) ?? []), table]);
    });
    return Array.from(groups.entries());
  }, [tables, t]);

  const runAction = async (action: () => Promise<unknown>) => {
    setLastError(null);
    try {
      await action();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : t('tables.error.generic'));
    }
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>{t('tables.eyebrow')}</Text>
          <Text style={styles.title}>{t('tables.title')}</Text>
        </View>
        <StatusPill value={activeShiftQuery.data ? t('shifts.status.open') : t('shifts.status.none')} tone={activeShiftQuery.data ? 'success' : 'warning'} />
      </View>

      {lastError ? (
        <Surface variant="muted" padding="lg" style={styles.errorBox}>
          <Text style={styles.errorText}>{lastError}</Text>
        </Surface>
      ) : null}

      <ScrollView contentContainerStyle={styles.content}>
        {tablesQuery.isLoading ? <Text style={styles.muted}>{t('tables.loading')}</Text> : null}
        {!tablesQuery.isLoading && groupedTables.length === 0 ? <EmptyState title={t('tables.empty.title')} description={t('tables.empty.description')} /> : null}
        {groupedTables.map(([areaName, areaTables]) => (
          <View key={areaName} style={styles.area}>
            <Text style={styles.areaTitle}>{areaName}</Text>
            <View style={styles.grid}>
              {areaTables.map((table) => {
                const busy = openTable.isPending || addItems.isPending || checkoutTable.isPending || clearTable.isPending;
                const currentTotal = table.currentOrder?.total ?? 0;
                return (
                  <Surface key={table.id} padding="lg" style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={styles.tableNameRow}>
                        <Armchair color={tokens.colors.accent} size={22} />
                        <Text style={styles.tableName}>{table.name}</Text>
                      </View>
                      <StatusPill value={formatTableStatus(t, table.status)} tone={table.status === 'AVAILABLE' ? 'success' : table.status === 'DIRTY' ? 'warning' : 'info'} />
                    </View>
                    <Text style={styles.muted}>{t('tables.seats')}: {table.seats}</Text>
                    {table.currentOrder ? (
                      <View style={styles.orderMeta}>
                        <Text style={styles.orderNumber}>{table.currentOrder.orderNumber}</Text>
                        <Text style={styles.total}>{money(currentTotal)}</Text>
                      </View>
                    ) : null}

                    {table.status === 'AVAILABLE' || table.status === 'RESERVED' ? (
                      <View style={styles.actionRow}>
                        <TextInput
                          keyboardType="number-pad"
                          value={guestCounts[table.id] ?? '2'}
                          onChangeText={(value) => setGuestCounts((current) => ({ ...current, [table.id]: value }))}
                          placeholder={t('tables.guests')}
                          style={styles.input}
                        />
                        <AppButton
                          disabled={busy}
                          loading={openTable.isPending}
                          icon={<Plus color={tokens.colors.inverse} size={18} />}
                          onPress={() => runAction(() => openTable.mutateAsync({ tableId: table.id, guestCount: Number(guestCounts[table.id] ?? 2) || 2 }))}
                        >
                          {t('tables.open')}
                        </AppButton>
                      </View>
                    ) : null}

                    {table.status === 'OCCUPIED' ? (
                      <View style={styles.actions}>
                        <AppButton
                          variant="secondary"
                          disabled={busy || !simpleProduct}
                          loading={addItems.isPending}
                          icon={<Sparkles color={tokens.colors.ink} size={18} />}
                          onPress={() => simpleProduct ? runAction(() => addItems.mutateAsync({ tableId: table.id, items: [{ productId: simpleProduct.id, quantity: 1 }] })) : undefined}
                        >
                          {t('tables.addItem')}
                        </AppButton>
                        <AppButton
                          disabled={busy || !activeShiftQuery.data || currentTotal <= 0}
                          loading={checkoutTable.isPending}
                          icon={<CreditCard color={tokens.colors.inverse} size={18} />}
                          onPress={() => runAction(() => checkoutTable.mutateAsync({ tableId: table.id, payments: [{ method: 'CARD', amount: currentTotal }] }))}
                        >
                          {t('tables.checkout')}
                        </AppButton>
                      </View>
                    ) : null}

                    {table.status === 'DIRTY' ? (
                      <AppButton variant="secondary" disabled={busy} loading={clearTable.isPending} onPress={() => runAction(() => clearTable.mutateAsync(table.id))}>
                        {t('tables.clear')}
                      </AppButton>
                    ) : null}
                  </Surface>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

function formatTableStatus(t: (key: string) => string, status: DiningTable['status']) {
  return t(`tables.status.${status}`);
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xl,
  },
  eyebrow: {
    ...tokens.typography.label,
    color: tokens.colors.accent,
    textTransform: 'uppercase',
  },
  title: {
    ...tokens.typography.screenTitle,
    color: tokens.colors.ink,
  },
  content: {
    gap: tokens.spacing.xl,
    paddingBottom: tokens.spacing['3xl'],
  },
  area: {
    gap: tokens.spacing.md,
  },
  areaTitle: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.lg,
  },
  card: {
    gap: tokens.spacing.md,
    minWidth: 280,
    width: '31%',
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  tableNameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  tableName: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  muted: {
    ...tokens.typography.body,
    color: tokens.colors.muted,
  },
  orderMeta: {
    borderTopColor: tokens.colors.line,
    borderTopWidth: 1,
    gap: tokens.spacing.xs,
    paddingTop: tokens.spacing.md,
  },
  orderNumber: {
    ...tokens.typography.label,
    color: tokens.colors.muted,
  },
  total: {
    ...tokens.typography.numeric,
    color: tokens.colors.ink,
  },
  actionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: tokens.spacing.md,
  },
  actions: {
    gap: tokens.spacing.sm,
  },
  input: {
    ...tokens.typography.body,
    backgroundColor: tokens.colors.surfaceElevated,
    borderColor: tokens.colors.lineStrong,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    color: tokens.colors.ink,
    minHeight: tokens.spacing.buttonHeight,
    minWidth: 86,
    paddingHorizontal: tokens.spacing.md,
  },
  errorBox: {
    borderColor: tokens.colors.danger,
    marginBottom: tokens.spacing.lg,
  },
  errorText: {
    ...tokens.typography.body,
    color: tokens.colors.danger,
  },
});
