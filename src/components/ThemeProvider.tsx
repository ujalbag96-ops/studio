'use client';

import React, { useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore) return;

    // Real-time Industrial Theme Synchronization Node
    const settingsRef = doc(firestore, 'app_settings', 'global_config');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const themeName = data.currentThemeId || 'dark-default';
        
        // Update root data attribute for CSS variable switching
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Handle Light Mode Specific Overrides
        if (themeName === 'pure-light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
      }
    });

    return () => unsubscribe();
  }, [firestore]);

  return <>{children}</>;
}
