import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';

import { tokens } from '@/theme';

type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type AppButtonProps = {
  children: ReactNode;
  variant?: AppButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  onPress?: PressableProps['onPress'];
  style?: StyleProp<ViewStyle>;
};

const variantStyles = {
  primary: {
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accent,
    textColor: tokens.colors.inverse,
  },
  secondary: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.lineStrong,
    textColor: tokens.colors.ink,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: tokens.colors.muted,
  },
  danger: {
    backgroundColor: tokens.colors.danger,
    borderColor: tokens.colors.danger,
    textColor: tokens.colors.inverse,
  },
} as const;

export function AppButton({ children, variant = 'primary', disabled, loading, icon, onPress, style }: AppButtonProps) {
  const tone = variantStyles[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      android_ripple={{ color: variant === 'primary' || variant === 'danger' ? 'rgba(255,255,255,0.18)' : tokens.colors.surfaceMuted }}
      disabled={inactive}
      onPress={onPress}
      style={[
        {
          minHeight: tokens.spacing.buttonHeight,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: tokens.spacing.sm,
          borderRadius: tokens.radius.md,
          borderWidth: 1,
          paddingHorizontal: tokens.spacing.xl,
          backgroundColor: tone.backgroundColor,
          borderColor: tone.borderColor,
          opacity: inactive ? 0.58 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={tone.textColor} /> : null}
      {!loading && icon ? <View>{icon}</View> : null}
      <Text style={[tokens.typography.body, { color: tone.textColor, fontWeight: '700' }]}>{children}</Text>
    </Pressable>
  );
}
