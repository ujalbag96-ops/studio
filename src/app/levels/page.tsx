
'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { 
  Crown, 
  Trophy, 
  Zap, 
  Gift, 
  ChevronRight, 
  Star, 
  TrendingUp, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/app/lib/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function LevelsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  const currentXp = 120;
  const nextLevelXp = 500;
  const progress = (currentXp / nextLevelXp) * 100;

  const handleClaimReward = async (rewardId: string, amount: number) => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Access Denied", description: "Login to claim your rewards." });
      return;
    }

    setIsClaiming(rewardId);
    
    setTimeout(async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

        // Level rewards add to WITHDRAWABLE winnings
        await updateDoc(userRef, {
          coins: increment(amount),
          withdrawableCoins: increment(amount)
        });

        await addDoc(ledgerRef, {
          type: 'income',
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Level ${rewardId} Winning Reward`
        });

        toast({
          title: "Winning Reward Claimed!",
          description: `${amount} 🪙 added to your winning balance.`,
        });
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Claim Failed",
          description: "Could not sync with the arena server.",
        });
      } finally {
        setIsClaiming(null);
      }
    }, 1500);
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 shadow-2xl p-8 md:p-16">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
              <Trophy className="h-4 w-4 text-primary animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Bronze Tier Active</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
              ARENA <span className="text-primary italic">LEVELS</span>
            </h1>
            
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              Level rewards are added directly to your <span className="text-white font-bold">Winning Amount</span> for instant withdrawal.
            </p>
          </div>

          <div className="w-full md:w-80 space-y-4">
            <div className="flex justify-between items-end">
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Status</p>
                 <p className="text-3xl font-black text-white">BRONZE I</p>
               </div>
               <p className="text-xs font-bold text-muted-foreground">XP: {currentXp} / {nextLevelXp}</p>
            </div>
            <div className="relative h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
               <div 
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-secondary shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-1000"
                 style={{ width: `${progress}%` }}
               />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <LevelRewardCard 
          title="Daily Winning Payout"
          description="Claim your daily winning dividend for being active."
          value="10.00"
          icon={<Clock className="h-8 w-8 text-primary" />}
          id="daily"
          isClaiming={isClaiming === 'daily'}
          onClaim={() => handleClaimReward('Daily', 10)}
          color="primary"
        />
        <LevelRewardCard 
          title="Welcome Winnings"
          description="Starter gift added to your withdrawable balance."
          value="50.00"
          icon={<Gift className="h-8 w-8 text-secondary" />}
          id="welcome"
          isClaiming={isClaiming === 'welcome'}
          onClaim={() => handleClaimReward('Welcome', 50)}
          color="secondary"
        />
        <LevelRewardCard 
          title="Weekly Winning Drop"
          description="Exclusive weekly winning drop for grinders."
          value="100.00"
          icon={<Trophy className="h-8 w-8 text-white" />}
          id="weekly"
          isClaiming={isClaiming === 'weekly'}
          onClaim={() => handleClaimReward('Weekly', 100)}
          color="white"
        />
      </div>
    </div>
  );
}

function LevelRewardCard({ title, description, value, icon, id, isClaiming, onClaim, color }: any) {
  const colorStyles = color === 'primary' 
    ? "from-primary/20 to-transparent border-primary/20 text-primary" 
    : color === 'secondary'
    ? "from-secondary/20 to-transparent border-secondary/20 text-secondary"
    : "from-white/10 to-transparent border-white/20 text-white";

  return (
    <Card className={cn(
      "relative bg-[#1a1a1a] border-white/5 overflow-hidden transition-all duration-500 group hover:border-white/10 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[400px]",
      "shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
    )}>
      <div className={cn("absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-125 duration-700", colorStyles)}>
        {icon}
      </div>

      <div className="space-y-6 relative z-10">
        <div className={cn("h-16 w-16 rounded-2xl bg-gradient-to-br flex items-center justify-center border shadow-2xl", colorStyles)}>
           {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black uppercase tracking-tight">{title}</h3>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex items-end gap-2">
           <p className="text-5xl font-black tracking-tighter">{value}</p>
           <p className="text-xl font-black opacity-40 mb-1">🪙</p>
        </div>
        <Button 
          onClick={onClaim}
          disabled={isClaiming}
          className={cn(
            "w-full font-black uppercase tracking-widest h-14 rounded-2xl transition-all shadow-xl",
            color === 'primary' ? "bg-primary hover:bg-primary/90 text-white" : 
            color === 'secondary' ? "bg-secondary hover:bg-secondary/90 text-black" : "bg-white text-black hover:bg-white/90"
          )}
        >
          {isClaiming ? <Loader2 className="h-5 w-5 animate-spin" /> : "CLAIM WINNINGS"}
        </Button>
      </div>
    </Card>
  );
}
