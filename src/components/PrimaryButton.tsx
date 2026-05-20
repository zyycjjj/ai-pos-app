import type { PropsWithChildren } from 'react';
import { Pressable, Text } from 'react-native';

type PrimaryButtonProps = PropsWithChildren<{
  disabled?: boolean;
  onPress?: () => void;
}>;

export function PrimaryButton({ children, disabled, onPress }: PrimaryButtonProps) {
  return (
    <Pressable
      className={`h-12 items-center justify-center rounded-pos px-5 active:opacity-80 ${
        disabled ? 'bg-pos-muted opacity-60' : 'bg-pos-accent'
      }`}
      disabled={disabled}
      onPress={onPress}
    >
      <Text className="text-base font-semibold text-white">{children}</Text>
    </Pressable>
  );
}
