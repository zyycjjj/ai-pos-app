import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { LoginScreen } from '@/modules/auth/LoginScreen';
import { AiCreateScreen } from '@/modules/ai/AiCreateScreen';
import { CustomerDisplayScreen } from '@/modules/customerDisplay/CustomerDisplayScreen';
import { OrdersScreen } from '@/modules/orders/OrdersScreen';
import { ProductsScreen } from '@/modules/products/ProductsScreen';
import { KitchenScreen } from '@/modules/kitchen/KitchenScreen';
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
  Kitchen: undefined;
  Orders: undefined;
  Display: undefined;
  Shift: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function AppNavigator() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const role = useAuthStore((state) => state.role);

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
      {canAccess(role, 'Sell') ? <Tab.Screen name="Sell" component={SellScreen} /> : null}
      {canAccess(role, 'Orders') ? <Tab.Screen name="Orders" component={OrdersScreen} /> : null}
      {canAccess(role, 'Products') ? <Tab.Screen name="Products" component={ProductsScreen} /> : null}
      {canAccess(role, 'Tables') ? <Tab.Screen name="Tables" component={TablesScreen} /> : null}
      {canAccess(role, 'Kitchen') ? <Tab.Screen name="Kitchen" component={KitchenScreen} /> : null}
      {canAccess(role, 'Display') ? <Tab.Screen name="Display" component={CustomerDisplayScreen} /> : null}
      {canAccess(role, 'Shift') ? <Tab.Screen name="Shift" component={ShiftScreen} /> : null}
      {canAccess(role, 'AI') ? <Tab.Screen name="AI" component={AiCreateScreen} /> : null}
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function canAccess(role: ReturnType<typeof useAuthStore.getState>['role'], screen: keyof RootTabParamList) {
  if (role === 'KITCHEN') return screen === 'Kitchen' || screen === 'Settings';
  if (role === 'WAITER') return screen === 'Tables' || screen === 'Settings';
  if (role === 'CASHIER') return ['Sell', 'Tables', 'Orders', 'Shift', 'Settings'].includes(screen);
  return true;
}
