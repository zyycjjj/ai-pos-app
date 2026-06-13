import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CheckCircle2, Minus, Plus, Printer, RotateCcw, Search, Trash2, X } from 'lucide-react-native';

import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { MetricCard } from '@/components/MetricCard';
import { StatusPill } from '@/components/StatusPill';
import { Surface } from '@/components/Surface';
import { useCurrency } from '@/hooks/useCurrency';
import {
  type CheckoutOrder,
  useCreateCheckoutOrder,
  useMarkOrderPaid,
  useMarkOrderPrinted,
  useReceipt,
  useTodaySummary,
} from '@/services/businessApi';
import { tokens } from '@/theme';
import { useCartStore } from '@/stores/cartStore';

import { getCheckoutTotals } from './checkoutMath';
import { useActiveProducts } from '../products/useProducts';

const TAX_RATE = 0.08;

type PrintFlowStatus = 'idle' | 'printing' | 'printed' | 'failed';

export function SellScreen() {
  const money = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [completedOrder, setCompletedOrder] = useState<CheckoutOrder | null>(null);
  const [printStatus, setPrintStatus] = useState<PrintFlowStatus>('idle');
  const productsQuery = useActiveProducts();
  const summaryQuery = useTodaySummary();
  const createOrder = useCreateCheckoutOrder();
  const markPaid = useMarkOrderPaid();
  const markPrinted = useMarkOrderPrinted();
  const receiptQuery = useReceipt(completedOrder?.id);
  const { addLine, clear, lines, removeLine, setQuantity } = useCartStore();

  const products = productsQuery.data ?? [];
  const categories = useMemo(() => {
    const values = products.map((product) => product.category ?? 'Menu');
    return ['All', ...Array.from(new Set(values))];
  }, [products]);
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const category = product.category ?? 'Menu';
      const matchesCategory = selectedCategory === 'All' || category === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        category.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);
  const { subtotal, tax, total } = getCheckoutTotals(lines, TAX_RATE);
  const isCheckingOut = createOrder.isPending || markPaid.isPending;
  const printerReady = true;

  const checkout = async () => {
    if (lines.length === 0) {
      return;
    }

    const order = await createOrder.mutateAsync({
      items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      tax,
      currency: 'USD',
    });
    const paidOrder = await markPaid.mutateAsync(order.id);
    setCompletedOrder(paidOrder);
    setPrintStatus('idle');
    clear();
  };

  const printReceipt = async () => {
    if (!completedOrder) {
      return;
    }

    setPrintStatus('printing');
    try {
      await markPrinted.mutateAsync(completedOrder.id);
      setCompletedOrder({ ...completedOrder, printStatus: 'PRINTED', printedAt: new Date().toISOString() });
      setPrintStatus('printed');
    } catch {
      setPrintStatus('failed');
    }
  };

  const startNextOrder = () => {
    setCompletedOrder(null);
    setPrintStatus('idle');
  };

  return (
    <AppScreen>
      <View style={styles.root}>
        <View style={styles.workspace}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Counter terminal</Text>
              <Text style={styles.title}>Products</Text>
            </View>
            <View style={styles.telemetry}>
              <MetricCard label="Today Sales" value={money(summaryQuery.data?.salesTotal ?? 0)} tone="accent" />
              <MetricCard label="Orders" value={String(summaryQuery.data?.orderCount ?? 0)} />
              <MetricCard label="Avg Ticket" value={money(summaryQuery.data?.averageTicket ?? 0)} />
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.searchBox}>
              <Search color={tokens.colors.muted} size={20} />
              <TextInput
                placeholder="Search products"
                placeholderTextColor={tokens.colors.subtle}
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
              {categories.map((category) => (
                <CategoryChip
                  key={category}
                  label={category}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                />
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.productGrid} showsVerticalScrollIndicator={false}>
            {filteredProducts.map((product) => (
              <Pressable
                key={product.id}
                android_ripple={{ color: tokens.colors.accentMuted }}
                onPress={() =>
                  addLine({
                    productId: product.id,
                    name: product.name,
                    quantity: 1,
                    unitPrice: Number(product.price),
                  })
                }
                style={styles.productTile}
              >
                <View>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productMeta} numberOfLines={1}>
                    {product.category ?? 'Menu'}
                  </Text>
                </View>
                <View style={styles.productFooter}>
                  <View style={styles.categoryAccent} />
                  <Text style={styles.productPrice}>{money(Number(product.price))}</Text>
                </View>
              </Pressable>
            ))}
            {!productsQuery.isLoading && filteredProducts.length === 0 ? (
              <Surface style={styles.emptyProducts}>
                <EmptyState title="No matching products" description="Adjust the category or search to continue checkout." />
              </Surface>
            ) : null}
          </ScrollView>
        </View>

        <Surface variant="elevated" shadow="soft" style={styles.orderRail}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderTitle}>Current Order</Text>
              <Text style={styles.orderSubtitle}>{lines.length} line items</Text>
            </View>
            <IconButton label="Clear order" onPress={clear}>
              <RotateCcw color={tokens.colors.muted} size={20} />
            </IconButton>
          </View>

          <View style={styles.statusRow}>
            <StatusPill label="Printer" tone={printerReady ? 'success' : 'danger'} value={printerReady ? 'Ready' : 'Offline'} />
            <StatusPill label="Display" tone="info" value="Synced" />
            <StatusPill label="Order" tone={lines.length > 0 ? 'warning' : 'neutral'} value={lines.length > 0 ? 'Open' : 'Idle'} />
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.cartScroll} contentContainerStyle={lines.length === 0 ? styles.emptyCartContent : styles.cartContent}>
            {lines.length === 0 ? (
              <EmptyState title="Ready for the next sale" description="Tap product keys to build the order." />
            ) : (
              lines.map((line) => (
                <View key={line.productId} style={styles.cartLine}>
                  <View style={styles.cartLineTop}>
                    <Text style={styles.cartItemName} numberOfLines={2}>
                      {line.name}
                    </Text>
                    <Text style={styles.cartLineTotal}>{money(line.unitPrice * line.quantity)}</Text>
                  </View>
                  <Text style={styles.cartItemMeta}>{money(line.unitPrice)} each</Text>
                  <View style={styles.cartLineActions}>
                    <View style={styles.quantityStepper}>
                      <IconButton label="Decrease quantity" onPress={() => setQuantity(line.productId, line.quantity - 1)}>
                        <Minus color={tokens.colors.ink} size={18} />
                      </IconButton>
                      <Text style={styles.quantity}>{line.quantity}</Text>
                      <IconButton label="Increase quantity" onPress={() => setQuantity(line.productId, line.quantity + 1)}>
                        <Plus color={tokens.colors.ink} size={18} />
                      </IconButton>
                    </View>
                    <IconButton label="Remove item" onPress={() => removeLine(line.productId)}>
                      <Trash2 color={tokens.colors.danger} size={19} />
                    </IconButton>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.totalArea}>
            <TotalRow label="Subtotal" value={money(subtotal)} />
            <TotalRow label="Tax" value={money(tax)} />
            <View style={styles.totalDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
            <AppButton
              disabled={lines.length === 0 || isCheckingOut}
              loading={isCheckingOut}
              onPress={checkout}
              style={styles.markPaidButton}
            >
              Mark Paid
            </AppButton>
          </View>
        </Surface>
      </View>

      <Modal animationType="fade" transparent visible={Boolean(completedOrder)} onRequestClose={startNextOrder}>
        <View style={styles.modalBackdrop}>
          <Surface shadow="modal" style={styles.paymentModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <CheckCircle2 color={tokens.colors.success} size={32} />
                <View>
                  <Text style={styles.modalTitle}>Payment complete</Text>
                  <Text style={styles.modalSubtitle}>{completedOrder?.orderNumber}</Text>
                </View>
              </View>
              <IconButton label="Close payment modal" onPress={startNextOrder}>
                <X color={tokens.colors.muted} size={20} />
              </IconButton>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRows}>
              <TotalRow label="Receipt format" value={receiptQuery.data?.format ?? 'escpos-80mm'} />
              <TotalRow label="Total" value={completedOrder ? money(completedOrder.total) : money(0)} />
              <TotalRow label="Printer" value="Built-in thermal printer" />
              <TotalRow label="Status" value={printStatusLabel(printStatus)} />
            </View>

            <View style={styles.modalActions}>
              <AppButton
                disabled={printStatus === 'printing' || markPrinted.isPending}
                icon={<Printer color={tokens.colors.inverse} size={20} />}
                loading={printStatus === 'printing' || markPrinted.isPending}
                onPress={printReceipt}
                style={styles.modalActionButton}
              >
                Print receipt
              </AppButton>
              <AppButton variant="secondary" onPress={startNextOrder} style={styles.modalActionButton}>
                Next order
              </AppButton>
            </View>
          </Surface>
        </View>
      </Modal>
    </AppScreen>
  );
}

function CategoryChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable android_ripple={{ color: tokens.colors.accentMuted }} onPress={onPress} style={[styles.categoryChip, selected ? styles.categoryChipSelected : null]}>
      <Text style={[styles.categoryText, selected ? styles.categoryTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

function IconButton({ children, label, onPress }: { children: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" android_ripple={{ color: tokens.colors.surfaceMuted }} onPress={onPress} style={styles.iconButton}>
      {children}
    </Pressable>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalRowLabel}>{label}</Text>
      <Text style={styles.totalRowValue}>{value}</Text>
    </View>
  );
}

function printStatusLabel(status: PrintFlowStatus) {
  switch (status) {
    case 'printing':
      return 'Printing';
    case 'printed':
      return 'Printed';
    case 'failed':
      return 'Failed, retry available';
    default:
      return 'Not printed';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    gap: tokens.navigation.workspaceGap,
  },
  workspace: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
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
  telemetry: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
    width: '100%',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    marginBottom: tokens.spacing.lg,
  },
  searchBox: {
    height: tokens.spacing.buttonHeight,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.lg,
  },
  searchInput: {
    ...tokens.typography.body,
    flex: 1,
    color: tokens.colors.ink,
    padding: 0,
  },
  categoryList: {
    gap: tokens.spacing.sm,
    paddingRight: tokens.spacing.md,
    alignItems: 'center',
  },
  categoryChip: {
    minHeight: tokens.spacing.buttonHeight,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.xl,
  },
  categoryChipSelected: {
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.accentMuted,
  },
  categoryText: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  categoryTextSelected: {
    color: tokens.colors.accent,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    paddingBottom: tokens.spacing['2xl'],
  },
  productTile: {
    width: 160,
    minHeight: 148,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
    ...tokens.shadow.soft,
  },
  productName: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  productMeta: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
    marginTop: tokens.spacing.xs,
  },
  productFooter: {
    gap: tokens.spacing.sm,
  },
  categoryAccent: {
    width: 44,
    height: 3,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.accent,
  },
  productPrice: {
    ...tokens.typography.numeric,
    color: tokens.colors.ink,
  },
  emptyProducts: {
    flex: 1,
    minWidth: 460,
  },
  orderRail: {
    width: tokens.navigation.orderRailWidth,
    alignSelf: 'stretch',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderTitle: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  orderSubtitle: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
    marginTop: tokens.spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.line,
    marginVertical: tokens.spacing.lg,
  },
  cartScroll: {
    flex: 1,
  },
  emptyCartContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  cartContent: {
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing.lg,
  },
  cartLine: {
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.lg,
  },
  cartLineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  cartItemName: {
    ...tokens.typography.body,
    flex: 1,
    color: tokens.colors.ink,
    fontWeight: '700',
  },
  cartLineTotal: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  cartItemMeta: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
    marginTop: tokens.spacing.xs,
  },
  cartLineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: tokens.spacing.md,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  iconButton: {
    width: tokens.spacing.touchTargetMin,
    height: tokens.spacing.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
  },
  pressed: {
    opacity: 0.75,
  },
  quantity: {
    ...tokens.typography.body,
    width: 34,
    textAlign: 'center',
    color: tokens.colors.ink,
    fontWeight: '700',
  },
  totalArea: {
    gap: tokens.spacing.sm,
    paddingTop: tokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalRowLabel: {
    ...tokens.typography.body,
    color: tokens.colors.muted,
  },
  totalRowValue: {
    ...tokens.typography.body,
    color: tokens.colors.ink,
    fontWeight: '700',
  },
  totalDivider: {
    height: 1,
    backgroundColor: tokens.colors.line,
    marginVertical: tokens.spacing.sm,
  },
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  totalLabel: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
    marginBottom: tokens.spacing.xs,
  },
  totalValue: {
    ...tokens.typography.numericLarge,
    color: tokens.colors.ink,
  },
  markPaidButton: {
    minHeight: tokens.spacing.primaryActionHeight,
    marginTop: tokens.spacing.md,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(23, 26, 31, 0.34)',
    padding: tokens.spacing['2xl'],
  },
  paymentModal: {
    width: 540,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacing.lg,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  modalTitle: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  modalSubtitle: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
    marginTop: tokens.spacing.xs,
  },
  receiptRows: {
    gap: tokens.spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.xl,
  },
  modalActionButton: {
    flex: 1,
  },
});
