
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Sparkles, Loader2, Clock, ShieldAlert, Zap, RefreshCw } from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function RewardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const jhilliRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'jhilli_config') : null, [firestore]);
  
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);
  const { data: jhilliConfig } = useDoc<any>(jhilliRef);

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

  const formatCooldown = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const handleSpin = async () => {
    if (!user || !firestore || !userRef || !jhilliConfig) return;
    
    // Industrial Validation
    const spinCost = jhilliConfig.spinCost || 10;
    const isFree = cooldownRemaining === 0;

    if (!isFree && profile!.coins < spinCost) {
      toast({ variant: "destructive", title: "Insufficient Assets", description: `You need ${spinCost} coins for an extra spin.` });
      return;
    }

    setIsSpinning(true);
    
    // Probabilistic Reward Logic
    const rewards = jhilliConfig.rewards || [5, 10, 0, 20, 1, 15, 5, 50];
    const wonAmount = rewards[Math.floor(Math.random() * rewards.length)];

    setTimeout(async () => {
      try {
        const updateData: any = {
          bonusBalance: increment(wonAmount),
          coins: increment(isFree ? wonAmount : (wonAmount - spinCost)),
          lastSpinTimestamp: new Date().toISOString()
        };

        await updateDoc(userRef, updateData);

        await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
          type: isFree ? 'income' : 'conversion',
          amount: wonAmount,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Jhilli Spin: Won ${wonAmount} 🪙 ${!isFree ? `(Paid ${spinCost} 🪙)` : ''}`
        });

        toast({ 
          title: wonAmount > 0 ? "JACKPOT UNLOCKED!" : "NEXT TIME, WARRIOR", 
          description: wonAmount > 0 ? `You won ${wonAmount} Bonus Coins!` : "The Jhilli was silent today."
        });

        if (wonAmount > 0) {
          new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
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
        <p className="text-muted-foreground font-medium text-lg">Your daily inventory of free coins and tactical bonuses.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        <Card className="bg-[#0a0a0f] border-white/5 border-2 rounded-[3rem] overflow-hidden relative group">
           <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
           <CardHeader className="p-10 text-center space-y-2">
              <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px] mx-auto">Jhilli Engine Live</Badge>
              <CardTitle className="text-3xl font-black uppercase italic">The Daily Wheel</CardTitle>
              <CardDescription className="text-muted-foreground uppercase font-bold text-[10px]">Spin for real supplemental assets</CardDescription>
           </CardHeader>
           <CardContent className="p-10 flex flex-col items-center gap-10">
              <div 
                className={cn(
                  "h-64 w-64 rounded-full border-8 border-white/5 bg-black/40 flex items-center justify-center relative shadow-[0_0_50px_rgba(255,123,0,0.1)] transition-transform ease-out",
                  isSpinning ? "rotate-[1440deg]" : ""
                )}
                style={{ transitionDuration: '2000ms' }}
              >
                 <div className="absolute inset-0 rounded-full border-t-8 border-primary animate-spin opacity-20" style={{ animationDuration: '3s' }} />
                 <Zap className="h-16 w-16 text-primary drop-shadow-[0_0_15px_rgba(255,123,0,0.5)]" />
                 {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                   <div key={deg} className="absolute h-full w-1 flex flex-col justify-start pt-4" style={{ transform: `rotate(${deg}deg)` }}>
                      <div className="h-2 w-2 rounded-full bg-white/20" />
                   </div>
                 ))}
              </div>

              <div className="w-full space-y-4">
                 <Button 
                   onClick={handleSpin}
                   disabled={isSpinning}
                   className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase italic text-xl shadow-2xl transition-all active:scale-95"
                 >
                   {isSpinning ? "SPINNING VAULT..." : 
                    cooldownRemaining > 0 ? `PAID SPIN (${jhilliConfig?.spinCost || 10} 🪙)` : "FREE DAILY SPIN"}
                 </Button>
                 
                 {cooldownRemaining > 0 && (
                   <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest italic">
                      <Clock className="h-3 w-3" /> Next Free Signal in {formatCooldown(cooldownRemaining)}
                   </div>
                 )}
              </div>
           </CardContent>
        </Card>

        <div className="space-y-8">
           <Card className="bg-[#121212] border-white/5 rounded-[2.5rem] p-10 space-y-6">
              <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                 <ShieldAlert className="h-5 w-5 text-primary" /> Jhilli Protocol
              </h3>
              <div className="space-y-6">
                 <RewardFeature icon={<Zap />} title="Real Asset Credit" desc="Rewards are synced directly to your Supplemental Balance." />
                 <RewardFeature icon={<RefreshCw />} title="System Limit" desc={`${jhilliConfig?.dailyFreeLimit || 1} Free Spin per 24 hour cycle. Extra spins cost ${jhilliConfig?.spinCost || 10} coins.`} />
                 <RewardFeature icon={<Sparkles />} title="Grand Prize" desc={`Max reward of ${Math.max(...(jhilliConfig?.rewards || [50]))} coins detected in current logic.`} />
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

function RewardFeature({ icon, title, desc }: any) {
  return (
    <div className="flex items-start gap-4">
       <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-primary shrink-0 border border-white/5">
          {icon}
       </div>
       <div>
          <h4 className="text-sm font-black uppercase italic text-white">{title}</h4>
          <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">{desc}</p>
       </div>
    </div>
  );
}
