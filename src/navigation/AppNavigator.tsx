import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Sparkles, ReceiptText, Settings, ShoppingBag, Store } from 'lucide-react-native';

import { AiCreateScreen } from '@/modules/ai/AiCreateScreen';
import { OrdersScreen } from '@/modules/orders/OrdersScreen';
import { ProductsScreen } from '@/modules/products/ProductsScreen';
import { ReceiptsScreen } from '@/modules/receipts/ReceiptsScreen';
import { SellScreen } from '@/modules/sell/SellScreen';
import { SettingsScreen } from '@/modules/settings/SettingsScreen';
import { colors } from '@/theme/colors';

export type RootTabParamList = {
  Sell: undefined;
  AI: undefined;
  Products: undefined;
  Orders: undefined;
  Receipts: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen name="Sell" component={SellScreen} options={{ tabBarIcon: icon(Store) }} />
      <Tab.Screen name="AI" component={AiCreateScreen} options={{ tabBarIcon: icon(Sparkles) }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ tabBarIcon: icon(ShoppingBag) }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: icon(ReceiptText) }} />
      <Tab.Screen name="Receipts" component={ReceiptsScreen} options={{ tabBarIcon: icon(ReceiptText) }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: icon(Settings) }} />
    </Tab.Navigator>
  );
}

function icon(Icon: typeof Store) {
  return ({ color, size }: { color: string; size: number }) => <Icon color={color} size={size} strokeWidth={2.1} />;
}
