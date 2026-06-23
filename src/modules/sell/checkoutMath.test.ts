import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getCheckoutTotals } from './checkoutMath';

describe('checkout math', () => {
  it('calculates subtotal, tax, and total for cart lines', () => {
    const totals = getCheckoutTotals([
      { lineId: 'espresso', productId: 'espresso', name: 'Espresso', quantity: 2, basePrice: 3.5, unitPrice: 3.5, modifiers: [] },
      { lineId: 'croissant', productId: 'croissant', name: 'Croissant', quantity: 1, basePrice: 4.25, unitPrice: 4.25, modifiers: [] },
    ]);

    assert.deepEqual(totals, {
      subtotal: 11.25,
      adjustment: 0,
      adjustedSubtotal: 11.25,
      tax: 0.93,
      total: 12.18,
    });
  });

  it('rounds money values to cents', () => {
    const totals = getCheckoutTotals([
      { lineId: 'tea', productId: 'tea', name: 'Tea', quantity: 3, basePrice: 1.11, unitPrice: 1.11, modifiers: [] },
    ], 0.0775);

    assert.deepEqual(totals, {
      subtotal: 3.33,
      adjustment: 0,
      adjustedSubtotal: 3.33,
      tax: 0.26,
      total: 3.59,
    });
  });

  it('calculates discount, fixed reduction, and price override totals', () => {
    const lines = [{ lineId: 'tea', productId: 'tea', name: 'Tea', quantity: 2, basePrice: 10, unitPrice: 10, modifiers: [] }];

    assert.deepEqual(getCheckoutTotals(lines, 0, { type: 'discount', value: 90 }), {
      subtotal: 20,
      adjustment: 2,
      adjustedSubtotal: 18,
      tax: 0,
      total: 18,
    });
    assert.deepEqual(getCheckoutTotals(lines, 0, { type: 'fixed_reduction', value: 5 }), {
      subtotal: 20,
      adjustment: 5,
      adjustedSubtotal: 15,
      tax: 0,
      total: 15,
    });
    assert.deepEqual(getCheckoutTotals(lines, 0, { type: 'price_override', value: 12 }), {
      subtotal: 20,
      adjustment: 8,
      adjustedSubtotal: 12,
      tax: 0,
      total: 12,
    });
  });
});
