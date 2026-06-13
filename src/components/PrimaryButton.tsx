import type { PropsWithChildren } from 'react';

import { AppButton } from './AppButton';

type PrimaryButtonProps = PropsWithChildren<{
  disabled?: boolean;
  onPress?: () => void;
}>;

export function PrimaryButton({ children, disabled, onPress }: PrimaryButtonProps) {
  return (
    <AppButton disabled={disabled} onPress={onPress}>
      {children}
    </AppButton>
  );
}
