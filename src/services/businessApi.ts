import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from './apiClient';
import type { SelectedModifier } from '@/types/modifiers';

export type CheckoutOrderItem = {
  id: string;
  productId: string;
  name: string;
  category?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  refundedQuantity?: number;
  modifiers: SelectedModifier[];
};

export type CheckoutPaymentLine = {
  id?: string;
  method: 'CASH' | 'CARD' | 'MANUAL';
  amount: number;
  amountReceived: number | null;
  changeDue: number | null;
};

export type KitchenTicketStatus = 'NEW' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type CheckoutKitchenTicket = {
  id: string;
  ticketNumber: string;
  status: KitchenTicketStatus;
  stationId: string;
  stationName: string | null;
  startedAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
};

export type CheckoutOrder = {
  id: string;
  orderNumber: string;
  pickupNumber: string | null;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'PICKUP';
  status: 'OPEN' | 'HELD' | 'PAID' | 'CANCELLED' | 'VOIDED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
  printStatus: 'NOT_PRINTED' | 'PRINTING' | 'PRINTED' | 'FAILED';
  paymentMethod: 'CASH' | 'CARD' | 'MANUAL' | null;
  currency: string;
  subtotal: number;
  adjustment: number;
  adjustmentType: 'discount' | 'percentage_discount' | 'fixed_reduction' | 'price_override' | null;
  adjustmentValue: number | null;
  discountReason: string | null;
  taxRate: number;
  tax: number;
  serviceChargeRate: number;
  serviceCharge: number;
  tip: number;
  total: number;
  cashReceived: number | null;
  changeDue: number | null;
  paidAt: string | null;
  printedAt: string | null;
  heldAt: string | null;
  resumedAt: string | null;
  createdAt: string;
  refundedTotal?: number;
  payments: CheckoutPaymentLine[];
  refunds?: CheckoutRefund[];
  auditLogs?: CheckoutOrderAuditLog[];
  kitchenTickets?: CheckoutKitchenTicket[];
  kitchenStatus?: KitchenTicketStatus | null;
  items: CheckoutOrderItem[];
};

export type CheckoutRefund = {
  id: string;
  refundNumber: string;
  orderId?: string;
  status: 'COMPLETED';
  method: 'CASH' | 'CARD' | 'MANUAL';
  amount: number;
  reason: string;
  operatorId: string | null;
  approvedById: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    orderItemId: string;
    quantity: number;
    amount: number;
  }>;
};

export type CheckoutOrderAuditLog = {
  id: string;
  action: 'CANCELLED' | 'VOIDED' | 'REFUNDED' | 'HELD' | 'RESUMED';
  fromStatus: CheckoutOrder['status'] | null;
  toStatus: CheckoutOrder['status'] | null;
  amount: number | null;
  reason: string;
  operatorId: string | null;
  approvedById: string | null;
  createdAt: string;
};

export type TodaySummary = {
  salesTotal: number;
  grossSales: number;
  netSales: number;
  refundTotal: number;
  refundCount: number;
  orderCount: number;
  averageTicket: number;
  activeProducts: number;
  recentOrders: Array<Pick<CheckoutOrder, 'id' | 'orderNumber' | 'status' | 'total' | 'createdAt'>>;
};

export type CashMovement = {
  id: string;
  shiftId: string;
  type: 'OPENING' | 'SALE' | 'REFUND' | 'CASH_IN' | 'CASH_OUT' | 'ADJUSTMENT';
  amount: number;
  reason: string;
  referenceType: 'ORDER_PAYMENT' | 'REFUND' | 'MANUAL';
  referenceId: string | null;
  createdByUserId: string | null;
  createdByName: string | null;
  createdAt: string;
};

export type Shift = {
  id: string;
  storeId: string;
  userId: string;
  staffName: string;
  status: 'OPEN' | 'CLOSED';
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  cashSales: number;
  cashRefunds: number;
  cashIn: number;
  cashOut: number;
  adjustments: number;
  expectedCash: number;
  actualCash: number | null;
  variance: number | null;
  notes: string | null;
  movements: CashMovement[];
  createdAt: string;
  updatedAt: string;
};

export type AiMenuDraft = {
  id: string;
  prompt: string;
  structuredJson: {
    currency: string;
    items: Array<{
      name: string;
      category: string;
      price: number;
      currency: string;
    }>;
  };
  status: 'DRAFT' | 'CONFIRMED' | 'DISCARDED';
  createdAt: string;
};

export type AiGeneratedMenu = {
  categories: Array<{ name: string }>;
  products: Array<{
    name: string;
    category: string;
    price: number;
    description?: string;
    active: boolean;
    modifierGroups: Array<{
      name: string;
      required: boolean;
      multiSelect: boolean;
      displayOrder: number;
      options: Array<{
        name: string;
        priceDelta: number;
        displayOrder: number;
      }>;
    }>;
  }>;
  provider: 'deepseek' | 'mock';
  model: string;
};

export type AiMenuGeneratePayload = {
  businessType?: string;
  cuisine?: string;
  priceRange?: string;
  brandTone?: string;
  notes?: string;
};

export type AiMenuGenerateResponse = {
  draftId: string;
  menu: AiGeneratedMenu;
  source: 'deepseek' | 'mock';
};

type AiGenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

type AiGenerationJob<Result> = {
  id: string;
  kind: 'menu' | 'campaign';
  status: AiGenerationJobStatus;
  createdAt: string;
  updatedAt: string;
  result?: Result;
  error?: string;
};

export type AiMenuImportResponse = {
  summary: {
    created: number;
    skipped: number;
  };
  products: Array<{
    id: string;
    name: string;
    category: string | null;
    price: number;
    currency: string;
    isActive: boolean;
  }>;
};

export type AiGeneratedCampaign = {
  campaignName: string;
  goal: string;
  targetProducts: string[];
  discountType: 'percentage' | 'fixed_amount' | 'bundle' | 'staff_prompt';
  discountValue: number;
  timeWindow: string;
  bannerCopy: string;
  staffMessage: string;
  executionNotes: string[];
  salesSummary: {
    totalOrders: number;
    totalRevenue: number;
    topProducts: Array<{
      name: string;
      quantity: number;
      revenue: number;
    }>;
    lowPerformingProducts: Array<{
      name: string;
      quantity: number;
      revenue: number;
    }>;
    paymentBreakdown: Array<{
      method: string;
      amount: number;
    }>;
  };
  provider: 'deepseek' | 'mock';
  model: string;
};

export type AiCampaignGeneratePayload = {
  goal?: string;
  timeWindow?: string;
  focusCategory?: string;
  notes?: string;
};

export type AiCampaignGenerateResponse = {
  draftId: string;
  campaign: AiGeneratedCampaign;
  source: 'deepseek' | 'mock';
};

const AI_JOB_POLL_INTERVAL_MS = 1000;
const AI_JOB_TIMEOUT_MS = 90_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAiJob<Result>(jobPath: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < AI_JOB_TIMEOUT_MS) {
    const { data } = await apiClient.get<AiGenerationJob<Result>>(jobPath, { timeout: 10_000 });

    if (data.status === 'succeeded' && data.result) {
      return data.result;
    }

    if (data.status === 'failed') {
      throw new Error(data.error ?? 'AI generation failed.');
    }

    await sleep(AI_JOB_POLL_INTERVAL_MS);
  }

  throw new Error('AI generation timed out.');
}

export type ReceiptPayload = {
  format: string;
  store: { name: string };
  order: Pick<CheckoutOrder, 'id' | 'orderNumber' | 'pickupNumber' | 'status' | 'printStatus' | 'createdAt' | 'paidAt' | 'printedAt'>;
  currency: string;
  items: Array<Pick<CheckoutOrderItem, 'name' | 'quantity' | 'unitPrice' | 'lineTotal' | 'modifiers'>>;
  totals: Pick<CheckoutOrder, 'subtotal' | 'adjustment' | 'tax' | 'tip' | 'total'> & {
    refundedTotal?: number;
    netTotal?: number;
  };
  refunds?: Array<Pick<CheckoutRefund, 'id' | 'refundNumber' | 'status' | 'method' | 'amount' | 'reason' | 'createdAt'>>;
  payments: CheckoutPaymentLine[];
  footer: {
    message: string;
    qrPayload: string;
  };
};

export type RefundReceiptPayload = {
  format: string;
  type: 'refund';
  store: { name: string };
  refund: Pick<CheckoutRefund, 'id' | 'refundNumber' | 'status' | 'method' | 'amount' | 'reason' | 'createdAt'>;
  order: Pick<CheckoutOrder, 'id' | 'orderNumber' | 'pickupNumber' | 'status' | 'paidAt'>;
  currency: string;
  items: Array<{ name: string; quantity: number; amount: number }>;
  footer: {
    message: string;
    qrPayload: string;
  };
};

export type PrintDocumentType = 'CUSTOMER_RECEIPT' | 'KITCHEN_TICKET' | 'REFUND_RECEIPT' | 'SHIFT_SUMMARY' | 'TEST_PAGE';
export type PrintJobReferenceType = 'ORDER' | 'KITCHEN_TICKET' | 'REFUND' | 'SHIFT' | 'TEST';
export type PrintJobStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
export type PrintJobReason = 'AUTO' | 'MANUAL' | 'MANUAL_REPRINT' | 'TEST';

export type PrintJob = {
  id: string;
  printerId: string | null;
  printer: {
    id: string;
    name: string;
    code: string;
    type: 'RECEIPT' | 'KITCHEN' | 'MULTI_PURPOSE';
    connectionType: 'LAN' | 'USB';
    status: 'ACTIVE' | 'INACTIVE';
    address: string;
  } | null;
  documentType: PrintDocumentType;
  referenceType: PrintJobReferenceType;
  referenceId: string;
  status: PrintJobStatus;
  reason: PrintJobReason;
  renderedText: string | null;
  byteLength: number | null;
  retryCount: number;
  maxRetries: number;
  lastError: string | null;
  sourceJobId: string | null;
  claimedByDeviceId: string | null;
  createdAt: string;
  updatedAt: string;
};

export function useTodaySummary() {
  return useQuery({
    queryKey: ['metrics', 'today'],
    queryFn: async () => {
      const { data } = await apiClient.get<TodaySummary>('/api/metrics/today');
      return data;
    },
  });
}

export function useActiveShift() {
  return useQuery({
    queryKey: ['shifts', 'active'],
    queryFn: async () => {
      const { data } = await apiClient.get<Shift | null>('/api/shifts/active');
      return data;
    },
  });
}

export function useShifts() {
  return useQuery({
    queryKey: ['shifts', 'list'],
    queryFn: async () => {
      const { data } = await apiClient.get<Shift[]>('/api/shifts');
      return data;
    },
  });
}

export function useOpenShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { openingCash: number; notes?: string }) => {
      const { data } = await apiClient.post<Shift>('/api/shifts/open', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCashIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { shiftId: string; amount: number; reason: string }) => {
      const { shiftId, ...body } = payload;
      const { data } = await apiClient.post<Shift>(`/api/shifts/${shiftId}/cash-in`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCashOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { shiftId: string; amount: number; reason: string }) => {
      const { shiftId, ...body } = payload;
      const { data } = await apiClient.post<Shift>(`/api/shifts/${shiftId}/cash-out`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCloseShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { shiftId: string; actualCash: number; notes?: string }) => {
      const { shiftId, ...body } = payload;
      const { data } = await apiClient.post<Shift>(`/api/shifts/${shiftId}/close`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shifts'] });
    },
  });
}

export function useCheckoutOrders(status?: CheckoutOrder['status']) {
  return useQuery({
    queryKey: ['checkout', 'orders', status ?? 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<CheckoutOrder[]>('/api/checkout/orders', {
        params: status ? { status } : undefined,
      });
      return data;
    },
    refetchInterval: 3_000,
  });
}

export function useCreateCheckoutOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      items: Array<{
        productId: string;
        quantity: number;
        modifiers?: Array<{ groupId: string; optionIds: string[] }>;
      }>;
      orderType?: CheckoutOrder['orderType'];
      adjustment?: {
        type: 'discount' | 'percentage_discount' | 'fixed_reduction' | 'price_override';
        value: number;
        reason?: string;
      };
      payments: Array<{
        method: 'CASH' | 'CARD' | 'MANUAL';
        amount: number;
        amountReceived?: number;
      }>;
      tax?: number;
      taxRate?: number;
      serviceChargeRate?: number;
      serviceCharge?: number;
      tip?: number;
      currency?: string;
    }) => {
      const { data } = await apiClient.post<CheckoutOrder>('/api/checkout/orders', payload, { timeout: 30_000 });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useHoldCheckoutOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      items: Array<{
        productId: string;
        quantity: number;
        modifiers?: Array<{ groupId: string; optionIds: string[] }>;
      }>;
      orderType?: CheckoutOrder['orderType'];
      adjustment?: {
        type: 'discount' | 'percentage_discount' | 'fixed_reduction' | 'price_override';
        value: number;
        reason?: string;
      };
      taxRate?: number;
      serviceChargeRate?: number;
      tip?: number;
      currency?: string;
    }) => {
      const { data } = await apiClient.post<CheckoutOrder>('/api/checkout/orders/hold', payload, { timeout: 30_000 });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function useResumeCheckoutOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${orderId}/resume`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
    },
  });
}

export function usePayCheckoutOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      orderId: string;
      payments: Array<{ method: 'CASH' | 'CARD' | 'MANUAL'; amount: number; amountReceived?: number }>;
    }) => {
      const { data } = await apiClient.post<CheckoutOrder>(`/api/checkout/orders/${payload.orderId}/pay`, { payments: payload.payments }, { timeout: 30_000 });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useMarkOrderPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${orderId}/mark-paid`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useMarkOrderPrinted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${orderId}/mark-printed`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { orderId: string; reason: string }) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${payload.orderId}/cancel`, { reason: payload.reason });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useVoidOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { orderId: string; reason: string; approvedById?: string }) => {
      const { data } = await apiClient.patch<CheckoutOrder>(`/api/checkout/orders/${payload.orderId}/void`, {
        reason: payload.reason,
        approvedById: payload.approvedById,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
    },
  });
}

export function useRefundOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      orderId: string;
      idempotencyKey: string;
      reason: string;
      method?: 'CASH' | 'CARD' | 'MANUAL';
      amount?: number;
      items?: Array<{ orderItemId: string; quantity: number }>;
      approvedById?: string;
    }) => {
      const { orderId, ...body } = payload;
      const { data } = await apiClient.post<CheckoutRefund>(`/api/checkout/orders/${orderId}/refunds`, body);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['metrics', 'today'] });
      void queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}

export function usePrintOrderReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/orders/${orderId}/receipt`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export function useReprintOrderReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/orders/${orderId}/reprint`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['checkout'] });
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export function usePrintRefundReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (refundId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/refunds/${refundId}`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export function usePrintShiftSummary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (shiftId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/shifts/${shiftId}/summary`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export function useReprintPrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await apiClient.post<PrintJob>(`/api/print/jobs/${jobId}/reprint`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}

export async function fetchDevicePrintJobs(deviceId: string) {
  const { data } = await apiClient.get<Array<PrintJob & { deviceId: string }>>('/api/print/device/jobs', {
    headers: { 'X-Device-Id': deviceId },
  });
  return data;
}

export async function claimDevicePrintJob(jobId: string, deviceId: string) {
  const { data } = await apiClient.post<PrintJob>(`/api/print/device/jobs/${jobId}/claim`, undefined, {
    headers: { 'X-Device-Id': deviceId },
  });
  return data;
}

export async function markDevicePrintJobSucceeded(jobId: string, deviceId: string) {
  const { data } = await apiClient.post<PrintJob>(`/api/print/device/jobs/${jobId}/success`, undefined, {
    headers: { 'X-Device-Id': deviceId },
  });
  return data;
}

export async function markDevicePrintJobFailed(jobId: string, deviceId: string, error: string) {
  const { data } = await apiClient.post<PrintJob>(`/api/print/device/jobs/${jobId}/fail`, { error }, {
    headers: { 'X-Device-Id': deviceId },
  });
  return data;
}

export function useCreateMenuDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { prompt: string; currency?: string }) => {
      const { data } = await apiClient.post<AiMenuDraft>('/api/ai/menu-drafts', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
    },
  });
}

export function useConfirmMenuDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: string) => {
      const { data } = await apiClient.patch(`/api/ai/menu-drafts/${draftId}/confirm`, {});
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
      void queryClient.invalidateQueries({ queryKey: ['zenstack'] });
    },
  });
}

export function useGenerateAiMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AiMenuGeneratePayload) => {
      const { data: job } = await apiClient.post<AiGenerationJob<AiMenuGenerateResponse>>('/api/ai/menu/generate-jobs', payload);
      return waitForAiJob<AiMenuGenerateResponse>(`/api/ai/menu/generate-jobs/${job.id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
    },
  });
}

export function useImportAiMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (menu: AiGeneratedMenu) => {
      const { data } = await apiClient.post<AiMenuImportResponse>('/api/ai/menu/import', { menu }, { timeout: 60_000 });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['products', 'active'] });
      void queryClient.invalidateQueries({ queryKey: ['zenstack'] });
    },
  });
}

export function useGenerateAiCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AiCampaignGeneratePayload) => {
      const { data: job } = await apiClient.post<AiGenerationJob<AiCampaignGenerateResponse>>('/api/ai/campaign/generate-jobs', payload);
      return waitForAiJob<AiCampaignGenerateResponse>(`/api/ai/campaign/generate-jobs/${job.id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
    },
  });
}

export function useReceipt(orderId?: string) {
  return useQuery({
    queryKey: ['receipts', orderId],
    enabled: Boolean(orderId),
    queryFn: async () => {
      return fetchReceiptPayload(orderId);
    },
  });
}

export async function fetchReceiptPayload(orderId?: string) {
  if (!orderId) {
    throw new Error('Order id is required to fetch receipt payload.');
  }

  const { data } = await apiClient.get<ReceiptPayload>(`/api/receipts/orders/${orderId}`);
  return data;
}

export async function fetchRefundReceiptPayload(refundId: string) {
  const { data } = await apiClient.get<RefundReceiptPayload>(`/api/receipts/refunds/${refundId}`);
  return data;
}
