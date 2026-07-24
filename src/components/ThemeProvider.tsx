
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

    const themeId = settings.currentThemeId || 'classic-0';
    const theme = MASTER_THEMES.find(t => t.id === themeId);

    if (theme) {
      const root = document.documentElement;
      root.style.setProperty('--primary', theme.primary);
      root.style.setProperty('--background', theme.background);
      root.style.setProperty('--accent', theme.accent);
      
      // Auto-calculate dark foreground for readability
      root.style.setProperty('--foreground', '0 0% 98%');
      root.style.setProperty('--card', theme.background);
      root.style.setProperty('--popover', theme.background);
      root.style.setProperty('--border', '0 0% 15%');
    }
  }, [settings]);

  return <>{children}</>;
}
