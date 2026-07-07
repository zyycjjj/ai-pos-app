import { Clock, Monitor, ReceiptText, Settings, ShoppingBag, Sparkles, Store } from 'lucide-react-native';

import type { RootTabParamList } from './AppNavigator';

export type NavigationItem = {
  name: keyof RootTabParamList;
  labelKey: 'nav.sell' | 'nav.orders' | 'nav.products' | 'nav.display' | 'nav.shift' | 'nav.ai' | 'nav.settings';
  Icon: typeof Store;
};

export const navigationItems: NavigationItem[] = [
  { name: 'Sell', labelKey: 'nav.sell', Icon: Store },
  { name: 'Orders', labelKey: 'nav.orders', Icon: ReceiptText },
  { name: 'Products', labelKey: 'nav.products', Icon: ShoppingBag },
  { name: 'Display', labelKey: 'nav.display', Icon: Monitor },
  { name: 'Shift', labelKey: 'nav.shift', Icon: Clock },
  { name: 'AI', labelKey: 'nav.ai', Icon: Sparkles },
  { name: 'Settings', labelKey: 'nav.settings', Icon: Settings },
];
