import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { EncodingType, File, Paths } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { Stack, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import type { ComponentProps, ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { AppScreen } from '@/components/layout/AppScreen';
import { AppCard } from '@/components/ui/AppCard';
import { useAppTheme } from '@/context/AppThemeContext';
import { useExpenseRecords } from '@/context/ExpenseRecordsContext';
import { clearLedgerMockData, seedLedgerMockData } from '@/dev/seedLedgerMockData';
import { ledgerRepository } from '@/repositories/ledgerRepository';
import { getProducts, saveProducts } from '@/storage/productStorage';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import {
  createDataBackup,
  DataBackup,
  DataBackupType,
  getBackupFileName,
  isMockLedgerRecord,
  mergeById,
  parseDataBackup,
  serializeDataBackup
} from '@/utils/dataBackup';

type PickedBackupAsset = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

type BusyAction =
  | 'clear-all'
  | 'clear-ledger'
  | 'clear-mock'
  | 'clear-products'
  | 'export-full'
  | 'export-ledger'
  | 'export-products'
  | 'import-full'
  | 'import-ledger'
  | 'import-products'
  | 'seed-mock'
  | null;

type ParseFailureReason = Extract<ReturnType<typeof parseDataBackup>, { ok: false }>['reason'];

const labels = {
  title: '数据管理',
  appName: '算得值',
  ledgerData: '记账数据',
  productData: '成本消费品数据',
  fullBackup: '完整备份',
  exportLedger: '导出记账数据',
  importLedger: '导入记账数据',
  clearLedger: '清空记账数据',
  exportProducts: '导出成本数据',
  importProducts: '导入成本数据',
  clearProducts: '清空成本数据',
  exportFull: '导出完整备份',
  importFull: '导入完整备份',
  clearAll: '清空全部数据',
  exportDescription: '导出为 JSON 备份文件',
  importDescription: '从 JSON 文件导入，重复 id 会跳过',
  clearLedgerDescription: '仅清空本机记账记录',
  clearProductsDescription: '仅清空本机消费品记录',
  clearAllDescription: '清空记账和成本消费品数据',
  devTools: '开发测试数据',
  devDescription: '仅开发环境可见，用于测试统计页和筛选效果。',
  seedMock: '注入 mock 账单',
  clearMock: '清除 mock 账单',
  cancel: '取消',
  confirm: '确定',
  clear: '清空',
  exportFailed: '导出失败',
  exportFailedDescription: '无法生成备份文件，请稍后再试。',
  importFailed: '导入失败',
  importReadFailed: '无法读取所选文件，请换一个 JSON 文件再试。',
  importInvalidJson: '文件不是有效的 JSON。',
  importInvalidFormat: '文件格式不符合算得值备份规范。',
  importUnsupportedType: '备份类型不支持当前导入入口。',
  importSuccess: '导入完成',
  exportSuccessTitle: '备份已准备好',
  exportSuccessDescription: '请选择系统分享面板中的保存或发送方式。',
  clearSuccess: '已清空',
  mockSeedSuccess: '已注入',
  mockClearSuccess: '已清除',
  seedMockConfirm:
    '将注入测试账单数据，不会删除真实记录，只会替换旧 mock 数据。',
  clearMockConfirm: '将清除 mock 测试账单，不会删除真实记录。',
  clearLedgerConfirm:
    '将清空全部记账记录，此操作不可撤销。建议先导出记账数据备份。',
  clearProductsConfirm:
    '将清空全部成本消费品记录，此操作不可撤销。建议先导出成本数据备份。',
  clearAllConfirm:
    '将清空记账记录和成本消费品记录，此操作不可撤销。建议先导出完整备份。',
  clearAllSecondConfirm: '再次确认：确定要清空全部本地数据吗？',
  importConfirmTitle: '确认导入',
  localWins: '同 id 数据会跳过，保留本机已有数据。',
  schemaDescription: 'schemaVersion 1 / JSON',
  importedLedger: '新增记账',
  importedProducts: '新增消费品',
  skipped: '跳过重复',
  noSharing: '当前设备不支持分享文件。',
  mockCount: '当前 mock 账单'
};

function getParseErrorMessage(reason: ParseFailureReason) {
  if (reason === 'invalid-json') {
    return labels.importInvalidJson;
  }

  if (reason === 'unsupported-type') {
    return labels.importUnsupportedType;
  }

  return labels.importInvalidFormat;
}

function isBackupTypeCompatible(targetType: DataBackupType, backupType: DataBackupType) {
  if (targetType === 'full') {
    return backupType === 'full';
  }

  return backupType === targetType || backupType === 'full';
}

export default function DataSettingsScreen() {
  const { colors: themeColors } = useAppTheme();
  const { records, refreshRecords } = useExpenseRecords();
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const actionDisabled = busyAction !== null;
  const mockRecordCount = useMemo(
    () => records.filter(isMockLedgerRecord).length,
    [records]
  );

  useFocusEffect(
    useCallback(() => {
      refreshRecords();
    }, [refreshRecords])
  );

  async function runBusyAction(action: Exclude<BusyAction, null>, task: () => Promise<void>) {
    try {
      setBusyAction(action);
      await task();
    } finally {
      setBusyAction(null);
    }
  }

  async function shareJsonFile(type: DataBackupType, backup: DataBackup) {
    const sharingAvailable = await Sharing.isAvailableAsync();

    if (!sharingAvailable) {
      throw new Error(labels.noSharing);
    }

    const backupFile = new File(Paths.document, getBackupFileName(type));
    backupFile.create({ overwrite: true });
    backupFile.write(serializeDataBackup(backup));

    await Sharing.shareAsync(backupFile.uri, {
      mimeType: 'application/json',
      dialogTitle: `${labels.appName} ${labels.fullBackup}`
    });
  }

  async function handleExportData(type: DataBackupType) {
    const action = `export-${type}` as Exclude<BusyAction, null>;

    await runBusyAction(action, async () => {
      try {
        const [storedRecords, storedProducts] = await Promise.all([
          ledgerRepository.getAllRecords(),
          getProducts()
        ]);
        const backup = createDataBackup({
          type,
          expenseRecords: storedRecords,
          products: storedProducts
        });

        await shareJsonFile(type, backup);
        Alert.alert(labels.exportSuccessTitle, labels.exportSuccessDescription);
      } catch {
        Alert.alert(labels.exportFailed, labels.exportFailedDescription);
      }
    });
  }

  async function readPickedBackupFile(asset: PickedBackupAsset) {
    try {
      const backupFile = new File(asset.uri);
      return await backupFile.text();
    } catch {
      return await readAsStringAsync(asset.uri, {
        encoding: EncodingType.UTF8
      });
    }
  }

  async function pickBackupJson() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];

    if (!asset) {
      return null;
    }

    return readPickedBackupFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
      size: asset.size
    });
  }

  async function applyImport(targetType: DataBackupType, backup: DataBackup) {
    let ledgerAdded = 0;
    let ledgerSkipped = 0;
    let productsAdded = 0;
    let productsSkipped = 0;

    if (targetType === 'ledger' || targetType === 'full') {
      const localRecords = await ledgerRepository.getAllRecords();
      const ledgerMerge = mergeById(localRecords, backup.data.expenseRecords);
      await ledgerRepository.saveAllRecords(ledgerMerge.merged);
      ledgerAdded = ledgerMerge.addedCount;
      ledgerSkipped = ledgerMerge.skippedCount;
    }

    if (targetType === 'products' || targetType === 'full') {
      const localProducts = await getProducts();
      const productMerge = mergeById(localProducts, backup.data.products);
      await saveProducts(productMerge.merged);
      productsAdded = productMerge.addedCount;
      productsSkipped = productMerge.skippedCount;
    }

    await refreshRecords();

    Alert.alert(
      labels.importSuccess,
      [
        `${labels.importedLedger}：${ledgerAdded}`,
        `${labels.importedProducts}：${productsAdded}`,
        `${labels.skipped}：${ledgerSkipped + productsSkipped}`
      ].join('\n')
    );
  }

  async function handleImportData(targetType: DataBackupType) {
    const action = `import-${targetType}` as Exclude<BusyAction, null>;

    await runBusyAction(action, async () => {
      let rawJson: string | null = null;

      try {
        rawJson = await pickBackupJson();
      } catch {
        Alert.alert(labels.importFailed, labels.importReadFailed);
        return;
      }

      if (!rawJson) {
        return;
      }

      const parsed = parseDataBackup(rawJson);

      if (!parsed.ok) {
        Alert.alert(labels.importFailed, getParseErrorMessage(parsed.reason));
        return;
      }

      if (!isBackupTypeCompatible(targetType, parsed.backup.type)) {
        Alert.alert(labels.importFailed, labels.importUnsupportedType);
        return;
      }

      const ledgerCount =
        targetType === 'products' ? 0 : parsed.backup.data.expenseRecords.length;
      const productCount =
        targetType === 'ledger' ? 0 : parsed.backup.data.products.length;

      Alert.alert(
        labels.importConfirmTitle,
        [
          `${labels.importedLedger}：${ledgerCount}`,
          `${labels.importedProducts}：${productCount}`,
          labels.localWins
        ].join('\n'),
        [
          { style: 'cancel', text: labels.cancel },
          {
            text: labels.confirm,
            onPress: () => {
              runBusyAction(action, () => applyImport(targetType, parsed.backup)).catch(() => {
                Alert.alert(labels.importFailed, labels.importInvalidFormat);
              });
            }
          }
        ]
      );
    });
  }

  function confirmClearLedger() {
    Alert.alert(labels.clearLedger, labels.clearLedgerConfirm, [
      { style: 'cancel', text: labels.cancel },
      {
        style: 'destructive',
        text: labels.clear,
        onPress: () => {
          runBusyAction('clear-ledger', async () => {
            await ledgerRepository.saveAllRecords([]);
            await refreshRecords();
            Alert.alert(labels.clearSuccess, labels.clearLedger);
          }).catch(() => {
            Alert.alert(labels.importFailed, labels.importInvalidFormat);
          });
        }
      }
    ]);
  }

  function confirmClearProducts() {
    Alert.alert(labels.clearProducts, labels.clearProductsConfirm, [
      { style: 'cancel', text: labels.cancel },
      {
        style: 'destructive',
        text: labels.clear,
        onPress: () => {
          runBusyAction('clear-products', async () => {
            await saveProducts([]);
            Alert.alert(labels.clearSuccess, labels.clearProducts);
          }).catch(() => {
            Alert.alert(labels.importFailed, labels.importInvalidFormat);
          });
        }
      }
    ]);
  }

  function confirmClearAll() {
    Alert.alert(labels.clearAll, labels.clearAllConfirm, [
      { style: 'cancel', text: labels.cancel },
      {
        style: 'destructive',
        text: labels.clear,
        onPress: () => {
          Alert.alert(labels.clearAll, labels.clearAllSecondConfirm, [
            { style: 'cancel', text: labels.cancel },
            {
              style: 'destructive',
              text: labels.clear,
              onPress: () => {
                runBusyAction('clear-all', async () => {
                  await Promise.all([
                    ledgerRepository.saveAllRecords([]),
                    saveProducts([])
                  ]);
                  await refreshRecords();
                  Alert.alert(labels.clearSuccess, labels.clearAll);
                }).catch(() => {
                  Alert.alert(labels.importFailed, labels.importInvalidFormat);
                });
              }
            }
          ]);
        }
      }
    ]);
  }

  function confirmSeedMockData() {
    Alert.alert(labels.devTools, labels.seedMockConfirm, [
      { style: 'cancel', text: labels.cancel },
      {
        text: labels.confirm,
        onPress: () => {
          runBusyAction('seed-mock', async () => {
            const count = await seedLedgerMockData();
            await refreshRecords();
            Alert.alert(labels.mockSeedSuccess, `已注入 ${count} 条 mock 账单`);
          }).catch(() => {
            Alert.alert(labels.importFailed, labels.importInvalidFormat);
          });
        }
      }
    ]);
  }

  function confirmClearMockData() {
    Alert.alert(labels.devTools, labels.clearMockConfirm, [
      { style: 'cancel', text: labels.cancel },
      {
        text: labels.confirm,
        onPress: () => {
          runBusyAction('clear-mock', async () => {
            const count = await clearLedgerMockData();
            await refreshRecords();
            Alert.alert(labels.mockClearSuccess, `已清除 ${count} 条 mock 账单`);
          }).catch(() => {
            Alert.alert(labels.importFailed, labels.importInvalidFormat);
          });
        }
      }
    ]);
  }

  return (
    <AppScreen bottomPadding={32}>
      <Stack.Screen options={{ title: labels.title }} />
      <Text variant="headlineSmall" style={[styles.title, { color: themeColors.text }]}>
        {labels.title}
      </Text>

      <SectionCard title={labels.ledgerData}>
        <ActionRow
          disabled={actionDisabled}
          description={labels.exportDescription}
          icon="download-outline"
          onPress={() => handleExportData('ledger')}
          title={labels.exportLedger}
          value={labels.schemaDescription}
        />
        <ActionRow
          disabled={actionDisabled}
          description={labels.importDescription}
          icon="upload-outline"
          onPress={() => handleImportData('ledger')}
          title={labels.importLedger}
        />
        <ActionRow
          danger
          disabled={actionDisabled}
          description={labels.clearLedgerDescription}
          icon="trash-can-outline"
          onPress={confirmClearLedger}
          title={labels.clearLedger}
        />
      </SectionCard>

      <SectionCard title={labels.productData}>
        <ActionRow
          disabled={actionDisabled}
          description={labels.exportDescription}
          icon="download-outline"
          onPress={() => handleExportData('products')}
          title={labels.exportProducts}
          value={labels.schemaDescription}
        />
        <ActionRow
          disabled={actionDisabled}
          description={labels.importDescription}
          icon="upload-outline"
          onPress={() => handleImportData('products')}
          title={labels.importProducts}
        />
        <ActionRow
          danger
          disabled={actionDisabled}
          description={labels.clearProductsDescription}
          icon="trash-can-outline"
          onPress={confirmClearProducts}
          title={labels.clearProducts}
        />
      </SectionCard>

      <SectionCard title={labels.fullBackup}>
        <ActionRow
          disabled={actionDisabled}
          description={labels.exportDescription}
          icon="archive-arrow-down-outline"
          onPress={() => handleExportData('full')}
          title={labels.exportFull}
          value={labels.schemaDescription}
        />
        <ActionRow
          disabled={actionDisabled}
          description={labels.importDescription}
          icon="archive-arrow-up-outline"
          onPress={() => handleImportData('full')}
          title={labels.importFull}
        />
        <ActionRow
          danger
          disabled={actionDisabled}
          description={labels.clearAllDescription}
          icon="delete-alert-outline"
          onPress={confirmClearAll}
          title={labels.clearAll}
        />
      </SectionCard>

      {__DEV__ ? (
        <SectionCard title={labels.devTools}>
          <Text style={[styles.devDescription, { color: themeColors.textSecondary }]}>
            {labels.devDescription}
          </Text>
          <Text style={[styles.mockCount, { color: themeColors.textSecondary }]}>
            {labels.mockCount}：{mockRecordCount}
          </Text>
          <View style={styles.devActions}>
            <DevButton
              disabled={actionDisabled}
              onPress={confirmSeedMockData}
              primary
              title={labels.seedMock}
            />
            <DevButton
              disabled={actionDisabled}
              onPress={confirmClearMockData}
              title={labels.clearMock}
            />
          </View>
        </SectionCard>
      ) : null}
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

function ActionRow({
  danger = false,
  description,
  disabled = false,
  icon,
  onPress,
  title,
  value
}: {
  danger?: boolean;
  description?: string;
  disabled?: boolean;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress: () => void;
  title: string;
  value?: string;
}) {
  const { colors: themeColors } = useAppTheme();
  const accentColor = danger ? themeColors.danger : themeColors.primary;

  return (
    <Pressable
      android_ripple={{ color: themeColors.ripple }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        { backgroundColor: pressed ? themeColors.surfacePressed : 'transparent' },
        disabled && styles.disabledAction
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: themeColors.cardAlt }]}>
        <MaterialCommunityIcons name={icon} color={accentColor} size={20} />
      </View>
      <View style={styles.actionMain}>
        <Text style={[styles.actionTitle, { color: danger ? themeColors.danger : themeColors.text }]}>
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

function DevButton({
  disabled,
  onPress,
  primary = false,
  title
}: {
  disabled: boolean;
  onPress: () => void;
  primary?: boolean;
  title: string;
}) {
  const { colors: themeColors } = useAppTheme();

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.devButton,
        {
          backgroundColor: primary
            ? pressed
              ? themeColors.surfacePressed
              : themeColors.primary
            : pressed
              ? themeColors.surfacePressed
              : themeColors.cardAlt,
          borderColor: primary ? themeColors.primary : themeColors.border
        },
        disabled && styles.disabledAction
      ]}
    >
      <Text
        style={[
          styles.devButtonText,
          { color: primary ? themeColors.background : themeColors.text }
        ]}
      >
        {title}
      </Text>
    </Pressable>
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
  },
  devDescription: {
    fontSize: 13,
    lineHeight: 20
  },
  mockCount: {
    fontSize: 12,
    fontWeight: '800'
  },
  devActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  devButton: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md
  },
  devButtonText: {
    fontWeight: '900'
  },
  disabledAction: {
    opacity: 0.52
  }
});
