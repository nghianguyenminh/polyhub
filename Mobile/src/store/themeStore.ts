import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName, StyleSheet } from 'react-native';
import { lightColors, darkColors, typography, spacing, borderRadius, shadows } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  themeMode: ThemeMode;
  systemTheme: ColorSchemeName;
  setThemeMode: (mode: ThemeMode) => void;
  setSystemTheme: (theme: ColorSchemeName) => void;
  getTheme: () => any;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      systemTheme: Appearance.getColorScheme(),
      setThemeMode: (mode) => set({ themeMode: mode }),
      setSystemTheme: (theme) => set({ systemTheme: theme }),
      getTheme: () => {
        const { themeMode, systemTheme } = get();
        const isDark = themeMode === 'dark' || (themeMode === 'system' && systemTheme === 'dark');
        return {
          colors: isDark ? darkColors : lightColors,
          typography,
          spacing,
          borderRadius,
          shadows,
          isDark
        };
      }
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeMode: state.themeMode }), // Only persist themeMode
    }
  )
);

// Hook helper to avoid writing theme selection repeatedly
export const useAppTheme = (styleCreator?: (theme: any) => any) => {
  const getTheme = useThemeStore((state) => state.getTheme);
  const themeMode = useThemeStore((state) => state.themeMode);
  const systemTheme = useThemeStore((state) => state.systemTheme);
  
  // getTheme depends on these states, so this will trigger re-render
  const theme = getTheme(); 
  const styles = styleCreator ? styleCreator(theme) : {};

  return { theme, styles };
};
