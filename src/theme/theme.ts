import { MD3LightTheme } from 'react-native-paper';

import { colors } from './colors';

export const appTheme = {
  ...MD3LightTheme,
  roundness: 16,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    background: colors.background,
    surface: colors.background,
    surfaceVariant: colors.card,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    outline: colors.outline
  }
};
