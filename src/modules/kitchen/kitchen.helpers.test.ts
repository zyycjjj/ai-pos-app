import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { formatKitchenSlaStatus, sortKitchenTicketsForDisplay } from './kitchen.helpers';

describe('kitchen helpers', () => {
  it('formats SLA and sorts urgent, overdue, warning, then oldest', () => {
    assert.equal(formatKitchenSlaStatus('WARNING'), 'Warning');

    const sorted = sortKitchenTicketsForDisplay([
      { id: 'warning', urgent: false, slaStatus: 'WARNING' as const, createdAt: '2026-07-29T10:00:00.000Z' },
      { id: 'urgent', urgent: true, slaStatus: 'NORMAL' as const, createdAt: '2026-07-29T10:10:00.000Z' },
      { id: 'overdue', urgent: false, slaStatus: 'OVERDUE' as const, createdAt: '2026-07-29T10:20:00.000Z' },
    ]);

    assert.deepEqual(sorted.map((ticket) => ticket.id), ['urgent', 'overdue', 'warning']);
  });
});
