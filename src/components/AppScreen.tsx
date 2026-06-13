import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { tokens } from '@/theme';

type AppScreenProps = PropsWithChildren<{
  padded?: boolean;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
}>;

export function AppScreen({ children, padded = true, edges = ['top', 'left', 'right'] }: AppScreenProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }} edges={edges}>
      <View style={[{ flex: 1 }, padded ? { paddingHorizontal: tokens.navigation.contentPadding, paddingVertical: tokens.spacing.xl } : null]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

