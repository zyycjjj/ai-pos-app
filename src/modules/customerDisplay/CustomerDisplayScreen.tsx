import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { useCurrency } from '@/hooks/useCurrency';
import { useCartStore } from '@/stores/cartStore';
import { tokens } from '@/theme';

import { getCheckoutTotals } from '../sell/checkoutMath';

const TAX_RATE = 0.08;

export function CustomerDisplayScreen() {
  const money = useCurrency();
  const lines = useCartStore((state) => state.lines);
  const { subtotal, tax, total } = getCheckoutTotals(lines, TAX_RATE);

  return (
    <Screen padded={false}>
      <View style={styles.root}>
        <View style={styles.hero}>
          <Text style={styles.storeName}>AI POS Store</Text>
          <Text style={styles.heroTitle}>{lines.length === 0 ? 'Welcome' : 'Review your order'}</Text>
          <Text style={styles.heroDescription}>
            {lines.length === 0 ? 'Your order will appear here as the cashier adds items.' : 'Please confirm the items and total.'}
          </Text>
        </View>

        <View style={styles.orderPanel}>
          <Text style={styles.orderTitle}>Order</Text>
          <View style={styles.divider} />
          {lines.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No items yet</Text>
            </View>
          ) : (
            <ScrollView style={styles.orderList} contentContainerStyle={styles.orderListContent}>
              <View style={styles.lineStack}>
                {lines.map((line) => (
                  <View key={line.lineId} style={styles.orderLine}>
                    <View style={styles.lineText}>
                      <Text style={styles.lineName}>{line.name}</Text>
                      <Text style={styles.lineQuantity}>Qty {line.quantity}</Text>
                    </View>
                    <Text style={styles.lineTotal}>{money(line.unitPrice * line.quantity)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
          <View style={styles.summary}>
            <SummaryRow label="Subtotal" value={money(subtotal)} />
            <SummaryRow label="Tax" value={money(tax)} />
            <View style={styles.dividerCompact} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
          </View>
        </View>
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    gap: tokens.spacing['2xl'],
    paddingHorizontal: tokens.navigation.contentPadding,
    paddingVertical: tokens.spacing.xl,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
  },
  storeName: {
    color: tokens.colors.accent,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  heroTitle: {
    color: tokens.colors.ink,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '800',
    marginTop: tokens.spacing.lg,
  },
  heroDescription: {
    maxWidth: 560,
    color: tokens.colors.muted,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '500',
    marginTop: tokens.spacing.lg,
  },
  orderPanel: {
    width: 420,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.xl,
    ...tokens.shadow.soft,
  },
  orderTitle: {
    color: tokens.colors.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.line,
    marginVertical: tokens.spacing.xl,
  },
  dividerCompact: {
    height: 1,
    backgroundColor: tokens.colors.line,
    marginVertical: tokens.spacing.sm,
  },
  emptyState: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: tokens.colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  orderList: {
    flex: 1,
    maxHeight: 360,
  },
  orderListContent: {
    paddingBottom: tokens.spacing.sm,
  },
  lineStack: {
    gap: tokens.spacing.lg,
  },
  orderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing.lg,
  },
  lineText: {
    flex: 1,
  },
  lineName: {
    color: tokens.colors.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  lineQuantity: {
    color: tokens.colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    marginTop: 4,
  },
  lineTotal: {
    color: tokens.colors.ink,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
  },
  summary: {
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: tokens.colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
  },
  summaryValue: {
    color: tokens.colors.ink,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: tokens.colors.ink,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '800',
  },
  totalValue: {
    color: tokens.colors.ink,
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
  },
});
