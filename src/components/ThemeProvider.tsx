
'use client';

import React, { useEffect, useState } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

/**
 * Enterprise Theme Provider Node
 * Synchronizes visual identity variables from Firestore in real-time.
 * Features industrial-grade fail-safe logic to prevent UI blocking.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Fail-safe timeout: If Firestore takes too long (e.g. slow network or missing doc),
    // we unblock the UI after 3 seconds to ensure the app is usable.
    const timeout = setTimeout(() => {
      if (!isLoaded) {
        console.warn("Theme synchronization timed out. Proceeding with default industrial theme.");
        setIsLoaded(true);
      }
    }, 3000);

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
      } else {
        // Fallback to default industrial theme if config node is missing in Firestore
        document.documentElement.setAttribute('data-theme', 'dark-default');
        document.documentElement.classList.remove('light');
      }
      
      setIsLoaded(true);
      clearTimeout(timeout);
    }, (error) => {
      // If there's a permission error or network issue, we still want the app to load.
      console.error("Theme synchronization node error:", error);
      setIsLoaded(true);
      clearTimeout(timeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [firestore, isLoaded]);

  // Prevent flicker during initial theme sync, but unblock after timeout or successful response.
  // Using background color to match initial splash screen feel.
  if (!isLoaded) {
    return (
      <div className="bg-[#050508] fixed inset-0 z-[9999] flex items-center justify-center">
         {/* Invisible div to keep standard layout space while loading */}
      </div>
    );
  }

  return <>{children}</>;
}
