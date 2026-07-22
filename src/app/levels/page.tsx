'use client';

import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { 
  Trophy, 
  Zap, 
  Gift, 
  Star, 
  Loader2,
  PlayCircle,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function LevelsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  const [pendingReward, setPendingReward] = useState<{ id: string, amount: number } | null>(null);

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    let timer: any;
    if (showAd && adCountdown > 0) {
      timer = setInterval(() => setAdCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showAd, adCountdown]);

  const initiateClaim = (id: string, amount: number) => {
    if (!user) {
      toast({ variant: "destructive", title: "Access Denied", description: "Identity node required." });
      return;
    }
    setPendingReward({ id, amount });
    setShowAd(true);
    setAdCountdown(10);
  };

  const handleClaimFinalize = async () => {
    if (!user || !firestore || !pendingReward || adCountdown > 0) return;

    setIsClaiming(pendingReward.id);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

      await updateDoc(userRef, {
        coins: increment(pendingReward.amount),
        bonusBalance: increment(pendingReward.amount)
      });

      await addDoc(ledgerRef, {
        type: 'income',
        amount: pendingReward.amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Level Reward: ${pendingReward.id} [Ad Verified]`
      });

      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.play().catch(() => {});
      
      toast({ title: "REWARD DEPLOYED", description: `${pendingReward.amount} Coins added to vault.` });
      setShowAd(false);
      setPendingReward(null);
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILURE" });
    } finally {
      setIsClaiming(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 shadow-2xl p-8 md:p-16">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left max-w-xl">
            <Badge className="bg-primary/10 text-primary uppercase font-black px-4 py-1 tracking-widest">TIER: {profile?.rank || 'BRONZE'}</Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">Arena <span className="text-primary">Levels</span></h1>
            <p className="text-lg text-muted-foreground font-medium uppercase tracking-tight">Watch Ads to claim high-yield level milestones.</p>
          </div>
          <div className="w-full md:w-80 space-y-4">
             <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-primary w-[45%] shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
             </div>
             <p className="text-[10px] font-black uppercase text-center text-muted-foreground tracking-widest">45% to next tier</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <LevelRewardCard 
          title="Starter Pack"
          description="Basic verification dividend for active warriors."
          value="10.00"
          icon={<Zap className="h-8 w-8 text-primary" />}
          id="starter"
          onClaim={() => initiateClaim('Starter', 10)}
        />
        <LevelRewardCard 
          title="Veteran Drop"
          description="High eCPM milestone for focused students."
          value="25.00"
          icon={<Trophy className="h-8 w-8 text-amber-500" />}
          id="veteran"
          onClaim={() => initiateClaim('Veteran', 25)}
        />
        <LevelRewardCard 
          title="Elite Bounty"
          description="Premium supplemental liquidity release."
          value="50.00"
          icon={<Gift className="h-8 w-8 text-green-500" />}
          id="elite"
          onClaim={() => initiateClaim('Elite', 50)}
        />
      </div>

      {/* REWARDED AD MODAL (Simulation) */}
      {showAd && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="max-w-md w-full text-center space-y-10">
              <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                 <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" style={{ animationDuration: '3s' }} />
                 <PlayCircle className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-black uppercase italic text-white">Unlocking Bounty...</h3>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                    Industrial Ad Signal Sync in progress. Release in {adCountdown}s.
                 </p>
              </div>
              <p className="text-6xl font-black text-white italic tabular-nums">{adCountdown}s</p>
              <Button 
                disabled={adCountdown > 0 || !!isClaiming} 
                onClick={handleClaimFinalize}
                className={cn(
                  "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                  adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                )}
              >
                 {isClaiming ? <Loader2 className="animate-spin" /> : adCountdown === 0 ? "CLAIM ASSET" : "SYNCING..."}
              </Button>
              {adCountdown > 0 && (
                 <button onClick={() => setShowAd(false)} className="text-[9px] font-black uppercase text-white/20 hover:text-white transition-colors">Discard Signal</button>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

function LevelRewardCard({ title, description, value, icon, id, onClaim }: any) {
  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[400px] shadow-2xl relative group overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">{icon}</div>
      <div className="space-y-6 relative z-10">
        <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl">
           {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black uppercase italic tracking-tight text-white">{title}</h3>
          <p className="text-xs text-muted-foreground font-medium uppercase leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="space-y-6 relative z-10">
        <div className="flex items-end gap-2">
           <p className="text-6xl font-black tracking-tighter text-white italic">{value}</p>
           <p className="text-2xl font-black text-primary mb-1">🪙</p>
        </div>
        <Button 
          onClick={onClaim}
          className="w-full bg-white/5 hover:bg-primary border border-white/10 hover:border-primary text-white font-black uppercase italic h-16 rounded-2xl shadow-xl transition-all"
        >
          CLAIM REWARD
        </Button>
      </div>
    </Card>
  );
}
