import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { ThemeMode, useAppTheme } from '@/context/AppThemeContext';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const labels = {
  title: '偏好设置',
  appearance: '外观模式',
  system: '跟随系统',
  systemDescription: '随手机系统自动切换',
  light: '浅色',
  lightDescription: '始终使用浅色界面',
  dark: '深色',
  darkDescription: '始终使用深色界面'
};

const themeOptions: {
  description: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: ThemeMode;
}[] = [
  {
    description: labels.systemDescription,
    icon: 'theme-light-dark',
    label: labels.system,
    value: 'system'
  },
  {
    description: labels.lightDescription,
    icon: 'white-balance-sunny',
    label: labels.light,
    value: 'light'
  },
  {
    description: labels.darkDescription,
    icon: 'weather-night',
    label: labels.dark,
    value: 'dark'
  }
];

export default function AppearanceSettingsScreen() {
  const { colors: themeColors, setThemeMode, themeMode } = useAppTheme();

  return (
    <AppScreen bottomPadding={32}>
      <Stack.Screen options={{ title: labels.title }} />
      <Text variant="headlineSmall" style={[styles.title, { color: themeColors.text }]}>
        {labels.title}
      </Text>

      <SectionCard title={labels.appearance}>
        {themeOptions.map((option) => {
          const active = themeMode === option.value;

          return (
            <Pressable
              key={option.value}
              android_ripple={{ color: themeColors.ripple }}
              onPress={() => setThemeMode(option.value)}
              style={({ pressed }) => [
                styles.optionRow,
                {
                  backgroundColor: active
                    ? themeColors.primary
                    : pressed
                      ? themeColors.surfacePressed
                      : themeColors.cardAlt
                }
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: active ? themeColors.background : themeColors.card }
                ]}
              >
                <MaterialCommunityIcons
                  name={option.icon}
                  color={active ? themeColors.primary : themeColors.textSecondary}
                  size={20}
                />
              </View>
              <View style={styles.optionMain}>
                <Text
                  variant="titleSmall"
                  style={[styles.optionTitle, { color: active ? themeColors.background : themeColors.text }]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: active ? themeColors.background : themeColors.textSecondary }
                  ]}
                >
                  {option.description}
                </Text>
              </View>
              {active ? (
                <MaterialCommunityIcons name="check" color={themeColors.background} size={22} />
              ) : null}
            </Pressable>
          );
        })}
      </SectionCard>
    </AppScreen>
  );
}

function SectionCard({ children, title }: { children: ReactNode; title: string }) {
  const { colors: themeColors } = useAppTheme();

  return (
    <AppCard style={styles.sectionCard}>
      <Card.Content style={styles.sectionContent}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text }]}>
          {title}
        </Text>
        {children}
      </Card.Content>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '900',
    marginBottom: spacing.lg
  },
  sectionCard: {
    marginBottom: spacing.md
  },
  sectionContent: {
    gap: spacing.sm
  },
  sectionTitle: {
    fontWeight: '900',
    marginBottom: spacing.xs
  },
  optionRow: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 68,
    overflow: 'hidden',
    padding: spacing.sm
  },
  optionIcon: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  optionMain: {
    flex: 1
  },
  optionTitle: {
    fontWeight: '900'
  },
  optionDescription: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 2
  }
});
