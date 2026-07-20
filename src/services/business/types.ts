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
  tableId: string | null;
  tableName: string | null;
  customerId: string | null;
  customerPhone: string | null;
  customerName: string | null;
  loyaltyPointsEarned: number;
  loyaltyPointsBalanceAfter: number | null;
  guestCount: number | null;
  status: 'OPEN' | 'HELD' | 'PAID' | 'CANCELLED' | 'VOIDED' | 'PARTIALLY_REFUNDED' | 'REFUNDED';
  printStatus: 'NOT_PRINTED' | 'PRINTING' | 'PRINTED' | 'FAILED';
  paymentMethod: 'CASH' | 'CARD' | 'MANUAL' | null;
  currency: string;
  subtotal: number;
  adjustment: number;
  promotionDiscountAmount: number;
  manualDiscountAmount: number;
  totalDiscountAmount: number;
  appliedPromotions: Array<{ id: string; name: string; type: string; promoCode: string | null; discountAmount: number }>;
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

export type CustomerProfile = {
  id: string;
  phone: string;
  normalizedPhone: string;
  name: string | null;
  note: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  orderCount: number;
  totalSpend: number;
  pointsBalance: number;
  createdAt: string;
  updatedAt: string;
};

export type DiningTableStatus = 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'RESERVED' | 'INACTIVE';

export type DiningTable = {
  id: string;
  areaId: string;
  areaName: string;
  name: string;
  seats: number;
  status: DiningTableStatus;
  sortOrder: number;
  currentOrderId: string | null;
  currentOrder: CheckoutOrder | null;
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
  action: 'CANCELLED' | 'VOIDED' | 'REFUNDED' | 'HELD' | 'RESUMED' | 'TABLE_OPENED' | 'TABLE_TRANSFERRED' | 'TABLE_MERGED' | 'BILL_SPLIT' | 'TABLE_CLEARED';
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

export type AiGenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export type AiGenerationJob<Result> = {
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
