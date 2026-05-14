import type { PropsWithChildren } from 'react';
import { Pressable, Text } from 'react-native';

type PrimaryButtonProps = PropsWithChildren<{
  onPress?: () => void;
}>;

export function PrimaryButton({ children, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      className="h-12 items-center justify-center rounded-pos bg-pos-accent px-5 active:opacity-80"
      onPress={onPress}
    >
      <Text className="text-base font-semibold text-white">{children}</Text>
    </Pressable>
  );
}
