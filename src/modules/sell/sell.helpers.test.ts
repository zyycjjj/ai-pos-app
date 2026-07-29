import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getModifierTotal, getSelectedModifiers, isModifierSelectionComplete, createPromotionPreviewInputHash, resolvePromotionPreviewReasonKey } from './sell.helpers';

describe('promotion preview sell helpers', () => {
  it('maps customer-targeted preview reasons to cashier-facing copy keys', () => {
    assert.equal(resolvePromotionPreviewReasonKey('CUSTOMER_REQUIRED'), 'payment.preview.customerRequired');
    assert.equal(resolvePromotionPreviewReasonKey('PROMO_CODE_NOT_ELIGIBLE_FOR_CUSTOMER'), 'payment.validation.customerPromoNotEligible');
  });

  it('changes the preview hash when cart, customer, promo, or tip changes', () => {
    const base = createPromotionPreviewInputHash({
      lineIds: ['line-1:1:10'],
      promoCode: 'vip10',
      customerPhone: '+14155550100',
      tipAmount: 0,
    });
    const changed = createPromotionPreviewInputHash({
      lineIds: ['line-1:2:10'],
      promoCode: 'VIP10',
      customerPhone: '+14155550100',
      tipAmount: 1,
    });

    assert.notEqual(base, changed);
  });
});

describe('modifier sell helpers', () => {
  const groups = [
    {
      id: 'size',
      name: 'Size',
      required: true,
      multiSelect: false,
      minSelect: 1,
      maxSelect: 1,
      displayOrder: 1,
      options: [
        { id: 'small', name: 'Small', priceDelta: 0, status: 'ACTIVE' as const, displayOrder: 1 },
        { id: 'large', name: 'Large', priceDelta: 2, status: 'ACTIVE' as const, displayOrder: 2 },
      ],
    },
    {
      id: 'topping',
      name: 'Topping',
      required: false,
      multiSelect: true,
      minSelect: 0,
      maxSelect: 2,
      displayOrder: 2,
      options: [
        { id: 'egg', name: 'Egg', priceDelta: 1, status: 'ACTIVE' as const, displayOrder: 1 },
      ],
    },
  ];
  const product = { id: 'p1', name: 'Noodle', category: null, price: 10, currency: 'USD', isActive: true, availabilityStatus: 'AVAILABLE' as const, modifierGroups: groups };

  it('requires mandatory groups before adding modifier products', () => {
    assert.equal(isModifierSelectionComplete(groups, {}), false);
    assert.equal(isModifierSelectionComplete(groups, { size: ['large'] }), true);
  });

  it('keeps modifier snapshots and price deltas stable', () => {
    const selections = { size: ['large'], topping: ['egg'] };
    assert.equal(getModifierTotal(product, selections), 13);
    assert.deepEqual(getSelectedModifiers(groups, selections).map((modifier) => modifier.optionName), ['Large', 'Egg']);
  });
});
