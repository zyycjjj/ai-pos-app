import type { PropsWithChildren } from 'react';

import { AppScreen } from './AppScreen';

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
}>;

export function Screen({ children, padded = true }: ScreenProps) {
  return <AppScreen padded={padded}>{children}</AppScreen>;
}
