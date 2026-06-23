import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/i18n/useI18n';
import { tokens } from '@/theme';

import { navigationItems } from './navigationItems';

export function TerminalRail({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useI18n();

  return (
    <View style={styles.rail}>
      <View style={styles.itemStack}>
        {navigationItems.map(({ name, labelKey, Icon }) => {
          const routeIndex = state.routes.findIndex((route) => route.name === name);
          if (routeIndex === -1) {
            return null;
          }

          const route = state.routes[routeIndex];
          const isFocused = state.index === routeIndex;
          const options = descriptors[route.key]?.options;
          const label = t(labelKey);
          const color = isFocused ? tokens.colors.inverse : tokens.colors.muted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              testID={options?.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              android_ripple={{ color: tokens.colors.accentMuted, borderless: false }}
              style={[styles.item, isFocused && styles.itemActive]}
            >
              <View style={[styles.iconBox, isFocused && styles.iconBoxActive]}>
                <Icon color={color} size={22} strokeWidth={2.2} />
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.82} style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: tokens.navigation.railCollapsedWidth,
    flexShrink: 0,
    backgroundColor: tokens.colors.ink,
    borderRightWidth: 1,
    borderRightColor: tokens.colors.lineStrong,
    paddingHorizontal: tokens.spacing.sm,
    paddingTop: tokens.spacing.lg,
    paddingBottom: tokens.spacing.lg,
  },
  itemStack: {
    gap: tokens.spacing.sm,
  },
  item: {
    minHeight: tokens.navigation.railItemHeight,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemActive: {
    backgroundColor: tokens.colors.accent,
    borderColor: tokens.colors.accentMuted,
  },
  iconBox: {
    width: 32,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    borderRadius: tokens.radius.sm,
  },
  label: {
    marginTop: 2,
    color: tokens.colors.subtle,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
    maxWidth: tokens.navigation.railCollapsedWidth - tokens.spacing.lg,
  },
  labelActive: {
    color: tokens.colors.inverse,
  },
});
