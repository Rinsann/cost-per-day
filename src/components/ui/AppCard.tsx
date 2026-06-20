import { PropsWithChildren } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Card } from 'react-native-paper';

import { useAppTheme } from '@/context/AppThemeContext';

type AppCardProps = PropsWithChildren<{
  elevated?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}>;

export function AppCard({ children, elevated = false, onPress, style }: AppCardProps) {
  const { colors } = useAppTheme();

  return (
    <Card
      mode="contained"
      onPress={onPress}
      style={[
        {
          backgroundColor: elevated ? colors.surfaceElevated : colors.surface,
          borderColor: colors.border,
          borderRadius: 24,
          borderWidth: 1
        },
        style
      ]}
    >
      {children}
    </Card>
  );
}
