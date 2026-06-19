import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';

import { colors } from '@/theme/colors';

type AppCardProps = PropsWithChildren<{
  elevated?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ children, elevated = false, onPress, style }: AppCardProps) {
  return (
    <Card
      mode="contained"
      onPress={onPress}
      style={[styles.card, elevated ? styles.elevated : null, style]}
    >
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1
  },
  elevated: {
    backgroundColor: colors.surfaceElevated
  }
});
