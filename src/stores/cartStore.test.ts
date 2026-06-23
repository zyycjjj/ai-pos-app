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

    assert.deepEqual(useCartStore.getState().lines, [
      { lineId: 'latte', productId: 'latte', name: 'Latte', quantity: 3, basePrice: 5, unitPrice: 5, modifiers: [] },
    ]);
  });

  it('keeps different modifier selections as separate lines', () => {
    const store = useCartStore.getState();

    store.addLine({
      productId: 'milk-tea',
      name: 'Milk Tea',
      quantity: 1,
      basePrice: 6.5,
      unitPrice: 8.5,
      modifiers: [{ groupId: 'sweetness', groupName: 'Sweetness', optionId: '70', optionName: '70%', priceDelta: 2 }],
    });
    store.addLine({
      productId: 'milk-tea',
      name: 'Milk Tea',
      quantity: 1,
      basePrice: 6.5,
      unitPrice: 6.5,
      modifiers: [{ groupId: 'sweetness', groupName: 'Sweetness', optionId: '100', optionName: '100%', priceDelta: 0 }],
    });

    assert.equal(useCartStore.getState().lines.length, 2);
    assert.equal(useCartStore.getState().lines[0].lineId, 'milk-tea:70');
    assert.equal(useCartStore.getState().lines[1].lineId, 'milk-tea:100');
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
