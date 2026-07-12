
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Gift, Sparkles, Coins, X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';

export default function ScratchCard({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [amount] = useState(() => Math.floor(Math.random() * 5) + 1);

  const handleReveal = async () => {
    if (isRevealed || !user || !firestore) return;
    setIsRevealed(true);
    setIsClaiming(true);

    try {
      const userRef = doc(firestore, 'users', user.uid);
      await updateDoc(userRef, {
        bonusBalance: increment(amount),
        coins: increment(amount)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Scratch Card Surprise Bonus'
      });

      new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
    } catch (e) {
      console.error(e);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="max-w-sm w-full bg-[#1a1a1a] border-primary/20 rounded-[3rem] overflow-hidden relative shadow-2xl">
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-6 right-6 z-50 text-white/40 hover:text-white">
          <X className="h-6 w-6" />
        </Button>

        <div className="p-10 text-center space-y-8">
           <div className="mx-auto h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20">
              <Gift className="h-10 w-10 text-primary" />
           </div>
           
           <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase italic">Surprise Gift!</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">You earned a scratch card for joining</p>
           </div>

           <div 
             onClick={handleReveal}
             className={cn(
               "h-48 w-full rounded-[2rem] border-4 border-dashed flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group",
               isRevealed ? "border-secondary/40 bg-secondary/5" : "border-white/10 bg-white/5 hover:border-primary/40"
             )}
           >
              {!isRevealed ? (
                <div className="flex flex-col items-center gap-3 animate-bounce">
                   <Sparkles className="h-10 w-10 text-primary opacity-40" />
                   <p className="text-xs font-black uppercase tracking-widest text-primary">Tap to Reveal</p>
                </div>
              ) : (
                <div className="text-center animate-in zoom-in-50 duration-500">
                   <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">You Won</p>
                   <div className="flex items-end justify-center gap-2">
                      <span className="text-6xl font-black italic text-white">{amount}</span>
                      <span className="text-2xl font-black text-primary mb-1">🪙</span>
                   </div>
                </div>
              )}

              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
           </div>

           <Button 
            disabled={!isRevealed || isClaiming} 
            onClick={onClose}
            className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl"
           >
              {isClaiming ? <Loader2 className="animate-spin" /> : isRevealed ? "CLAIM & CLOSE" : "LOCKED"}
           </Button>
        </div>
      </Card>
    </div>
  );
}
