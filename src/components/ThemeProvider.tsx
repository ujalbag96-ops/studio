
'use client';

import React, { useEffect } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings } from '@/app/lib/types';
import { MASTER_THEMES } from '@/app/lib/themes';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    if (!settings) return;

    const themeId = settings.currentThemeId || 'dark-default';
    const theme = MASTER_THEMES.find(t => t.id === themeId);

    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--background', theme.background);
      root.style.setProperty('--accent', theme.accent);
      
      // Auto-calculate properties based on theme intensity
      if (theme.isLight) {
        root.style.setProperty('--foreground', '222 47% 11%');
        root.style.setProperty('--card', '0 0% 100%');
        root.style.setProperty('--card-foreground', '222 47% 11%');
        root.style.setProperty('--popover', '0 0% 100%');
        root.style.setProperty('--popover-foreground', '222 47% 11%');
        root.style.setProperty('--muted', '210 40% 96%');
        root.style.setProperty('--muted-foreground', '215 16% 47%');
        root.style.setProperty('--border', '214 32% 91%');
        root.style.setProperty('--input', '214 32% 91%');
      } else {
        root.style.setProperty('--foreground', '0 0% 98%');
        root.style.setProperty('--card', theme.background);
        root.style.setProperty('--card-foreground', '0 0% 98%');
        root.style.setProperty('--popover', theme.background);
        root.style.setProperty('--popover-foreground', '0 0% 98%');
        root.style.setProperty('--muted', '240 3.7% 15.9%');
        root.style.setProperty('--muted-foreground', '240 5% 64.9%');
        root.style.setProperty('--border', '240 3.7% 15.9%');
        root.style.setProperty('--input', '240 3.7% 15.9%');
      }
    }
  }, [settings]);

  return <>{children}</>;
}
