import { Text, View } from 'react-native';

import { tokens } from '@/theme';

type MetricCardTone = 'default' | 'accent' | 'success' | 'warning';

type MetricCardProps = {
  label: string;
  value: string;
  caption?: string;
  tone?: MetricCardTone;
};

const toneAccent: Record<MetricCardTone, string> = {
  default: tokens.colors.lineStrong,
  accent: tokens.colors.accent,
  success: tokens.colors.success,
  warning: tokens.colors.warning,
};

export function MetricCard({ label, value, caption, tone = 'default' }: MetricCardProps) {
  return (
    <View
      style={[
        {
          minWidth: 176,
          borderRadius: tokens.radius.lg,
          borderWidth: 1,
          borderColor: tokens.colors.line,
          backgroundColor: tokens.colors.surface,
          padding: tokens.spacing.xl,
        },
        tokens.shadow.soft,
      ]}
    >
      <View style={{ height: 3, width: 44, borderRadius: tokens.radius.pill, backgroundColor: toneAccent[tone], marginBottom: tokens.spacing.md }} />
      <Text style={[tokens.typography.caption, { color: tokens.colors.muted }]}>{label}</Text>
      <Text style={[tokens.typography.numeric, { color: tokens.colors.ink, marginTop: tokens.spacing.xs }]}>{value}</Text>
      {caption ? <Text style={[tokens.typography.caption, { color: tokens.colors.subtle, marginTop: tokens.spacing.xs }]}>{caption}</Text> : null}
    </View>
  );
}

