
'use client';

import React, { useEffect, useState } from 'react';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings } from '@/app/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Zap } from 'lucide-react';

const CURRENT_VERSION = '1.0.0'; // Hardcoded in APK

export default function AutoUpdateChecker() {
  const firestore = useFirestore();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (settings?.appVersion && settings.appVersion !== CURRENT_VERSION) {
      setShowUpdate(true);
    }
  }, [settings?.appVersion]);

  if (!showUpdate || !settings) return null;

  return (
    <Dialog open={showUpdate} onOpenChange={setShowUpdate}>
      <DialogContent className="bg-[#0a0a0f] border-primary/20 text-white max-w-sm rounded-[2.5rem] p-10 shadow-2xl overflow-hidden" title="System Update Available">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent" />
        
        <div className="relative z-10 text-center space-y-8">
           <div className="h-20 w-20 rounded-[2.5rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-2xl">
              <Smartphone className="h-10 w-10 text-primary animate-pulse" />
           </div>

           <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">New <span className="text-primary">Update</span></h2>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Industrial Release v{settings.appVersion}</p>
           </div>

           <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
              <p className="text-[11px] font-medium text-white leading-relaxed uppercase tracking-tight">
                 "Critical performance signals and new earning nodes have been deployed. Please install the latest APK to maintain session integrity."
              </p>
           </div>

           <Button asChild className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black text-lg rounded-2xl shadow-xl shadow-primary/20 group">
              <a href={settings.apkDownloadUrl || '#'} target="_blank" rel="noopener noreferrer">
                 DOWNLOAD APK <Download className="ml-3 h-5 w-5 animate-bounce" />
              </a>
           </Button>

           <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase text-muted-foreground opacity-40 italic">
              <Zap className="h-3 w-3" /> CampusHub Industrial Core Sync
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
