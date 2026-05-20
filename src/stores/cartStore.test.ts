import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import { useCartStore } from './cartStore';

describe('cart store', () => {
  beforeEach(() => {
    useCartStore.getState().clear();
  });

  it('merges repeated product additions into one line', () => {
    const store = useCartStore.getState();

    store.addLine({ productId: 'latte', name: 'Latte', quantity: 1, unitPrice: 5 });
    store.addLine({ productId: 'latte', name: 'Latte', quantity: 2, unitPrice: 5 });

    assert.deepEqual(useCartStore.getState().lines, [{ productId: 'latte', name: 'Latte', quantity: 3, unitPrice: 5 }]);
  });

  it('removes and clears lines', () => {
    const store = useCartStore.getState();

    store.addLine({ productId: 'latte', name: 'Latte', quantity: 1, unitPrice: 5 });
    store.addLine({ productId: 'tea', name: 'Tea', quantity: 1, unitPrice: 4 });
    useCartStore.getState().removeLine('latte');

    assert.equal(useCartStore.getState().lines.length, 1);
    assert.equal(useCartStore.getState().lines[0].productId, 'tea');

    useCartStore.getState().clear();
    assert.deepEqual(useCartStore.getState().lines, []);
  });
});
