'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings } from './lib/types';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { usePathname } from 'next/navigation';
import { Loader2, ShieldAlert, Megaphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import SupportChat from '@/components/SupportChat';
import ThemeProvider from '@/components/ThemeProvider';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head key="layout-head">
        <title key="head-title">CampusHub | Global Scholar & Yield Platform</title>
        <meta key="head-meta-desc" name="description" content="Official CampusHub v170.0 Energy-Efficient Build. Low Battery Consumption Node." />
        <link key="head-link-preconnect-1" rel="preconnect" href="https://fonts.googleapis.com" />
        <link key="head-link-preconnect-2" rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link key="head-link-fonts" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body key="layout-body" className="font-body antialiased bg-background text-white min-h-screen flex flex-col overflow-x-hidden">
        <FirebaseClientProvider key="layout-fb-provider">
          <ThemeProvider key="layout-theme-provider">
            <Toaster key="layout-toaster" />
            <SystemGate key="layout-system-gate">
              <Navbar key="layout-navbar" />
              <main key="layout-main" className="flex-1 pb-24 md:pb-0 pt-16 relative">
                <BroadcastBanner key="layout-broadcast-banner" />
                <div key="layout-children-container">
                  {children}
                </div>
              </main>
              <SupportChat key="layout-support-chat" />
              <Footer key="layout-footer" />
            </SystemGate>
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

function BroadcastBanner() {
   const firestore = useFirestore();
   const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
   const { data: settings } = useDoc<AppSettings>(settingsRef);
   const [dismissed, setDismissed] = useState(false);

   if (!settings?.broadcastActive || !settings?.broadcastMessage || dismissed) return null;

   return (
      <div key="banner-container" className="bg-primary/20 backdrop-blur-md border-b border-primary/30 p-3 flex items-center justify-between relative z-[90] animate-in slide-in-from-top duration-700">
         <div className="flex items-center gap-3 px-4 flex-1">
            <Megaphone className="h-4 w-4 text-primary shrink-0 opacity-80" />
            <p className="text-[10px] font-black uppercase italic text-white tracking-widest leading-none truncate">
               {settings.broadcastMessage}
            </p>
         </div>
         <button key="banner-close" onClick={() => setDismissed(true)} className="p-2 text-white/40 hover:text-white transition-colors">
            <X className="h-4 w-4" />
         </button>
      </div>
   );
}

function SystemGate({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const pathname = usePathname();
  
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings, isLoading } = useDoc<AppSettings>(settingsRef);

  const isAdmin = user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isMaintenance = settings?.maintenanceMode && !isAdmin && !pathname.startsWith('/auth') && !pathname.startsWith('/admin') && !pathname.startsWith('/login');

  if (isLoading) return (
    <div key="system-gate-loading" className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-primary h-12 w-12 opacity-50" />
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">Synchronizing Operational Signal...</p>
      </div>
    </div>
  );

  if (isMaintenance) {
    return (
      <div key="system-gate-maint" className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8 bg-[#050508]">
        <div key="maint-icon-container" className="h-28 w-28 bg-primary/10 rounded-[3rem] flex items-center justify-center border border-primary/20 shadow-xl relative">
           <ShieldAlert className="h-12 w-12 text-primary" />
           <div className="absolute inset-0 rounded-[3rem] border border-primary/40 animate-pulse-slow opacity-20" />
        </div>
        <div key="maint-text-container" className="space-y-3">
           <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">Sector <span className="text-primary">Locked</span></h1>
           <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.4em] italic">Industrial Maintenance in Progress</p>
        </div>
        <div key="maint-info-box" className="p-8 bg-white/5 border border-white/10 rounded-[2rem] max-sm">
           <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic">
              "We are calibrating naye scholar resources. Full access will restore shortly. All earnings are safe in the vault."
           </p>
        </div>
        {isAdmin && (
           <Button key="maint-admin-btn" asChild variant="outline" className="border-primary/20 text-primary font-black uppercase italic text-[10px]">
              <Link href="/admin">Enter Override Node</Link>
           </Button>
        )}
      </div>
    );
  }

  return <div key="system-gate-active">{children}</div>;
}