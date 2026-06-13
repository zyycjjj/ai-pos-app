import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Monitor, ReceiptText, Settings, ShoppingBag, Sparkles, Store } from 'lucide-react-native';

import { AiCreateScreen } from '@/modules/ai/AiCreateScreen';
import { CustomerDisplayScreen } from '@/modules/customerDisplay/CustomerDisplayScreen';
import { OrdersScreen } from '@/modules/orders/OrdersScreen';
import { ProductsScreen } from '@/modules/products/ProductsScreen';
import { SellScreen } from '@/modules/sell/SellScreen';
import { SettingsScreen } from '@/modules/settings/SettingsScreen';
import { useI18n } from '@/i18n/useI18n';
import { colors } from '@/theme/colors';

export type RootTabParamList = {
  Sell: undefined;
  AI: undefined;
  Products: undefined;
  Orders: undefined;
  Display: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'left',
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderRightColor: colors.line,
          borderTopColor: 'transparent',
          width: 112,
          paddingBottom: 12,
          paddingTop: 12,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen name="Sell" component={SellScreen} options={{ tabBarIcon: icon(Store), tabBarLabel: t('nav.sell') }} />
      <Tab.Screen name="AI" component={AiCreateScreen} options={{ tabBarIcon: icon(Sparkles), tabBarLabel: t('nav.ai') }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ tabBarIcon: icon(ShoppingBag), tabBarLabel: t('nav.products') }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: icon(ReceiptText), tabBarLabel: t('nav.orders') }} />
      <Tab.Screen name="Display" component={CustomerDisplayScreen} options={{ tabBarIcon: icon(Monitor), tabBarLabel: t('nav.display') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: icon(Settings), tabBarLabel: t('nav.settings') }} />
    </Tab.Navigator>
  );
}

function icon(Icon: typeof Store) {
  return ({ color, size }: { color: string; size: number }) => <Icon color={color} size={size} strokeWidth={2.1} />;
}
