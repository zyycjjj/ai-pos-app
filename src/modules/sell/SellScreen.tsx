import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CheckCircle2, Minus, Plus, Printer, RotateCcw, Search, Trash2, X } from 'lucide-react-native';

import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { ManagerApprovalModal, type ManagerApprovalPayload } from '@/components/ManagerApprovalModal';
import { MetricCard } from '@/components/MetricCard';
import { StatusPill } from '@/components/StatusPill';
import { Surface } from '@/components/Surface';
import { useCurrency } from '@/hooks/useCurrency';
import { useI18n } from '@/i18n/useI18n';
import {
  type CheckoutOrder,
  useCreateCheckoutOrder,
  useCheckoutPreview,
  useActiveShift,
  useCheckoutOrders,
  useDiningTables,
  useLookupCustomer,
  useHoldCheckoutOrder,
  useMarkOrderPrinted,
  usePayCheckoutOrder,
  useQuickCreateCustomer,
  useReceipt,
  useResumeCheckoutOrder,
  useTodaySummary,
} from '@/services/businessApi';
import type { CustomerProfile } from '@/services/businessApi';
import type { PromotionPreview } from '@/services/businessApi';
import { tokens } from '@/theme';
import { useCartStore } from '@/stores/cartStore';
import type { ProductModifierGroup } from '@/types/modifiers';

import { getCheckoutTotals, type AdjustmentType, type OrderAdjustment } from './checkoutMath';
import { CategoryChip, IconButton, PaymentMethodChip, TotalRow } from './components/SellPrimitives';
import { useSellCheckout } from './hooks/useSellCheckout';
import {
  createPaymentLine,
  createPromotionPreviewInputHash,
  formatAdjustmentLabel,
  getModifierTotal,
  getSelectedModifiers,
  isManagerApprovalError,
  isModifierSelectionComplete,
  isProductSoldOut,
  paymentMethodLabel,
  printStatusLabel,
  resolvePaymentErrorKey,
  resolvePromotionPreviewReasonKey,
  roundMoney,
  toCheckoutModifierSelections,
} from './sell.helpers';
import type { ModifierSelections, OrderType, PaymentLineDraft, PrintFlowStatus } from './sell.types';
import type { ProductDto } from '../products/products.service';
import { useActiveProducts } from '../products/useProducts';
import { printReceiptPayload } from '../receipts/receiptPrinter.service';

const TAX_RATE = 0.08;
const ALL_CATEGORY = '__all__';

export function SellScreen() {
  const money = useCurrency();
  const { t } = useI18n();
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [search, setSearch] = useState('');
  const [completedOrder, setCompletedOrder] = useState<CheckoutOrder | null>(null);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [payingHeldOrder, setPayingHeldOrder] = useState<CheckoutOrder | null>(null);
  const [paymentLines, setPaymentLines] = useState<PaymentLineDraft[]>([]);
  const [paymentValidationVisible, setPaymentValidationVisible] = useState(false);
  const [shiftRequiredVisible, setShiftRequiredVisible] = useState(false);
  const [paymentSubmitError, setPaymentSubmitError] = useState<string | null>(null);
  const [managerApprovalVisible, setManagerApprovalVisible] = useState(false);
  const [adjustmentVisible, setAdjustmentVisible] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('discount');
  const [adjustmentValueText, setAdjustmentValueText] = useState('');
  const [adjustment, setAdjustment] = useState<OrderAdjustment | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('TAKEAWAY');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tipText, setTipText] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [previewResult, setPreviewResult] = useState<PromotionPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [lastPreviewInputHash, setLastPreviewInputHash] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [customerLookupMessage, setCustomerLookupMessage] = useState('');
  const [modifierProduct, setModifierProduct] = useState<ProductDto | null>(null);
  const [modifierSelections, setModifierSelections] = useState<ModifierSelections>({});
  const [modifierValidationVisible, setModifierValidationVisible] = useState(false);
  const [printStatus, setPrintStatus] = useState<PrintFlowStatus>('idle');
  const productsQuery = useActiveProducts();
  const heldOrdersQuery = useCheckoutOrders('HELD');
  const tablesQuery = useDiningTables();
  const summaryQuery = useTodaySummary();
  const activeShiftQuery = useActiveShift();
  const createOrder = useCreateCheckoutOrder();
  const previewPromotion = useCheckoutPreview();
  const holdOrder = useHoldCheckoutOrder();
  const resumeOrder = useResumeCheckoutOrder();
  const payOrder = usePayCheckoutOrder();
  const lookupCustomer = useLookupCustomer();
  const quickCreateCustomer = useQuickCreateCustomer();
  const markPrinted = useMarkOrderPrinted();
  const receiptQuery = useReceipt(completedOrder?.id);
  const sellCheckout = useSellCheckout();
  const { addLine, clear, lines, removeLine, setQuantity } = useCartStore();

  const products = productsQuery.data ?? [];
  const availableTables = (tablesQuery.data ?? []).filter((table) => table.status === 'AVAILABLE' || table.status === 'RESERVED');
  const menuLabel = t('sell.category.menu');
  const categories = useMemo(() => {
    const values = products.map((product) => product.category ?? menuLabel);
    return [
      { label: t('sell.category.all'), value: ALL_CATEGORY },
      ...Array.from(new Set(values)).map((category) => ({ label: category, value: category })),
    ];
  }, [menuLabel, products, t]);
  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const category = product.category ?? menuLabel;
      const matchesCategory = selectedCategory === ALL_CATEGORY || category === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        category.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [menuLabel, products, search, selectedCategory]);
  const tipAmount = Number(tipText) || 0;
  const { subtotal, adjustment: adjustmentAmount, tax, serviceCharge, total } = getCheckoutTotals(lines, TAX_RATE, adjustment, 0, tipAmount);
  const currentPreviewInputHash = createPromotionPreviewInputHash({
    lineIds: lines.map((line) => `${line.lineId}:${line.quantity}:${line.unitPrice}:${line.modifiers.map((modifier) => modifier.optionId).join(',')}`),
    promoCode,
    customerId: selectedCustomer?.id,
    customerPhone,
    adjustment,
    tipAmount,
  });
  const previewStale = Boolean(previewResult && currentPreviewInputHash !== lastPreviewInputHash);
  const activePreview = previewResult && !previewStale ? previewResult : null;
  const amountDue = payingHeldOrder?.total ?? activePreview?.total ?? total;
  const paymentLineTotal = roundMoney(paymentLines.reduce((sum, line) => sum + (Number(line.amountText) || 0), 0));
  const remainingBalance = roundMoney(amountDue - paymentLineTotal);
  const paymentsBalanced = Math.abs(remainingBalance) < 0.01;
  const cashLinesReady = paymentLines.every((line) => line.method !== 'CASH' || (Number(line.amountReceivedText) || 0) >= (Number(line.amountText) || 0));
  const paymentReady = paymentLines.length > 0 && paymentsBalanced && cashLinesReady;
  const isCheckingOut = createOrder.isPending || payOrder.isPending;
  const printerReady = true;
  const modifierTotal = modifierProduct ? getModifierTotal(modifierProduct, modifierSelections) : 0;
  const modifierRequiredComplete = modifierProduct ? isModifierSelectionComplete(modifierProduct.modifierGroups, modifierSelections) : true;
  const dineInTableRequired = orderType === 'DINE_IN' && !selectedTableId;

  const addProductToCart = (product: ProductDto) => {
    if (isProductSoldOut(product)) {
      return;
    }
    if (product.modifierGroups.length === 0) {
      addLine({
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: Number(product.price),
      });
      return;
    }

    setModifierProduct(product);
    setModifierSelections({});
    setModifierValidationVisible(false);
  };

  const openPayment = () => {
    if (lines.length === 0) {
      return;
    }
    if (dineInTableRequired) {
      return;
    }
    if (!activeShiftQuery.data) {
      setShiftRequiredVisible(true);
      return;
    }
    setShiftRequiredVisible(false);
    setPaymentVisible(true);
    setPayingHeldOrder(null);
    setPaymentValidationVisible(false);
    setPaymentSubmitError(null);
    clearPromotionPreview();
    setCustomerLookupMessage('');
    setPaymentLines([createPaymentLine('CASH', total, Math.ceil(total))]);
  };

  const clearPromotionPreview = () => {
    setPreviewResult(null);
    setPreviewError(null);
    setLastPreviewInputHash('');
  };

  const applyPromotionPreview = async () => {
    if (lines.length === 0 || payingHeldOrder) return;
    setPreviewError(null);
    const customerPayload = selectedCustomer
      ? { customerId: selectedCustomer.id }
      : customerPhone.trim()
        ? { customerPhone: customerPhone.trim(), customerName: customerName.trim() || undefined }
        : {};
    const payload = {
      items: lines.map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
        modifiers: toCheckoutModifierSelections(line.modifiers),
      })),
      orderType,
      tableId: orderType === 'DINE_IN' ? selectedTableId ?? undefined : undefined,
      adjustment: adjustment ?? undefined,
      promoCode: promoCode.trim() || undefined,
      ...customerPayload,
      taxRate: TAX_RATE * 100,
      serviceChargeRate: 0,
      tip: tipAmount,
      currency: 'USD',
    };
    try {
      const result = await previewPromotion.mutateAsync(payload);
      const firstRejected = result.rejectedPromotions.find((promotion) => promotion.promoCode?.toUpperCase() === promoCode.trim().toUpperCase()) ?? result.rejectedPromotions[0];
      setPreviewResult(result);
      setLastPreviewInputHash(currentPreviewInputHash);
      setPreviewError(firstRejected && result.appliedPromotions.length === 0 ? resolvePromotionPreviewReasonKey(firstRejected.reasonCode) : null);
      setPaymentLines([createPaymentLine('CASH', result.total, Math.ceil(result.total))]);
    } catch (error) {
      setPreviewResult(null);
      setLastPreviewInputHash('');
      setPreviewError(resolvePaymentErrorKey(error));
    }
  };

  const confirmPayment = async (managerApproval?: ManagerApprovalPayload) => {
    if (lines.length === 0) {
      return;
    }
    if (!paymentReady) {
      setPaymentValidationVisible(true);
      return;
    }

    setPaymentSubmitError(null);
    try {
      const payments = sellCheckout.buildPaymentPayload(paymentLines);
      const customerPayload = selectedCustomer
        ? { customerId: selectedCustomer.id }
        : customerPhone.trim()
          ? { customerPhone: customerPhone.trim(), customerName: customerName.trim() || undefined }
          : {};
      const paidOrder = payingHeldOrder
        ? await payOrder.mutateAsync({ orderId: payingHeldOrder.id, payments, ...customerPayload })
        : await createOrder.mutateAsync({
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          modifiers: toCheckoutModifierSelections(line.modifiers),
        })),
        orderType,
        tableId: orderType === 'DINE_IN' ? selectedTableId ?? undefined : undefined,
        adjustment: adjustment ?? undefined,
        promoCode: promoCode.trim() || undefined,
        ...customerPayload,
        payments,
        taxRate: TAX_RATE * 100,
        serviceChargeRate: 0,
        tip: tipAmount,
        currency: 'USD',
        managerApproval,
      });
      setCompletedOrder(paidOrder);
      setPaymentVisible(false);
      setPaymentValidationVisible(false);
      setPaymentLines([]);
      setAdjustment(null);
      setAdjustmentValueText('');
      setTipText('');
      setPromoCode('');
      clearPromotionPreview();
      setCustomerPhone('');
      setCustomerName('');
      setSelectedCustomer(null);
      setCustomerLookupMessage('');
      setPayingHeldOrder(null);
      setSelectedTableId(null);
      setPrintStatus('idle');
      clear();
    } catch (error) {
      if (isManagerApprovalError(error)) {
        setManagerApprovalVisible(true);
      } else {
        setPaymentSubmitError(resolvePaymentErrorKey(error));
      }
    }
  };

  const holdCurrentOrder = async () => {
    if (lines.length === 0) return;
    if (dineInTableRequired) return;
    setManagerApprovalVisible(false);
    try {
      await holdOrder.mutateAsync({
        items: lines.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
          modifiers: toCheckoutModifierSelections(line.modifiers),
        })),
        orderType,
        tableId: orderType === 'DINE_IN' ? selectedTableId ?? undefined : undefined,
        adjustment: adjustment ?? undefined,
        promoCode: promoCode.trim() || undefined,
        taxRate: TAX_RATE * 100,
        serviceChargeRate: 0,
        tip: tipAmount,
        currency: 'USD',
      });
      clear();
      setAdjustment(null);
      setAdjustmentValueText('');
      setTipText('');
      setPromoCode('');
      clearPromotionPreview();
      setCustomerPhone('');
      setCustomerName('');
      setSelectedCustomer(null);
      setCustomerLookupMessage('');
      setSelectedTableId(null);
    } catch (error) {
      if (isManagerApprovalError(error)) {
        setManagerApprovalVisible(true);
      }
    }
  };

  const resumeHeldOrder = async (order: CheckoutOrder) => {
    const resumed = await resumeOrder.mutateAsync(order.id);
    setPayingHeldOrder(resumed);
    setCustomerPhone(resumed.customerPhone ?? '');
    setCustomerName(resumed.customerName ?? '');
    setSelectedCustomer(null);
    setCustomerLookupMessage('');
    clearPromotionPreview();
    setPaymentVisible(true);
    setPaymentLines([createPaymentLine('CASH', resumed.total, Math.ceil(resumed.total))]);
  };

  const lookupOrCreateCustomer = async () => {
    const phone = customerPhone.trim();
    if (!phone) {
      setSelectedCustomer(null);
      setCustomerLookupMessage('');
      return;
    }
    setCustomerLookupMessage('');
    const existing = await lookupCustomer.mutateAsync(phone);
    if (existing) {
      setSelectedCustomer(existing);
      setCustomerName(existing.name ?? customerName);
      setCustomerLookupMessage(t('customer.found'));
      clearPromotionPreview();
      return;
    }
    const created = await quickCreateCustomer.mutateAsync({ phone, name: customerName.trim() || undefined });
    setSelectedCustomer(created);
    setCustomerName(created.name ?? customerName);
    setCustomerLookupMessage(t('customer.created'));
    clearPromotionPreview();
  };

  const addPaymentLine = () => {
    const amount = Math.max(remainingBalance, 0);
    setPaymentLines((current) => [...current, createPaymentLine('CARD', amount)]);
  };

  const updatePaymentLine = (id: string, patch: Partial<PaymentLineDraft>) => {
    setPaymentValidationVisible(false);
    setPaymentSubmitError(null);
    setPaymentLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  };

  const removePaymentLine = (id: string) => {
    setPaymentLines((current) => current.filter((line) => line.id !== id));
  };

  const applyAdjustment = () => {
    const value = Number(adjustmentValueText);
    if (!Number.isFinite(value) || value < 0) {
      return;
    }
    setAdjustment({ type: adjustmentType, value });
    setAdjustmentVisible(false);
  };

  const clearAdjustment = () => {
    setAdjustment(null);
    setAdjustmentValueText('');
    setAdjustmentVisible(false);
  };

  const printReceipt = async () => {
    if (!completedOrder) {
      return;
    }

    setPrintStatus('printing');
    try {
      const receipt = receiptQuery.data ?? (await receiptQuery.refetch()).data;
      if (!receipt) {
        throw new Error('Receipt payload is not ready.');
      }

      await printReceiptPayload(receipt);
      const printedOrder = await markPrinted.mutateAsync(completedOrder.id);
      setCompletedOrder(printedOrder);
      setPrintStatus('printed');
    } catch {
      setPrintStatus('failed');
    }
  };

  const startNextOrder = () => {
    setCompletedOrder(null);
    setPrintStatus('idle');
  };

  const toggleModifierOption = (group: ProductModifierGroup, optionId: string) => {
    setModifierValidationVisible(false);
    setModifierSelections((current) => {
      const selected = current[group.id] ?? [];
      if (group.multiSelect) {
        const next = selected.includes(optionId) ? selected.filter((id) => id !== optionId) : [...selected, optionId].slice(0, group.maxSelect ?? Number.MAX_SAFE_INTEGER);
        return { ...current, [group.id]: next };
      }

      return { ...current, [group.id]: selected.includes(optionId) ? [] : [optionId] };
    });
  };

  const addConfiguredProduct = () => {
    if (!modifierProduct) {
      return;
    }
    if (!modifierRequiredComplete) {
      setModifierValidationVisible(true);
      return;
    }

    const selectedModifiers = getSelectedModifiers(modifierProduct.modifierGroups, modifierSelections);
    addLine({
      productId: modifierProduct.id,
      name: modifierProduct.name,
      quantity: 1,
      basePrice: Number(modifierProduct.price),
      unitPrice: modifierTotal,
      modifiers: selectedModifiers,
    });
    setModifierProduct(null);
    setModifierSelections({});
    setModifierValidationVisible(false);
  };

  return (
    <AppScreen>
      <View style={styles.root}>
        <View style={styles.workspace}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>{t('sell.eyebrow')}</Text>
              <Text style={styles.title}>{t('sell.title')}</Text>
            </View>
            <View style={styles.telemetry}>
              <MetricCard label={t('sell.metrics.todaySales')} value={money(summaryQuery.data?.salesTotal ?? 0)} tone="accent" />
              <MetricCard label={t('sell.metrics.orders')} value={String(summaryQuery.data?.orderCount ?? 0)} />
              <MetricCard label={t('sell.metrics.avgTicket')} value={money(summaryQuery.data?.averageTicket ?? 0)} />
            </View>
          </View>

          <View style={styles.controls}>
            <View style={styles.searchBox}>
              <Search color={tokens.colors.muted} size={20} />
              <TextInput
                placeholder={t('sell.searchPlaceholder')}
                placeholderTextColor={tokens.colors.subtle}
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
              {categories.map((category) => (
                <CategoryChip
                  key={category.value}
                  label={category.label}
                  selected={selectedCategory === category.value}
                  onPress={() => setSelectedCategory(category.value)}
                />
              ))}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.productGrid} showsVerticalScrollIndicator={false}>
            {filteredProducts.map((product) => (
              <Pressable
                key={product.id}
                android_ripple={{ color: tokens.colors.accentMuted }}
                disabled={isProductSoldOut(product)}
                onPress={() => addProductToCart(product)}
                style={[styles.productTile, isProductSoldOut(product) && styles.productTileDisabled]}
              >
                <View>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.productMeta} numberOfLines={1}>
                    {product.category ?? menuLabel}
                  </Text>
                  {product.modifierGroups.length > 0 ? (
                    <Text style={styles.productModifierHint}>
                      {t('modifier.groups', { count: product.modifierGroups.length })}
                    </Text>
                  ) : null}
                  {isProductSoldOut(product) ? <Text style={styles.soldOutText}>Sold Out</Text> : null}
                </View>
                <View style={styles.productFooter}>
                  <View style={styles.categoryAccent} />
                  <Text style={styles.productPrice}>{money(Number(product.price))}</Text>
                </View>
              </Pressable>
            ))}
            {!productsQuery.isLoading && filteredProducts.length === 0 ? (
              <Surface style={styles.emptyProducts}>
                <EmptyState title={t('sell.emptyProducts.title')} description={t('sell.emptyProducts.description')} />
              </Surface>
            ) : null}
          </ScrollView>
        </View>

        <Surface variant="elevated" shadow="soft" style={styles.orderRail}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderTitle}>{t('sell.order.title')}</Text>
              <Text style={styles.orderSubtitle}>{t('sell.order.lineItems', { count: lines.length })}</Text>
            </View>
            <IconButton label={t('sell.order.clear')} onPress={clear}>
              <RotateCcw color={tokens.colors.muted} size={20} />
            </IconButton>
          </View>

            <View style={styles.statusRow}>
            {(['DINE_IN', 'TAKEAWAY', 'PICKUP'] as OrderType[]).map((type) => (
              <PaymentMethodChip
                key={type}
                label={t(`orderType.${type}`)}
                selected={orderType === type}
                onPress={() => {
                  setOrderType(type);
                  if (type !== 'DINE_IN') setSelectedTableId(null);
                }}
              />
            ))}
          </View>

          {orderType === 'DINE_IN' ? (
            <View style={styles.tableSelector}>
              <Text style={styles.cashLabel}>Table</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tableChips}>
                {availableTables.map((table) => (
                  <PaymentMethodChip key={table.id} label={table.name} selected={selectedTableId === table.id} onPress={() => setSelectedTableId(table.id)} />
                ))}
              </ScrollView>
              {availableTables.length === 0 ? <Text style={styles.modifierValidation}>No available tables.</Text> : null}
              {lines.length > 0 && !selectedTableId ? <Text style={styles.modifierValidation}>Select a table before dine-in checkout.</Text> : null}
            </View>
          ) : null}

          <View style={styles.statusRow}>
            <StatusPill
              label={t('sell.order.printer')}
              tone={printerReady ? 'success' : 'danger'}
              value={printerReady ? t('sell.order.ready') : t('sell.order.offline')}
            />
            <StatusPill label={t('sell.order.display')} tone="info" value={t('sell.order.synced')} />
            <StatusPill
              label={t('sell.order.status')}
              tone={lines.length > 0 ? 'warning' : 'neutral'}
              value={lines.length > 0 ? t('sell.order.open') : t('sell.order.idle')}
            />
          </View>

          <View style={styles.divider} />

          <ScrollView style={styles.cartScroll} contentContainerStyle={lines.length === 0 ? styles.emptyCartContent : styles.cartContent}>
            {lines.length === 0 ? (
              <EmptyState title={t('sell.order.emptyTitle')} description={t('sell.order.emptyDescription')} />
            ) : (
              lines.map((line) => (
                <View key={line.lineId} style={styles.cartLine}>
                  <View style={styles.cartLineTop}>
                    <Text style={styles.cartItemName} numberOfLines={2}>
                      {line.name}
                    </Text>
                    <Text style={styles.cartLineTotal}>{money(line.unitPrice * line.quantity)}</Text>
                  </View>
                  <Text style={styles.cartItemMeta}>{t('sell.order.each', { price: money(line.unitPrice) })}</Text>
                  {line.modifiers.length > 0 ? (
                    <View style={styles.cartModifiers}>
                      {line.modifiers.map((modifier) => (
                        <Text key={`${modifier.groupId}:${modifier.optionId}`} style={styles.cartModifierText}>
                          {modifier.optionName}
                          {modifier.priceDelta > 0 ? ` +${money(modifier.priceDelta)}` : ''}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                  <View style={styles.cartLineActions}>
                    <View style={styles.quantityStepper}>
                      <IconButton label={t('sell.order.decreaseQuantity')} onPress={() => setQuantity(line.lineId, line.quantity - 1)}>
                        <Minus color={tokens.colors.ink} size={18} />
                      </IconButton>
                      <Text style={styles.quantity}>{line.quantity}</Text>
                      <IconButton label={t('sell.order.increaseQuantity')} onPress={() => setQuantity(line.lineId, line.quantity + 1)}>
                        <Plus color={tokens.colors.ink} size={18} />
                      </IconButton>
                    </View>
                    <IconButton label={t('sell.order.removeItem')} onPress={() => removeLine(line.lineId)}>
                      <Trash2 color={tokens.colors.danger} size={19} />
                    </IconButton>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.totalArea}>
            <TotalRow label={t('sell.order.subtotal')} value={money(subtotal)} />
            {adjustment ? <TotalRow label={t('payment.adjustment')} value={`-${money(adjustmentAmount)}`} /> : null}
            <TotalRow label={t('sell.order.tax')} value={money(tax)} />
            <TotalRow label={t('payment.serviceCharge')} value={money(serviceCharge)} />
            <TotalRow label={t('payment.tip')} value={money(tipAmount)} />
            <View style={styles.totalDivider} />
            <View style={styles.grandTotalRow}>
              <Text style={styles.totalLabel}>{t('sell.order.total')}</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
            <Pressable
              android_ripple={{ color: tokens.colors.accentMuted }}
              disabled={lines.length === 0}
              onPress={() => {
                setAdjustmentType(adjustment?.type ?? 'discount');
                setAdjustmentValueText(adjustment ? String(adjustment.value) : '');
                setAdjustmentVisible(true);
              }}
              style={[styles.adjustmentButton, lines.length === 0 && styles.disabledButton]}
            >
              <Text style={styles.adjustmentButtonText}>{t('payment.discount')}</Text>
              <Text style={styles.adjustmentButtonMeta}>
                {adjustment ? formatAdjustmentLabel(adjustment, money) : t('payment.noAdjustment')}
              </Text>
            </Pressable>
            <TextInput
              keyboardType="numeric"
              placeholder={t('payment.tipPlaceholder')}
              placeholderTextColor={tokens.colors.subtle}
              style={styles.cashInput}
              value={tipText}
              onChangeText={setTipText}
            />
            <AppButton
              disabled={lines.length === 0 || holdOrder.isPending || dineInTableRequired}
              loading={holdOrder.isPending}
              onPress={holdCurrentOrder}
              style={styles.markPaidButton}
              variant="secondary"
            >
              {t('sell.order.hold')}
            </AppButton>
            <AppButton
              disabled={lines.length === 0 || isCheckingOut || dineInTableRequired}
              loading={isCheckingOut}
              onPress={openPayment}
              style={styles.markPaidButton}
            >
              {t('sell.order.markPaid')}
            </AppButton>
            {shiftRequiredVisible ? <Text style={styles.modifierValidation}>{t('sell.shiftRequired')}</Text> : null}
            {managerApprovalVisible ? <Text style={styles.modifierValidation}>{t('payment.managerApprovalRequired')}</Text> : null}
            {(heldOrdersQuery.data ?? []).length > 0 ? (
              <View style={styles.heldOrders}>
                <Text style={styles.cashLabel}>{t('sell.order.heldOrders')}</Text>
                {(heldOrdersQuery.data ?? []).slice(0, 3).map((order) => (
                  <Pressable key={order.id} onPress={() => resumeHeldOrder(order)} style={styles.heldOrderButton}>
                    <Text style={styles.removePaymentText}>{order.pickupNumber ? `#${order.pickupNumber}` : order.orderNumber} · {money(order.total)}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
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
                  <Text style={styles.modalTitle}>{t('sell.payment.complete')}</Text>
                  <Text style={styles.modalSubtitle}>{completedOrder?.orderNumber}</Text>
                </View>
              </View>
              <IconButton label={t('sell.payment.close')} onPress={startNextOrder}>
                <X color={tokens.colors.muted} size={20} />
              </IconButton>
            </View>

            <View style={styles.divider} />

            <View style={styles.receiptRows}>
              <TotalRow label={t('sell.payment.receiptFormat')} value={receiptQuery.data?.format ?? 'escpos-80mm'} />
              <TotalRow label={t('payment.pickupNumber')} value={completedOrder?.pickupNumber ? `#${completedOrder.pickupNumber}` : '-'} />
              <TotalRow label={t('payment.method')} value={completedOrder?.payments?.length ? t('payment.split') : completedOrder?.paymentMethod ? paymentMethodLabel(completedOrder.paymentMethod, t) : '-'} />
              <TotalRow label={t('sell.order.total')} value={completedOrder ? money(completedOrder.total) : money(0)} />
              {completedOrder?.payments?.map((payment, index) => (
                <TotalRow
                  key={`${payment.method}-${index}`}
                  label={`${paymentMethodLabel(payment.method, t)} ${index + 1}`}
                  value={money(payment.amount)}
                />
              ))}
              {completedOrder?.changeDue ? <TotalRow label={t('payment.changeDue')} value={money(completedOrder.changeDue)} /> : null}
              {completedOrder?.promotionDiscountAmount ? <TotalRow label={t('payment.promotionDiscount')} value={`-${money(completedOrder.promotionDiscountAmount)}`} /> : null}
              {completedOrder?.appliedPromotions?.map((promotion) => (
                <TotalRow key={promotion.id} label={promotion.promoCode ? `${promotion.name} (${promotion.promoCode})` : promotion.name} value={`-${money(promotion.discountAmount)}`} />
              ))}
              <TotalRow label={t('sell.payment.printer')} value={t('sell.payment.printerName')} />
              <TotalRow label={t('sell.payment.status')} value={printStatusLabel(printStatus, t)} />
            </View>

            <View style={styles.modalActions}>
              <AppButton
                disabled={printStatus === 'printing' || markPrinted.isPending}
                icon={<Printer color={tokens.colors.inverse} size={20} />}
                loading={printStatus === 'printing' || markPrinted.isPending}
                onPress={printReceipt}
                style={styles.modalActionButton}
              >
                {t('sell.payment.printReceipt')}
              </AppButton>
              <AppButton variant="secondary" onPress={startNextOrder} style={styles.modalActionButton}>
                {t('sell.payment.nextOrder')}
              </AppButton>
            </View>
          </Surface>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={paymentVisible} onRequestClose={() => setPaymentVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Surface shadow="modal" style={[styles.paymentModal, styles.checkoutPaymentModal]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('payment.title')}</Text>
                <Text style={styles.modalSubtitle}>{t('payment.amountDue')}</Text>
              </View>
              <IconButton label={t('sell.payment.close')} onPress={() => setPaymentVisible(false)}>
                <X color={tokens.colors.muted} size={20} />
              </IconButton>
            </View>

            <ScrollView style={styles.paymentModalScroll} contentContainerStyle={styles.paymentModalScrollContent} showsVerticalScrollIndicator>
              <View style={styles.paymentDueBlock}>
                <Text style={styles.paymentDue}>{money(amountDue)}</Text>
                <View style={styles.receiptRows}>
                  <TotalRow label={t('sell.order.subtotal')} value={money(subtotal)} />
                  {adjustment ? <TotalRow label={t('payment.adjustment')} value={`-${money(adjustmentAmount)}`} /> : null}
                  {promoCode.trim() ? <TotalRow label={t('payment.promoCode')} value={promoCode.trim().toUpperCase()} /> : null}
                  <TotalRow label={t('sell.order.tax')} value={money(tax)} />
                  <TotalRow label={t('payment.serviceCharge')} value={money(serviceCharge)} />
                  <TotalRow label={t('payment.tip')} value={money(tipAmount)} />
                </View>
              </View>

              <View style={styles.paymentSection}>
                <Text style={styles.cashLabel}>{t('payment.promoCode')}</Text>
                <TextInput
                  autoCapitalize="characters"
                  placeholder={t('payment.promoCodePlaceholder')}
                  value={promoCode}
                  onChangeText={(value) => {
                    setPromoCode(value);
                    setPreviewError(null);
                  }}
                  style={styles.cashInput}
                />
                <AppButton
                  disabled={lines.length === 0 || Boolean(payingHeldOrder) || previewPromotion.isPending}
                  loading={previewPromotion.isPending}
                  onPress={applyPromotionPreview}
                  variant="secondary"
                >
                  {t('payment.preview.applyPromo')}
                </AppButton>
                {previewStale ? <Text style={styles.previewStale}>{t('payment.preview.stale')}</Text> : null}
                {activePreview ? (
                  <View style={styles.previewCard}>
                    <TotalRow label={t('payment.preview.promotionDiscount')} value={`-${money(activePreview.promotionDiscountAmount)}`} />
                    <TotalRow label={t('payment.preview.estimatedTotal')} value={money(activePreview.total)} />
                    {activePreview.appliedPromotions.map((promotion) => (
                      <Text key={promotion.campaignId} style={styles.previewText}>
                        {t('payment.preview.applied')}: {promotion.name} · -{money(promotion.discountAmount)}
                      </Text>
                    ))}
                    {activePreview.eligiblePromotions.length > 0 ? (
                      <View style={styles.previewList}>
                        <Text style={styles.previewTitle}>{t('payment.preview.available')}</Text>
                        {activePreview.eligiblePromotions.slice(0, 3).map((promotion) => (
                          <Text key={promotion.campaignId} style={styles.previewText}>
                            {promotion.name} · {money(promotion.estimatedDiscountAmount)}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    {activePreview.rejectedPromotions.length > 0 ? (
                      <View style={styles.previewList}>
                        <Text style={styles.previewTitle}>{t('payment.preview.rejected')}</Text>
                        {activePreview.rejectedPromotions.slice(0, 2).map((promotion) => (
                          <Text key={promotion.campaignId} style={styles.previewText}>
                            {promotion.name}: {t(resolvePromotionPreviewReasonKey(promotion.reasonCode))}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ) : null}
                {previewError ? <Text style={styles.modifierValidation}>{t(previewError)}</Text> : null}
              </View>

              <View style={styles.paymentSection}>
                <Text style={styles.cashLabel}>{t('customer.phone')}</Text>
                <TextInput
                  keyboardType="phone-pad"
                  placeholder={t('customer.phonePlaceholder')}
                  placeholderTextColor={tokens.colors.subtle}
                  style={styles.cashInput}
                  value={customerPhone}
                  onChangeText={(value) => {
                    setCustomerPhone(value);
                    setSelectedCustomer(null);
                    setCustomerLookupMessage('');
                    setPreviewError(null);
                  }}
                />
                <Text style={styles.cashLabel}>{t('customer.nameOptional')}</Text>
                <TextInput
                  placeholder={t('customer.namePlaceholder')}
                  placeholderTextColor={tokens.colors.subtle}
                  style={styles.cashInput}
                  value={customerName}
                  onChangeText={setCustomerName}
                />
                <AppButton
                  disabled={!customerPhone.trim() || lookupCustomer.isPending || quickCreateCustomer.isPending}
                  loading={lookupCustomer.isPending || quickCreateCustomer.isPending}
                  onPress={lookupOrCreateCustomer}
                  variant="secondary"
                >
                  {t('customer.lookupCreate')}
                </AppButton>
                {selectedCustomer ? (
                  <View style={styles.customerSummary}>
                    <Text style={styles.customerSummaryTitle}>{selectedCustomer.name ?? selectedCustomer.phone}</Text>
                    <Text style={styles.customerSummaryText}>
                      {selectedCustomer.phone} · {t('customer.points')}: {selectedCustomer.pointsBalance} · {t('customer.orders')}: {selectedCustomer.orderCount}
                    </Text>
                    <Text style={styles.customerSummaryText}>
                      {t('customer.lastOrder')}: {selectedCustomer.lastOrderAt ? new Date(selectedCustomer.lastOrderAt).toLocaleDateString() : '-'}
                    </Text>
                  </View>
                ) : null}
                {customerLookupMessage ? <Text style={styles.customerLookupMessage}>{customerLookupMessage}</Text> : null}
              </View>

              <View style={styles.paymentLines}>
                {paymentLines.map((line, index) => {
                  const lineAmount = Number(line.amountText) || 0;
                  const lineReceived = Number(line.amountReceivedText) || 0;
                  const lineChange = Math.max(roundMoney(lineReceived - lineAmount), 0);
                  return (
                    <View key={line.id} style={styles.paymentLine}>
                      <View style={styles.modifierGroupHeader}>
                        <Text style={styles.cashLabel}>{t('payment.paymentLine', { count: index + 1 })}</Text>
                        {paymentLines.length > 1 ? (
                          <Pressable onPress={() => removePaymentLine(line.id)} style={styles.removePaymentButton}>
                            <Text style={styles.removePaymentText}>{t('payment.removePayment')}</Text>
                          </Pressable>
                        ) : null}
                      </View>
                      <View style={styles.paymentMethodRow}>
                        <PaymentMethodChip
                          label={t('payment.cash')}
                          selected={line.method === 'CASH'}
                          onPress={() => updatePaymentLine(line.id, { method: 'CASH', amountReceivedText: line.amountReceivedText || line.amountText })}
                        />
                        <PaymentMethodChip
                          label={t('payment.card')}
                          selected={line.method === 'CARD'}
                          onPress={() => updatePaymentLine(line.id, { method: 'CARD' })}
                        />
                        <PaymentMethodChip
                          label={t('payment.manual')}
                          selected={line.method === 'MANUAL'}
                          onPress={() => updatePaymentLine(line.id, { method: 'MANUAL' })}
                        />
                      </View>
                      <TextInput
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor={tokens.colors.subtle}
                        style={styles.cashInput}
                        value={line.amountText}
                        onChangeText={(value) =>
                          updatePaymentLine(line.id, { amountText: value, amountReceivedText: line.method === 'CASH' ? value : line.amountReceivedText })
                        }
                      />
                      {line.method === 'CASH' ? (
                        <>
                          <Text style={styles.cashLabel}>{t('payment.cashReceived')}</Text>
                          <TextInput
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor={tokens.colors.subtle}
                            style={styles.cashInput}
                            value={line.amountReceivedText}
                            onChangeText={(value) => updatePaymentLine(line.id, { amountReceivedText: value })}
                          />
                          <TotalRow label={t('payment.changeDue')} value={money(lineChange)} />
                        </>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <TotalRow label={t('payment.remaining')} value={money(Math.max(remainingBalance, 0))} />
              {paymentValidationVisible ? (
                <Text style={styles.modifierValidation}>{t(paymentsBalanced ? 'payment.validation.insufficient' : 'payment.validation.unbalanced')}</Text>
              ) : null}
              {paymentSubmitError ? <Text style={styles.modifierValidation}>{t(paymentSubmitError)}</Text> : null}
              {managerApprovalVisible ? <Text style={styles.modifierValidation}>{t('payment.managerApprovalRequired')}</Text> : null}
            </ScrollView>

            <View style={styles.modalActions}>
              <AppButton variant="secondary" onPress={addPaymentLine} style={styles.modalActionButton}>
                {t('payment.addPayment')}
              </AppButton>
              <AppButton disabled={isCheckingOut || !paymentReady} loading={isCheckingOut} onPress={() => void confirmPayment()} style={styles.modalActionButton}>
                {t('payment.confirm')}
              </AppButton>
            </View>
          </Surface>
        </View>
      </Modal>

      <Modal animationType="fade" transparent visible={adjustmentVisible} onRequestClose={() => setAdjustmentVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Surface shadow="modal" style={styles.paymentModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('payment.discount')}</Text>
                <Text style={styles.modalSubtitle}>{t('sell.order.subtotal')}: {money(subtotal)}</Text>
              </View>
              <IconButton label={t('sell.payment.close')} onPress={() => setAdjustmentVisible(false)}>
                <X color={tokens.colors.muted} size={20} />
              </IconButton>
            </View>

            <View style={styles.paymentMethodRow}>
              <PaymentMethodChip label={t('payment.discountPercent')} selected={adjustmentType === 'discount'} onPress={() => setAdjustmentType('discount')} />
              <PaymentMethodChip
                label={t('payment.fixedReduction')}
                selected={adjustmentType === 'fixed_reduction'}
                onPress={() => setAdjustmentType('fixed_reduction')}
              />
              <PaymentMethodChip
                label={t('payment.overridePrice')}
                selected={adjustmentType === 'price_override'}
                onPress={() => setAdjustmentType('price_override')}
              />
            </View>

            <TextInput
              keyboardType="numeric"
              placeholder={adjustmentType === 'discount' ? '90' : '0'}
              placeholderTextColor={tokens.colors.subtle}
              style={styles.cashInput}
              value={adjustmentValueText}
              onChangeText={setAdjustmentValueText}
            />

            <View style={styles.modalActions}>
              <AppButton onPress={applyAdjustment} style={styles.modalActionButton}>
                {t('payment.applyAdjustment')}
              </AppButton>
              <AppButton variant="secondary" onPress={clearAdjustment} style={styles.modalActionButton}>
                {t('payment.clearAdjustment')}
              </AppButton>
            </View>
          </Surface>
        </View>
      </Modal>

      <ManagerApprovalModal
        visible={managerApprovalVisible}
        title="Manager approval"
        message={t('payment.managerApprovalRequired')}
        loading={createOrder.isPending}
        onCancel={() => setManagerApprovalVisible(false)}
        onSubmit={(approval) => {
          setManagerApprovalVisible(false);
          void confirmPayment(approval);
        }}
      />

      <Modal animationType="fade" transparent visible={Boolean(modifierProduct)} onRequestClose={() => setModifierProduct(null)}>
        <View style={styles.modalBackdrop}>
          <Surface shadow="modal" style={styles.modifierModal}>
            {modifierProduct ? (
              <>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>{modifierProduct.name}</Text>
                    <Text style={styles.modalSubtitle}>{money(Number(modifierProduct.price))}</Text>
                  </View>
                  <IconButton label={t('sell.payment.close')} onPress={() => setModifierProduct(null)}>
                    <X color={tokens.colors.muted} size={20} />
                  </IconButton>
                </View>

                <ScrollView contentContainerStyle={styles.modifierGroups} showsVerticalScrollIndicator={false}>
                  {modifierProduct.modifierGroups.map((group) => (
                    <View key={group.id} style={styles.modifierGroup}>
                      <View style={styles.modifierGroupHeader}>
                        <Text style={styles.modifierGroupTitle}>{group.name}</Text>
                        <Text style={styles.modifierRequirement}>
                          {group.required ? t('modifier.required') : t('modifier.optional')}
                        </Text>
                      </View>
                      <View style={styles.modifierOptions}>
                        {group.options.map((option) => {
                          const selected = (modifierSelections[group.id] ?? []).includes(option.id);
                          const optionSoldOut = option.status === 'SOLD_OUT';
                          return (
                            <Pressable
                              key={option.id}
                              android_ripple={{ color: tokens.colors.accentMuted }}
                              disabled={optionSoldOut}
                              onPress={() => toggleModifierOption(group, option.id)}
                              style={[styles.modifierOption, selected && styles.modifierOptionSelected, optionSoldOut && styles.modifierOptionDisabled]}
                            >
                              <Text style={[styles.modifierOptionText, selected && styles.modifierOptionTextSelected, optionSoldOut && styles.modifierOptionTextDisabled]}>
                                {option.name}
                                {option.priceDelta > 0 ? ` +${money(option.priceDelta)}` : ''}
                                {optionSoldOut ? ' · Sold Out' : ''}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                  {modifierValidationVisible ? (
                    <Text style={styles.modifierValidation}>{t('modifier.validation.required')}</Text>
                  ) : null}
                </ScrollView>

                <View style={styles.modifierFooter}>
                  <TotalRow label={t('modifier.total')} value={money(modifierTotal)} />
                  <AppButton onPress={addConfiguredProduct} style={styles.markPaidButton}>
                    {t('modifier.addToOrder')}
                  </AppButton>
                </View>
              </>
            ) : null}
          </Surface>
        </View>
      </Modal>
    </AppScreen>
  );
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
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  searchBox: {
    height: tokens.spacing.touchTargetMin,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
  },
  searchInput: {
    ...tokens.typography.body,
    flex: 1,
    color: tokens.colors.ink,
    padding: 0,
  },
  categoryList: {
    gap: tokens.spacing.xs,
    paddingRight: tokens.spacing.sm,
    alignItems: 'center',
  },
  categoryChip: {
    minHeight: tokens.spacing.touchTargetMin,
    minWidth: tokens.spacing.touchTargetMin,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
  },
  categoryChipSelected: {
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.surfaceElevated,
  },
  categoryText: {
    ...tokens.typography.caption,
    color: tokens.colors.ink,
  },
  categoryTextSelected: {
    color: tokens.colors.accent,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing['2xl'],
  },
  productTile: {
    width: 154,
    minHeight: 146,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.surface,
    padding: tokens.spacing.lg,
    ...tokens.shadow.soft,
  },
  productTileDisabled: {
    borderColor: tokens.colors.warning,
    backgroundColor: tokens.colors.surfaceMuted,
    opacity: 0.72,
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
  productModifierHint: {
    ...tokens.typography.caption,
    color: tokens.colors.accent,
    marginTop: tokens.spacing.xs,
  },
  soldOutText: {
    ...tokens.typography.caption,
    color: tokens.colors.warning,
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
  tableSelector: {
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
  tableChips: {
    gap: tokens.spacing.sm,
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
  cartModifiers: {
    gap: 2,
    marginTop: tokens.spacing.sm,
  },
  cartModifierText: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
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
  adjustmentButton: {
    minHeight: tokens.spacing.touchTargetMin,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
  adjustmentButtonText: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  adjustmentButtonMeta: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
    marginTop: 2,
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
    maxWidth: '100%',
  },
  checkoutPaymentModal: {
    maxHeight: 640,
  },
  paymentModalScroll: {
    flexShrink: 1,
  },
  paymentModalScrollContent: {
    gap: tokens.spacing.md,
    paddingBottom: tokens.spacing.md,
  },
  modifierModal: {
    width: 620,
    maxHeight: 680,
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
  paymentDueBlock: {
    gap: tokens.spacing.md,
  },
  paymentDue: {
    ...tokens.typography.numericLarge,
    color: tokens.colors.ink,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.lg,
  },
  paymentSection: {
    gap: tokens.spacing.sm,
  },
  paymentMethodChip: {
    minHeight: tokens.spacing.touchTargetMin,
    minWidth: 108,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
  },
  paymentMethodChipSelected: {
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.accentMuted,
  },
  paymentMethodText: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  paymentMethodTextSelected: {
    color: tokens.colors.accent,
  },
  cashPanel: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.xl,
  },
  paymentLines: {
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.lg,
  },
  paymentLine: {
    gap: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.md,
  },
  removePaymentButton: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.sm,
  },
  removePaymentText: {
    ...tokens.typography.caption,
    color: tokens.colors.danger,
  },
  heldOrders: {
    gap: tokens.spacing.xs,
    marginTop: tokens.spacing.sm,
  },
  heldOrderButton: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.sm,
  },
  cashLabel: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  cashInput: {
    ...tokens.typography.numeric,
    minHeight: tokens.spacing.primaryActionHeight,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    color: tokens.colors.ink,
    paddingHorizontal: tokens.spacing.lg,
  },
  customerSummary: {
    gap: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.md,
  },
  customerSummaryTitle: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  customerSummaryText: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
  },
  customerLookupMessage: {
    ...tokens.typography.caption,
    color: tokens.colors.accent,
  },
  previewCard: {
    gap: tokens.spacing.sm,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.background,
    padding: tokens.spacing.md,
  },
  previewList: {
    gap: tokens.spacing.xs,
  },
  previewTitle: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  previewText: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
  },
  previewStale: {
    ...tokens.typography.caption,
    color: tokens.colors.warning,
  },
  cashQuickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  cashQuickButton: {
    minHeight: tokens.spacing.touchTargetMin,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
  },
  cashQuickText: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  modalActions: {
    flexDirection: 'row',
    gap: tokens.spacing.md,
    marginTop: tokens.spacing.xl,
  },
  modalActionButton: {
    flex: 1,
  },
  modifierGroups: {
    gap: tokens.spacing.lg,
    paddingVertical: tokens.spacing.lg,
  },
  modifierGroup: {
    gap: tokens.spacing.sm,
  },
  modifierGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacing.md,
  },
  modifierGroupTitle: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  modifierRequirement: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
  },
  modifierOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  modifierOption: {
    minHeight: tokens.spacing.touchTargetMin,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
  },
  modifierOptionSelected: {
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.accentMuted,
  },
  modifierOptionDisabled: {
    borderColor: tokens.colors.warning,
    backgroundColor: tokens.colors.surfaceMuted,
    opacity: 0.7,
  },
  modifierOptionText: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  modifierOptionTextSelected: {
    color: tokens.colors.accent,
  },
  modifierOptionTextDisabled: {
    color: tokens.colors.warning,
  },
  modifierValidation: {
    ...tokens.typography.caption,
    color: tokens.colors.danger,
  },
  modifierFooter: {
    gap: tokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.line,
    paddingTop: tokens.spacing.lg,
  },
});
