
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Crown, Zap, ShieldCheck, Star, ArrowRight, Loader2, CreditCard, Gift, Trophy } from 'lucide-react';
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
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handlePurchase = async (tier: 'weekly' | 'monthly', price: number) => {
    if (!user || !firestore || !userRef || !profile) return;
    
    if (profile.depositBalance < price) {
      toast({ variant: "destructive", title: "Insufficient Deposit Balance", description: "Top up your wallet to buy VIP pass." });
      return;
    }

    setIsProcessing(tier);
    
    try {
      const expiry = new Date();
      if (tier === 'weekly') expiry.setDate(expiry.getDate() + 7);
      else expiry.setDate(expiry.getDate() + 30);

      const updateData = {
        depositBalance: increment(-price),
        coins: increment(-price),
        vipStatus: {
          isActive: true,
          tier: tier,
          expiryDate: expiry.toISOString()
        }
      };

      await updateDoc(userRef, updateData);

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'vip_purchase',
        amount: price,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Purchased Elite ${tier === 'weekly' ? 'Weekly' : 'Monthly'} Pass`
      });

      toast({ 
        title: "VIP STATUS ACTIVATED!", 
        description: `Welcome to the Elite Club. Discounts are now active.` 
      });

    } catch (e) {
      toast({ variant: "destructive", title: "Activation Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const isVip = profile?.vipStatus?.isActive && new Date(profile.vipStatus.expiryDate) > new Date();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 shadow-2xl p-8 md:p-20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 shadow-xl">
              <Crown className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Elite Sector Access</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white italic">
              VIP <br />
              <span className="text-amber-500">ARENA</span> CLUB
            </h1>
            
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              Scale your earnings with the professional pass. Get exclusive discounts on tournament entries and priority withdrawals.
            </p>
          </div>

          {isVip ? (
            <Card className="w-full md:w-96 bg-amber-500 border-none rounded-[2.5rem] p-10 text-black shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:scale-125 transition-transform">
                  <Trophy className="h-32 w-32" />
               </div>
               <div className="relative z-10 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Your Current Status</p>
                  <h3 className="text-4xl font-black uppercase italic">{profile?.vipStatus?.tier} ELITE</h3>
                  <div className="pt-4 border-t border-black/10">
                     <p className="text-[9px] font-bold uppercase">Expires On</p>
                     <p className="text-sm font-black italic">{new Date(profile?.vipStatus?.expiryDate || '').toLocaleDateString()}</p>
                  </div>
               </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-4 w-full md:w-80">
               <BenefitItem text="10% Tournament Entry Discount" />
               <BenefitItem text="Instant Coin Conversions" />
               <BenefitItem text="Priority Admin Support" />
               <BenefitItem text="Exclusive VIP Tournaments" />
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <PassCard 
          tier="Weekly Elite" 
          price={99} 
          validity="7 Days" 
          discount="10%" 
          onPurchase={() => handlePurchase('weekly', 99)}
          isProcessing={isProcessing === 'weekly'}
          isVip={isVip}
        />
        <PassCard 
          tier="Monthly Pro" 
          price={299} 
          validity="30 Days" 
          discount="20%" 
          highlight
          onPurchase={() => handlePurchase('monthly', 299)}
          isProcessing={isProcessing === 'monthly'}
          isVip={isVip}
        />
      </div>
    </div>
  );
}

function BenefitItem({ text }: any) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
       <ShieldCheck className="h-5 w-5 text-amber-500" />
       <span className="text-[10px] font-black uppercase text-white tracking-widest">{text}</span>
    </div>
  );
}

function PassCard({ tier, price, validity, discount, onPurchase, isProcessing, isVip, highlight }: any) {
  return (
    <Card className={cn(
      "bg-[#121212] border-white/5 overflow-hidden rounded-[3rem] p-10 flex flex-col justify-between min-h-[450px] transition-all relative group",
      highlight && "border-amber-500/40 border-2 shadow-[0_0_50px_rgba(245,158,11,0.1)]"
    )}>
      {highlight && <div className="absolute top-6 right-10 bg-amber-500 text-black font-black uppercase text-[8px] px-3 py-1 rounded-full italic tracking-widest">BEST VALUE</div>}
      
      <div className="space-y-8">
        <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-500">
           <Star className={cn("h-8 w-8", highlight && "fill-amber-500")} />
        </div>
        <div className="space-y-2">
           <h3 className="text-3xl font-black uppercase italic tracking-tight">{tier}</h3>
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">VALID FOR {validity}</p>
        </div>
        <div className="flex flex-col gap-3">
           <p className="flex items-center gap-3 text-xs font-bold text-white/80"><ArrowRight className="h-3 w-3 text-amber-500" /> {discount} Entry Discount</p>
           <p className="flex items-center gap-3 text-xs font-bold text-white/80"><ArrowRight className="h-3 w-3 text-amber-500" /> No Conversion Fees</p>
           <p className="flex items-center gap-3 text-xs font-bold text-white/80"><ArrowRight className="h-3 w-3 text-amber-500" /> Priority Withdrawals</p>
        </div>
      </div>

      <div className="pt-10 space-y-6">
        <div className="flex items-end gap-2">
           <p className="text-5xl font-black italic">{price}</p>
           <p className="text-xl font-black opacity-30 mb-1">🪙</p>
        </div>
        <Button 
          onClick={onPurchase}
          disabled={isProcessing || isVip}
          className={cn(
            "w-full h-16 rounded-2xl font-black uppercase italic text-lg shadow-xl",
            highlight ? "bg-amber-500 hover:bg-amber-600 text-black" : "bg-white text-black hover:bg-white/90"
          )}
        >
          {isProcessing ? <Loader2 className="animate-spin h-5 w-5" /> : isVip ? "ELITE ACTIVE" : "UPGRADE NOW"}
        </Button>
      </div>
    </Card>
  );
}
