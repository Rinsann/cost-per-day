import AsyncStorage from '@react-native-async-storage/async-storage';
import { PropsWithChildren, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName, useColorScheme } from 'react-native';

import { AppColors, darkColors, lightColors } from '@/theme/colors';
import { createAppTheme } from '@/theme/theme';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

type AppThemeContextValue = {
  colors: AppColors;
  isReady: boolean;
  paperTheme: ReturnType<typeof createAppTheme>;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  themeMode: ThemeMode;
};

const THEME_MODE_STORAGE_KEY = 'cost-per-day:theme-mode';
const VALID_THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

function normalizeThemeMode(value: string | null): ThemeMode {
  return VALID_THEME_MODES.includes(value as ThemeMode) ? (value as ThemeMode) : 'system';
}

function resolveSystemTheme(systemTheme: ColorSchemeName): ResolvedTheme {
  return systemTheme === 'light' ? 'light' : 'dark';
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemTheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_MODE_STORAGE_KEY)
      .then((storedMode) => {
        if (mounted) {
          setThemeModeState(normalizeThemeMode(storedMode));
        }
      })
      .finally(() => {
        if (mounted) {
          setIsReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedTheme = themeMode === 'system' ? resolveSystemTheme(systemTheme) : themeMode;
  const themeColors = resolvedTheme === 'dark' ? darkColors : lightColors;
  const paperTheme = useMemo(
    () => createAppTheme(themeColors, resolvedTheme),
    [resolvedTheme, themeColors]
  );

  async function setThemeMode(nextMode: ThemeMode) {
    setThemeModeState(nextMode);
    await AsyncStorage.setItem(THEME_MODE_STORAGE_KEY, nextMode);
  }

  const value = useMemo<AppThemeContextValue>(
    () => ({
      colors: themeColors,
      isReady,
      paperTheme,
      resolvedTheme,
      setThemeMode,
      themeMode
    }),
    [isReady, paperTheme, resolvedTheme, themeColors, themeMode]
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(AppThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used within AppThemeProvider');
  }

  return context;
}
