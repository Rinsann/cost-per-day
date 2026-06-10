import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { appTheme } from '@/theme/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: appTheme.colors.background
            },
            headerShadowVisible: false,
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '700'
            },
            contentStyle: {
              backgroundColor: appTheme.colors.background
            }
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: 'Cost Per Day',
              headerBackVisible: false
            }}
          />
          <Stack.Screen
            name="add"
            options={{
              title: '\u65b0\u589e\u6d88\u8d39\u54c1',
              presentation: 'card'
            }}
          />
          <Stack.Screen
            name="product/[id]"
            options={{
              title: '\u6d88\u8d39\u54c1\u8be6\u60c5'
            }}
          />
          <Stack.Screen
            name="product/[id]/edit"
            options={{
              title: '\u7f16\u8f91\u6d88\u8d39\u54c1'
            }}
          />
          <Stack.Screen
            name="stats"
            options={{
              title: '\u6570\u636e\u7edf\u8ba1'
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              title: '\u8bbe\u7f6e'
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
