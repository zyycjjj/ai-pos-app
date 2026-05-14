import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function Screen({ children, padded = true }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-pos-background" edges={['top', 'left', 'right']}>
      <View className={padded ? 'flex-1 px-8 py-6' : 'flex-1'}>{children}</View>
    </SafeAreaView>
  );
}
