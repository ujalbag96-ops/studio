
'use client';

import React, { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!firestore) return;

    // Real-time Industrial Theme Synchronization Hub
    const settingsRef = doc(firestore, 'app_settings', 'global_config');
    const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const themeName = data.currentThemeId || 'dark-default';
        
        // Update root data attribute for CSS variable switching
        document.documentElement.setAttribute('data-theme', themeName);
        
        // Handle Light Mode Specific Overrides for ShadCN
        if (themeName === 'pure-light') {
          document.documentElement.classList.add('light');
        } else {
          document.documentElement.classList.remove('light');
        }
        
        setIsLoaded(true);
      }
    });

    return () => unsubscribe();
  }, [firestore]);

  // Prevent flicker during initial theme sync
  if (!isLoaded) return <div className="bg-black fixed inset-0 z-[9999]" />;

  return <>{children}</>;
}
