
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
import { Wallet, ArrowUpRight, Plus, CreditCard, Info, IndianRupee, Send, Trophy, Zap, RefreshCcw, Loader2 } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { UserProfile, AppSettings } from '@/app/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';

const TASK_CONVERSION_FEE = 0.012; // 1.2%

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
  
  const telegramUrl = settings?.telegramUrl || 'https://t.me/bracketbattles_support';

  const handleManualTopup = () => {
    const message = encodeURIComponent('I want to add funds to my Arena Wallet');
    window.open(`${telegramUrl}?text=${message}`, '_blank');
  };

  const handleConvertTasks = async () => {
    const amount = parseFloat(convertAmount);
    if (!user || !firestore || !userProfileRef) return;
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount" });
      return;
    }
    if (amount > taskBal) {
      toast({ variant: "destructive", title: "Insufficient Task Balance" });
      return;
    }

    setIsConverting(true);
    try {
      const fee = amount * TASK_CONVERSION_FEE;
      const netAmount = amount - fee;

      await updateDoc(userProfileRef, {
        taskBalance: increment(-amount),
        winningBalance: increment(netAmount),
        withdrawableCoins: increment(netAmount), // Sync legacy field
        coins: increment(-fee) // Legacy total adjustment
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'conversion',
        amount: netAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Converted ${amount} Task Coins to Winnings. Fee: ${fee.toFixed(2)} (1.2%)`
      });

      toast({ title: "Conversion Successful", description: `${netAmount.toFixed(2)} added to Winning Balance.` });
      setConvertAmount('');
    } catch (e) {
      toast({ variant: "destructive", title: "Conversion Failed" });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 border border-border/50">
            <Wallet className="h-4 w-4 text-secondary" />
            <span className="text-sm font-black text-secondary">
              {(depositBal + winningBal).toLocaleString()} 🪙
            </span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        <DialogHeader className="relative z-10 p-6 pb-0">
          <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shadow-xl">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Tactical Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6 relative z-10">
          {/* Main Balance Display */}
          <div className="grid grid-cols-3 gap-3">
            <BalanceCard label="Deposits" value={depositBal} color="white" icon={<Plus className="h-3 w-3" />} />
            <BalanceCard label="Winnings" value={winningBal} color="green" icon={<Trophy className="h-3 w-3" />} />
            <BalanceCard label="Tasks" value={taskBal} color="amber" icon={<Zap className="h-3 w-3" />} />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4">
             <Button onClick={handleManualTopup} className="bg-primary hover:bg-primary/90 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20">
                <Send className="h-4 w-4 mr-2" /> Add Funds
             </Button>
             <Button asChild className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-secondary/20">
                <Link href="/withdraw">
                   Withdraw <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
             </Button>
          </div>

          {/* Conversion Tool */}
          <div className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                   <RefreshCcw className="h-3 w-3 text-amber-500" /> Task Conversion
                </h4>
                <Badge className="bg-amber-500/10 text-amber-500 text-[8px] font-black border-none px-2">1.2% FEE</Badge>
             </div>
             
             <div className="flex gap-2">
                <div className="relative flex-1">
                   <Input 
                    type="number" 
                    placeholder="Amount to convert..." 
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="bg-black/40 border-white/10 h-12 rounded-xl text-xs font-bold"
                   />
                </div>
                <Button 
                  onClick={handleConvertTasks}
                  disabled={isConverting || !convertAmount}
                  className="bg-amber-500 hover:bg-amber-600 text-black h-12 px-6 rounded-xl font-black text-[10px] uppercase"
                >
                  {isConverting ? <Loader2 className="animate-spin h-4 w-4" /> : "CONVERT"}
                </Button>
             </div>
             <p className="text-[9px] text-muted-foreground italic font-medium">Convert earned Task Income to withdrawable Winning Balance.</p>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
             <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
             <p className="text-[9px] text-muted-foreground leading-relaxed">
                <strong>Policy:</strong> Only Winning Balance can be withdrawn. 10 Winning Coins = ₹1. Min. withdrawal ₹110. Deposits used for tournaments only.
             </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BalanceCard({ label, value, color, icon }: any) {
  const colorMap = {
    white: "text-white bg-white/5 border-white/10",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  };

  return (
    <div className={cn("p-4 rounded-2xl border text-center space-y-1 backdrop-blur-md", colorMap[color as keyof typeof colorMap])}>
       <p className="text-[8px] font-black uppercase tracking-widest opacity-60 flex items-center justify-center gap-1">
          {icon} {label}
       </p>
       <h3 className="text-lg font-black tracking-tighter">{value.toLocaleString()}</h3>
    </div>
  );
}
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { collection } from 'firebase/firestore';
