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
              title: 'Cost Per Day'
            }}
          />
          <Stack.Screen
            name="add"
            options={{
              title: '添加消费品',
              presentation: 'card'
            }}
          />
          <Stack.Screen
            name="product/[id]"
            options={{
              title: '消费品详情'
            }}
          />
          <Stack.Screen
            name="stats"
            options={{
              title: '数据统计'
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
