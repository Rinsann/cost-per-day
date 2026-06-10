import { useFocusEffect } from 'expo-router';
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
  version: 'V1.1-B',
  authorName: 'Rinsann',
  stack: 'React Native\nExpo\nTypeScript'
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
