import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const labels = {
  title: '\u7edf\u8ba1\u56fe\u8868',
  thisMonth: '\u672c\u6708',
  quarter: '\u5b63\u5ea6',
  year: '\u5168\u5e74',
  income: '\u603b\u6536\u5165',
  expense: '\u603b\u652f\u51fa',
  comingSoon: '\u7edf\u8ba1\u56fe\u8868\u6682\u672a\u5f00\u653e',
  description: '\u5f53\u524d\u5148\u4fdd\u7559\u6df1\u8272\u89c6\u89c9\u5360\u4f4d\uff0c\u540e\u7eed\u518d\u63a5\u5165\u8bb0\u8d26\u6570\u636e\u5206\u6790\u3002'
};

export default function InsightsTab() {
  return (
    <Screen>
      <Text variant="headlineSmall" style={styles.title}>
        {labels.title}
      </Text>

      <View style={styles.segment}>
        <Text variant="titleSmall" style={styles.activeSegment}>
          {labels.thisMonth}
        </Text>
        <Text variant="titleSmall" style={styles.segmentText}>
          {labels.quarter}
        </Text>
        <Text variant="titleSmall" style={styles.segmentText}>
          {labels.year}
        </Text>
      </View>

      <View style={styles.summaryGrid}>
        <Card mode="contained" style={styles.summaryCard}>
          <Card.Content>
            <MaterialCommunityIcons name="trending-up" color={colors.primary} size={20} />
            <Text variant="bodyMedium" style={styles.mutedText}>
              {labels.income}
            </Text>
            <Text variant="headlineSmall" style={styles.incomeValue}>
              \uFFE50.00
            </Text>
          </Card.Content>
        </Card>
        <Card mode="contained" style={styles.summaryCard}>
          <Card.Content>
            <MaterialCommunityIcons name="trending-down" color={colors.expense} size={20} />
            <Text variant="bodyMedium" style={styles.mutedText}>
              {labels.expense}
            </Text>
            <Text variant="headlineSmall" style={styles.expenseValue}>
              \uFFE50.00
            </Text>
          </Card.Content>
        </Card>
      </View>

      <Card mode="contained" style={styles.largeCard}>
        <Card.Content style={styles.placeholderContent}>
          <MaterialCommunityIcons name="chart-bar" color={colors.textSecondary} size={36} />
          <Text variant="titleMedium" style={styles.placeholderTitle}>
            {labels.comingSoon}
          </Text>
          <Text variant="bodyMedium" style={styles.placeholderText}>
            {labels.description}
          </Text>
        </Card.Content>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontWeight: '900',
    marginBottom: spacing.lg
  },
  segment: {
    backgroundColor: colors.card,
    borderRadius: radius.full,
    flexDirection: 'row',
    marginBottom: spacing.lg,
    padding: spacing.xs
  },
  activeSegment: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    color: colors.background,
    flex: 1,
    fontWeight: '900',
    paddingVertical: spacing.sm,
    textAlign: 'center'
  },
  segmentText: {
    color: colors.textSecondary,
    flex: 1,
    fontWeight: '800',
    paddingVertical: spacing.sm,
    textAlign: 'center'
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    flex: 1
  },
  mutedText: {
    color: colors.textSecondary,
    marginTop: spacing.sm
  },
  incomeValue: {
    color: colors.income,
    fontWeight: '900',
    marginTop: spacing.sm
  },
  expenseValue: {
    color: colors.expense,
    fontWeight: '900',
    marginTop: spacing.sm
  },
  largeCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    marginTop: spacing.lg
  },
  placeholderContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl
  },
  placeholderTitle: {
    color: colors.text,
    fontWeight: '800',
    marginTop: spacing.md
  },
  placeholderText: {
    color: colors.textSecondary,
    lineHeight: 22,
    marginTop: spacing.sm,
    textAlign: 'center'
  }
});
