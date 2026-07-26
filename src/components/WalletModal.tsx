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
import { Wallet, ArrowUpRight, Trophy, Zap, RefreshCw, Loader2, Globe, CreditCard } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { UserProfile } from '@/app/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { formatCurrency } from '@/lib/currency';

export default function WalletModal({ children }: { children?: React.ReactNode }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isConverting, setIsConverting] = useState(false);
  const [convertAmount, setConvertAmount] = useState('');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const winningBal = profile?.winningBalance || 0;
  const taskBal = profile?.taskBalance || 0;
  
  const totalDisplayBalance = formatCurrency(winningBal + taskBal, profile?.country);
  const isIndia = profile?.country === 'India';

  const handleConvertTasks = async () => {
    const amount = parseFloat(convertAmount);
    if (!user || !firestore || !userRef || !profile) return;
    if (isNaN(amount) || amount <= 0) return;
    if (amount > taskBal) {
      toast({ variant: "destructive", title: "Insufficient earnings" });
      return;
    }

    setIsConverting(true);
    const updateData = {
      taskBalance: increment(-amount),
      winningBalance: increment(amount)
    };

    try {
       await updateDoc(userRef, updateData);
       await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
          type: 'conversion',
          amount,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Converted Mission Revenue to Winnings`
       });
       toast({ title: "CONVERSION SUCCESS" });
       setConvertAmount('');
    } catch (err: any) {
       errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData,
       }));
    } finally {
       setIsConverting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <button className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 border border-primary/20 hover:bg-primary/20 transition-all">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-black text-white tabular-nums">
              {totalDisplayBalance}
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] overflow-hidden p-0 shadow-2xl">
        <VisuallyHidden.Root>
          <DialogTitle>Industrial Wallet Sync</DialogTitle>
        </VisuallyHidden.Root>
        
        <div className="relative z-10 p-8 space-y-8">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center shadow-lg">
                 <Wallet className="h-6 w-6 text-white" />
               </div>
               <div>
                 <h2 className="text-xl font-black uppercase italic">Hub Portfolio</h2>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1"><Globe className="h-2 w-2" /> {profile?.country || 'Global Node'}</span>
                 </div>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <BalanceRow label="MISSIONS" value={taskBal} country={profile?.country} color="amber" />
             <BalanceRow label="WINNINGS" value={winningBal} country={profile?.country} color="green" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <Button asChild className="bg-primary hover:bg-primary/90 h-14 rounded-xl font-black uppercase text-xs">
                <Link href="/earning-hub">Earn More</Link>
             </Button>
             <Button asChild className="bg-white/5 border border-white/10 hover:bg-white/10 h-14 rounded-xl font-black uppercase text-xs">
                <Link href={isIndia ? "/withdraw" : "/shop"} className="flex items-center justify-center">
                   {isIndia ? "Withdraw" : "Shop"} <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
             </Button>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
             <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase italic flex items-center gap-2 text-amber-500">
                  <RefreshCw className={cn("h-4 w-4", isConverting && "animate-spin")} /> Move Revenue to Winnings
                </h4>
             </div>
             <div className="flex gap-2">
                <Input 
                  type="number" 
                  placeholder="Amount..." 
                  value={convertAmount}
                  onChange={(e) => setConvertAmount(e.target.value)}
                  className="bg-black border-white/10 h-12 rounded-xl text-lg font-black"
                />
                <Button onClick={handleConvertTasks} disabled={isConverting || !convertAmount} className="bg-amber-500 hover:bg-amber-600 text-black h-12 px-6 rounded-xl font-black text-xs uppercase">
                  {isConverting ? <Loader2 className="animate-spin h-5 w-5" /> : "Move"}
                </Button>
             </div>
          </div>
          
          <div className="p-4 bg-green-500/5 rounded-xl text-center border border-green-500/10">
             <p className="text-[8px] font-bold text-green-500 uppercase tracking-widest italic">100% Free CampusHub Protocol v1.0</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BalanceRow({ label, value, country, color }: any) {
  const colorMap = {
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/20",
    green: "text-green-500 bg-green-500/5 border-green-500/20"
  };

  return (
    <div className={cn("p-4 rounded-xl border text-center space-y-1", colorMap[color as keyof typeof colorMap])}>
       <p className="text-[8px] font-black uppercase opacity-60">{label}</p>
       <h3 className="text-xs font-black tabular-nums">{formatCurrency(value, country)}</h3>
    </div>
  );
}