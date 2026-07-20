import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tokens } from '@/theme';

export function CategoryChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable android_ripple={{ color: tokens.colors.accentMuted }} onPress={onPress} style={[styles.categoryChip, selected ? styles.categoryChipSelected : null]}>
      <Text style={[styles.categoryText, selected ? styles.categoryTextSelected : null]}>{label}</Text>
    </Pressable>
  );
}

export function PaymentMethodChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable android_ripple={{ color: tokens.colors.accentMuted }} onPress={onPress} style={[styles.paymentMethodChip, selected && styles.paymentMethodChipSelected]}>
      <Text style={[styles.paymentMethodText, selected && styles.paymentMethodTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function IconButton({ children, label, onPress }: { children: ReactNode; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityLabel={label} accessibilityRole="button" android_ripple={{ color: tokens.colors.surfaceMuted }} onPress={onPress} style={styles.iconButton}>
      {children}
    </Pressable>
  );
}

export function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.totalRow}>
      <Text style={styles.totalRowLabel}>{label}</Text>
      <Text style={styles.totalRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  categoryChip: {
    minHeight: tokens.spacing.touchTargetMin,
    minWidth: tokens.spacing.touchTargetMin,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
  },
  categoryChipSelected: {
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.surfaceElevated,
  },
  categoryText: {
    ...tokens.typography.caption,
    color: tokens.colors.ink,
  },
  categoryTextSelected: {
    color: tokens.colors.accent,
  },
  paymentMethodChip: {
    flex: 1,
    minHeight: tokens.spacing.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
    paddingHorizontal: tokens.spacing.md,
  },
  paymentMethodChipSelected: {
    borderColor: tokens.colors.accent,
    backgroundColor: tokens.colors.accentMuted,
  },
  paymentMethodText: {
    ...tokens.typography.label,
    color: tokens.colors.ink,
  },
  paymentMethodTextSelected: {
    color: tokens.colors.accent,
  },
  iconButton: {
    width: tokens.spacing.touchTargetMin,
    height: tokens.spacing.touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.line,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalRowLabel: {
    ...tokens.typography.body,
    color: tokens.colors.muted,
  },
  totalRowValue: {
    ...tokens.typography.body,
    color: tokens.colors.ink,
    fontWeight: '700',
  },
});
