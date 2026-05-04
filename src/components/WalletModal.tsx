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
import { Wallet, ArrowUpRight, Plus, CreditCard, Info, IndianRupee, Send } from 'lucide-react';
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

  const balance = profile?.coins || 0;
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
              {balance.toLocaleString()} 🪙
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
            My Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Balance Display */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Balance</p>
              <h2 className="text-4xl font-black text-green-500 tracking-tighter">
                {balance.toLocaleString()} <span className="text-xl">🪙</span>
              </h2>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Withdrawable</p>
              <h2 className="text-2xl font-black text-white/90 tracking-tighter">
                ₹{balance.toFixed(2)}
              </h2>
            </div>
          </div>

          {/* Quick Actions */}
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
              As per our policy, all top-ups are handled manually via Telegram for 100% security.
            </p>
          </div>

          {/* Withdrawal Info Section */}
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Withdrawal Info
              </h3>
              <Button variant="link" size="sm" asChild className="text-[10px] h-auto p-0 font-bold text-primary">
                <Link href="/dashboard">Edit Details</Link>
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] font-medium text-muted-foreground">Linked UPI</span>
                <span className="text-sm font-bold tracking-tight">{profile?.upiId || 'Not Linked'}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] font-medium text-muted-foreground">Bank Status</span>
                <span className="text-sm font-bold tracking-tight text-primary uppercase">Verified</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[9px] text-muted-foreground leading-relaxed">
                Withdrawals are processed within 2-24 hours. Minimum withdrawal amount is ₹110.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">
          <IndianRupee className="h-3 w-3" />
          Powered by SecurePay Arena
        </div>
      </DialogContent>
    </Dialog>
  );
}