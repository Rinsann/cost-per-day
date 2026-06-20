import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { ThemeMode, useAppTheme } from '@/context/AppThemeContext';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const labels = {
  title: '\u6211\u7684',
  userName: 'Cost Per Day',
  userStatus: '\u672c\u5730\u4f7f\u7528\u4e2d',
  days: '\u8bb0\u5f55\u5929\u6570',
  records: '\u8bb0\u8d26\u8bb0\u5f55',
  saved: '\u7d2f\u8ba1\u7701\u94b1',
  appearance: '外观模式',
  system: '跟随系统',
  light: '浅色',
  dark: '深色',
  account: '\u8d26\u6237\u8bbe\u7f6e',
  backup: '\u6570\u636e\u5907\u4efd',
  reminder: '\u8bb0\u8d26\u63d0\u9192',
  comingSoon: '\u6211\u7684\u9875\u9762\u6682\u672a\u5f00\u653e'
};

const themeModeLabels: Record<ThemeMode, string> = {
  system: labels.system,
  light: labels.light,
  dark: labels.dark
};

export default function MeTab() {
  const { colors: themeColors, setThemeMode, themeMode } = useAppTheme();
  const [themeSheetVisible, setThemeSheetVisible] = useState(false);

  async function selectThemeMode(nextMode: ThemeMode) {
    await setThemeMode(nextMode);
    setThemeSheetVisible(false);
  }

  return (
    <Screen>
      <Text variant="headlineSmall" style={[styles.title, { color: themeColors.text }]}>
        {labels.title}
      </Text>

      <Card mode="contained" style={[styles.profileCard, { backgroundColor: themeColors.card }]}>
        <Card.Content style={styles.profileContent}>
          <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
            <Text variant="headlineMedium" style={[styles.avatarText, { color: themeColors.background }]}>
              C
            </Text>
          </View>
          <View style={styles.profileMain}>
            <Text variant="titleLarge" style={[styles.userName, { color: themeColors.text }]}>
              {labels.userName}
            </Text>
            <Text variant="bodyMedium" style={[styles.statusText, { color: themeColors.primary }]}>
              {labels.userStatus}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" color={themeColors.textSecondary} size={24} />
        </Card.Content>
      </Card>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
          <Text variant="headlineSmall" style={[styles.statValue, { color: themeColors.text }]}>
            0
          </Text>
          <Text variant="bodySmall" style={[styles.mutedText, { color: themeColors.textSecondary }]}>
            {labels.days}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
          <Text variant="headlineSmall" style={[styles.statValue, { color: themeColors.text }]}>
            0
          </Text>
          <Text variant="bodySmall" style={[styles.mutedText, { color: themeColors.textSecondary }]}>
            {labels.records}
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: themeColors.card }]}>
          <Text variant="headlineSmall" style={[styles.statValue, { color: themeColors.text }]}>
            0
          </Text>
          <Text variant="bodySmall" style={[styles.mutedText, { color: themeColors.textSecondary }]}>
            {labels.saved}
          </Text>
        </View>
      </View>

      <Card mode="contained" style={[styles.menuCard, { backgroundColor: themeColors.card }]}>
        <Card.Content>
          <Pressable
            onPress={() => setThemeSheetVisible(true)}
            style={[styles.menuItem, { borderBottomColor: themeColors.outline }]}
          >
            <View style={[styles.menuIcon, { backgroundColor: themeColors.cardAlt }]}>
              <MaterialCommunityIcons name="theme-light-dark" color={themeColors.textSecondary} size={20} />
            </View>
            <Text variant="titleSmall" style={[styles.menuText, { color: themeColors.text }]}>
              {labels.appearance}
            </Text>
            <Text style={[styles.menuValue, { color: themeColors.textSecondary }]}>
              {themeModeLabels[themeMode]}
            </Text>
            <MaterialCommunityIcons name="chevron-right" color={themeColors.textSecondary} size={22} />
          </Pressable>
          {[labels.account, labels.backup, labels.reminder].map((item) => (
            <View key={item} style={[styles.menuItem, { borderBottomColor: themeColors.outline }]}>
              <View style={[styles.menuIcon, { backgroundColor: themeColors.cardAlt }]}>
                <MaterialCommunityIcons name="cog-outline" color={themeColors.textSecondary} size={20} />
              </View>
              <Text variant="titleSmall" style={[styles.menuText, { color: themeColors.text }]}>
                {item}
              </Text>
              <MaterialCommunityIcons name="chevron-right" color={themeColors.textSecondary} size={22} />
            </View>
          ))}
        </Card.Content>
      </Card>

      <Text variant="bodyMedium" style={[styles.footerText, { color: themeColors.textSecondary }]}>
        {labels.comingSoon}
      </Text>

      <Modal
        animationType="slide"
        onRequestClose={() => setThemeSheetVisible(false)}
        transparent
        visible={themeSheetVisible}
      >
        <View style={[styles.modalOverlay, { backgroundColor: themeColors.overlay }]}>
          <View style={[styles.sheet, { backgroundColor: themeColors.surfaceElevated }]}>
            <View style={[styles.sheetHandle, { backgroundColor: themeColors.textSecondary }]} />
            <Text variant="titleMedium" style={[styles.sheetTitle, { color: themeColors.text }]}>
              {labels.appearance}
            </Text>
            {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => {
              const isSelected = themeMode === mode;

              return (
                <Pressable
                  key={mode}
                  onPress={() => selectThemeMode(mode)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isSelected ? themeColors.primary : themeColors.card
                    }
                  ]}
                >
                  <Text
                    variant="titleSmall"
                    style={[
                      styles.themeOptionText,
                      { color: isSelected ? themeColors.background : themeColors.text }
                    ]}
                  >
                    {themeModeLabels[mode]}
                  </Text>
                  {isSelected ? (
                    <MaterialCommunityIcons name="check" color={themeColors.background} size={20} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.lg
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 24
  },
  profileContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 76,
    justifyContent: 'center',
    width: 76
  },
  avatarText: {
    color: colors.background,
    fontWeight: '900'
  },
  profileMain: {
    flex: 1
  },
  userName: {
    color: colors.text,
    fontWeight: '900'
  },
  statusText: {
    color: colors.primary,
    marginTop: spacing.xs
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 20,
    flex: 1,
    padding: spacing.md
  },
  statValue: {
    color: colors.text,
    fontWeight: '900'
  },
  mutedText: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    marginTop: spacing.lg
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: colors.outline,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md
  },
  menuIcon: {
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36
  },
  menuText: {
    color: colors.text,
    flex: 1,
    fontWeight: '800'
  },
  menuValue: {
    fontSize: 12,
    fontWeight: '800'
  },
  footerText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center'
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: spacing.sm,
    padding: spacing.lg
  },
  sheetHandle: {
    alignSelf: 'center',
    borderRadius: radius.full,
    height: 4,
    marginBottom: spacing.sm,
    opacity: 0.45,
    width: 56
  },
  sheetTitle: {
    fontWeight: '900',
    marginBottom: spacing.sm
  },
  themeOption: {
    alignItems: 'center',
    borderRadius: radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  themeOptionText: {
    fontWeight: '900'
  }
});
