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
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function LevelsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState<string | null>(null);
  const [showCoinAnim, setShowCoinAnim] = useState(false);

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  const playClaimSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.play().catch(() => {});
  };

  const handleClaimReward = (rewardId: string, amount: number) => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Access Denied", description: "Login to claim your rewards." });
      return;
    }

    setIsClaiming(rewardId);
    
    const userRef = doc(firestore, 'users', user.uid);
    const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

    const updateData = {
      coins: increment(amount),
      withdrawableCoins: increment(amount)
    };

    const ledgerData = {
      type: 'income',
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Level ${rewardId} Reward`
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

    setTimeout(() => {
      setIsClaiming(null);
      playClaimSound();
      setShowCoinAnim(true);
      toast({
        title: "Reward Claimed!",
        description: `${amount} 🪙 added to your wallet.`,
      });
      setTimeout(() => setShowCoinAnim(false), 2000);
    }, 800);
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32 relative">
      {showCoinAnim && (
        <div className="fixed inset-0 pointer-events-none z-[200] flex items-center justify-center">
          <div className="coin-collect-animation bg-primary rounded-full h-20 w-20 flex items-center justify-center shadow-2xl">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>
      )}

      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 shadow-2xl p-8 md:p-16">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left max-w-xl">
            <Badge className="bg-primary/10 text-primary uppercase font-black px-4 py-1 tracking-widest">TIER: BRONZE I</Badge>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">Arena <span className="text-primary">Levels</span></h1>
            <p className="text-lg text-muted-foreground font-medium">Progress through tiers to unlock withdrawable rewards.</p>
          </div>
          <div className="w-full md:w-80 space-y-4">
             <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10">
                <div className="h-full bg-primary w-[30%] shadow-[0_0_20px_rgba(255,123,0,0.5)]" />
             </div>
             <p className="text-[10px] font-black uppercase text-center text-muted-foreground tracking-widest">30% to next tier</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <LevelRewardCard 
          title="Daily Bonus"
          description="Login daily to collect your activity dividend."
          value="10.00"
          icon={<Clock className="h-8 w-8 text-primary" />}
          id="daily"
          isClaiming={isClaiming === 'daily'}
          onClaim={() => handleClaimReward('Daily', 10)}
          color="primary"
        />
        <LevelRewardCard 
          title="Welcome Gift"
          description="Starter reward for newly registered warriors."
          value="50.00"
          icon={<Gift className="h-8 w-8 text-secondary" />}
          id="welcome"
          isClaiming={isClaiming === 'welcome'}
          onClaim={() => handleClaimReward('Welcome', 50)}
          color="secondary"
        />
        <LevelRewardCard 
          title="Weekly Drop"
          description="Special bonus for high activity throughout the week."
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
      "relative bg-[#1a1a1a] border-white/5 overflow-hidden rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[400px] shadow-2xl",
    )}>
      <div className="space-y-6 relative z-10">
        <div className={cn("h-16 w-16 rounded-2xl bg-gradient-to-br flex items-center justify-center border shadow-xl", colorStyles)}>
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
            "w-full font-black uppercase tracking-widest h-14 rounded-2xl",
            color === 'primary' ? "bg-primary hover:bg-primary/90 text-white" : 
            color === 'secondary' ? "bg-secondary hover:bg-secondary/90 text-black" : "bg-white text-black hover:bg-white/90"
          )}
        >
          {isClaiming ? <Loader2 className="h-5 w-5 animate-spin" /> : "CLAIM REWARD"}
        </Button>
      </div>
    </Card>
  );
}