import { printerModule } from '@/native/printer/PrinterModule';
import { fetchReceiptPayload, type ReceiptPayload } from '@/services/businessApi';

export async function printReceiptPayload(receipt: ReceiptPayload) {
  return printerModule.printReceipt(receipt);
}

export async function printOrderReceipt(orderId: string) {
  const receipt = await fetchReceiptPayload(orderId);
  return printReceiptPayload(receipt);
}
