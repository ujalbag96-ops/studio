'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, addDoc, query, where, getDocs, limit } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CloudRain, 
  Sun, 
  Zap, 
  ShieldCheck, 
  Loader2, 
  PlayCircle, 
  AlertCircle,
  CheckCircle2,
  X,
  TrendingUp,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function WeatherTradingArena() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [selectedVote, setSelectedVote] = useState<'YES' | 'NO' | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    async function checkVote() {
      if (!user || !firestore) return;
      const today = new Date().toISOString().split('T')[0];
      const q = query(
        collection(firestore, 'weather_votes'), 
        where('userId', '==', user.uid),
        where('timestamp', '>=', today),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) setHasVoted(true);
    }
    checkVote();
  }, [user, firestore]);

  useEffect(() => {
    let interval: any;
    if (showAdModal && adCountdown > 0) {
      interval = setInterval(() => setAdCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showAdModal, adCountdown]);

  const handleVoteSelect = (vote: 'YES' | 'NO') => {
    if (!user) {
      toast({ variant: "destructive", title: "Identification Required" });
      return;
    }
    if (hasVoted) {
      toast({ title: "SIGNAL ALREADY LOCKED", description: "You have already predicted today's weather." });
      return;
    }
    setSelectedVote(vote);
    setShowAdModal(true);
    setAdCountdown(10);
  };

  const handleEntryConfirm = async () => {
    if (!user || !firestore || selectedVote === null) return;
    
    setIsProcessing(true);
    try {
      await addDoc(collection(firestore, 'weather_votes'), {
        userId: user.uid,
        userEmail: user.email,
        vote: selectedVote,
        status: 'pending',
        timestamp: new Date().toISOString()
      });

      toast({ 
        title: "PREDICTION VERIFIED", 
        description: `Your vote "${selectedVote}" has been logged for Sambalpur.` 
      });
      
      setHasVoted(true);
      setShowAdModal(false);
      setSelectedVote(null);
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
            <Globe className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Regional Prediction Arena</span>
         </div>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Weather <span className="text-primary">Wars</span></h1>
         <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest italic">Watch Ad to Trade • Official Station: Sambalpur, IN</p>
      </header>

      <section className="relative overflow-hidden rounded-[3rem] bg-[#0a0a0f] border-2 border-white/5 p-12 text-center space-y-10 shadow-2xl">
         <div className="absolute top-0 right-0 p-8 opacity-5">
            <CloudRain className="h-48 w-48 text-primary" />
         </div>

         <div className="space-y-4 relative z-10">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight text-white leading-none">
              Will it rain in <span className="text-primary">Sambalpur</span> today?
            </h2>
            <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest italic">Official result logged at 6:00 PM IST</p>
         </div>

         {!hasVoted ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Button 
                onClick={() => handleVoteSelect('YES')}
                className="h-24 rounded-3xl bg-primary hover:bg-primary/90 text-white font-black text-3xl italic uppercase shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                 <CloudRain className="mr-4 h-8 w-8 fill-white" /> YES
              </Button>
              <Button 
                onClick={() => handleVoteSelect('NO')}
                variant="outline"
                className="h-24 rounded-3xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-3xl italic uppercase shadow-xl transition-all hover:scale-105 active:scale-95"
              >
                 <Sun className="mr-4 h-8 w-8 text-amber-500 fill-amber-500" /> NO
              </Button>
           </div>
         ) : (
           <div className="py-10 space-y-6 animate-in zoom-in-95">
              <div className="h-20 w-20 bg-green-500/20 border-2 border-green-500/40 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                 <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black uppercase italic">SIGNAL LOCKED</h3>
                 <p className="text-xs text-muted-foreground font-bold uppercase">Reward will be distributed after 8:00 PM settlement.</p>
              </div>
           </div>
         )}
      </section>

      {showAdModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
           <Card className="max-w-md w-full bg-[#0d0d12] border-white/10 rounded-[3rem] overflow-hidden relative shadow-2xl">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(10 - adCountdown) * 36}deg)` }}
                    />
                    <Zap className="h-12 w-12 text-primary animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic">Verifying Vote...</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Watching sponsor video to confirm prediction for 10 Bonus Coins reward.
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
                       {isProcessing ? <Loader2 className="animate-spin" /> : adCountdown === 0 ? "CONFIRM SIGNAL" : "WATCHING AD..."}
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
         <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-amber-500">
               <ShieldCheck /> Trading Rules
            </h3>
            <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
               <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Free entry via rewarded ad sync.</li>
               <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Reward: 10 Bonus Coins per correct win.</li>
               <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Settlement based on official local airport weather station.</li>
            </ul>
         </Card>

         <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center space-y-4">
            <TrendingUp className="h-10 w-10 text-primary" />
            <h4 className="text-xl font-black uppercase italic">Settlement Period</h4>
            <p className="text-xs font-medium text-muted-foreground uppercase leading-relaxed">
               Predictions close at 5:30 PM. Results are settled and coins distributed at 8:00 PM daily.
            </p>
         </Card>
      </div>

      <div className="pt-4 border-t border-white/5 text-center">
         <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase text-muted-foreground italic">
            <ShieldCheck className="h-3 w-3 text-primary" /> CampusHub Secured Connection
         </div>
      </div>
    </div>
  );
}
