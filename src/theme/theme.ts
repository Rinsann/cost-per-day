import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';

import { AppColors, colors } from './colors';

export function createAppTheme(themeColors: AppColors, resolvedTheme: 'dark' | 'light') {
  const baseTheme = resolvedTheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return {
    ...baseTheme,
    dark: resolvedTheme === 'dark',
    roundness: 16,
    colors: {
      ...baseTheme.colors,
      primary: themeColors.primary,
      background: themeColors.background,
      surface: themeColors.surface,
      surfaceVariant: themeColors.surface,
      secondaryContainer: themeColors.surfaceElevated,
      onSurface: themeColors.textPrimary,
      onSurfaceVariant: themeColors.textSecondary,
      outline: themeColors.border,
      error: themeColors.danger
    }
  };
}

export const appTheme = {
  ...createAppTheme(colors, 'dark'),
  roundness: 16,
};
