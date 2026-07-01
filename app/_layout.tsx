import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppThemeProvider, useAppTheme } from '@/context/AppThemeContext';
import { ExpenseCategoriesProvider } from '@/context/ExpenseCategoriesContext';

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <ExpenseCategoriesProvider>
        <RootLayoutContent />
      </ExpenseCategoriesProvider>
    </AppThemeProvider>
  );
}

function RootLayoutContent() {
  const { colors, paperTheme, resolvedTheme } = useAppTheme();

  return (
    <SafeAreaProvider style={{ backgroundColor: colors.background, flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <StatusBar
          backgroundColor={colors.background}
          barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'}
        />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.background
            },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: '700'
            },
            contentStyle: {
              backgroundColor: colors.background
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
            name="categories"
            options={{
              title: '\u5206\u7c7b\u7ba1\u7406'
            }}
          />
          <Stack.Screen
            name="settings/appearance"
            options={{
              title: '\u504f\u597d\u8bbe\u7f6e'
            }}
          />
          <Stack.Screen
            name="settings/data"
            options={{
              title: '\u6570\u636e\u7ba1\u7406'
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
