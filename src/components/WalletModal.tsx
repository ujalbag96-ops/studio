
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, Plus, CreditCard, Trophy, Zap, RefreshCcw, Loader2, Crown, Globe } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { UserProfile, AppSettings } from '@/app/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import ConnectWalletModal from './ConnectWalletModal';
import { formatCurrency } from '@/lib/currency';

export default function WalletModal({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [convertAmount, setConvertAmount] = useState('');

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const depositBal = profile?.depositBalance || 0;
  const winningBal = profile?.winningBalance || 0;
  const taskBal = profile?.taskBalance || 0;
  
  const totalDisplayBalance = formatCurrency(depositBal + winningBal);

  const handleConvertTasks = async () => {
    const amount = parseFloat(convertAmount);
    if (!user || !firestore || !userProfileRef || !profile) return;
    if (isNaN(amount) || amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount" });
      return;
    }
    if (amount > taskBal) {
      toast({ variant: "destructive", title: "Not enough bonus coins" });
      return;
    }

    setIsConverting(true);
    const fee = 0; // Removing fee for pure skill-based context
    const netAmount = amount;

    const updateData = {
      taskBalance: increment(-amount),
      winningBalance: increment(netAmount)
    };

    updateDoc(userProfileRef, updateData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userProfileRef.path,
        operation: 'update',
        requestResourceData: updateData,
      }));
    });

    const ledgerData = {
      type: 'conversion',
      amount: netAmount,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Converted Study/Arcade Earnings to Cash`
    };

    addDoc(collection(firestore, 'users', user.uid, 'ledger'), ledgerData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${user.uid}/ledger`,
        operation: 'create',
        requestResourceData: ledgerData,
      }));
    });

    toast({ title: "Success", description: "Earnings converted to winning balance." });
    setConvertAmount('');
    setIsConverting(false);
  };

  return (
    <>
      <ConnectWalletModal isOpen={isConnectOpen} onOpenChange={setIsConnectOpen} />
      
      <Dialog>
        <DialogTrigger asChild>
          {children || (
            <button className="flex items-center gap-2 rounded-full bg-[#121216] px-4 py-1.5 border border-white/5 hover:bg-white/5">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-black text-white tabular-nums">
                {totalDisplayBalance}
              </span>
            </button>
          )}
        </DialogTrigger>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] overflow-hidden p-0">
          <VisuallyHidden.Root>
            <DialogTitle>My Wallet</DialogTitle>
          </VisuallyHidden.Root>
          
          <div className="relative z-10 p-8 space-y-10">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                   <Wallet className="h-6 w-6 text-white" />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black uppercase italic">My Wallet</h2>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground">Industrial Sync Active</span>
                   </div>
                 </div>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Rank</p>
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold text-sm italic">
                     <Crown className="h-3 w-3" /> {profile?.rank || 'Bronze'}
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
               <BalanceRow label="DEPOSIT" value={depositBal} color="blue" icon={<CreditCard className="h-3 w-3" />} />
               <BalanceRow label="EARNINGS" value={taskBal} color="amber" icon={<Zap className="h-3 w-3" />} />
               <BalanceRow label="WINNINGS" value={winningBal} color="green" icon={<Trophy className="h-3 w-3" />} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <Button onClick={() => setIsConnectOpen(true)} className="bg-primary hover:bg-primary/90 h-16 rounded-xl font-black uppercase text-xs">
                  <Plus className="h-4 w-4 mr-2" /> Add Cash
               </Button>
               <Button asChild className="bg-[#121216] border border-white/10 hover:bg-white/5 h-16 rounded-xl font-black uppercase text-xs">
                  <Link href="/withdraw" className="flex items-center justify-center">
                     Withdraw <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Link>
               </Button>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-6">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                     <h4 className="text-xs font-bold uppercase italic flex items-center gap-2">
                        <RefreshCcw className="h-4 w-4 text-amber-500" /> Convert Earnings
                     </h4>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase italic">Transfer study rewards to winnings</p>
                  </div>
               </div>
               
               <div className="flex gap-3">
                  <div className="flex-1 relative">
                     <Input 
                      type="number" 
                      placeholder="Amount..." 
                      value={convertAmount}
                      onChange={(e) => setConvertAmount(e.target.value)}
                      className="bg-black border-white/10 h-14 rounded-xl text-lg font-black focus:ring-amber-500 pl-10"
                     />
                     <Zap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500 opacity-40" />
                  </div>
                  <Button 
                    onClick={handleConvertTasks}
                    disabled={isConverting || !convertAmount}
                    className="bg-amber-500 hover:bg-amber-600 text-black h-14 px-8 rounded-xl font-black text-xs uppercase"
                  >
                    {isConverting ? <Loader2 className="animate-spin h-5 w-5" /> : "Convert"}
                  </Button>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BalanceRow({ label, value, color, icon }: any) {
  const colorMap = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20"
  };

  const displayVal = formatCurrency(value);

  return (
    <div className={cn("p-4 rounded-xl border text-center space-y-1", colorMap[color as keyof typeof colorMap])}>
       <p className="text-[8px] font-bold uppercase opacity-60 flex items-center justify-center gap-1">
          {icon} {label}
       </p>
       <h3 className="text-sm font-black tabular-nums">{displayVal}</h3>
       <p className="text-[7px] font-bold opacity-40">{value.toLocaleString()} 🪙</p>
    </div>
  );
}
