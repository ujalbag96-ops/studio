
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error('Next.js Client Exception:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center space-y-6">
      <div className="h-20 w-20 bg-destructive/10 rounded-[2.5rem] flex items-center justify-center border border-destructive/20 shadow-2xl">
        <AlertTriangle className="h-10 w-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black uppercase tracking-tighter">Arena Glitch</h1>
        <p className="text-muted-foreground font-medium max-w-md mx-auto">
          A client-side exception occurred. The battle data encountered a synchronization error.
        </p>
        <p className="text-[10px] font-mono text-muted-foreground mt-4 opacity-50">
          {error.message || 'Unknown error'}
        </p>
      </div>
      <Button 
        onClick={() => reset()} 
        size="lg" 
        className="rounded-2xl font-black px-12 h-14 bg-primary hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4 mr-2" /> REBOOT ARENA
      </Button>
    </div>
  );
}
