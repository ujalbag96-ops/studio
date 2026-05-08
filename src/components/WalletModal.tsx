
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, Plus, CreditCard, Info, IndianRupee, Trophy, Zap, RefreshCcw, Loader2, Crown, ShieldCheck, ArrowRight } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, addDoc, getDoc } from 'firebase/firestore';
import { UserProfile, AppSettings } from '@/app/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { collection } from 'firebase/firestore';

export default function WalletModal({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  
  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const [isConverting, setIsConverting] = useState(false);
  const [convertAmount, setConvertAmount] = useState('');

  const depositBal = profile?.depositBalance || 0;
  const winningBal = profile?.winningBalance || 0;
  const taskBal = profile?.taskBalance || 0;
  
  // TIER BASED FEES
  const baseFee = 0.012; // 1.2%
  const tierFee = profile?.rank === 'Gold' ? 0.005 : profile?.rank === 'Silver' ? 0.008 : baseFee;
  
  const telegramUrl = settings?.telegramUrl || 'https://t.me/bracketbattles_support';

  const handleManualTopup = () => {
    const message = encodeURIComponent('I want to add funds to my Arena Wallet');
    window.open(`${telegramUrl}?text=${message}`, '_blank');
  };

  const handleConvertTasks = async () => {
    const amount = parseFloat(convertAmount);
    if (!user || !firestore || !userProfileRef || !profile) return;
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Volume" });
      return;
    }
    if (amount > taskBal) {
      toast({ variant: "destructive", title: "Insufficient Task Funds" });
      return;
    }

    setIsConverting(true);
    try {
      const fee = amount * tierFee;
      const netAmount = amount - fee;

      const passivePercent = settings?.passiveReferralPercent || 2;
      const passiveBonus = netAmount * (passivePercent / 100);

      await updateDoc(userProfileRef, {
        taskBalance: increment(-amount),
        winningBalance: increment(netAmount),
        coins: increment(-fee)
      });

      // Credit Referrer (Level 2 Passive Earning)
      if (profile.referredBy) {
         const refRef = doc(firestore, 'users', profile.referredBy);
         const refSnap = await getDoc(refRef);
         if (refSnap.exists()) {
            await updateDoc(refRef, {
               winningBalance: increment(passiveBonus),
               coins: increment(passiveBonus)
            });
            await addDoc(collection(firestore, 'users', profile.referredBy, 'ledger'), {
               type: 'passive_referral',
               amount: passiveBonus,
               date: new Date().toISOString().split('T')[0],
               status: 'completed',
               description: `Passive Commission: Recruit converted tasks.`
            });
         }
      }

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'conversion',
        amount: netAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Conversion Protocol: ${(tierFee * 100).toFixed(1)}% Fee Applied`
      });

      toast({ title: "Conversion Successful", description: `${netAmount.toFixed(1)} added to Winnings.` });
      setConvertAmount('');
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failure" });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" className="flex items-center gap-2 rounded-full bg-[#121216] px-4 py-1.5 border border-white/5 hover:bg-white/5">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-black text-white tabular-nums">
              {(depositBal + winningBal).toLocaleString()} 🪙
            </span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] overflow-hidden p-0">
        <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-8 space-y-10">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3">
                 <Wallet className="h-8 w-8 text-white" />
               </div>
               <div>
                 <h2 className="text-2xl font-black uppercase tracking-tighter italic">Tactical Vault</h2>
                 <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-green-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">3-Layer Encryption Active</span>
                 </div>
               </div>
             </div>
             <div className="text-right">
                <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Rank Status</p>
                <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm italic">
                   <Crown className="h-3 w-3" /> {profile?.rank || 'Bronze'}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             {/* Dynamic Wallet Display */}
             <div className="grid grid-cols-3 gap-3">
               <BalanceRow label="DEPOSIT" value={depositBal} color="blue" icon={<CreditCard className="h-3 w-3" />} />
               <BalanceRow label="TASK" value={taskBal} color="amber" icon={<Zap className="h-3 w-3" />} />
               <BalanceRow label="WINNING" value={winningBal} color="green" icon={<Trophy className="h-3 w-3" />} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <Button onClick={handleManualTopup} className="bg-primary hover:bg-primary/90 h-20 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 italic group">
                <Plus className="h-4 w-4 mr-2 group-hover:scale-125 transition-transform" /> ADD FUNDS
             </Button>
             <Button asChild className="bg-[#121216] border border-white/10 hover:bg-white/5 h-20 rounded-2xl font-black uppercase tracking-widest text-xs italic">
                <Link href="/withdraw" className="flex items-center">
                   WITHDRAW <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
             </Button>
          </div>

          {/* Conversion Pathway Section */}
          <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-inner relative overflow-hidden">
             <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                   <h4 className="text-xs font-black uppercase tracking-widest italic flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4 text-amber-500" /> Conversion Protocol
                   </h4>
                   <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest italic">Transfer Task Coins to Winnings</p>
                </div>
                <Badge className="bg-amber-500 text-black text-[9px] font-black border-none px-3 py-1 uppercase">{(tierFee * 100).toFixed(1)}% FEE</Badge>
             </div>
             
             <div className="flex gap-3 relative z-10">
                <div className="flex-1 relative">
                   <Input 
                    type="number" 
                    placeholder="Volume..." 
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="bg-black/40 border-white/10 h-16 rounded-2xl text-lg font-black focus:ring-amber-500 pl-12"
                   />
                   <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500 opacity-40" />
                </div>
                <Button 
                  onClick={handleConvertTasks}
                  disabled={isConverting || !convertAmount}
                  className="bg-amber-500 hover:bg-amber-600 text-black h-16 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20"
                >
                  {isConverting ? <Loader2 className="animate-spin h-5 w-5" /> : "EXECUTE"}
                </Button>
             </div>

             <div className="flex items-center justify-center gap-4 py-2">
                <div className="text-[10px] font-black text-amber-500 uppercase">TASK HUB</div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-40" />
                <div className="text-[10px] font-black text-green-500 uppercase">WINNING VAULT</div>
             </div>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 flex items-start gap-4">
             <Info className="h-5 w-5 text-primary shrink-0 mt-1" />
             <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">
                <strong>STANDARD POLICY:</strong> Only Winning Balance can be withdrawn. Minimum ₹110. Multiple task completions are verified by admin before release.
             </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BalanceRow({ label, value, color, icon }: any) {
  const colorMap = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20"
  };

  return (
    <div className={cn("p-4 rounded-2xl border text-center space-y-1.5 backdrop-blur-3xl transition-transform hover:scale-105", colorMap[color as keyof typeof colorMap])}>
       <p className="text-[8px] font-black uppercase tracking-[0.1em] opacity-60 flex items-center justify-center gap-1.5">
          {icon} {label}
       </p>
       <h3 className="text-xl font-black tracking-tighter tabular-nums">{value.toFixed(1)}</h3>
    </div>
  );
}
