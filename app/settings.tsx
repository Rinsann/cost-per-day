import { File, Paths } from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Card, List, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { getProducts } from '@/storage/productStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const labels = {
  data: '\u6570\u636e',
  productCount: '\u6d88\u8d39\u54c1\u6570\u91cf',
  exportData: '\u5bfc\u51fa\u6570\u636e',
  json: 'JSON',
  app: '\u5e94\u7528',
  currentVersion: '\u5f53\u524d\u7248\u672c',
  techStack: '\u6280\u672f\u6808',
  about: '\u5173\u4e8e',
  appName: 'Cost Per Day',
  description: '\u5e2e\u52a9\u7528\u6237\u8ba1\u7b97\u6d88\u8d39\u54c1\u771f\u5b9e\u4f7f\u7528\u6210\u672c\u3002',
  versionNumber: '\u5f53\u524d\u7248\u672c\u53f7',
  author: '\u4f5c\u8005',
  github: 'Github \u4ed3\u5e93',
  comingSoon: 'Coming Soon',
  noExportData: '\u6682\u65e0\u53ef\u5bfc\u51fa\u7684\u6d88\u8d39\u54c1\u6570\u636e\u3002',
  exportFailed: '\u5bfc\u51fa\u5931\u8d25',
  exportFailedHint: '\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002',
  exportDialogTitle: '\u5bfc\u51fa Cost Per Day \u5907\u4efd',
  version: 'V1.1-C',
  authorName: 'Rinsann',
  stack: 'React Native\nExpo\nTypeScript'
};

const EXPORT_FILE_NAME = 'cost-per-day-backup.json';

export default function SettingsScreen() {
  const [productCount, setProductCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      getProducts().then((products) => {
        if (mounted) {
          setProductCount(products.length);
        }
      });

      return () => {
        mounted = false;
      };
    }, [])
  );

  async function handleExportData() {
    try {
      const products = await getProducts();

      if (products.length === 0) {
        Alert.alert(labels.exportData, labels.noExportData);
        return;
      }

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        throw new Error('Sharing is not available on this device.');
      }

      const backup = {
        app: labels.appName,
        version: labels.version,
        exportedAt: new Date().toISOString(),
        products
      };

      const backupFile = new File(Paths.document, EXPORT_FILE_NAME);
      backupFile.create({ overwrite: true });
      backupFile.write(JSON.stringify(backup, null, 2));

      await Sharing.shareAsync(backupFile.uri, {
        mimeType: 'application/json',
        dialogTitle: labels.exportDialogTitle
      });
    } catch {
      Alert.alert(labels.exportFailed, labels.exportFailedHint);
    }
  }

  return (
    <Screen>
      <Card mode="contained" style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {labels.data}
          </Text>
          <List.Item
            title={labels.productCount}
            right={() => <Text style={styles.valueText}>{productCount}</Text>}
          />
          <List.Item
            title={labels.exportData}
            right={(props) => (
              <>
                <Text style={styles.valueText}>{labels.json}</Text>
                <List.Icon {...props} icon="chevron-right" />
              </>
            )}
            onPress={handleExportData}
          />
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {labels.app}
          </Text>
          <List.Item
            title={labels.currentVersion}
            right={() => <Text style={styles.valueText}>{labels.version}</Text>}
          />
          <List.Item
            title={labels.techStack}
            description={labels.stack}
            descriptionNumberOfLines={3}
          />
        </Card.Content>
      </Card>

      <Card mode="contained" style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            {labels.about}
          </Text>
          <List.Item title={labels.appName} description={labels.description} />
          <List.Item
            title={labels.versionNumber}
            right={() => <Text style={styles.valueText}>{labels.version}</Text>}
          />
          <List.Item
            title={labels.author}
            right={() => <Text style={styles.valueText}>{labels.authorName}</Text>}
          />
          <List.Item
            title={labels.github}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert(labels.github, labels.comingSoon)}
          />
        </Card.Content>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    marginBottom: spacing.md
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '800',
    marginBottom: spacing.xs
  },
  valueText: {
    alignSelf: 'center',
    color: colors.text,
    fontWeight: '700'
  }
});
