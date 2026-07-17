
'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Zap, ArrowRight, ShieldCheck, Star, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/app/lib/types';
import Link from 'next/link';

interface CelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export default function QuestCelebrationModal({ isOpen, onClose, profile }: CelebrationProps) {
  const currentINR = (profile.winningBalance + profile.taskBalance) / 100;
  const withdrawalGoal = 100;
  const needed = Math.max(0, withdrawalGoal - currentINR);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0a0a0f] border-amber-500/20 text-white max-w-md rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_100px_rgba(245,158,11,0.15)]">
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-amber-500/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-10 text-center space-y-8">
           <div className="mx-auto h-24 w-24 rounded-[2.5rem] bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center animate-bounce shadow-2xl">
              <Trophy className="h-12 w-12 text-amber-500" />
           </div>

           <div className="space-y-3">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                 Bonus <span className="text-amber-500">Unlocked!</span>
              </h2>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">VIP 1 Access Protocol Active</p>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                 <div className="text-left">
                    <p className="text-[9px] font-black uppercase text-muted-foreground">Cash Unlocked</p>
                    <p className="text-3xl font-black text-green-500 italic">₹{currentINR.toFixed(2)}</p>
                 </div>
                 <div className="h-10 w-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                    <Zap className="h-6 w-6" />
                 </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                 <p className="text-[9px] font-black uppercase text-amber-500 tracking-widest italic">Next Withdrawal Goal: ₹100.00</p>
                 <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${(currentINR / withdrawalGoal) * 100}%` }} />
                 </div>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                    Earn <span className="text-white">₹{needed.toFixed(2)} more</span> to make your first industrial withdrawal!
                 </p>
              </div>
           </div>

           <div className="grid gap-4">
              <Button asChild onClick={onClose} className="h-16 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic text-lg rounded-2xl shadow-xl shadow-amber-500/20">
                 <Link href="/earning-hub">COMPLETE MORE TASKS <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button variant="ghost" onClick={onClose} className="h-12 font-black uppercase text-[10px] text-muted-foreground tracking-widest">
                 Close Signal
              </Button>
           </div>

           <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase text-muted-foreground opacity-40 italic">
              <ShieldCheck className="h-3 w-3" /> Identity Audit Pass: VIP 1
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
