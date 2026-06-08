import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { CheckCircle2, Minus, Plus, Printer, RotateCcw, Trash2, X } from 'lucide-react-native';

import { useFindManyProduct } from '@/_/hook';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Screen } from '@/components/Screen';
import { useCurrency } from '@/hooks/useCurrency';
import {
  type CheckoutOrder,
  useCreateCheckoutOrder,
  useMarkOrderPaid,
  useMarkOrderPrinted,
  useReceipt,
  useTodaySummary,
} from '@/services/businessApi';
import { colors } from '@/theme/colors';
import { useCartStore } from '@/stores/cartStore';

import { getCheckoutTotals } from './checkoutMath';

const TAX_RATE = 0.08;

type PrintFlowStatus = 'idle' | 'printing' | 'printed' | 'failed';

export function SellScreen() {
  const money = useCurrency();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [completedOrder, setCompletedOrder] = useState<CheckoutOrder | null>(null);
  const [printStatus, setPrintStatus] = useState<PrintFlowStatus>('idle');
  const productsQuery = useFindManyProduct({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
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
  const filteredProducts =
    selectedCategory === 'All' ? products : products.filter((product) => (product.category ?? 'Menu') === selectedCategory);
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
    <Screen>
      <View className="mb-5 flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-semibold text-pos-ink">Sell</Text>
          <Text className="mt-1 text-base text-pos-muted">Counter checkout for dual-screen Android POS terminals.</Text>
        </View>
        <View className="flex-row gap-3">
          <StatusPill label="Main display" value="Cashier" />
          <StatusPill label="Customer display" value="Ready" />
          <StatusPill label="Printer" tone={printerReady ? 'ready' : 'danger'} value={printerReady ? 'Built-in ready' : 'Offline'} />
        </View>
      </View>

      <View className="flex-1 flex-row gap-5">
        <View className="flex-[2]">
          <View className="mb-4 flex-row gap-3">
            <Metric label="Today" value={money(summaryQuery.data?.salesTotal ?? 0)} />
            <Metric label="Orders" value={String(summaryQuery.data?.orderCount ?? 0)} />
            <Metric label="Avg ticket" value={money(summaryQuery.data?.averageTicket ?? 0)} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 max-h-12">
            <View className="flex-row gap-2">
              {categories.map((category) => {
                const selected = selectedCategory === category;
                return (
                  <Pressable
                    key={category}
                    className={`h-11 justify-center rounded-pos border px-5 ${
                      selected ? 'border-pos-accent bg-pos-accent' : 'border-pos-line bg-pos-surface'
                    }`}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text className={`text-sm font-semibold ${selected ? 'text-white' : 'text-pos-ink'}`}>{category}</Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <ScrollView contentContainerClassName="flex-row flex-wrap gap-3 pb-8">
            {filteredProducts.map((product) => (
              <Pressable
                key={product.id}
                className="h-36 w-44 justify-between rounded-pos border border-pos-line bg-pos-surface p-4 active:opacity-80"
                onPress={() =>
                  addLine({
                    productId: product.id,
                    name: product.name,
                    quantity: 1,
                    unitPrice: Number(product.price),
                  })
                }
              >
                <View>
                  <Text className="text-lg font-semibold text-pos-ink" numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text className="mt-1 text-sm text-pos-muted" numberOfLines={1}>
                    {product.category ?? 'Menu'}
                  </Text>
                </View>
                <Text className="text-xl font-semibold text-pos-ink">{money(Number(product.price))}</Text>
              </Pressable>
            ))}
            {!productsQuery.isLoading && filteredProducts.length === 0 ? (
              <Text className="text-base text-pos-muted">No active products in this category.</Text>
            ) : null}
          </ScrollView>
        </View>

        <View className="w-[380px] rounded-pos border border-pos-line bg-pos-surface p-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-semibold text-pos-ink">Current order</Text>
              <Text className="mt-1 text-sm text-pos-muted">{lines.length} line items</Text>
            </View>
            <Pressable className="h-10 w-10 items-center justify-center rounded-pos bg-pos-background" onPress={clear}>
              <RotateCcw color={colors.muted} size={18} />
            </Pressable>
          </View>

          <View className="my-5 h-px bg-pos-line" />

          <ScrollView className="flex-1">
            {lines.length === 0 ? (
              <View className="mt-8 items-center">
                <Text className="text-base font-medium text-pos-ink">Ready for the next sale</Text>
                <Text className="mt-2 text-center text-sm text-pos-muted">Tap menu items to build the order shown on the customer screen.</Text>
              </View>
            ) : (
              <View className="gap-4">
                {lines.map((line) => (
                  <View key={line.productId} className="rounded-pos bg-pos-background p-3">
                    <View className="flex-row justify-between gap-3">
                      <Text className="flex-1 text-base font-semibold text-pos-ink" numberOfLines={2}>
                        {line.name}
                      </Text>
                      <Text className="text-base font-semibold text-pos-ink">{money(line.unitPrice * line.quantity)}</Text>
                    </View>
                    <View className="mt-3 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <IconButton onPress={() => setQuantity(line.productId, line.quantity - 1)}>
                          <Minus color={colors.ink} size={16} />
                        </IconButton>
                        <Text className="w-8 text-center text-base font-semibold text-pos-ink">{line.quantity}</Text>
                        <IconButton onPress={() => setQuantity(line.productId, line.quantity + 1)}>
                          <Plus color={colors.ink} size={16} />
                        </IconButton>
                      </View>
                      <Pressable className="h-9 w-9 items-center justify-center rounded-pos" onPress={() => removeLine(line.productId)}>
                        <Trash2 color={colors.danger} size={17} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <View className="mt-5 gap-2">
            <TotalRow label="Subtotal" value={money(subtotal)} />
            <TotalRow label="Tax" value={money(tax)} />
            <View className="my-2 h-px bg-pos-line" />
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-pos-ink">Total</Text>
              <Text className="text-3xl font-semibold text-pos-ink">{money(total)}</Text>
            </View>
            <PrimaryButton disabled={lines.length === 0 || isCheckingOut} onPress={checkout}>
              {isCheckingOut ? 'Processing' : 'Mark paid'}
            </PrimaryButton>
          </View>
        </View>
      </View>

      <Modal animationType="fade" transparent visible={Boolean(completedOrder)} onRequestClose={startNextOrder}>
        <View className="flex-1 items-center justify-center bg-black/30 px-8">
          <View className="w-[520px] rounded-pos bg-pos-surface p-6">
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-3">
                <CheckCircle2 color={colors.accent} size={28} />
                <View>
                  <Text className="text-2xl font-semibold text-pos-ink">Payment complete</Text>
                  <Text className="mt-1 text-sm text-pos-muted">{completedOrder?.orderNumber}</Text>
                </View>
              </View>
              <Pressable className="h-9 w-9 items-center justify-center rounded-pos bg-pos-background" onPress={startNextOrder}>
                <X color={colors.muted} size={18} />
              </Pressable>
            </View>

            <View className="my-5 h-px bg-pos-line" />

            <View className="gap-2">
              <TotalRow label="Receipt format" value={receiptQuery.data?.format ?? 'escpos-80mm'} />
              <TotalRow label="Total" value={completedOrder ? money(completedOrder.total) : money(0)} />
              <TotalRow label="Printer" value="Built-in thermal printer" />
              <TotalRow label="Status" value={printStatusLabel(printStatus)} />
            </View>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-pos bg-pos-accent active:opacity-80"
                disabled={printStatus === 'printing' || markPrinted.isPending}
                onPress={printReceipt}
              >
                <Printer color="#FFFFFF" size={18} />
                <Text className="text-base font-semibold text-white">{printStatus === 'printing' ? 'Printing' : 'Print receipt'}</Text>
              </Pressable>
              <Pressable className="h-12 flex-1 items-center justify-center rounded-pos bg-pos-background active:opacity-80" onPress={startNextOrder}>
                <Text className="text-base font-semibold text-pos-ink">Next order</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="h-20 flex-1 justify-center rounded-pos border border-pos-line bg-pos-surface px-4">
      <Text className="text-sm text-pos-muted">{label}</Text>
      <Text className="mt-1 text-xl font-semibold text-pos-ink">{value}</Text>
    </View>
  );
}

function StatusPill({ label, tone = 'ready', value }: { label: string; tone?: 'ready' | 'danger'; value: string }) {
  return (
    <View className="rounded-pos border border-pos-line bg-pos-surface px-4 py-2">
      <Text className="text-xs text-pos-muted">{label}</Text>
      <Text className={`mt-0.5 text-sm font-semibold ${tone === 'danger' ? 'text-pos-danger' : 'text-pos-accent'}`}>{value}</Text>
    </View>
  );
}

function IconButton({ children, onPress }: { children: ReactNode; onPress: () => void }) {
  return (
    <Pressable className="h-9 w-9 items-center justify-center rounded-pos border border-pos-line bg-pos-surface" onPress={onPress}>
      {children}
    </Pressable>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-pos-muted">{label}</Text>
      <Text className="text-sm font-semibold text-pos-ink">{value}</Text>
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
