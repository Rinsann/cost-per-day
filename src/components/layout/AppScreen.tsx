import { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/AppThemeContext';
import { spacing } from '@/theme/spacing';

export type AppScreenProps = PropsWithChildren<{
  bottomPadding?: number;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
}>;

const DEFAULT_BOTTOM_PADDING = 12;

export function AppScreen({
  bottomPadding = DEFAULT_BOTTOM_PADDING,
  children,
  contentStyle,
  scroll = true
}: AppScreenProps) {
  const { colors } = useAppTheme();
  const containerStyle = {
    backgroundColor: colors.background,
    flex: 1
  } as const;
  const contentBaseStyle = {
    flexGrow: 1,
    padding: spacing.md
  } as const;

  if (!scroll) {
    return (
      <SafeAreaView style={containerStyle} edges={['top', 'left', 'right']}>
        <View style={[contentBaseStyle, { paddingBottom: bottomPadding }, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[contentBaseStyle, { paddingBottom: bottomPadding }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
