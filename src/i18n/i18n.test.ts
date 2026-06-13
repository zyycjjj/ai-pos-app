import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatCurrencyForLocale } from './format';
import { translate } from './index';

describe('i18n helpers', () => {
  it('resolves an English key', () => {
    assert.equal(translate('en', 'sell.order.markPaid'), 'Mark Paid');
  });

  it('resolves a Simplified Chinese key', () => {
    assert.equal(translate('zh-CN', 'sell.order.markPaid'), '标记已付款');
  });

  it('falls back safely for missing keys', () => {
    assert.equal(translate('en', 'missing.example'), '[missing:missing.example]');
  });

  it('formats currency without changing the numeric value', () => {
    const formatted = formatCurrencyForLocale('zh-CN', 12.34, { currency: 'USD' });

    assert.equal(formatted.replace(/[^\d.]/g, ''), '12.34');
  });
});
