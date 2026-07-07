import { PropsWithChildren, Ref } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleProp, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const topInset =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const containerStyle = {
    backgroundColor: colors.background,
    flex: 1,
    paddingLeft: insets.left,
    paddingRight: insets.right,
    paddingTop: topInset
  } as const;
  const contentBaseStyle = {
    flexGrow: 1,
    padding: spacing.md
  } as const;

  if (!scroll) {
    return (
      <View style={containerStyle}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoiding}
        >
          <View style={[contentBaseStyle, { paddingBottom: bottomPadding }, contentStyle]}>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
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
    </View>
  );
}

const styles = {
  keyboardAvoiding: {
    flex: 1
  }
} as const;
