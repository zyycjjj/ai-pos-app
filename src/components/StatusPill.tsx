import { Text, View } from 'react-native';

import { tokens } from '@/theme';

type StatusPillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

type StatusPillProps = {
  label?: string;
  value: string;
  tone?: StatusPillTone;
};

const toneStyles = {
  neutral: {
    backgroundColor: tokens.colors.surfaceMuted,
    borderColor: tokens.colors.line,
    textColor: tokens.colors.ink,
  },
  success: {
    backgroundColor: '#E3F4EC',
    borderColor: '#A8DCC4',
    textColor: tokens.colors.success,
  },
  warning: {
    backgroundColor: '#FBF0D7',
    borderColor: '#E8C77B',
    textColor: tokens.colors.warning,
  },
  danger: {
    backgroundColor: '#F8E2DD',
    borderColor: '#E6ACA1',
    textColor: tokens.colors.danger,
  },
  info: {
    backgroundColor: '#E1EDF7',
    borderColor: '#AAC9E3',
    textColor: tokens.colors.info,
  },
} as const;

export function StatusPill({ label, value, tone = 'neutral' }: StatusPillProps) {
  const style = toneStyles[tone];

  return (
    <View
      style={{
        minHeight: tokens.spacing.touchTargetMin,
        borderRadius: tokens.radius.pill,
        borderWidth: 1,
        borderColor: style.borderColor,
        backgroundColor: style.backgroundColor,
        paddingHorizontal: tokens.spacing.lg,
        justifyContent: 'center',
      }}
    >
      {label ? <Text style={[tokens.typography.caption, { color: tokens.colors.muted }]}>{label}</Text> : null}
      <Text style={[tokens.typography.label, { color: style.textColor }]}>{value}</Text>
    </View>
  );
}

