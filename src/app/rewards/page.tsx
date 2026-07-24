
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Loader2, Clock, ShieldAlert, Zap, RefreshCw } from 'lucide-react';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function RewardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    if (!profile?.lastSpinTimestamp) {
      setCooldownRemaining(0);
      return;
    }
    const checkCooldown = () => {
      const lastSpin = new Date(profile.lastSpinTimestamp!).getTime();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const remaining = Math.max(0, twentyFourHours - (now - lastSpin));
      setCooldownRemaining(Math.ceil(remaining / 1000));
    };
    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [profile?.lastSpinTimestamp]);

  const handleSpin = async () => {
    if (!user || !firestore || !userRef || !settings) return;
    
    const spinCost = 10;
    const isFree = cooldownRemaining === 0;

    if (!isFree && profile!.coins < spinCost) {
      toast({ variant: "destructive", title: "Insufficient Assets" });
      return;
    }

    setIsSpinning(true);
    const rewards = [5, 10, 0, 20, 1, 15, 5, 50];
    const wonAmount = rewards[Math.floor(Math.random() * rewards.length)];

    setTimeout(async () => {
      try {
        await updateDoc(userRef, {
          bonusBalance: increment(wonAmount),
          coins: increment(isFree ? wonAmount : (wonAmount - spinCost)),
          lastSpinTimestamp: new Date().toISOString()
        });

        await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
          type: isFree ? 'income' : 'conversion',
          amount: wonAmount,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Jhilli Spin: Won ${wonAmount} 🪙`
        });

        toast({ title: wonAmount > 0 ? "WINNER!" : "TRY AGAIN", description: `You received ${wonAmount} coins.` });

        if (wonAmount > 0 && settings.globalRewardSoundUrl) {
          const audio = new Audio(settings.globalRewardSoundUrl);
          audio.play().catch(() => {});
        }
      } catch (e) {
        toast({ variant: "destructive", title: "Sync Failed" });
      } finally {
        setIsSpinning(false);
      }
    }, 2000);
  };

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-12 pb-32">
      <div className="text-center space-y-4 pt-12">
        <div className="mx-auto h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-4 shadow-2xl border border-primary/20">
          <Sparkles className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white">Daily <span className="text-primary">Rewards</span></h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Card className="bg-[#0a0a0f] border-white/5 border-2 rounded-[3rem] overflow-hidden relative">
           <CardHeader className="p-10 text-center space-y-2">
              <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px] mx-auto">Jhilli Engine Live</Badge>
              <CardTitle className="text-3xl font-black uppercase italic">The Daily Wheel</CardTitle>
           </CardHeader>
           <CardContent className="p-10 flex flex-col items-center gap-10">
              <div 
                className={cn(
                  "h-64 w-64 rounded-full border-8 border-white/5 bg-black/40 flex items-center justify-center relative transition-transform ease-out",
                  isSpinning ? "rotate-[1440deg]" : ""
                )}
                style={{ transitionDuration: '2000ms' }}
              >
                 <Zap className="h-16 w-16 text-primary" />
              </div>
              <Button onClick={handleSpin} disabled={isSpinning} className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase italic text-xl shadow-2xl transition-all">
                {isSpinning ? "SPINNING..." : cooldownRemaining > 0 ? "PAID SPIN (10 🪙)" : "FREE SPIN"}
              </Button>
           </CardContent>
        </Card>
        <Card className="bg-[#121212] border-white/5 rounded-[2.5rem] p-10 space-y-6">
           <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3"><ShieldAlert className="h-5 w-5 text-primary" /> Sonic Logic</h3>
           <p className="text-[11px] text-muted-foreground font-medium leading-relaxed uppercase">
              Global notification and reward sounds are dynamically managed by the Hub Admin. Every signal matches your industrial profile.
           </p>
        </Card>
      </div>
    </div>
  );
}
