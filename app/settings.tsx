import * as DocumentPicker from 'expo-document-picker';
import { EncodingType, File, Paths } from 'expo-file-system';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { router, useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Card, List, Text } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { appInfo } from '@/constants/appInfo';
import { messages } from '@/constants/messages';
import { getProducts, saveProducts } from '@/storage/productStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { parseCostPerDayBackup } from '@/utils/backup';

const labels = {
  data: '\u6570\u636e',
  productCount: '\u6d88\u8d39\u54c1\u6570\u91cf',
  exportData: '\u5bfc\u51fa\u6570\u636e',
  importData: '\u5bfc\u5165\u6570\u636e',
  importFromFile: '\u4ece\u6587\u4ef6\u5bfc\u5165\uff08\u5b9e\u9a8c\u6027\uff09',
  importFromPaste: '\u7c98\u8d34 JSON \u5bfc\u5165\uff08\u63a8\u8350\uff09',
  json: 'JSON',
  app: '\u5e94\u7528',
  appName: '\u5e94\u7528\u540d\u79f0',
  currentVersion: '\u5f53\u524d\u7248\u672c',
  buildType: '\u6784\u5efa\u7c7b\u578b',
  techStack: '\u6280\u672f\u6808',
  about: '\u5173\u4e8e',
  description: '\u5e94\u7528\u8bf4\u660e',
  versionNumber: '\u5f53\u524d\u7248\u672c\u53f7',
  author: '\u4f5c\u8005',
  github: 'Github \u4ed3\u5e93',
  exportDialogTitle: `\u5bfc\u51fa ${appInfo.name} \u5907\u4efd`,
  importConfirmBody: '\n\n\u5907\u4efd\u6587\u4ef6\u5305\u542b\uff1a\n{count} \u4ef6\u6d88\u8d39\u54c1',
  cancel: '\u53d6\u6d88',
  confirmImport: '\u786e\u8ba4\u5bfc\u5165',
  stack: 'React Native\nExpo\nTypeScript'
};

const EXPORT_FILE_NAME = 'cost-per-day-backup.json';

type PickedBackupAsset = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

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
        Alert.alert(labels.exportData, messages.error.noExportData);
        return;
      }

      const sharingAvailable = await Sharing.isAvailableAsync();

      if (!sharingAvailable) {
        throw new Error('Sharing is not available on this device.');
      }

      const backup = {
        app: appInfo.name,
        version: appInfo.displayVersion,
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
      Alert.alert(messages.error.exportTitle, messages.error.exportDescription);
    }
  }

  async function confirmImportProducts(rawJson: string) {
    const parsedBackup = parseCostPerDayBackup(rawJson);

    if (!parsedBackup.ok) {
      Alert.alert(
        messages.error.importTitle,
        parsedBackup.reason === 'invalid-json'
          ? messages.error.importInvalidJson
          : messages.error.importInvalidFormat
      );
      return;
    }

    const count = parsedBackup.products.length;

    Alert.alert(
      messages.confirm.importTitle,
      `${messages.confirm.importDescription}${labels.importConfirmBody.replace(
        '{count}',
        String(count)
      )}`,
      [
        {
          text: labels.cancel,
          style: 'cancel'
        },
        {
          text: labels.confirmImport,
          onPress: async () => {
            try {
              await saveProducts(parsedBackup.products);
              setProductCount(count);
              Alert.alert(
                messages.success.importTitle,
                messages.success.importDescription.replace('{count}', String(count))
              );
            } catch {
              Alert.alert(messages.error.importTitle, messages.error.saveDescription);
            }
          }
        }
      ]
    );
  }

  async function readPickedBackupFile(asset: PickedBackupAsset) {
    try {
      const backupFile = new File(asset.uri);
      return await backupFile.text();
    } catch (error) {
      console.log(`${appInfo.name} import read failed with File API`, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
        errorName: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      });
    }

    try {
      return await readAsStringAsync(asset.uri, {
        encoding: EncodingType.UTF8
      });
    } catch (error) {
      console.log(`${appInfo.name} import read failed with legacy FileSystem API`, {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size,
        errorName: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  async function handleFileImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset) {
        Alert.alert(messages.error.importTitle, messages.error.importReadFailed);
        return;
      }

      let rawJson = '';
      const pickedAsset = {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size
      };

      console.log(`${appInfo.name} import picked asset`, pickedAsset);

      try {
        rawJson = await readPickedBackupFile(pickedAsset);
      } catch {
        Alert.alert(messages.error.importTitle, messages.error.importReadFailed);
        return;
      }

      await confirmImportProducts(rawJson);
    } catch {
      Alert.alert(messages.error.importTitle, messages.error.importReadFailed);
    }
  }

  function handleImportData() {
    Alert.alert(labels.importData, undefined, [
      {
        text: labels.importFromPaste,
        onPress: () => router.push('/settings/import-json')
      },
      {
        text: labels.importFromFile,
        onPress: handleFileImport
      },
      {
        text: labels.cancel,
        style: 'cancel'
      }
    ]);
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
          <List.Item
            title={labels.importData}
            right={(props) => (
              <>
                <Text style={styles.valueText}>{labels.json}</Text>
                <List.Icon {...props} icon="chevron-right" />
              </>
            )}
            onPress={handleImportData}
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
            right={() => <Text style={styles.valueText}>{appInfo.displayVersion}</Text>}
          />
          <List.Item
            title={labels.buildType}
            right={() => <Text style={styles.valueText}>{appInfo.buildType}</Text>}
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
          <List.Item
            title={labels.appName}
            right={() => <Text style={styles.valueText}>{appInfo.name}</Text>}
          />
          <List.Item title={labels.description} description={appInfo.description} />
          <List.Item
            title={labels.versionNumber}
            right={() => <Text style={styles.valueText}>{appInfo.displayVersion}</Text>}
          />
          <List.Item
            title={labels.author}
            right={() => <Text style={styles.valueText}>{appInfo.author}</Text>}
          />
          <List.Item
            title={labels.github}
            description={appInfo.github}
            descriptionNumberOfLines={2}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Alert.alert(labels.github, appInfo.github)}
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
