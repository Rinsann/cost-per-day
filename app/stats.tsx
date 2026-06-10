import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function StatsScreen() {
  return (
    <Screen>
      <Card mode="contained" style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium">统计页占位</Text>
          <Text variant="bodyMedium" style={styles.muted}>
            后续模块会加入总资产金额、总使用天数、平均日均成本、分类占比和使用最久商品。
          </Text>
        </Card.Content>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg
  },
  muted: {
    color: colors.textSecondary,
    marginTop: spacing.xs
  }
});
