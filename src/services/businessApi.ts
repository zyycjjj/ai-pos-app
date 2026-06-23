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
  modifiers: SelectedModifier[];
};

export type CheckoutPaymentLine = {
  id?: string;
  method: 'CASH' | 'CARD' | 'MANUAL';
  amount: number;
  amountReceived: number | null;
  changeDue: number | null;
};

export type CheckoutOrder = {
  id: string;
  orderNumber: string;
  pickupNumber: string | null;
  status: 'OPEN' | 'PAID' | 'CANCELLED';
  printStatus: 'NOT_PRINTED' | 'PRINTING' | 'PRINTED' | 'FAILED';
  paymentMethod: 'CASH' | 'CARD' | 'MANUAL' | null;
  currency: string;
  subtotal: number;
  adjustment: number;
  adjustmentType: 'discount' | 'fixed_reduction' | 'price_override' | null;
  adjustmentValue: number | null;
  tax: number;
  tip: number;
  total: number;
  cashReceived: number | null;
  changeDue: number | null;
  paidAt: string | null;
  printedAt: string | null;
  createdAt: string;
  payments: CheckoutPaymentLine[];
  items: CheckoutOrderItem[];
};

export type TodaySummary = {
  salesTotal: number;
  orderCount: number;
  averageTicket: number;
  activeProducts: number;
  recentOrders: Array<Pick<CheckoutOrder, 'id' | 'orderNumber' | 'status' | 'total' | 'createdAt'>>;
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
  order: Pick<CheckoutOrder, 'id' | 'orderNumber' | 'status' | 'printStatus' | 'createdAt' | 'paidAt' | 'printedAt'>;
  currency: string;
  items: Array<Pick<CheckoutOrderItem, 'name' | 'quantity' | 'unitPrice' | 'lineTotal'>>;
  totals: Pick<CheckoutOrder, 'subtotal' | 'tax' | 'tip' | 'total'>;
  payments: CheckoutPaymentLine[];
  footer: {
    message: string;
    qrPayload: string;
  };
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

export function useCheckoutOrders(status?: CheckoutOrder['status']) {
  return useQuery({
    queryKey: ['checkout', 'orders', status ?? 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<CheckoutOrder[]>('/api/checkout/orders', {
        params: status ? { status } : undefined,
      });
      return data;
    },
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
      adjustment?: {
        type: 'discount' | 'fixed_reduction' | 'price_override';
        value: number;
      };
      payments: Array<{
        method: 'CASH' | 'CARD' | 'MANUAL';
        amount: number;
        amountReceived?: number;
      }>;
      tax?: number;
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
      const { data } = await apiClient.get<ReceiptPayload>(`/api/receipts/orders/${orderId}`);
      return data;
    },
  });
}
