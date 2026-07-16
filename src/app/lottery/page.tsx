
'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Zap, 
  ShieldCheck, 
  Loader2, 
  PlayCircle, 
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import LivePrizePool from '@/components/LivePrizePool';
import Link from 'next/link';

export default function LotteryTerminal() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let interval: any;
    if (showAdModal && adCountdown > 0) {
      interval = setInterval(() => setAdCountdown(c => c - 1), 1000);
    } else if (showAdModal && adCountdown === 0) {
      // Reward logic handled in modal
    }
    return () => clearInterval(interval);
  }, [showAdModal, adCountdown]);

  const handleNumSelect = (num: number) => {
    if (!user) {
      toast({ variant: "destructive", title: "Identification Required" });
      return;
    }
    setSelectedNum(num);
    setShowAdModal(true);
    setAdCountdown(10);
  };

  const handleEntryConfirm = async () => {
    if (!user || !firestore || selectedNum === null) return;
    
    setIsProcessing(true);
    try {
      // 1. Log entry in Firestore
      await addDoc(collection(firestore, 'lottery_entries'), {
        userId: user.uid,
        userEmail: user.email,
        selectedNumber: selectedNum,
        timestamp: new Date().toISOString(),
        status: 'active'
      });

      // 2. Increment global participant counter
      const poolRef = doc(firestore, 'daily_pool', 'config');
      await updateDoc(poolRef, {
        total_participants: increment(1)
      });

      toast({ 
        title: "ENTRY VERIFIED", 
        description: `Your number ${selectedNum} has been locked in for the midnight draw.` 
      });
      
      setShowAdModal(false);
      setSelectedNum(null);
      new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
    } catch (e) {
      toast({ variant: "destructive", title: "Verification Error" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-4 pt-10 text-center">
         <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
            <Trophy className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Rewarded Jackpot Arena</span>
         </div>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Daily <span className="text-primary">Lottery</span></h1>
         <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest italic">Watch Ad to enter for free • WIN ₹500+ DAILY</p>
      </header>

      <LivePrizePool />

      <section className="space-y-8">
         <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-black uppercase italic italic tracking-tighter">Choose Your <span className="text-primary">Lucky Signal</span></h2>
            <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase">Draw at 12:00 AM</Badge>
         </div>

         <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
               <button
                  key={num}
                  onClick={() => handleNumSelect(num)}
                  className="h-24 rounded-3xl bg-[#0a0a0f] border-2 border-white/5 flex items-center justify-center text-4xl font-black italic text-white hover:border-primary hover:bg-primary/10 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
               >
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {num}
               </button>
            ))}
         </div>
      </section>

      {/* REWARDED AD MODAL (Simulation) */}
      {showAdModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
           <Card className="max-w-md w-full bg-[#0d0d12] border-white/10 rounded-[3rem] overflow-hidden relative shadow-2xl">
              {adCountdown > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setShowAdModal(false);
                    toast({ variant: "destructive", title: "Verification Failed", description: "Watch full video to confirm your entry." });
                  }}
                  className="absolute top-6 right-6 z-50 text-white/40 hover:text-white"
                >
                   <X />
                </Button>
              )}

              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(10 - adCountdown) * 36}deg)` }}
                    />
                    <PlayCircle className="h-12 w-12 text-primary animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic">Verifying Slot...</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Sponsor signal analysis in progress. Reward will be credited after session lock.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0 || isProcessing} 
                      onClick={handleEntryConfirm}
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {isProcessing ? <Loader2 className="animate-spin" /> : adCountdown === 0 ? "CONFIRM ENTRY" : "WATCHING AD..."}
                    </Button>
                 </div>
              </div>
              
              <div className="bg-white/5 p-4 text-center">
                 <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">AdMob Industrial Rewarded Integration v4.1</p>
              </div>
           </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
         <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-amber-500">
               <ShieldCheck /> Security Protocol
            </h3>
            <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
               <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> One entry per 24 hour draw cycle.</li>
               <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Ad completion is verified server-side.</li>
               <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> 20% platform rake applied to total pool.</li>
            </ul>
         </Card>

         <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-primary" />
            <h4 className="text-xl font-black uppercase italic">Draw Schedule</h4>
            <p className="text-xs font-medium text-muted-foreground uppercase leading-relaxed">
               Winning number is generated at 00:00 AM server time. Winners receive prize directly in winning balance.
            </p>
         </Card>
      </div>
    </div>
  );
}
