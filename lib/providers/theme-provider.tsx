'use client';

/**
 * Theme Provider
 * 
 * Manages dark/light mode and theme preferences using next-themes.
 * Syncs with user profile settings in Supabase.
 */

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

