import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ban, Printer, RotateCcw } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { ManagerApprovalModal, type ManagerApprovalPayload } from '@/components/ManagerApprovalModal';
import { StatusPill } from '@/components/StatusPill';
import { Surface } from '@/components/Surface';
import { useCurrency } from '@/hooks/useCurrency';
import { useI18n } from '@/i18n/useI18n';
import { type CheckoutOrder, useCheckoutOrders, usePrintOrderReceipt, usePrintRefundReceipt, useRefundOrder, useReprintOrderReceipt, useVoidOrder } from '@/services/businessApi';
import { tokens } from '@/theme';
import { isManagerApprovalError } from '@/modules/sell/sell.helpers';

type PendingManagerAction = { type: 'refund' | 'void'; order: CheckoutOrder } | null;

export function OrdersScreen() {
  const { t } = useI18n();
  const money = useCurrency();
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<PendingManagerAction>(null);
  const [printMessage, setPrintMessage] = useState<string | null>(null);
  const ordersQuery = useCheckoutOrders();
  const printOrderReceipt = usePrintOrderReceipt();
  const reprintOrderReceipt = useReprintOrderReceipt();
  const printRefundReceipt = usePrintRefundReceipt();
  const refundOrder = useRefundOrder();
  const voidOrder = useVoidOrder();
  const orders = ordersQuery.data ?? [];

  const reprint = async (order: CheckoutOrder) => {
    setPrintingOrderId(order.id);
    setPrintMessage(null);
    try {
      const job = order.printStatus === 'PRINTED' ? await reprintOrderReceipt.mutateAsync(order.id) : await printOrderReceipt.mutateAsync(order.id);
      setPrintMessage(job.lastError ? job.lastError : `Print job ${job.status}.`);
    } catch (error) {
      setPrintMessage(error instanceof Error ? error.message : 'Print failed.');
    } finally {
      setPrintingOrderId(null);
    }
  };

  const refund = async (order: CheckoutOrder, managerApproval?: ManagerApprovalPayload) => {
    setActionOrderId(order.id);
    try {
      const refundRecord = await refundOrder.mutateAsync({
        orderId: order.id,
        idempotencyKey: `pos-full-refund-${order.id}-${Date.now()}`,
        reason: t('orders.refund.defaultReason'),
        method: order.paymentMethod ?? 'MANUAL',
        managerApproval,
      });
      await printRefundReceipt.mutateAsync(refundRecord.id);
      setPendingApproval(null);
    } catch (error) {
      if (isManagerApprovalError(error)) {
        setPendingApproval({ type: 'refund', order });
      }
    } finally {
      setActionOrderId(null);
    }
  };

  const voidPaidOrder = async (order: CheckoutOrder, managerApproval?: ManagerApprovalPayload) => {
    setActionOrderId(order.id);
    try {
      await voidOrder.mutateAsync({
        orderId: order.id,
        reason: t('orders.void.defaultReason'),
        managerApproval,
      });
      setPendingApproval(null);
    } catch (error) {
      if (isManagerApprovalError(error)) {
        setPendingApproval({ type: 'void', order });
      }
    } finally {
      setActionOrderId(null);
    }
  };

  const paidOrdersCount = orders.filter((order) => order.status === 'PAID').length;

  return (
    <AppScreen>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[tokens.typography.caption, { color: tokens.colors.muted }]}>{t('orders.eyebrow')}</Text>
          <Text style={[tokens.typography.screenTitle, { color: tokens.colors.ink, marginTop: tokens.spacing.xs }]}>{t('orders.title')}</Text>
        </View>
        <Surface variant="muted" padding="lg" style={{ minWidth: 160 }}>
          <Text style={[tokens.typography.caption, { color: tokens.colors.muted }]}>{t('orders.metrics.paidOrders')}</Text>
          <Text style={[tokens.typography.numeric, { color: tokens.colors.ink, marginTop: tokens.spacing.xs }]}>{paidOrdersCount}</Text>
        </Surface>
      </View>

      {printMessage ? (
        <Surface variant="muted" padding="md" style={styles.printFeedback}>
          <Text style={styles.printFeedbackText}>{printMessage}</Text>
        </Surface>
      ) : null}

      {/* Orders List */}
      {orders.length === 0 ? (
        <Surface style={{ flex: 1, justifyContent: 'center' }}>
          <EmptyState title={t('orders.empty.title')} description={t('orders.empty.description')} />
        </Surface>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: tokens.spacing.md }}>
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              money={money}
              t={t}
              onReprint={reprint}
              onRefund={refund}
              onVoid={voidPaidOrder}
              isPrinting={printingOrderId === order.id}
              isActing={actionOrderId === order.id}
            />
          ))}
        </ScrollView>
      )}
      <ManagerApprovalModal
        visible={Boolean(pendingApproval)}
        title="Manager approval"
        message={pendingApproval?.type === 'refund' ? t('orders.actions.refund') : t('orders.actions.void')}
        loading={refundOrder.isPending || voidOrder.isPending}
        onCancel={() => setPendingApproval(null)}
        onSubmit={(approval) => {
          if (!pendingApproval) return;
          if (pendingApproval.type === 'refund') {
            void refund(pendingApproval.order, approval);
          } else {
            void voidPaidOrder(pendingApproval.order, approval);
          }
        }}
      />
    </AppScreen>
  );
}

type OrderCardProps = {
  order: CheckoutOrder;
  money: (value: number) => string;
  t: (key: string, params?: Record<string, string | number>) => string;
  onReprint: (order: CheckoutOrder) => void;
  onRefund: (order: CheckoutOrder) => void;
  onVoid: (order: CheckoutOrder) => void;
  isPrinting: boolean;
  isActing: boolean;
};

function OrderCard({ order, money, t, onReprint, onRefund, onVoid, isPrinting, isActing }: OrderCardProps) {
  const itemsLabel = order.items.length === 1 ? t('orders.list.item', { count: order.items.length }) : t('orders.list.items', { count: order.items.length });

  return (
    <Surface padding="xl">
      <View style={styles.cardRow}>
        {/* Left: Order info */}
        <View style={{ flex: 1, gap: tokens.spacing.md }}>
          {/* Order number and badges */}
          <View style={styles.badgeRow}>
            <Text style={[tokens.typography.label, { color: tokens.colors.ink }]}>{order.orderNumber}</Text>
            {order.pickupNumber ? <StatusPill value={t('orders.list.pickupNumber', { number: order.pickupNumber })} tone="info" /> : null}
            <StatusPill value={getStatusLabel(order.status, t)} tone={getStatusTone(order.status)} />
            <StatusPill value={getPrintStatusLabel(order.printStatus, t)} tone={getPrintStatusTone(order.printStatus)} />
            {order.kitchenStatus ? <StatusPill value={getKitchenStatusLabel(order.kitchenStatus)} tone={getKitchenStatusTone(order.kitchenStatus)} /> : null}
          </View>

          {/* Date and items */}
          <View style={{ gap: tokens.spacing.xs }}>
            <Text style={[tokens.typography.body, { color: tokens.colors.muted }]}>{formatDate(order.createdAt)}</Text>
            <Text style={[tokens.typography.body, { color: tokens.colors.muted }]}>{itemsLabel}</Text>
            {order.payments?.length ? (
              <Text style={[tokens.typography.caption, { color: tokens.colors.muted }]}>{formatPaymentSummary(order, money, t)}</Text>
            ) : null}
            {order.kitchenTickets?.length ? (
              <Text style={[tokens.typography.caption, { color: tokens.colors.muted }]}>{formatKitchenStations(order)}</Text>
            ) : null}
          </View>
        </View>

        {/* Right: Amount and print button */}
        <View style={styles.rightColumn}>
          <Text style={[tokens.typography.numeric, { color: tokens.colors.ink }]}>{money(order.total)}</Text>
          {order.refundedTotal ? (
            <Text style={[tokens.typography.caption, { color: tokens.colors.muted }]}>
              {t('orders.list.refunded', { amount: money(order.refundedTotal) })}
            </Text>
          ) : null}
          <Pressable
            style={styles.printButton}
            disabled={!canPrint(order.status) || isPrinting}
            onPress={() => onReprint(order)}
            android_ripple={{ color: tokens.colors.line }}
          >
            <Printer color={tokens.colors.ink} size={16} />
            <Text style={[tokens.typography.label, { color: tokens.colors.ink }]}>{getPrintButtonLabel(order.printStatus, isPrinting, t)}</Text>
          </Pressable>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.iconButton, !canRefund(order.status) || isActing ? styles.disabledButton : null]}
              disabled={!canRefund(order.status) || isActing}
              onPress={() => onRefund(order)}
              android_ripple={{ color: tokens.colors.line }}
            >
              <RotateCcw color={tokens.colors.ink} size={16} />
              <Text style={[tokens.typography.label, { color: tokens.colors.ink }]}>{t('orders.actions.refund')}</Text>
            </Pressable>
            <Pressable
              style={[styles.iconButton, !canVoid(order.status, order.refundedTotal ?? 0) || isActing ? styles.disabledButton : null]}
              disabled={!canVoid(order.status, order.refundedTotal ?? 0) || isActing}
              onPress={() => onVoid(order)}
              android_ripple={{ color: tokens.colors.line }}
            >
              <Ban color={tokens.colors.ink} size={16} />
              <Text style={[tokens.typography.label, { color: tokens.colors.ink }]}>{t('orders.actions.void')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Surface>
  );
}

// Helpers
function getStatusLabel(status: CheckoutOrder['status'], t: (key: string) => string): string {
  switch (status) {
    case 'PAID':
      return t('orders.status.paid');
    case 'CANCELLED':
      return t('orders.status.cancelled');
    case 'VOIDED':
      return t('orders.status.voided');
    case 'PARTIALLY_REFUNDED':
      return t('orders.status.partiallyRefunded');
    case 'REFUNDED':
      return t('orders.status.refunded');
    default:
      return status;
  }
}

function getStatusTone(status: CheckoutOrder['status']): 'success' | 'danger' | 'neutral' {
  switch (status) {
    case 'PAID':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    case 'VOIDED':
      return 'danger';
    case 'PARTIALLY_REFUNDED':
      return 'neutral';
    case 'REFUNDED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function canPrint(status: CheckoutOrder['status']) {
  return ['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(status);
}

function canRefund(status: CheckoutOrder['status']) {
  return ['PAID', 'PARTIALLY_REFUNDED'].includes(status);
}

function canVoid(status: CheckoutOrder['status'], refundedTotal: number) {
  return ['OPEN', 'PAID'].includes(status) && refundedTotal === 0;
}

function getPrintStatusLabel(printStatus: CheckoutOrder['printStatus'], t: (key: string) => string): string {
  switch (printStatus) {
    case 'PRINTED':
      return t('orders.printStatus.printed');
    case 'PRINTING':
      return t('orders.printStatus.printing');
    case 'FAILED':
      return t('orders.printStatus.failed');
    default:
      return t('orders.printStatus.notPrinted');
  }
}

function getPrintStatusTone(printStatus: CheckoutOrder['printStatus']): 'success' | 'warning' | 'danger' | 'neutral' {
  switch (printStatus) {
    case 'PRINTED':
      return 'success';
    case 'PRINTING':
      return 'warning';
    case 'FAILED':
      return 'danger';
    default:
      return 'neutral';
  }
}

function getKitchenStatusLabel(status: NonNullable<CheckoutOrder['kitchenStatus']>): string {
  switch (status) {
    case 'NEW':
      return 'Kitchen New';
    case 'PREPARING':
      return 'Preparing';
    case 'READY':
      return 'Ready';
    case 'COMPLETED':
      return 'Kitchen Done';
    case 'CANCELLED':
      return 'Kitchen Cancelled';
    default:
      return status;
  }
}

function getKitchenStatusTone(status: NonNullable<CheckoutOrder['kitchenStatus']>): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (status) {
    case 'READY':
    case 'COMPLETED':
      return 'success';
    case 'PREPARING':
      return 'warning';
    case 'CANCELLED':
      return 'danger';
    case 'NEW':
      return 'info';
    default:
      return 'neutral';
  }
}

function getPrintButtonLabel(printStatus: CheckoutOrder['printStatus'], isPrinting: boolean, t: (key: string) => string): string {
  if (isPrinting) {
    return t('orders.print.printing');
  }
  if (printStatus === 'PRINTED') {
    return t('orders.print.reprint');
  }
  return t('orders.print.print');
}

function formatPaymentSummary(order: CheckoutOrder, money: (value: number) => string, t: (key: string) => string) {
  if (order.payments.length > 1) {
    return order.payments.map((payment) => `${getPaymentMethodLabel(payment.method, t)} ${money(payment.amount)}`).join(' / ');
  }
  return order.paymentMethod ? getPaymentMethodLabel(order.paymentMethod, t) : '';
}

function formatKitchenStations(order: CheckoutOrder) {
  const names = [...new Set((order.kitchenTickets ?? []).map((ticket) => ticket.stationName).filter(Boolean))];
  return names.length > 0 ? `Kitchen: ${names.join(' / ')}` : 'Kitchen ticket created';
}

function getPaymentMethodLabel(method: NonNullable<CheckoutOrder['paymentMethod']>, t: (key: string) => string) {
  switch (method) {
    case 'CASH':
      return t('payment.cash');
    case 'CARD':
      return t('payment.card');
    case 'MANUAL':
      return t('payment.manual');
    default:
      return method;
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing['2xl'],
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacing.xl,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.md,
    flexWrap: 'wrap',
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: tokens.spacing.md,
  },
  printButton: {
    minHeight: tokens.spacing.touchTargetMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
  },
  printFeedback: {
    marginBottom: tokens.spacing.lg,
  },
  printFeedbackText: {
    ...tokens.typography.body,
    color: tokens.colors.ink,
  },
  actionRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  iconButton: {
    minHeight: tokens.spacing.touchTargetMin,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.background,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
