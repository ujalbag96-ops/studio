
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
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-10 pb-24">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
          <Gift className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase">Arena <span className="text-secondary">Rewards</span></h1>
        <p className="text-muted-foreground font-medium">Complete tasks, watch ads, and build your bankroll.</p>
      </div>

      {/* Featured: Watch & Earn (Top Placement) */}
      <Card className="border-2 border-secondary/40 bg-[#1a1a24] relative overflow-hidden group shadow-2xl shadow-secondary/5">
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
          <PlayCircle className="h-48 w-48 text-secondary" />
        </div>
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl font-black text-secondary uppercase tracking-tight">
                <PlayCircle className="h-7 w-7" />
                Watch & Earn
              </CardTitle>
              <CardDescription className="text-muted-foreground font-medium italic">Get 5 🪙 instantly per view.</CardDescription>
            </div>
            {cooldownRemaining > 0 && (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-black px-4 py-1">
                READY IN {formatCooldown(cooldownRemaining)}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6 relative z-10 pt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-6 rounded-[1.5rem] bg-black/40 border border-white/5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Reward Amount</p>
                <div className="flex items-center gap-2">
                   <p className="text-3xl font-black text-secondary">5.00</p>
                   <span className="text-xl">🪙</span>
                </div>
              </div>
              <Sparkles className={cn("h-10 w-10 text-secondary/40", cooldownRemaining === 0 && "animate-pulse text-secondary")} />
            </div>
            
            <Button 
              onClick={handleWatchVideo} 
              disabled={isVideoLoading || cooldownRemaining > 0} 
              className="w-full bg-secondary text-secondary-foreground font-black h-full py-8 rounded-[1.5rem] shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale text-lg tracking-widest uppercase"
            >
              {isVideoLoading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin mr-3" />
                  LOADING AD...
                </>
              ) : cooldownRemaining > 0 ? (
                <>RELOAD IN {formatCooldown(cooldownRemaining)}</>
              ) : (
                <>WATCH VIDEO AD</>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-black/20 border-t border-white/5 py-3">
          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Ad frequency is limited to protect system integrity and account safety.
          </p>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Invite Friends */}
        <Card className="border border-primary/20 bg-primary/5 rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-primary font-black uppercase tracking-tight">
              <Users className="h-6 w-6" />
              Squad Bonus
            </CardTitle>
            <CardDescription className="font-medium">Earn 100 🪙 for every active referral.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="p-5 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Personal Referral Link</label>
                <div className="flex gap-2">
                  <Input 
                    value={`https://bracketbattles.in/ref/${user?.uid?.slice(0, 6) || '---'}`} 
                    readOnly 
                    className="bg-transparent border-white/10 font-mono text-xs h-12" 
                  />
                  <Button className="bg-primary font-black px-6 rounded-xl" onClick={() => {
                    navigator.clipboard.writeText(`https://bracketbattles.in/ref/${user?.uid?.slice(0, 6) || ''}`);
                    toast({ title: "Copied!", description: "Link ready to share." });
                  }}>COPY</Button>
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border border-white/5 bg-card/20 rounded-[2rem] flex items-center justify-center p-8 text-center">
          <div className="space-y-4">
            <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tighter">More Tasks Coming Soon</h3>
            <p className="text-sm text-muted-foreground font-medium">We're adding more ways to earn every week. Stay tuned!</p>
          </div>
        </Card>
      </div>

      {/* Offer Wall */}
      <section className="space-y-6 pt-10">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter">Elite Offer Wall</h2>
        </div>
        <Card className="border border-white/5 overflow-hidden bg-card/30 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl">
          <CardHeader className="bg-white/5">
            <CardTitle className="text-lg font-bold">Premium Tasks</CardTitle>
            <CardDescription className="font-medium">High-payout surveys and application challenges.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 min-h-[500px] flex items-center justify-center">
            {isSettingsLoading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Authenticating Network...</p>
              </div>
            ) : settings?.cpaLeadUrl ? (
              <iframe 
                src={settings.cpaLeadUrl} 
                className="w-full h-[700px] border-none"
                title="CPA Lead Offer Wall"
              />
            ) : (
              <div className="text-center p-20 space-y-6">
                <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto border border-dashed border-muted">
                  <LayoutDashboard className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div className="space-y-2">
                  <p className="text-foreground font-black uppercase tracking-tight">Wall Maintenance</p>
                  <p className="text-muted-foreground text-sm max-w-xs mx-auto">Offers are currently being updated by our providers. Please check back in a few minutes.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
