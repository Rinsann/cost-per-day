import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
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
  account: '\u8d26\u6237\u8bbe\u7f6e',
  backup: '\u6570\u636e\u5907\u4efd',
  reminder: '\u8bb0\u8d26\u63d0\u9192',
  comingSoon: '\u6211\u7684\u9875\u9762\u6682\u672a\u5f00\u653e'
};

export default function MeTab() {
  return (
    <Screen>
      <Text variant="headlineSmall" style={styles.title}>
        {labels.title}
      </Text>

      <Card mode="contained" style={styles.profileCard}>
        <Card.Content style={styles.profileContent}>
          <View style={styles.avatar}>
            <Text variant="headlineMedium" style={styles.avatarText}>
              C
            </Text>
          </View>
          <View style={styles.profileMain}>
            <Text variant="titleLarge" style={styles.userName}>
              {labels.userName}
            </Text>
            <Text variant="bodyMedium" style={styles.statusText}>
              {labels.userStatus}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" color={colors.textSecondary} size={24} />
        </Card.Content>
      </Card>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text variant="headlineSmall" style={styles.statValue}>
            0
          </Text>
          <Text variant="bodySmall" style={styles.mutedText}>
            {labels.days}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text variant="headlineSmall" style={styles.statValue}>
            0
          </Text>
          <Text variant="bodySmall" style={styles.mutedText}>
            {labels.records}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text variant="headlineSmall" style={styles.statValue}>
            0
          </Text>
          <Text variant="bodySmall" style={styles.mutedText}>
            {labels.saved}
          </Text>
        </View>
      </View>

      <Card mode="contained" style={styles.menuCard}>
        <Card.Content>
          {[labels.account, labels.backup, labels.reminder].map((item) => (
            <View key={item} style={styles.menuItem}>
              <View style={styles.menuIcon}>
                <MaterialCommunityIcons name="cog-outline" color={colors.textSecondary} size={20} />
              </View>
              <Text variant="titleSmall" style={styles.menuText}>
                {item}
              </Text>
              <MaterialCommunityIcons name="chevron-right" color={colors.textSecondary} size={22} />
            </View>
          ))}
        </Card.Content>
      </Card>

      <Text variant="bodyMedium" style={styles.footerText}>
        {labels.comingSoon}
      </Text>
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
  footerText: {
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center'
  }
});
