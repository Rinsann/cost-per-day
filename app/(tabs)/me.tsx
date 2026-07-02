import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { ThemeMode, useAppTheme } from '@/context/AppThemeContext';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import { getProducts } from '@/storage/productStorage';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { isMockLedgerRecord } from '@/utils/dataBackup';

const labels = {
  title: '我的',
  appName: '算得值',
  tagline: '记录收支，算清值不值。',
  localStatus: '本地存储中',
  localOnly: '数据仅保存在本机。卸载 App 或清空数据前，请先导出备份。',
  overview: '本地数据',
  ledgerRecords: '记账记录',
  productRecords: '消费品',
  mockRecords: 'mock 账单',
  earliestDate: '最早账单',
  latestDate: '最新账单',
  noDate: '暂无',
  preferences: '偏好设置',
  appearance: '外观模式',
  appearanceDescription: '跟随系统、浅色或深色',
  ledgerSettings: '记账设置',
  categoryManagement: '分类管理',
  categoryManagementDescription: '管理记账分类和图标',
  monthlyBudget: '月度预算',
  monthlyBudgetDescription: '设置本月总预算参考',
  dataManagement: '数据管理',
  dataManagementDescription: '导入、导出、备份和清空本地数据',
  system: '跟随系统',
  light: '浅色',
  dark: '深色',
  loadFailed: '读取本地数据失败',
  importReadFailed: '无法读取本地数据，请稍后再试。'
};

const themeModeLabels: Record<ThemeMode, string> = {
  system: labels.system,
  light: labels.light,
  dark: labels.dark
};

function getDateRangeText(records: { date: string }[]) {
  const dates = records
    .map((record) => record.date)
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort((a, b) => a.localeCompare(b));

  return {
    earliest: dates[0] ?? labels.noDate,
    latest: dates[dates.length - 1] ?? labels.noDate
  };
}

export default function MeTab() {
  const { colors: themeColors, themeMode } = useAppTheme();
  const { records, refreshRecords } = useExpenseRecords();
  const [productCount, setProductCount] = useState(0);
  const mockRecordCount = useMemo(
    () => records.filter(isMockLedgerRecord).length,
    [records]
  );
  const dateRange = useMemo(() => getDateRangeText(records), [records]);

  const loadLocalData = useCallback(async () => {
    try {
      const storedProducts = await getProducts();
      await refreshRecords();
      setProductCount(storedProducts.length);
    } catch {
      Alert.alert(labels.loadFailed, labels.importReadFailed);
    }
  }, [refreshRecords]);

  useFocusEffect(
    useCallback(() => {
      loadLocalData();
    }, [loadLocalData])
  );

  return (
    <AppScreen bottomPadding={24}>
      <Text variant="headlineSmall" style={[styles.title, { color: themeColors.text }]}>
        {labels.title}
      </Text>

      <AppCard elevated style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <View style={[styles.avatar, { backgroundColor: themeColors.primary }]}>
            <Text variant="headlineSmall" style={[styles.avatarText, { color: themeColors.background }]}>
              算
            </Text>
          </View>
          <View style={styles.heroText}>
            <Text variant="titleLarge" style={[styles.appName, { color: themeColors.text }]}>
              {labels.appName}
            </Text>
            <Text style={[styles.tagline, { color: themeColors.textSecondary }]}>
              {labels.tagline}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: themeColors.cardAlt }]}>
            <Text style={[styles.statusText, { color: themeColors.primary }]}>
              {labels.localStatus}
            </Text>
          </View>
        </Card.Content>
      </AppCard>

      <SectionCard title={labels.overview}>
        <View style={styles.overviewGrid}>
          <InfoTile label={labels.ledgerRecords} value={String(records.length)} />
          <InfoTile label={labels.productRecords} value={String(productCount)} />
          {__DEV__ ? (
            <InfoTile label={labels.mockRecords} value={String(mockRecordCount)} />
          ) : null}
          <InfoTile label={labels.earliestDate} value={dateRange.earliest} />
          <InfoTile label={labels.latestDate} value={dateRange.latest} />
        </View>
        <Text style={[styles.localNote, { color: themeColors.textSecondary }]}>
          {labels.localOnly}
        </Text>
      </SectionCard>

      <SectionCard title={labels.preferences}>
        <ActionRow
          description={labels.appearanceDescription}
          icon="theme-light-dark"
          onPress={() => router.push('/settings/appearance')}
          title={labels.appearance}
          value={themeModeLabels[themeMode]}
        />
      </SectionCard>

      <SectionCard title={labels.ledgerSettings}>
        <ActionRow
          description={labels.monthlyBudgetDescription}
          icon="wallet-outline"
          onPress={() => router.push('/settings/budget')}
          title={labels.monthlyBudget}
        />
        <ActionRow
          description={labels.categoryManagementDescription}
          icon="shape-outline"
          onPress={() => router.push('/categories')}
          title={labels.categoryManagement}
        />
      </SectionCard>

      <SectionCard title={labels.dataManagement}>
        <ActionRow
          description={labels.dataManagementDescription}
          icon="database-cog-outline"
          onPress={() => router.push('/settings/data')}
          title={labels.dataManagement}
        />
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

function InfoTile({ label, value }: { label: string; value: string }) {
  const { colors: themeColors } = useAppTheme();

  return (
    <View style={[styles.infoTile, { backgroundColor: themeColors.cardAlt }]}>
      <Text style={[styles.infoValue, { color: themeColors.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.infoLabel, { color: themeColors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ActionRow({
  description,
  icon,
  onPress,
  title,
  value
}: {
  description?: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  title: string;
  value?: string;
}) {
  const { colors: themeColors } = useAppTheme();

  return (
    <Pressable
      android_ripple={{ color: themeColors.ripple }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        { backgroundColor: pressed ? themeColors.surfacePressed : 'transparent' }
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: themeColors.cardAlt }]}>
        <MaterialCommunityIcons name={icon} color={themeColors.primary} size={20} />
      </View>
      <View style={styles.actionMain}>
        <Text style={[styles.actionTitle, { color: themeColors.text }]}>
          {title}
        </Text>
        {description ? (
          <Text style={[styles.actionDescription, { color: themeColors.textSecondary }]}>
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text style={[styles.actionValue, { color: themeColors.textSecondary }]} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <MaterialCommunityIcons name="chevron-right" color={themeColors.textSecondary} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: {
    fontWeight: '900',
    marginBottom: spacing.lg
  },
  heroCard: {
    marginBottom: spacing.md
  },
  heroContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radius.lg,
    height: 64,
    justifyContent: 'center',
    width: 64
  },
  avatarText: {
    fontWeight: '900'
  },
  heroText: {
    flex: 1
  },
  appName: {
    fontWeight: '900'
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs
  },
  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900'
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
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  infoTile: {
    borderRadius: radius.md,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 72,
    padding: spacing.md
  },
  infoValue: {
    fontSize: 18,
    fontWeight: '900'
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xs
  },
  localNote: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs
  },
  actionRow: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 64,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  actionIcon: {
    alignItems: 'center',
    borderRadius: radius.full,
    height: 40,
    justifyContent: 'center',
    width: 40
  },
  actionMain: {
    flex: 1
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '900'
  },
  actionDescription: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    marginTop: 2
  },
  actionValue: {
    fontSize: 11,
    fontWeight: '800',
    maxWidth: 92,
    textAlign: 'right'
  }
});
