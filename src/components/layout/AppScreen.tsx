import { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
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
  if (!scroll) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={[styles.content, { paddingBottom: bottomPadding }, contentStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }, contentStyle]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {
    flexGrow: 1,
    padding: spacing.md
  }
});
