import { PropsWithChildren, Ref } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppTheme } from '@/context/AppThemeContext';
import { spacing } from '@/theme/spacing';

export type AppScreenProps = PropsWithChildren<{
  bottomPadding?: number;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  scrollRef?: Ref<ScrollView>;
}>;

const DEFAULT_BOTTOM_PADDING = 12;

export function AppScreen({
  bottomPadding = DEFAULT_BOTTOM_PADDING,
  children,
  contentStyle,
  scroll = true,
  scrollRef
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}
        >
          <View style={[contentBaseStyle, { paddingBottom: bottomPadding }, contentStyle]}>
            {children}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[contentBaseStyle, { paddingBottom: bottomPadding }, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = {
  keyboardAvoiding: {
    flex: 1
  }
} as const;
