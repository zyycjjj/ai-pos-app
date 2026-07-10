import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Banknote, DoorOpen, LogOut, Minus, Plus, Printer } from 'lucide-react-native';

import { AppButton } from '@/components/AppButton';
import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { MetricCard } from '@/components/MetricCard';
import { StatusPill } from '@/components/StatusPill';
import { Surface } from '@/components/Surface';
import { useCurrency } from '@/hooks/useCurrency';
import { useI18n } from '@/i18n/useI18n';
import { type Shift, useActiveShift, useCashIn, useCashOut, useCloseShift, useOpenShift, usePrintShiftSummary, useShifts } from '@/services/businessApi';
import { tokens } from '@/theme';

type CashAction = 'cashIn' | 'cashOut';

export function ShiftScreen() {
  const { t } = useI18n();
  const money = useCurrency();
  const activeShiftQuery = useActiveShift();
  const shiftsQuery = useShifts();
  const openShift = useOpenShift();
  const cashIn = useCashIn();
  const cashOut = useCashOut();
  const closeShift = useCloseShift();
  const printShiftSummary = usePrintShiftSummary();

  const [openingCashText, setOpeningCashText] = useState('200');
  const [openNotes, setOpenNotes] = useState('');
  const [cashAction, setCashAction] = useState<CashAction>('cashIn');
  const [movementAmountText, setMovementAmountText] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [actualCashText, setActualCashText] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [errorVisible, setErrorVisible] = useState(false);

  const activeShift = activeShiftQuery.data ?? null;
  const recentShifts = shiftsQuery.data ?? [];
  const actualCash = Number(actualCashText) || 0;
  const variance = activeShift ? roundMoney(actualCash - activeShift.expectedCash) : 0;
  const movementReady = Boolean(activeShift) && Number(movementAmountText) > 0 && movementReason.trim().length > 0;

  const submitOpenShift = async () => {
    const openingCash = Number(openingCashText);
    if (!Number.isFinite(openingCash) || openingCash < 0) {
      setErrorVisible(true);
      return;
    }
    setErrorVisible(false);
    await openShift.mutateAsync({ openingCash, notes: openNotes.trim() || undefined });
  };

  const submitMovement = async () => {
    if (!activeShift || !movementReady) {
      setErrorVisible(true);
      return;
    }
    setErrorVisible(false);
    const payload = { shiftId: activeShift.id, amount: Number(movementAmountText), reason: movementReason.trim() };
    if (cashAction === 'cashIn') {
      await cashIn.mutateAsync(payload);
    } else {
      await cashOut.mutateAsync(payload);
    }
    setMovementAmountText('');
    setMovementReason('');
  };

  const submitCloseShift = async () => {
    if (!activeShift || !Number.isFinite(actualCash)) {
      setErrorVisible(true);
      return;
    }
    setErrorVisible(false);
    await closeShift.mutateAsync({ shiftId: activeShift.id, actualCash, notes: closeNotes.trim() || undefined });
    setActualCashText('');
    setCloseNotes('');
  };

  const varianceLabel = useMemo(() => {
    if (Math.abs(variance) < 0.01) {
      return t('shifts.variance.balanced');
    }
    return variance > 0 ? t('shifts.variance.over') : t('shifts.variance.short');
  }, [t, variance]);

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>{t('shifts.eyebrow')}</Text>
            <Text style={styles.title}>{t('shifts.title')}</Text>
          </View>
          {activeShift ? <StatusPill value={t('shifts.status.open')} tone="success" /> : <StatusPill value={t('shifts.status.none')} tone="neutral" />}
        </View>

        {activeShift ? (
          <>
            <View style={styles.metrics}>
              <MetricCard label={t('shifts.metrics.opening')} value={money(activeShift.openingCash)} />
              <MetricCard label={t('shifts.metrics.expected')} value={money(activeShift.expectedCash)} tone="accent" />
              <MetricCard label={t('shifts.metrics.cashSales')} value={money(activeShift.cashSales)} tone="success" />
              <MetricCard label={t('shifts.metrics.cashRefunds')} value={money(activeShift.cashRefunds)} tone="warning" />
            </View>

            <View style={styles.printRow}>
              <AppButton
                variant="secondary"
                icon={<Printer size={16} color={tokens.colors.ink} />}
                loading={printShiftSummary.isPending}
                onPress={() => printShiftSummary.mutate(activeShift.id)}
              >
                {t('shifts.print.summary')}
              </AppButton>
            </View>

            <View style={styles.grid}>
              <Surface padding="xl" style={styles.panel}>
                <Text style={styles.sectionTitle}>{t('shifts.cashMovement.title')}</Text>
                <View style={styles.segment}>
                  <AppButton variant={cashAction === 'cashIn' ? 'primary' : 'secondary'} icon={<Plus size={16} color={cashAction === 'cashIn' ? tokens.colors.inverse : tokens.colors.ink} />} onPress={() => setCashAction('cashIn')}>
                    {t('shifts.cashMovement.cashIn')}
                  </AppButton>
                  <AppButton variant={cashAction === 'cashOut' ? 'primary' : 'secondary'} icon={<Minus size={16} color={cashAction === 'cashOut' ? tokens.colors.inverse : tokens.colors.ink} />} onPress={() => setCashAction('cashOut')}>
                    {t('shifts.cashMovement.cashOut')}
                  </AppButton>
                </View>
                <TextInput style={styles.input} keyboardType="decimal-pad" placeholder={t('shifts.fields.amount')} value={movementAmountText} onChangeText={setMovementAmountText} />
                <TextInput style={styles.input} placeholder={t('shifts.fields.reason')} value={movementReason} onChangeText={setMovementReason} />
                <AppButton loading={cashIn.isPending || cashOut.isPending} disabled={!movementReady} onPress={submitMovement}>
                  {t('shifts.cashMovement.submit')}
                </AppButton>
              </Surface>

              <Surface padding="xl" style={styles.panel}>
                <Text style={styles.sectionTitle}>{t('shifts.close.title')}</Text>
                <View style={styles.closeRow}>
                  <Text style={styles.muted}>{t('shifts.metrics.expected')}</Text>
                  <Text style={styles.amount}>{money(activeShift.expectedCash)}</Text>
                </View>
                <TextInput style={styles.input} keyboardType="decimal-pad" placeholder={t('shifts.fields.actualCash')} value={actualCashText} onChangeText={setActualCashText} />
                {actualCashText ? (
                  <View style={styles.closeRow}>
                    <Text style={styles.muted}>{varianceLabel}</Text>
                    <Text style={[styles.amount, { color: variance < 0 ? tokens.colors.danger : tokens.colors.ink }]}>{money(variance)}</Text>
                  </View>
                ) : null}
                <TextInput style={styles.input} placeholder={t('shifts.fields.notes')} value={closeNotes} onChangeText={setCloseNotes} />
                <AppButton variant="danger" icon={<LogOut size={16} color={tokens.colors.inverse} />} loading={closeShift.isPending} onPress={submitCloseShift}>
                  {t('shifts.close.submit')}
                </AppButton>
              </Surface>
            </View>

            <MovementList shift={activeShift} money={money} t={t} />
          </>
        ) : (
          <Surface padding="xl">
            <View style={styles.openPanel}>
              <DoorOpen color={tokens.colors.accent} size={28} />
              <Text style={styles.sectionTitle}>{t('shifts.open.title')}</Text>
              <Text style={styles.muted}>{t('shifts.open.description')}</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" placeholder={t('shifts.fields.openingCash')} value={openingCashText} onChangeText={setOpeningCashText} />
              <TextInput style={styles.input} placeholder={t('shifts.fields.notes')} value={openNotes} onChangeText={setOpenNotes} />
              <AppButton icon={<Banknote size={16} color={tokens.colors.inverse} />} loading={openShift.isPending} onPress={submitOpenShift}>
                {t('shifts.open.submit')}
              </AppButton>
            </View>
          </Surface>
        )}

        {errorVisible ? <Text style={styles.error}>{t('shifts.validation.checkFields')}</Text> : null}

        <Surface padding="xl">
          <Text style={styles.sectionTitle}>{t('shifts.history.title')}</Text>
          {recentShifts.length === 0 ? (
            <EmptyState title={t('shifts.history.empty')} />
          ) : (
            <View style={{ gap: tokens.spacing.sm }}>
              {recentShifts.slice(0, 6).map((shift) => (
                <View key={shift.id} style={styles.historyRow}>
                  <View>
                    <Text style={styles.rowTitle}>{shift.staffName}</Text>
                    <Text style={styles.muted}>{new Date(shift.openedAt).toLocaleString()}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <StatusPill value={shift.status} tone={shift.status === 'OPEN' ? 'success' : 'neutral'} />
                    <Text style={styles.muted}>{money(shift.expectedCash)}</Text>
                    <AppButton
                      variant="secondary"
                      icon={<Printer size={16} color={tokens.colors.ink} />}
                      loading={printShiftSummary.isPending}
                      onPress={() => printShiftSummary.mutate(shift.id)}
                    >
                      {t('shifts.print.short')}
                    </AppButton>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Surface>
      </ScrollView>
    </AppScreen>
  );
}

function MovementList({ shift, money, t }: { shift: Shift; money: (value: number) => string; t: (key: string) => string }) {
  return (
    <Surface padding="xl">
      <Text style={styles.sectionTitle}>{t('shifts.movements.title')}</Text>
      <View style={{ gap: tokens.spacing.sm }}>
        {shift.movements.slice().reverse().slice(0, 8).map((movement) => (
          <View key={movement.id} style={styles.historyRow}>
            <View>
              <Text style={styles.rowTitle}>{movement.type}</Text>
              <Text style={styles.muted}>{movement.reason}</Text>
            </View>
            <Text style={styles.amount}>{money(movement.type === 'REFUND' || movement.type === 'CASH_OUT' ? -movement.amount : movement.amount)}</Text>
          </View>
        ))}
      </View>
    </Surface>
  );
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

const styles = StyleSheet.create({
  root: {
    gap: tokens.spacing.xl,
    paddingBottom: tokens.spacing['3xl'],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  eyebrow: {
    ...tokens.typography.caption,
    color: tokens.colors.muted,
  },
  title: {
    ...tokens.typography.screenTitle,
    color: tokens.colors.ink,
    marginTop: tokens.spacing.xs,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  printRow: {
    alignItems: 'flex-start',
  },
  grid: {
    flexDirection: 'row',
    gap: tokens.spacing.xl,
    flexWrap: 'wrap',
  },
  panel: {
    flex: 1,
    minWidth: 320,
    gap: tokens.spacing.md,
  },
  sectionTitle: {
    ...tokens.typography.sectionTitle,
    color: tokens.colors.ink,
  },
  muted: {
    ...tokens.typography.body,
    color: tokens.colors.muted,
  },
  input: {
    minHeight: tokens.spacing.touchTargetMin,
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.lg,
    color: tokens.colors.ink,
    backgroundColor: tokens.colors.background,
  },
  segment: {
    flexDirection: 'row',
    gap: tokens.spacing.sm,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  openPanel: {
    maxWidth: 520,
    gap: tokens.spacing.md,
  },
  historyRow: {
    minHeight: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.line,
    paddingVertical: tokens.spacing.sm,
  },
  rowTitle: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  error: {
    ...tokens.typography.body,
    color: tokens.colors.danger,
  },
});
