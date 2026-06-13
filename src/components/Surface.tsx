import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { tokens, type AppShadowToken, type AppSpacingToken } from '@/theme';

type SurfaceVariant = 'default' | 'elevated' | 'muted';

type SurfaceProps = PropsWithChildren<{
  variant?: SurfaceVariant;
  padding?: AppSpacingToken | 'none';
  shadow?: AppShadowToken;
  style?: StyleProp<ViewStyle>;
}>;

const variantStyle: Record<SurfaceVariant, ViewStyle> = {
  default: {
    backgroundColor: tokens.colors.surface,
    borderColor: tokens.colors.line,
    borderWidth: 1,
  },
  elevated: {
    backgroundColor: tokens.colors.surfaceElevated,
    borderColor: tokens.colors.line,
    borderWidth: 1,
  },
  muted: {
    backgroundColor: tokens.colors.surfaceMuted,
    borderColor: tokens.colors.line,
    borderWidth: 1,
  },
};

export function Surface({ children, variant = 'default', padding = 'xl', shadow = 'none', style }: SurfaceProps) {
  return (
    <View
      style={[
        {
          borderRadius: tokens.radius.lg,
          padding: padding === 'none' ? 0 : tokens.spacing[padding],
        },
        variantStyle[variant],
        tokens.shadow[shadow],
        style,
      ]}
    >
      {children}
    </View>
  );
}

