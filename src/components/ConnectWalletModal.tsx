
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  SmartphoneNfc, 
  Wallet, 
  ArrowRight, 
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ConnectWalletModal({ isOpen, onOpenChange }: ConnectWalletModalProps) {
  const providers = [
    { id: 'upi', name: 'UPI Gateway', description: 'GPay, PhonePe, Paytm', icon: <SmartphoneNfc />, color: 'bg-primary' },
    { id: 'card', name: 'Bank Transfer', description: 'Direct IMPS/NEFT', icon: <CreditCard />, color: 'bg-blue-500' },
    { id: 'crypto', name: 'Binance Pay', description: 'USDT (Global)', icon: <Globe />, color: 'bg-amber-500' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2.5rem] overflow-hidden p-0">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-8 space-y-8">
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Connect Wallet</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
              Choose your preferred provider to manage assets.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpenChange(false)}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/40 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-xl", p.color)}>
                    {p.icon}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black uppercase tracking-tight">{p.name}</p>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">{p.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/5 text-center">
             <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase text-muted-foreground italic">
                <ShieldCheck className="h-3 w-3 text-primary" /> Bracket Battles Secured Connection
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
