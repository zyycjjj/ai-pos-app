import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  background: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFCF7',
  surfaceMuted: '#EEE9DF',
  ink: '#171A1F',
  muted: '#69706B',
  subtle: '#8B918B',
  line: '#E1DCD2',
  lineStrong: '#C8C1B4',
  accent: '#0B6E5F',
  accentMuted: '#DDEDE8',
  success: '#168A5B',
  warning: '#B7791F',
  danger: '#C24130',
  info: '#2F6EA3',
  inverse: '#FFFFFF',
  warm: '#F2B84B',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
  touchTargetMin: 48,
  buttonHeight: 52,
  primaryActionHeight: 60,
} as const;

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const typography = {
  display: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
  },
  screenTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '500',
  },
  numeric: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
  },
  numericLarge: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '800',
  },
} as const satisfies Record<string, TextStyle>;

export const shadow = {
  none: {},
  soft: {
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 4,
  },
  modal: {
    shadowColor: '#171A1F',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 8,
  },
} as const satisfies Record<string, ViewStyle>;

export const navigation = {
  railWidth: 344,
  railCollapsedWidth: 92,
  railItemHeight: 56,
  contentPadding: 32,
  workspaceGap: 20,
  orderRailWidth: 380,
  pageMaxWidth: 1366,
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  typography,
  shadow,
  navigation,
} as const;

export type AppColorToken = keyof typeof colors;
export type AppSpacingToken = keyof typeof spacing;
export type AppRadiusToken = keyof typeof radius;
export type AppShadowToken = keyof typeof shadow;

