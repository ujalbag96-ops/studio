
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Users, PlayCircle, Sparkles, Loader2, LayoutDashboard, Clock, ExternalLink } from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
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
  const { data: settings, isLoading: isSettingsLoading } = useDoc<AppSettings>(settingsRef);

  // Cooldown Logic
  useEffect(() => {
    const checkCooldown = () => {
      const lastWatchTime = localStorage.getItem('last_video_watch_time');
      if (lastWatchTime) {
        const elapsed = Date.now() - parseInt(lastWatchTime);
        const cooldownMs = 5 * 60 * 1000; // 5 minutes
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
      toast({ 
        variant: "destructive", 
        title: "Sign-in Required", 
        description: "You must be logged in to earn and save rewards." 
      });
      return;
    }

    if (cooldownRemaining > 0) {
      toast({
        variant: "destructive",
        title: "Cooldown Active",
        description: `Please wait ${formatCooldown(cooldownRemaining)} before watching another video.`,
      });
      return;
    }

    setIsVideoLoading(true);
    
    // Simulate Video Ad SDK (Unity/AppLovin) Callback
    setTimeout(async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

        // 1. Atomic Update: Increment coins directly in the user document
        await updateDoc(userRef, {
          coins: increment(5)
        });

        // 2. Ledger Update: Record the transaction for user history
        await addDoc(ledgerRef, {
          userId: user.uid, // Tag with userId for Admin processing
          type: 'income',
          amount: 5,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: 'Rewarded Video Watch Bonus'
        });

        // 3. Set Cooldown
        localStorage.setItem('last_video_watch_time', Date.now().toString());
        setCooldownRemaining(300); // Start 5 min countdown

        toast({
          title: "Reward Claimed!",
          description: "5 🪙 have been added to your wallet.",
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Wallet Sync Failed",
          description: "Could not update balance. Please check your connection.",
        });
      } finally {
        setIsVideoLoading(false);
      }
    }, 3000); // 3-second simulation
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-10 pb-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto pt-8">
        <div className="mx-auto h-20 w-20 rounded-[2rem] bg-primary/20 flex items-center justify-center mb-4 shadow-2xl shadow-primary/20">
          <Gift className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter uppercase">Arena <span className="text-secondary italic">Rewards</span></h1>
        <p className="text-muted-foreground font-medium text-lg">Predict. Participate. Profit. Multiple ways to stack your coins.</p>
      </div>

      {/* Featured: Watch & Earn (Top Placement) */}
      <Card className="border-2 border-primary/20 bg-[#1a1a24] relative overflow-hidden group shadow-2xl shadow-primary/5 rounded-[2.5rem]">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <PlayCircle className="h-64 w-64 text-primary" />
        </div>
        <CardHeader className="relative z-10 p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-3 text-3xl font-black text-primary uppercase tracking-tight">
                <PlayCircle className="h-8 w-8 text-primary" />
                Watch & Earn
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium text-base italic">Get 5 🪙 instantly per view. High availability.</CardDescription>
            </div>
            {cooldownRemaining > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-black px-6 py-2 rounded-full text-sm animate-pulse">
                READY IN {formatCooldown(cooldownRemaining)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10 px-8 pb-8 pt-0">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between p-8 rounded-[2rem] bg-black/40 border border-white/5">
              <div className="space-y-1">
                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground">Ad Bonus</p>
                <div className="flex items-center gap-2">
                   <p className="text-4xl font-black text-secondary">5.00</p>
                   <span className="text-2xl">🪙</span>
                </div>
              </div>
              <Sparkles className={cn("h-12 w-12 text-secondary/20", cooldownRemaining === 0 && "animate-pulse text-secondary")} />
            </div>
            
            <Button 
              onClick={handleWatchVideo} 
              disabled={isVideoLoading || cooldownRemaining > 0} 
              className="w-full bg-primary hover:bg-primary/90 text-white font-black h-full py-10 rounded-[2rem] shadow-2xl shadow-primary/25 hover:scale-[1.03] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale text-xl tracking-widest uppercase"
            >
              {isVideoLoading ? (
                <>
                  <Loader2 className="h-7 w-7 animate-spin mr-3" />
                  LOADING AD...
                </>
              ) : cooldownRemaining > 0 ? (
                <>WAIT {formatCooldown(cooldownRemaining)}</>
              ) : (
                <>WATCH VIDEO AD</>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-black/20 border-t border-white/5 py-4 px-8">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cooldown is enabled to ensure fair rewards and project sustainability.
          </p>
        </CardFooter>
      </Card>

      {/* Offer Wall and other content... */}
    </div>
  );
}
