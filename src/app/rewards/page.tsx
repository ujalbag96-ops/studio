'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gift, Users, PlayCircle, Sparkles, Loader2, LayoutDashboard, Clock } from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12 pb-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Gift className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tight uppercase">Earn <span className="text-secondary">Free Coins</span></h1>
        <p className="text-muted-foreground">Complete simple tasks to fill your wallet. Use your earnings for tournament entries and premium battles.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Watch & Earn Section */}
        <Card className="border-2 border-secondary/20 bg-secondary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PlayCircle className="h-32 w-32 text-secondary" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-secondary">
              <PlayCircle className="h-6 w-6" />
              Watch & Earn
            </CardTitle>
            <CardDescription>Instant rewards for every video watched.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Earnings</p>
                <p className="text-2xl font-black text-secondary">5 🪙</p>
              </div>
              {cooldownRemaining > 0 ? (
                <div className="flex items-center gap-2 text-destructive font-black">
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>{formatCooldown(cooldownRemaining)}</span>
                </div>
              ) : (
                <Sparkles className="h-8 w-8 text-secondary animate-pulse" />
              )}
            </div>
            <Button 
              onClick={handleWatchVideo} 
              disabled={isVideoLoading || cooldownRemaining > 0} 
              className="w-full bg-secondary text-secondary-foreground font-black h-14 rounded-2xl shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:grayscale"
            >
              {isVideoLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Playing Ad...
                </>
              ) : cooldownRemaining > 0 ? (
                <>WAIT {formatCooldown(cooldownRemaining)}</>
              ) : (
                <>CLAIM VIDEO REWARD</>
              )}
            </Button>
          </CardContent>
          <CardFooter>
            <p className="text-[10px] text-muted-foreground italic">
              {cooldownRemaining > 0 
                ? "Cooldown active to protect system integrity." 
                : "Video rewards are processed automatically upon completion."}
            </p>
          </CardFooter>
        </Card>

        {/* Invite Friends */}
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Users className="h-6 w-6" />
              Squad Referral
            </CardTitle>
            <CardDescription>Earn 100 🪙 for every successful invite.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Referral Link</label>
                <div className="flex gap-2">
                  <Input 
                    value={`https://bracketbattles.in/ref/${user?.uid?.slice(0, 6) || '---'}`} 
                    readOnly 
                    className="bg-transparent border-white/10 font-mono text-xs" 
                  />
                  <Button size="sm" className="bg-primary font-bold" onClick={() => {
                    navigator.clipboard.writeText(`https://bracketbattles.in/ref/${user?.uid?.slice(0, 6) || ''}`);
                    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
                  }}>COPY</Button>
                </div>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Offer Wall */}
      <section className="space-y-6 pt-12">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-black uppercase tracking-tight">CPA Lead Offer Wall</h2>
        </div>
        <Card className="border-2 border-primary/10 overflow-hidden bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>High Value Offers</CardTitle>
            <CardDescription>Participate in surveys and app trials for massive coin payouts.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t border-white/5 min-h-[500px] flex items-center justify-center">
            {isSettingsLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Syncing Offers...</p>
              </div>
            ) : settings?.cpaLeadUrl ? (
              <iframe 
                src={settings.cpaLeadUrl} 
                className="w-full h-[600px] border-none"
                title="CPA Lead Offer Wall"
              />
            ) : (
              <div className="text-center p-12 space-y-4">
                <LayoutDashboard className="h-16 w-16 text-muted-foreground/20 mx-auto" />
                <p className="text-muted-foreground font-medium">Offers are currently being updated.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
