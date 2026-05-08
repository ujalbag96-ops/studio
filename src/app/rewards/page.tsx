
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, PlayCircle, Sparkles, Loader2, Clock, ShieldAlert } from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function RewardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: profile } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    const checkCooldown = () => {
      if (typeof window === 'undefined') return;
      const lastWatchTime = localStorage.getItem('last_video_watch_time');
      if (lastWatchTime) {
        const elapsed = Date.now() - parseInt(lastWatchTime);
        const cooldownMs = 5 * 60 * 1000; // 5 minute cooldown
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
    if (!user || !firestore || !userRef) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }

    if (cooldownRemaining > 0 || isVideoLoading) return;

    setIsVideoLoading(true);
    
    // SCAM PREVENTION: Wait for simulated verification
    await new Promise(resolve => setTimeout(resolve, 6000));

    try {
      const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

      const updateData = {
        taskBalance: increment(5),
        coins: increment(5) // Legacy total sync
      };

      const ledgerData = {
        userId: user.uid,
        type: 'income',
        amount: 5,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Video Ad Reward (Added to Task Balance)'
      };

      updateDoc(userRef, updateData).catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      });

      addDoc(ledgerRef, ledgerData).catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: ledgerRef.path,
          operation: 'create',
          requestResourceData: ledgerData,
        }));
      });

      localStorage.setItem('last_video_watch_time', Date.now().toString());
      setCooldownRemaining(300);

      toast({ title: "Task Reward Verified!", description: "5 Coins added to Task Balance. Convert them in your wallet." });
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.play().catch(() => {});

    } catch (error: any) {
      toast({ variant: "destructive", title: "Wallet Sync Failed" });
    } finally {
      setIsVideoLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-10 pb-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-8">
        <div className="mx-auto h-20 w-20 rounded-[2rem] bg-amber-500/20 flex items-center justify-center mb-4 shadow-2xl border border-amber-500/20">
          <Gift className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase italic">Extra <span className="text-amber-500">Income</span></h1>
        <p className="text-muted-foreground font-medium text-lg">Watch tactical briefs to earn Task Coins. Convert them to winning balance for withdrawal.</p>
      </div>

      <Card className="border-2 border-amber-500/20 bg-[#1a1a24] relative overflow-hidden rounded-[2.5rem]">
        <CardHeader className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-amber-500 tracking-widest mb-2">
                 <ShieldAlert className="h-3 w-3" /> Secure Reward Synchronizer
              </div>
              <CardTitle className="text-3xl font-black text-amber-500 uppercase tracking-tight italic">Watch & Earn</CardTitle>
              <CardDescription className="text-muted-foreground font-medium text-base">Earn 5 Task Coins per mission.</CardDescription>
            </div>
            {cooldownRemaining > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-black px-6 py-2 rounded-full text-sm">
                NEXT MISSION: {formatCooldown(cooldownRemaining)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          <Button 
            onClick={handleWatchVideo} 
            disabled={isVideoLoading || cooldownRemaining > 0} 
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-black h-20 rounded-[2rem] shadow-2xl text-xl tracking-[0.2em] uppercase italic"
          >
            {isVideoLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : cooldownRemaining > 0 ? `LOCKED (${formatCooldown(cooldownRemaining)})` : "EXECUTE MISSION"}
          </Button>
        </CardContent>
        <CardFooter className="bg-black/20 border-t border-white/5 py-4 px-8">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Conversion required (1.2% fee) for withdrawal.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
