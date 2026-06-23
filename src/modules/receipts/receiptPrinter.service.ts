import { printerModule } from '@/native/printer/PrinterModule';
import { fetchReceiptPayload, type ReceiptPayload } from '@/services/businessApi';

export async function printReceiptPayload(receipt: ReceiptPayload) {
  return printerModule.printText(formatReceiptText(receipt));
}

export async function printOrderReceipt(orderId: string) {
  const receipt = await fetchReceiptPayload(orderId);
  return printReceiptPayload(receipt);
}

const RECEIPT_WIDTH = 32;

function formatReceiptText(receipt: ReceiptPayload) {
  const lines = [
    center(receipt.store.name),
    center(receipt.order.orderNumber),
    receipt.order.pickupNumber ? center(`Pickup #${receipt.order.pickupNumber}`) : null,
    receipt.order.paidAt ? center(formatDate(receipt.order.paidAt)) : center(formatDate(receipt.order.createdAt)),
    separator(),
    ...receipt.items.flatMap((item) => [
      item.name,
      row(`  ${item.quantity} x ${money(item.unitPrice, receipt.currency)}`, money(item.lineTotal, receipt.currency)),
      ...((item.modifiers ?? []).map((modifier) => `  - ${modifier.optionName}${modifier.priceDelta ? ` +${money(modifier.priceDelta, receipt.currency)}` : ''}`)),
    ]),
    separator(),
    row('Subtotal', money(receipt.totals.subtotal, receipt.currency)),
    receipt.totals.adjustment ? row('Adjustment', `-${money(receipt.totals.adjustment, receipt.currency)}`) : null,
    row('Tax', money(receipt.totals.tax, receipt.currency)),
    receipt.totals.tip ? row('Tip', money(receipt.totals.tip, receipt.currency)) : null,
    separator(),
    row('TOTAL', money(receipt.totals.total, receipt.currency)),
    ...paymentLines(receipt),
    separator(),
    center(receipt.footer.message),
    '',
  ];

  return lines.filter(Boolean).join('\n');
}

function paymentLines(receipt: ReceiptPayload) {
  if (!receipt.payments.length) {
    return [];
  }

  return [
    separator(),
    ...receipt.payments.flatMap((payment) => [
      row(payment.method, money(payment.amount, receipt.currency)),
      payment.changeDue && payment.changeDue > 0 ? row('Change', money(payment.changeDue, receipt.currency)) : null,
    ]),
  ].filter(Boolean) as string[];
}

function separator() {
  return '-'.repeat(RECEIPT_WIDTH);
}

function center(value: string) {
  const text = value.slice(0, RECEIPT_WIDTH);
  const left = Math.max(0, Math.floor((RECEIPT_WIDTH - text.length) / 2));
  return `${' '.repeat(left)}${text}`;
}

function row(left: string, right: string) {
  const clippedRight = right.slice(0, RECEIPT_WIDTH);
  const clippedLeft = left.slice(0, Math.max(1, RECEIPT_WIDTH - clippedRight.length - 1));
  const gap = Math.max(1, RECEIPT_WIDTH - clippedLeft.length - clippedRight.length);
  return `${clippedLeft}${' '.repeat(gap)}${clippedRight}`;
}

function money(value: number, currency: string) {
  const prefix = currency.toUpperCase() === 'USD' ? '$' : `${currency.toUpperCase()} `;
  return `${prefix}${value.toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
