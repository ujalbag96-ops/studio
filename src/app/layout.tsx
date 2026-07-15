'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings } from './lib/types';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import SupportChat from '@/components/SupportChat';
import { usePathname } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-white min-h-screen flex flex-col">
        <FirebaseClientProvider>
          <Toaster />
          <MaintenanceGate>
            <Navbar />
            <main className="flex-1 pb-20 md:pb-0 md:pt-16">
              {children}
            </main>
            <Footer />
            <SupportChat />
          </MaintenanceGate>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const pathname = usePathname();
  
  const settingsRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'app_settings', 'global_config') : null, 
    [firestore]
  );
  const { data: settings, isLoading } = useDoc<AppSettings>(settingsRef);

  const isAdmin = user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const isExcludedPage = pathname.startsWith('/admin') || 
                         pathname === '/login' || 
                         pathname === '/auth';
                         
  const isMaintenance = settings?.maintenanceMode && !isExcludedPage && !isAdmin;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-primary h-12 w-12" />
        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">Synchronizing Secure Signal...</p>
      </div>
    </div>
  );

  if (isMaintenance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-8 bg-[#050508]">
        <div className="h-28 w-28 bg-primary/10 rounded-[3rem] flex items-center justify-center border border-primary/20 shadow-2xl animate-pulse relative">
           <ShieldAlert className="h-12 w-12 text-primary" />
           <div className="absolute inset-0 rounded-[3rem] border border-primary/40 animate-ping opacity-20" />
        </div>
        <div className="space-y-3">
           <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">Sector <span className="text-primary">Locked</span></h1>
           <p className="text-muted-foreground font-black text-xs uppercase tracking-[0.4em] italic">Tactical System Update in Progress</p>
        </div>
        <div className="max-w-xs space-y-4">
           <p className="text-[11px] text-muted-foreground font-bold uppercase leading-relaxed opacity-60">
             The arena is currently undergoing a scheduled structural reinforcement for better performance.
           </p>
           <div className="h-px w-20 bg-white/10 mx-auto" />
           <p className="text-[10px] font-black text-primary uppercase tracking-widest italic">ETA: 15-45 MINUTES</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
