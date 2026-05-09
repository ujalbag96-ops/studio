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
          <Toaster /> {/* Toaster moved outside gate for constant visibility */}
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
  
  const settingsRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'settings', 'global') : null, 
    [firestore]
  );
  const { data: settings, isLoading } = useDoc<AppSettings>(settingsRef);

  // Critical: Allow login and admin pages even during maintenance
  const isExcludedPage = pathname.startsWith('/admin') || 
                         pathname === '/login' || 
                         pathname === '/auth' || 
                         pathname === '/maintenance';
                         
  const isMaintenance = settings?.maintenanceMode && !isExcludedPage;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <Loader2 className="animate-spin text-primary h-10 w-10" />
    </div>
  );

  if (isMaintenance) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center space-y-6 bg-[#050508]">
        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-2xl animate-pulse">
           <ShieldAlert className="h-12 w-12 text-primary" />
        </div>
        <div className="space-y-2">
           <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">App Update</h1>
           <p className="text-muted-foreground font-medium text-lg uppercase tracking-widest">Maintenance Mode ON</p>
        </div>
        <p className="text-xs text-muted-foreground max-w-sm font-bold uppercase opacity-50">The app is being updated for a better experience. Please check back soon.</p>
      </div>
    );
  }

  return <>{children}</>;
}
