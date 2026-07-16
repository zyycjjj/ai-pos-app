import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { LoginScreen } from '@/modules/auth/LoginScreen';
import { AiCreateScreen } from '@/modules/ai/AiCreateScreen';
import { CustomerDisplayScreen } from '@/modules/customerDisplay/CustomerDisplayScreen';
import { OrdersScreen } from '@/modules/orders/OrdersScreen';
import { ProductsScreen } from '@/modules/products/ProductsScreen';
import { SellScreen } from '@/modules/sell/SellScreen';
import { SettingsScreen } from '@/modules/settings/SettingsScreen';
import { ShiftScreen } from '@/modules/shifts/ShiftScreen';
import { TablesScreen } from '@/modules/tables/TablesScreen';
import { useAuthStore } from '@/stores/authStore';

import { TerminalRail } from './TerminalRail';

export type RootTabParamList = {
  Sell: undefined;
  AI: undefined;
  Products: undefined;
  Tables: undefined;
  Orders: undefined;
  Display: undefined;
  Shift: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  const accessToken = useAuthStore((state) => state.accessToken);

  if (!accessToken) {
    return <LoginScreen />;
  }

  return (
    <Tab.Navigator
      tabBar={(props) => <TerminalRail {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: 'left',
      }}
    >
      <Tab.Screen name="Sell" component={SellScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Tables" component={TablesScreen} />
      <Tab.Screen name="Display" component={CustomerDisplayScreen} />
      <Tab.Screen name="Shift" component={ShiftScreen} />
      <Tab.Screen name="AI" component={AiCreateScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
