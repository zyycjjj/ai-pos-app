import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChefHat, Play, Printer, XCircle } from 'lucide-react-native';

import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { StatusPill } from '@/components/StatusPill';
import { Surface } from '@/components/Surface';
import {
  type KitchenTicket,
  type KitchenTicketStatus,
  useCancelKitchenTicket,
  useKitchenStations,
  useKitchenTickets,
  useReadyKitchenTicket,
  useReprintKitchenTicket,
  useStartKitchenTicket,
} from '@/services/businessApi';
import { tokens } from '@/theme';

const ALL_STATIONS = '__all__';

export function KitchenScreen() {
  const [stationId, setStationId] = useState(ALL_STATIONS);
  const [status, setStatus] = useState<KitchenTicketStatus | ''>('');
  const [message, setMessage] = useState<string | null>(null);
  const stationsQuery = useKitchenStations();
  const ticketsQuery = useKitchenTickets({
    stationId: stationId === ALL_STATIONS ? undefined : stationId,
    status,
    take: 80,
  });
  const startTicket = useStartKitchenTicket();
  const readyTicket = useReadyKitchenTicket();
  const cancelTicket = useCancelKitchenTicket();
  const reprintTicket = useReprintKitchenTicket();

  const stations = stationsQuery.data ?? [];
  const tickets = ticketsQuery.data ?? [];
  const busy = startTicket.isPending || readyTicket.isPending || cancelTicket.isPending || reprintTicket.isPending;
  const statusFilters = useMemo<Array<{ label: string; value: KitchenTicketStatus | '' }>>(
    () => [
      { label: 'Active', value: '' },
      { label: 'New', value: 'NEW' },
      { label: 'In progress', value: 'PREPARING' },
      { label: 'Ready', value: 'READY' },
      { label: 'Cancelled', value: 'CANCELLED' },
    ],
    [],
  );

  const run = async (action: () => Promise<unknown>, success: string) => {
    setMessage(null);
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kitchen action failed.');
    }
  };

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Kitchen Mode</Text>
          <Text style={styles.title}>Tickets</Text>
        </View>
        <StatusPill value={`${tickets.length} open`} tone={tickets.length > 0 ? 'warning' : 'success'} />
      </View>

      <Surface padding="lg" style={styles.toolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <FilterChip label="All stations" selected={stationId === ALL_STATIONS} onPress={() => setStationId(ALL_STATIONS)} />
          {stations.map((station) => (
            <FilterChip key={station.id} label={station.name} selected={stationId === station.id} onPress={() => setStationId(station.id)} />
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {statusFilters.map((filter) => (
            <FilterChip key={filter.label} label={filter.label} selected={status === filter.value} onPress={() => setStatus(filter.value)} />
          ))}
        </ScrollView>
      </Surface>

      {message ? (
        <Surface variant="muted" padding="md" style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </Surface>
      ) : null}

      <ScrollView contentContainerStyle={styles.ticketGrid}>
        {ticketsQuery.isLoading ? <Text style={styles.muted}>Loading tickets...</Text> : null}
        {!ticketsQuery.isLoading && tickets.length === 0 ? <EmptyState title="No kitchen tickets" description="Current station is clear." /> : null}
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            busy={busy}
            onStart={() => run(() => startTicket.mutateAsync(ticket.id), 'Ticket started.')}
            onReady={() => run(() => readyTicket.mutateAsync(ticket.id), 'Ticket marked ready.')}
            onCancel={() => run(() => cancelTicket.mutateAsync({ id: ticket.id, reason: 'Cancelled from Kitchen Mode' }), 'Ticket cancelled.')}
            onReprint={() => run(() => reprintTicket.mutateAsync(ticket.id), 'Reprint job created.')}
          />
        ))}
      </ScrollView>
    </AppScreen>
  );
}

function TicketCard({
  ticket,
  busy,
  onStart,
  onReady,
  onCancel,
  onReprint,
}: {
  ticket: KitchenTicket;
  busy: boolean;
  onStart: () => void;
  onReady: () => void;
  onCancel: () => void;
  onReprint: () => void;
}) {
  const canStart = ticket.status === 'NEW';
  const canReady = ticket.status === 'NEW' || ticket.status === 'PREPARING' || ticket.status === 'IN_PROGRESS';
  const canCancel = ticket.status === 'NEW' || ticket.status === 'PREPARING' || ticket.status === 'IN_PROGRESS';

  return (
    <Surface padding="lg" style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <View style={styles.ticketTitleRow}>
          <ChefHat color={tokens.colors.accent} size={22} />
          <View>
            <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
            <Text style={styles.muted}>{ticket.station.name} · #{ticket.order.pickupNumber ?? ticket.order.orderNumber}</Text>
          </View>
        </View>
        <StatusPill value={ticket.status === 'PREPARING' ? 'IN_PROGRESS' : ticket.status} tone={ticket.status === 'READY' ? 'success' : ticket.status === 'CANCELLED' ? 'danger' : 'warning'} />
      </View>

      <View style={styles.items}>
        {ticket.items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={styles.itemQty}>{item.quantity}x</Text>
            <View style={styles.itemMain}>
              <Text style={styles.itemName}>{item.productName}</Text>
              {item.modifiers.length > 0 ? <Text style={styles.muted}>{item.modifiers.map((modifier) => modifier.optionName).join(', ')}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <AppButton variant="secondary" disabled={busy || !canStart} icon={<Play color={tokens.colors.ink} size={18} />} onPress={onStart}>
          Start
        </AppButton>
        <AppButton disabled={busy || !canReady} onPress={onReady}>
          Ready
        </AppButton>
        <AppButton variant="secondary" disabled={busy} icon={<Printer color={tokens.colors.ink} size={18} />} onPress={onReprint}>
          Reprint
        </AppButton>
        <AppButton variant="secondary" disabled={busy || !canCancel} icon={<XCircle color={tokens.colors.danger} size={18} />} onPress={onCancel}>
          Cancel
        </AppButton>
      </View>
    </Surface>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filterChip, selected && styles.filterChipSelected]}>
      <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing.xl,
  },
  eyebrow: {
    ...tokens.typography.label,
    color: tokens.colors.accent,
    textTransform: 'uppercase',
  },
  title: {
    ...tokens.typography.screenTitle,
    color: tokens.colors.ink,
  },
  toolbar: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.lg,
  },
  chipRow: {
    gap: tokens.spacing.sm,
  },
  filterChip: {
    borderColor: tokens.colors.lineStrong,
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
  },
  filterChipSelected: {
    backgroundColor: tokens.colors.ink,
    borderColor: tokens.colors.ink,
  },
  filterChipText: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  filterChipTextSelected: {
    color: tokens.colors.inverse,
  },
  messageBox: {
    marginBottom: tokens.spacing.lg,
  },
  messageText: {
    ...tokens.typography.body,
    color: tokens.colors.ink,
  },
  ticketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.lg,
    paddingBottom: tokens.spacing['3xl'],
  },
  ticketCard: {
    gap: tokens.spacing.md,
    minWidth: 320,
    width: '31%',
  },
  ticketHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: tokens.spacing.md,
    justifyContent: 'space-between',
  },
  ticketTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  ticketNumber: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  muted: {
    ...tokens.typography.body,
    color: tokens.colors.muted,
  },
  items: {
    borderTopColor: tokens.colors.line,
    borderTopWidth: 1,
    gap: tokens.spacing.sm,
    paddingTop: tokens.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  itemQty: {
    ...tokens.typography.label,
    color: tokens.colors.accent,
    minWidth: 34,
  },
  itemMain: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
});
