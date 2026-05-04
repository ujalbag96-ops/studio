'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DepositPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new unified Earning Hub
    router.replace('/earning-hub');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground font-medium">Entering Earning Hub...</p>
    </div>
  );
}
