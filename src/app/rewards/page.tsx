
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, PlayCircle, Sparkles, Loader2, Clock } from 'lucide-react';
import { AppSettings } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function RewardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    const checkCooldown = () => {
      const lastWatchTime = localStorage.getItem('last_video_watch_time');
      if (lastWatchTime) {
        const elapsed = Date.now() - parseInt(lastWatchTime);
        const cooldownMs = 5 * 60 * 1000;
        if (elapsed < cooldownMs) {
          setCooldownRemaining(Math.ceil((cooldownMs - elapsed) / 1000));
        } else {
          setCooldownRemaining(0);
        }
      }
    };
    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWatchVideo = async () => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }

    if (cooldownRemaining > 0) return;

    setIsVideoLoading(true);
    
    setTimeout(async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

        // Rewards add to both total coins and WITHDRAWABLE winning balance
        await updateDoc(userRef, {
          coins: increment(5),
          withdrawableCoins: increment(5)
        });

        await addDoc(ledgerRef, {
          type: 'income',
          amount: 5,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: 'Earned from Video Ad'
        });

        localStorage.setItem('last_video_watch_time', Date.now().toString());
        setCooldownRemaining(300);

        toast({ title: "Winning Reward Claimed!", description: "5 🪙 added to your winning balance." });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Wallet Sync Failed" });
      } finally {
        setIsVideoLoading(false);
      }
    }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-10 pb-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-8">
        <div className="mx-auto h-20 w-20 rounded-[2rem] bg-primary/20 flex items-center justify-center mb-4 shadow-2xl">
          <Gift className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase">Arena <span className="text-secondary italic">Rewards</span></h1>
        <p className="text-muted-foreground font-medium text-lg">Earn coins that add directly to your Winning Amount.</p>
      </div>

      <Card className="border-2 border-primary/20 bg-[#1a1a24] relative overflow-hidden rounded-[2.5rem]">
        <CardHeader className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black text-primary uppercase tracking-tight">Watch & Earn</CardTitle>
              <CardDescription className="text-muted-foreground font-medium text-base italic">Get 5 Withdrawable Coins instantly.</CardDescription>
            </div>
            {cooldownRemaining > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-black px-6 py-2 rounded-full text-sm">
                READY IN {formatCooldown(cooldownRemaining)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          <Button 
            onClick={handleWatchVideo} 
            disabled={isVideoLoading || cooldownRemaining > 0} 
            className="w-full bg-primary hover:bg-primary/90 text-white font-black h-20 rounded-[2rem] shadow-2xl text-xl tracking-widest uppercase"
          >
            {isVideoLoading ? <Loader2 className="h-7 w-7 animate-spin mr-3" /> : cooldownRemaining > 0 ? `WAIT ${formatCooldown(cooldownRemaining)}` : "WATCH VIDEO AD"}
          </Button>
        </CardContent>
        <CardFooter className="bg-black/20 border-t border-white/5 py-4 px-8">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ad Provider: {settings?.videoAdProvider?.toUpperCase() || 'UNITY'}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
