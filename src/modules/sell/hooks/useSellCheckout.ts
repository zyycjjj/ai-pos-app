import { useMemo } from 'react';

import type { PaymentLineDraft } from '../sell.types';

export function useSellCheckout() {
  return useMemo(
    () => ({
      buildPaymentPayload(paymentLines: PaymentLineDraft[]) {
        // POS only shapes operator-entered payment lines; the backend still recomputes trusted totals and validates balance.
        return paymentLines.map((line) => ({
          method: line.method,
          amount: Number(line.amountText) || 0,
          amountReceived: line.method === 'CASH' ? Number(line.amountReceivedText) || 0 : undefined,
        }));
      },
    }),
    [],
  );
}
