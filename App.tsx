import 'react-native-gesture-handler';
import './global.css';

import { NavigationContainer } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Provider as ZenStackHooksProvider } from './src/_/hook';
import { AppNavigator } from './src/navigation/AppNavigator';
import { apiClient } from './src/services/apiClient';
import { queryClient } from './src/services/queryClient';

export default function App() {
  return (
    <GestureHandlerRootView className="flex-1 bg-pos-background">
      <QueryClientProvider client={queryClient}>
        <ZenStackHooksProvider value={{ endpoint: `${apiClient.defaults.baseURL}/api/rpc` }}>
          <SafeAreaProvider>
            <NavigationContainer>
              <StatusBar style="dark" />
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </ZenStackHooksProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
