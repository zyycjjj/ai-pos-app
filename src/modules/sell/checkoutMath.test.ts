import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getCheckoutTotals } from './checkoutMath';

describe('checkout math', () => {
  it('calculates subtotal, tax, and total for cart lines', () => {
    const totals = getCheckoutTotals([
      { productId: 'espresso', name: 'Espresso', quantity: 2, unitPrice: 3.5 },
      { productId: 'croissant', name: 'Croissant', quantity: 1, unitPrice: 4.25 },
    ]);

    assert.deepEqual(totals, {
      subtotal: 11.25,
      tax: 0.93,
      total: 12.18,
    });
  });

  it('rounds money values to cents', () => {
    const totals = getCheckoutTotals([{ productId: 'tea', name: 'Tea', quantity: 3, unitPrice: 1.11 }], 0.0775);

    assert.deepEqual(totals, {
      subtotal: 3.33,
      tax: 0.26,
      total: 3.59,
    });
  });
});
