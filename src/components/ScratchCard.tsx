'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Gift, Sparkles, Coins, X, Loader2, PlayCircle } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ScratchCard({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isRevealed, setIsRevealed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  const [amount] = useState(() => Math.floor(Math.random() * 5) + 5); // 5 to 10 coins

  useEffect(() => {
    let timer: any;
    if (showAd && adCountdown > 0) {
      timer = setInterval(() => setAdCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showAd, adCountdown]);

  const initiateReveal = () => {
    if (isRevealed) return;
    setShowAd(true);
    setAdCountdown(10);
  };

  const handleClaimFinalize = async () => {
    if (!user || !firestore || isClaiming || adCountdown > 0) return;
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
        description: 'Scratch Card Reward [Ad Verified]'
      });

      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.play().catch(() => {});
      
      setIsRevealed(true);
      setShowAd(false);
      toast({ title: "COINS CREDITED", description: `+${amount} Coins added to your supplemental wallet.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "CLAIM FAILED" });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <Card className="max-w-sm w-full bg-[#1a1a1a] border-primary/20 rounded-[3rem] overflow-hidden relative shadow-2xl">
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-6 right-6 z-50 text-white/40 hover:text-white">
          <X className="h-6 w-6" />
        </Button>

        <div className="p-10 text-center space-y-8">
           <div className="mx-auto h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20">
              <Gift className="h-10 w-10 text-primary animate-bounce" />
           </div>
           
           <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase italic">Surprise Gift!</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Verify session to unlock your reward</p>
           </div>

           <div 
             onClick={initiateReveal}
             className={cn(
               "h-48 w-full rounded-[2rem] border-4 border-dashed flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group",
               isRevealed ? "border-green-500/40 bg-green-500/5" : "border-white/10 bg-white/5 hover:border-primary/40"
             )}
           >
              {!isRevealed ? (
                <div className="flex flex-col items-center gap-3">
                   <Sparkles className="h-10 w-10 text-primary opacity-40 animate-pulse" />
                   <p className="text-xs font-black uppercase tracking-widest text-primary">Tap to Reveal (Ad)</p>
                </div>
              ) : (
                <div className="text-center animate-in zoom-in-50 duration-500">
                   <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Claimed</p>
                   <div className="flex items-end justify-center gap-2">
                      <span className="text-6xl font-black italic text-white">{amount}</span>
                      <span className="text-2xl font-black text-primary mb-1">🪙</span>
                   </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
           </div>

           <Button 
            disabled={isRevealed || isClaiming} 
            onClick={initiateReveal}
            className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl"
           >
              {isRevealed ? "ALREADY CLAIMED" : "REVEAL GIFT"}
           </Button>
        </div>
      </Card>

      {/* REWARDED AD MODAL (Simulation) */}
      {showAd && (
        <div className="fixed inset-0 z-[300] bg-black/98 flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="max-w-md w-full text-center space-y-10">
              <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                 <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" style={{ animationDuration: '3s' }} />
                 <PlayCircle className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-black uppercase italic text-white">Unlocking Gift...</h3>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                    Sponsor signal processing. Reward will activate after {adCountdown}s.
                 </p>
              </div>
              <p className="text-6xl font-black text-white italic tabular-nums">{adCountdown}s</p>
              <Button 
                disabled={adCountdown > 0 || isClaiming} 
                onClick={handleClaimFinalize}
                className={cn(
                  "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                  adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                )}
              >
                 {isClaiming ? <Loader2 className="animate-spin" /> : adCountdown === 0 ? "CONFIRM REWARD" : "BUFFERING..."}
              </Button>
           </div>
        </div>
      )}
    </div>
  );
}
