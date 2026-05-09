
'use client';

import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings } from './lib/types';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import SupportChat from '@/components/SupportChat';
import { usePathname } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';

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
      <body className="font-body antialiased bg-background text-white">
        <FirebaseClientProvider>
          {/* Toaster placed at root level to ensure visibility across all gates */}
          <Toaster />
          <MaintenanceGate>
            <Navbar />
            <main className="pb-20 md:pb-0 md:pt-16 min-h-screen">
              {children}
            </main>
            <SupportChat />
          </MaintenanceGate>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const firestore = useFirestore();
  const pathname = usePathname();
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings, isLoading } = useDoc<AppSettings>(settingsRef);

  const isMaintenance = settings?.maintenanceMode && !pathname.startsWith('/admin') && pathname !== '/maintenance';

  if (isLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary" /></div>;

  if (isMaintenance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6 bg-[#050508]">
        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-2xl animate-pulse">
           <ShieldAlert className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2">
           <h1 className="text-5xl font-black uppercase italic tracking-tighter">System Offline</h1>
           <p className="text-muted-foreground font-medium text-lg uppercase tracking-widest">Scheduled Infrastructure Optimization in Progress</p>
        </div>
        <p className="text-xs text-muted-foreground max-w-sm font-bold uppercase opacity-50">Operational services will resume shortly. We appreciate your institutional patience.</p>
      </div>
    );
  }

  return <>{children}</>;
}
