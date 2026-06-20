import { Stack } from 'expo-router';
import { StatusBar, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { appTheme } from '@/theme/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider style={styles.provider}>
      <PaperProvider theme={appTheme}>
        <StatusBar backgroundColor={appTheme.colors.background} barStyle="light-content" />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: appTheme.colors.background
            },
            headerTintColor: appTheme.colors.onSurface,
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
            name="(tabs)"
            options={{
              headerShown: false
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
            name="ledger/[id]"
            options={{
              title: '\u8bb0\u8d26\u8be6\u60c5'
            }}
          />
          <Stack.Screen
            name="ledger/[id]/edit"
            options={{
              title: '\u7f16\u8f91\u8bb0\u8d26'
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
          <Stack.Screen
            name="settings/import-json"
            options={{
              title: '\u7c98\u8d34 JSON \u5bfc\u5165'
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: {
    backgroundColor: appTheme.colors.background,
    flex: 1
  }
});
