import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickExpenseSheet } from '@/components/expense/QuickExpenseSheet';
import { useAppTheme } from '@/context/AppThemeContext';
import { ExpenseRecordsProvider } from '@/context/ExpenseRecordsContext';
import { spacing } from '@/theme/spacing';

type TabIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type TabMeta = {
  label: string;
  icon: TabIconName;
};

type TabRoute = {
  key: string;
  name: string;
  params?: object;
};

type TabNavigation = {
  emit: (options: {
    type: 'tabPress';
    target: string;
    canPreventDefault: true;
  }) => { defaultPrevented: boolean };
  navigate: (name: string, params?: object) => void;
};

const tabMeta: Record<string, TabMeta> = {
  ledger: {
    label: '\u8bb0\u8d26',
    icon: 'home-variant-outline'
  },
  insights: {
    label: '\u7edf\u8ba1',
    icon: 'chart-bar'
  },
  index: {
    label: '\u6210\u672c',
    icon: 'chart-donut'
  },
  me: {
    label: '\u6211\u7684',
    icon: 'account-outline'
  }
};

type AppTabBarProps = {
  state: {
    index: number;
    routes: TabRoute[];
  };
  navigation: TabNavigation;
  onQuickPress: () => void;
};

function AppTabBar({ state, navigation, onQuickPress }: AppTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();

  function renderTabButton(route: (typeof state.routes)[number], index: number) {
    const meta = tabMeta[route.name];
    const isFocused = state.index === index;
    const color = isFocused ? colors.primary : colors.textSecondary;

    function handlePress() {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    }

    return (
      <Pressable key={route.key} onPress={handlePress} style={styles.tabButton}>
        <MaterialCommunityIcons name={meta.icon} color={color} size={24} />
        <Text style={[styles.tabLabel, { color }]}>{meta.label}</Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.tabBarWrap,
        {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.outline,
          paddingBottom: Math.max(insets.bottom, 8)
        }
      ]}
    >
      <View style={styles.tabBar}>
        {state.routes.slice(0, 2).map(renderTabButton)}
        <Pressable
          onPress={onQuickPress}
          style={[
            styles.quickButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary
            }
          ]}
        >
          <MaterialCommunityIcons name="plus" color={colors.background} size={30} />
        </Pressable>
        {state.routes.slice(2).map((route, index) => renderTabButton(route, index + 2))}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const [quickSheetVisible, setQuickSheetVisible] = useState(false);

  return (
    <ExpenseRecordsProvider>
      <Tabs
        initialRouteName="ledger"
        tabBar={(props) => (
          <AppTabBar {...props} onQuickPress={() => setQuickSheetVisible(true)} />
        )}
        screenOptions={{
          headerShown: false
        }}
      >
        <Tabs.Screen name="ledger" options={{ title: '\u8bb0\u8d26' }} />
        <Tabs.Screen name="insights" options={{ title: '\u7edf\u8ba1' }} />
        <Tabs.Screen name="index" options={{ title: '\u6210\u672c' }} />
        <Tabs.Screen name="me" options={{ title: '\u6211\u7684' }} />
      </Tabs>
      <QuickExpenseSheet
        visible={quickSheetVisible}
        onClose={() => setQuickSheetVisible(false)}
      />
    </ExpenseRecordsProvider>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    borderTopWidth: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  tabBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    minHeight: 52,
    minWidth: 54
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '800'
  },
  quickButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 56,
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    width: 56
  }
});
