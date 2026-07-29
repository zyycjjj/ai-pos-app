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
import { type DiningTable, useActiveShift, useAddTableItems, useCheckoutTable, useClearTable, useDeleteTableOrderItem, useDiningTables, useOpenTable, useTransferTable, useUpdateTableOrderItem } from '@/services/businessApi';
import { tokens } from '@/theme';

import { useActiveProducts } from '../products/useProducts';
import type { ProductDto } from '../products/products.service';
import { ModifierPickerModal } from '../sell/components/ModifierPickerModal';
import { toCheckoutModifierSelections } from '../sell/sell.helpers';

const DELETE_REASONS = ['tables.deleteReason.mistake', 'tables.deleteReason.customerCancelled', 'tables.deleteReason.duplicate', 'tables.deleteReason.other'];

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
  const transferTable = useTransferTable();
  const updateOrderItem = useUpdateTableOrderItem();
  const deleteOrderItem = useDeleteTableOrderItem();
  const [guestCounts, setGuestCounts] = useState<Record<string, string>>({});
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>({});
  const [orderingTableId, setOrderingTableId] = useState<string | null>(null);
  const [modifierTarget, setModifierTarget] = useState<{ tableId: string; product: ProductDto } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ tableId: string; itemId: string } | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const tables = tablesQuery.data ?? [];
  const orderableProducts = (productsQuery.data ?? []).filter((product) => product.isActive && product.availabilityStatus !== 'SOLD_OUT');
  const groupedTables = useMemo(() => {
    const groups = new Map<string, DiningTable[]>();
    tables.forEach((table) => {
      const key = table.areaName || t('tables.area.default');
      groups.set(key, [...(groups.get(key) ?? []), table]);
    });
    return Array.from(groups.entries());
  }, [tables, t]);
  const availableTransferTargets = tables.filter((table) => table.status === 'AVAILABLE' || table.status === 'RESERVED');

  const runAction = async (action: () => Promise<unknown>) => {
    setLastError(null);
    try {
      await action();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : t('tables.error.generic'));
    }
  };
  const addProductToTable = (tableId: string, product: ProductDto) => {
    if (product.modifierGroups.length > 0) {
      setModifierTarget({ tableId, product });
      return;
    }
    void runAction(() => addItems.mutateAsync({ tableId, items: [{ productId: product.id, quantity: 1 }] }));
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
                const busy = openTable.isPending || addItems.isPending || checkoutTable.isPending || clearTable.isPending || transferTable.isPending || updateOrderItem.isPending || deleteOrderItem.isPending;
                const currentTotal = table.currentOrder?.total ?? 0;
                const selectedTransferTarget = transferTargets[table.id] ?? availableTransferTargets.find((target) => target.id !== table.id)?.id ?? '';
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
                        <Text style={styles.muted}>{t('tables.guests')}: {table.currentOrder.guestCount ?? '-'}</Text>
                        {table.currentOrder.items.map((item) => (
                          <View key={item.id} style={styles.itemRow}>
                            <View style={styles.itemLineTop}>
                              <Text style={styles.itemText}>{item.quantity} x {item.name}</Text>
                              <Text style={styles.itemText}>{money(item.lineTotal)}</Text>
                            </View>
                            {item.modifiers.length > 0 ? <Text style={styles.modifierText}>{item.modifiers.map((modifier) => modifier.optionName).join(', ')}</Text> : null}
                            <Text style={styles.modifierText}>
                              {t('tables.itemStatus')}: {formatItemStatus(t, item.kitchenStatus)}
                              {' · '}
                              {t('tables.addedAt')}: {item.addedAt ? new Date(item.addedAt).toLocaleTimeString() : '-'}
                            </Text>
                            {item.note ? <Text style={styles.modifierText}>{t('tables.itemNote')}: {item.note}</Text> : null}
                            <View style={styles.itemEditRow}>
                              <AppButton
                                variant="secondary"
                                disabled={busy || item.quantity <= 1}
                                onPress={() => runAction(() => updateOrderItem.mutateAsync({ tableId: table.id, itemId: item.id, quantity: item.quantity - 1 }))}
                                style={styles.smallButton}
                              >
                                -
                              </AppButton>
                              <AppButton
                                variant="secondary"
                                disabled={busy}
                                onPress={() => runAction(() => updateOrderItem.mutateAsync({ tableId: table.id, itemId: item.id, quantity: item.quantity + 1 }))}
                                style={styles.smallButton}
                              >
                                +
                              </AppButton>
                              <AppButton
                                variant="secondary"
                                disabled={busy}
                                onPress={() => setDeleteTarget((current) => (current?.itemId === item.id ? null : { tableId: table.id, itemId: item.id }))}
                                style={styles.smallButton}
                              >
                                {t('tables.deleteItem')}
                              </AppButton>
                            </View>
                            {deleteTarget?.itemId === item.id ? (
                              <View style={styles.reasonBox}>
                                <Text style={styles.muted}>{t('tables.deleteReason.title')}</Text>
                                <View style={styles.reasonChips}>
                                  {DELETE_REASONS.map((reasonKey) => (
                                    <AppButton
                                      key={reasonKey}
                                      variant="secondary"
                                      disabled={busy}
                                      onPress={() =>
                                        runAction(async () => {
                                          await deleteOrderItem.mutateAsync({ tableId: table.id, itemId: item.id, reason: t(reasonKey) });
                                          setDeleteTarget(null);
                                        })
                                      }
                                      style={styles.reasonChip}
                                    >
                                      {t(reasonKey)}
                                    </AppButton>
                                  ))}
                                </View>
                                <Text style={styles.modifierText}>{t('tables.deleteReason.preparedHint')}</Text>
                              </View>
                            ) : null}
                          </View>
                        ))}
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
                          disabled={busy}
                          loading={addItems.isPending}
                          icon={<Sparkles color={tokens.colors.ink} size={18} />}
                          onPress={() => setOrderingTableId((current) => (current === table.id ? null : table.id))}
                        >
                          {t('tables.addItem')}
                        </AppButton>
                        {orderingTableId === table.id ? (
                          <View style={styles.productPicker}>
                            <Text style={styles.muted}>{t('tables.selectItem')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productChips}>
                              {orderableProducts.map((product) => (
                                <AppButton key={product.id} variant="secondary" disabled={busy} onPress={() => addProductToTable(table.id, product)} style={styles.productChip}>
                                  {product.name}
                                </AppButton>
                              ))}
                            </ScrollView>
                          </View>
                        ) : null}
                        <View style={styles.transferBox}>
                          <Text style={styles.muted}>{t('tables.transferTo')}</Text>
                          <TextInput
                            value={selectedTransferTarget}
                            onChangeText={(value) => setTransferTargets((current) => ({ ...current, [table.id]: value }))}
                            placeholder={t('tables.targetTableId')}
                            style={styles.input}
                          />
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.targetChips}>
                            {availableTransferTargets.filter((target) => target.id !== table.id).map((target) => (
                              <AppButton
                                key={target.id}
                                variant={selectedTransferTarget === target.id ? 'primary' : 'secondary'}
                                disabled={busy}
                                onPress={() => setTransferTargets((current) => ({ ...current, [table.id]: target.id }))}
                                style={styles.chipButton}
                              >
                                {target.name}
                              </AppButton>
                            ))}
                          </ScrollView>
                          <AppButton
                            variant="secondary"
                            disabled={busy || !selectedTransferTarget}
                            loading={transferTable.isPending}
                            onPress={() => runAction(() => transferTable.mutateAsync({ tableId: table.id, targetTableId: selectedTransferTarget }))}
                          >
                            {t('tables.transfer')}
                          </AppButton>
                        </View>
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
      <ModifierPickerModal
        includeNote
        product={modifierTarget?.product ?? null}
        visible={Boolean(modifierTarget)}
        onClose={() => setModifierTarget(null)}
        onConfirm={({ product, modifiers, note }) => {
          if (!modifierTarget) return;
          void runAction(async () => {
            await addItems.mutateAsync({
              tableId: modifierTarget.tableId,
              items: [{ productId: product.id, quantity: 1, modifiers: toCheckoutModifierSelections(modifiers), note }],
            });
            setModifierTarget(null);
          });
        }}
      />
    </AppScreen>
  );
}

function formatTableStatus(t: (key: string) => string, status: DiningTable['status']) {
  return t(`tables.status.${status}`);
}

function formatItemStatus(t: (key: string) => string, status?: string | null) {
  return t(`tables.itemStatus.${status ?? 'NEW'}`);
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
  itemRow: {
    borderTopColor: tokens.colors.line,
    borderTopWidth: 1,
    gap: tokens.spacing.xs,
    paddingTop: tokens.spacing.sm,
  },
  itemLineTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
  },
  itemText: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  modifierText: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
  },
  transferBox: {
    gap: tokens.spacing.sm,
  },
  itemEditRow: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
  },
  reasonBox: {
    gap: tokens.spacing.xs,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  reasonChip: {
    minHeight: 34,
    paddingHorizontal: tokens.spacing.sm,
  },
  smallButton: {
    minHeight: 34,
    minWidth: 48,
    paddingHorizontal: tokens.spacing.sm,
  },
  productPicker: {
    gap: tokens.spacing.sm,
  },
  productChips: {
    gap: tokens.spacing.sm,
  },
  productChip: {
    minHeight: 42,
    paddingHorizontal: tokens.spacing.md,
  },
  targetChips: {
    gap: tokens.spacing.sm,
  },
  chipButton: {
    minHeight: 42,
    paddingHorizontal: tokens.spacing.md,
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
