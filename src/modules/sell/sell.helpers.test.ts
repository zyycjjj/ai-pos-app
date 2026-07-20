import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createPromotionPreviewInputHash, resolvePromotionPreviewReasonKey } from './sell.helpers';

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
