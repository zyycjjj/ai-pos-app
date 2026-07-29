import type { KitchenTicket } from '@/services/businessApi';

export function formatKitchenSlaStatus(status: KitchenTicket['slaStatus']) {
  if (status === 'OVERDUE') return 'Overdue';
  if (status === 'WARNING') return 'Warning';
  return 'Normal';
}

export function sortKitchenTicketsForDisplay<T extends { urgent: boolean; slaStatus: KitchenTicket['slaStatus']; createdAt: string }>(tickets: T[]) {
  const weights: Record<KitchenTicket['slaStatus'], number> = { NORMAL: 0, WARNING: 1, OVERDUE: 2 };
  return [...tickets].sort((a, b) => {
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1;
    const slaDiff = weights[b.slaStatus] - weights[a.slaStatus];
    if (slaDiff !== 0) return slaDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}
