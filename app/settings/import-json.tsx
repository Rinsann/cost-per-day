import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { saveProducts } from '@/storage/productStorage';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { parseCostPerDayBackup } from '@/utils/backup';

const labels = {
  title: '\u7c98\u8d34 JSON \u5bfc\u5165',
  description:
    '\u8bf7\u6253\u5f00 cost-per-day-backup.json \u6587\u4ef6\uff0c\u590d\u5236\u5b8c\u6574\u5185\u5bb9\u540e\u7c98\u8d34\u5230\u4e0b\u65b9\u8f93\u5165\u6846\u3002',
  placeholder:
    '\u8bf7\u7c98\u8d34 cost-per-day-backup.json \u7684\u5b8c\u6574\u5185\u5bb9',
  validateAndImport: '\u6821\u9a8c\u5e76\u5bfc\u5165',
  importing: '\u5bfc\u5165\u4e2d...',
  importFailed: '\u5bfc\u5165\u5931\u8d25',
  invalidJson: '\u7c98\u8d34\u5185\u5bb9\u4e0d\u662f\u6709\u6548\u7684 JSON\u3002',
  invalidFormat: '\u6587\u4ef6\u683c\u5f0f\u4e0d\u6b63\u786e\u3002',
  importConfirmTitle: '\u786e\u5b9a\u5bfc\u5165\u6570\u636e\uff1f',
  importConfirmBody:
    '\u5f53\u524d\u672c\u5730\u6570\u636e\u5c06\u88ab\u8986\u76d6\u3002\n\n\u5907\u4efd\u6587\u4ef6\u5305\u542b\uff1a\n{count} \u4ef6\u6d88\u8d39\u54c1',
  cancel: '\u53d6\u6d88',
  confirmImport: '\u786e\u8ba4\u5bfc\u5165',
  importSuccess: '\u5bfc\u5165\u6210\u529f',
  importSuccessBody: '\u5df2\u6062\u590d {count} \u4ef6\u6d88\u8d39\u54c1\u3002',
  saveFailedHint: '\u8bf7\u7a0d\u540e\u518d\u8bd5\u3002'
};

export default function PasteJsonImportScreen() {
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);

  function handleValidateAndImport() {
    const parsedBackup = parseCostPerDayBackup(jsonText.trim());

    if (!parsedBackup.ok) {
      Alert.alert(
        labels.importFailed,
        parsedBackup.reason === 'invalid-json' ? labels.invalidJson : labels.invalidFormat
      );
      return;
    }

    const count = parsedBackup.products.length;

    Alert.alert(
      labels.importConfirmTitle,
      labels.importConfirmBody.replace('{count}', String(count)),
      [
        {
          text: labels.cancel,
          style: 'cancel'
        },
        {
          text: labels.confirmImport,
          onPress: async () => {
            try {
              setImporting(true);
              await saveProducts(parsedBackup.products);
              Alert.alert(
                labels.importSuccess,
                labels.importSuccessBody.replace('{count}', String(count)),
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/settings')
                  }
                ]
              );
            } catch {
              Alert.alert(labels.importFailed, labels.saveFailedHint);
            } finally {
              setImporting(false);
            }
          }
        }
      ]
    );
  }

  return (
    <Screen>
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.content}>
          <Text variant="titleLarge" style={styles.title}>
            {labels.title}
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {labels.description}
          </Text>
          <TextInput
            mode="outlined"
            value={jsonText}
            onChangeText={setJsonText}
            placeholder={labels.placeholder}
            multiline
            style={styles.input}
            textAlignVertical="top"
          />
          <Button
            mode="contained"
            onPress={handleValidateAndImport}
            loading={importing}
            disabled={importing}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {importing ? labels.importing : labels.validateAndImport}
          </Button>
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
  content: {
    gap: spacing.md
  },
  title: {
    color: colors.text,
    fontWeight: '800'
  },
  description: {
    color: colors.textSecondary,
    lineHeight: 22
  },
  input: {
    minHeight: 200
  },
  button: {
    borderRadius: radius.lg
  },
  buttonContent: {
    height: 48
  }
});
