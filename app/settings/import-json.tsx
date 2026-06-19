import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';

import { Screen } from '@/components/layout/Screen';
import { AppCard } from '@/components/ui/AppCard';
import { messages } from '@/constants/messages';
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
  importConfirmBody: '\n\n\u5907\u4efd\u6587\u4ef6\u5305\u542b\uff1a\n{count} \u4ef6\u6d88\u8d39\u54c1',
  cancel: '\u53d6\u6d88',
  confirmImport: '\u786e\u8ba4\u5bfc\u5165',
};

export default function PasteJsonImportScreen() {
  const [jsonText, setJsonText] = useState('');
  const [importing, setImporting] = useState(false);

  function handleValidateAndImport() {
    const parsedBackup = parseCostPerDayBackup(jsonText.trim());

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
              setImporting(true);
              await saveProducts(parsedBackup.products);
              Alert.alert(
                messages.success.importTitle,
                messages.success.importDescription.replace('{count}', String(count)),
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/settings')
                  }
                ]
              );
            } catch {
              Alert.alert(messages.error.importTitle, messages.error.saveDescription);
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
      <AppCard style={styles.card}>
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
            textColor={colors.text}
            placeholderTextColor={colors.textSecondary}
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
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24
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
    backgroundColor: colors.cardAlt,
    minHeight: 200
  },
  button: {
    borderRadius: radius.lg
  },
  buttonContent: {
    height: 48
  }
});
