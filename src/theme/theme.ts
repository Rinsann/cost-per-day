import { MD3DarkTheme } from 'react-native-paper';

import { colors } from './colors';

export const appTheme = {
  ...MD3DarkTheme,
  roundness: 16,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    surfaceVariant: colors.surface,
    secondaryContainer: colors.surfaceElevated,
    onSurface: colors.textPrimary,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.border,
    error: colors.danger
  }
};
