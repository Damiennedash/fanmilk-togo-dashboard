'use client';

import { useEffect } from 'react';

export const THEME_KEY = 'fanmilk_theme';
export const NOTIFICATIONS_KEY = 'fanmilk_notifications';
export const PREFERENCES_EVENT = 'fanmilk-preferences-changed';

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function AppPreferences() {
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    applyTheme(savedTheme === 'dark' ? 'dark' : 'light');
  }, []);

  return null;
}
