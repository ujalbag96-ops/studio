
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, ArrowUpRight, Plus, CreditCard, Info, IndianRupee, Send, Trophy } from 'lucide-react';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { UserProfile, AppSettings } from '@/app/lib/types';
import Link from 'next/link';

interface WalletModalProps {
  children?: React.ReactNode;
}

export default function WalletModal({ children }: WalletModalProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  
  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const balanceCoins = profile?.coins || 0;
  const withdrawableCoins = profile?.withdrawableCoins || 0;
  const rupeeValue = withdrawableCoins / 10; // 10 winning coins = ₹1
  const telegramUrl = settings?.telegramUrl || 'https://t.me/bracketbattles_support';

  const handleManualTopup = () => {
    const message = encodeURIComponent('I want to add funds to my wallet');
    window.open(`${telegramUrl}?text=${message}`, '_blank');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 border border-border/50">
            <Wallet className="h-4 w-4 text-secondary" />
            <span className="text-sm font-black text-secondary">
              {balanceCoins.toLocaleString()} 🪙
            </span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#1e1e1e] border-white/10 text-white max-w-md rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            Arena Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Balance</p>
              <h2 className="text-3xl font-black text-white/60 tracking-tighter">
                {balanceCoins.toLocaleString()} <span className="text-lg">🪙</span>
              </h2>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center justify-end gap-1">
                <Trophy className="h-2 w-2" /> Winning Balance
              </p>
              <h2 className="text-3xl font-black text-green-500 tracking-tighter">
                {withdrawableCoins.toLocaleString()} <span className="text-lg">🪙</span>
              </h2>
              <p className="text-[10px] font-bold text-white/40">≈ ₹{rupeeValue.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={handleManualTopup}
                className="bg-green-600 hover:bg-green-700 h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-green-900/20"
              >
                <Send className="h-5 w-5 mr-2" /> Add Funds
              </Button>
              <Button asChild className="bg-yellow-500 hover:bg-yellow-600 text-black h-14 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-yellow-900/20">
                <Link href="/withdraw">
                  Withdraw <ArrowUpRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground font-medium px-4 leading-relaxed">
              <strong>Important:</strong> Only Winning Balance (Tournament wins & tasks) can be withdrawn to ₹.
            </p>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Withdrawal Policy
              </h3>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                Min. Withdrawal: ₹110 (1,100 Winning Coins). Processing fee: 8%. Deposits cannot be withdrawn.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
