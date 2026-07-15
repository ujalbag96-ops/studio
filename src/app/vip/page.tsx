
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, writeBatch } from 'firebase/firestore';
import { Crown, Zap, ShieldCheck, Star, ArrowRight, Loader2, CreditCard, Gift, Trophy, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function VIPClubPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handleMlmJoin = async (amount: number) => {
    if (!user || !firestore || !userRef || !profile) return;
    
    if (profile.depositBalance < amount) {
      toast({ variant: "destructive", title: "Insufficient Assets", description: "Top up your deposit wallet to join this package." });
      return;
    }

    setIsProcessing(amount);
    
    try {
      const batch = writeBatch(firestore);
      const dateStr = new Date().toISOString().split('T')[0];

      // 1. Deduct joining fee
      batch.update(userRef, {
        depositBalance: increment(-amount),
        coins: increment(-amount),
        mlmLevel: amount,
        rank: amount >= 5000 ? 'Gold' : amount >= 3000 ? 'Silver' : 'Bronze'
      });

      // 2. Ledger Entry
      batch.set(doc(collection(firestore, 'users', user.uid, 'ledger')), {
        type: 'mlm_joining',
        amount: amount,
        date: dateStr,
        status: 'completed',
        description: `MLM Package Activation: ${amount} Tier`
      });

      // 3. 30% Joining Commission Split (L1: 20%, L2: 10%)
      const commL1 = amount * 0.20;
      const commL2 = amount * 0.10;

      if (profile.referredBy) {
        const l1Ref = doc(firestore, 'users', profile.referredBy);
        batch.update(l1Ref, {
          referralCommissionBalance: increment(commL1),
          coins: increment(commL1)
        });
        batch.set(doc(collection(firestore, 'users', profile.referredBy, 'ledger')), {
          type: 'referral_comm',
          amount: commL1,
          date: dateStr,
          status: 'completed',
          description: `MLM Joining Commission (L1) from ${profile.email || profile.id}`
        });
      }

      if (profile.referredByL2) {
        const l2Ref = doc(firestore, 'users', profile.referredByL2);
        batch.update(l2Ref, {
          referralCommissionBalance: increment(commL2),
          coins: increment(commL2)
        });
        batch.set(doc(collection(firestore, 'users', profile.referredByL2, 'ledger')), {
          type: 'referral_comm',
          amount: commL2,
          date: dateStr,
          status: 'completed',
          description: `MLM Joining Commission (L2) from downline activity`
        });
      }

      await batch.commit();

      toast({ 
        title: "PACKAGE ACTIVATED!", 
        description: `You are now on the ${amount} tier. MLM earnings are live.` 
      });

    } catch (e) {
      toast({ variant: "destructive", title: "Activation Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const currentLevel = profile?.mlmLevel || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 shadow-2xl p-8 md:p-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-xl">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">MLM Network Hub</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white italic">
              ELITE <br />
              <span className="text-amber-500">PACKAGES</span>
            </h1>
            
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              Activate your MLM tier and earn 30% combined commission from your downline activity and joining fees.
            </p>
          </div>

          <div className="flex flex-col gap-4 w-full md:w-80">
             <BenefitItem text="20% Direct Referral Commission (L1)" />
             <BenefitItem text="10% Indirect Referral Commission (L2)" />
             <BenefitItem text="30% Share in Downline CPA Missions" />
             <BenefitItem text="Priority 2-Hour Payout Support" />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MlmPassCard tier="Starter" amount={1000} current={currentLevel} onJoin={() => handleMlmJoin(1000)} isProcessing={isProcessing === 1000} />
        <MlmPassCard tier="Pro Warrior" amount={3000} current={currentLevel} onJoin={() => handleMlmJoin(3000)} isProcessing={isProcessing === 3000} highlight />
        <MlmPassCard tier="Elite Master" amount={5000} current={currentLevel} onJoin={() => handleMlmJoin(5000)} isProcessing={isProcessing === 5000} />
        <MlmPassCard tier="Grand Arena" amount={10000} current={currentLevel} onJoin={() => handleMlmJoin(10000)} isProcessing={isProcessing === 10000} gold />
      </div>
    </div>
  );
}

function BenefitItem({ text }: any) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
       <CheckCircle2 className="h-5 w-5 text-amber-500" />
       <span className="text-[10px] font-black uppercase text-white tracking-widest">{text}</span>
    </div>
  );
}

function MlmPassCard({ tier, amount, current, onJoin, isProcessing, highlight, gold }: any) {
  const isOwned = current >= amount;
  
  return (
    <Card className={cn(
      "bg-[#121212] border-white/5 overflow-hidden rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[400px] transition-all relative group",
      highlight && "border-primary/40 shadow-[0_0_30px_rgba(255,123,0,0.1)]",
      gold && "border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]"
    )}>
      <div className="space-y-6">
        <div className={cn("h-14 w-14 rounded-2xl bg-white/5 border flex items-center justify-center", gold ? "text-amber-500 border-amber-500/20" : "text-primary border-primary/20")}>
           {gold ? <Crown className="h-8 w-8" /> : <Zap className="h-8 w-8" />}
        </div>
        <div>
           <h3 className="text-xl font-black uppercase italic tracking-tight">{tier}</h3>
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Join Fee: {amount} 🪙</p>
        </div>
        <ul className="space-y-3">
           <li className="flex items-center gap-2 text-[10px] font-bold text-white/60"><ArrowRight className="h-3 w-3 text-primary" /> L1: 20% Comm</li>
           <li className="flex items-center gap-2 text-[10px] font-bold text-white/60"><ArrowRight className="h-3 w-3 text-primary" /> L2: 10% Comm</li>
           <li className="flex items-center gap-2 text-[10px] font-bold text-white/60"><ArrowRight className="h-3 w-3 text-primary" /> Task Share: 30%</li>
        </ul>
      </div>

      <div className="pt-8 space-y-4">
        <Button 
          onClick={onJoin} 
          disabled={isProcessing || isOwned}
          className={cn(
            "w-full h-14 rounded-xl font-black uppercase italic text-sm",
            isOwned ? "bg-green-500/20 text-green-500" : 
            gold ? "bg-amber-500 text-black hover:bg-amber-600" : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {isProcessing ? <Loader2 className="animate-spin h-4 w-4" /> : isOwned ? "ACTIVE" : "JOIN NOW"}
        </Button>
      </div>
    </Card>
  );
}
