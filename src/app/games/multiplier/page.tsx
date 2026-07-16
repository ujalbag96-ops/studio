
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  TrendingUp, 
  Trophy, 
  Coins, 
  Loader2, 
  AlertCircle, 
  Target, 
  ShieldCheck,
  RefreshCw,
  Crown
} from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function MultiplierGame() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [betAmount, setBetAmount] = useState('1');
  const [multiplier, setMultiplier] = useState('2.0');
  const [isRolling, setIsRolling] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const winChance = (95 / parseFloat(multiplier)).toFixed(2);
  const estimatedProfit = (parseFloat(betAmount) * parseFloat(multiplier)).toFixed(2);

  const handleRoll = async () => {
    if (!user || isRolling) return;
    const amt = parseFloat(betAmount);
    const mult = parseFloat(multiplier);

    if (isNaN(amt) || amt < 1) {
      toast({ variant: "destructive", title: "Invalid Bet", description: "Minimum bet is ₹1" });
      return;
    }
    if (isNaN(mult) || mult < 1.1 || mult > 50) {
      toast({ variant: "destructive", title: "Invalid Odds", description: "Multiplier must be between 1.1x and 50x" });
      return;
    }

    setIsRolling(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/games/multiplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, amountINR: amt, multiplier: mult })
      });

      const data = await res.json();
      if (data.success) {
        setLastResult(data);
        if (data.isWin || data.isJackpot) {
          toast({ title: data.isJackpot ? "🏆 JACKPOT!" : "💰 YOU WON!", description: `₹${data.profitINR} credited to your wallet.` });
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
          audio.play().catch(() => {});
        }
      } else {
        toast({ variant: "destructive", title: "Error", description: data.error });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "System Signal Lost" });
    } finally {
      setIsRolling(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="space-y-4 pt-10 text-center">
         <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
            <Zap className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">High-Stakes Multiplier</span>
         </div>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Multi <span className="text-primary">Win</span></h1>
         <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest italic">Industrial Randomness Engine • ₹1 MIN BET • 95% RTP</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {/* Betting Control Panel */}
         <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl">
            <div className="space-y-6">
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bet Amount (INR)</Label>
                  <div className="relative">
                     <Input 
                      type="number" 
                      value={betAmount} 
                      onChange={e => setBetAmount(e.target.value)} 
                      className="h-14 bg-black border-white/10 rounded-xl font-black text-xl text-primary pl-10" 
                      min="1"
                     />
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase ml-1">Start from ₹1 minimum</p>
               </div>

               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Set Odds (Multiplier)</Label>
                  <div className="relative">
                     <Input 
                      type="number" 
                      value={multiplier} 
                      onChange={e => setMultiplier(e.target.value)} 
                      className="h-14 bg-black border-white/10 rounded-xl font-black text-xl text-white pl-10" 
                     />
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">x</span>
                  </div>
               </div>

               <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black uppercase text-muted-foreground">Win Chance</span>
                     <span className="text-sm font-black text-green-500 italic">{winChance}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[9px] font-black uppercase text-muted-foreground">Est. Profit</span>
                     <span className="text-sm font-black text-primary italic">₹{estimatedProfit}</span>
                  </div>
               </div>
            </div>

            <Button 
              onClick={handleRoll} 
              disabled={isRolling || !betAmount || !multiplier}
              className="w-full h-20 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic text-xl shadow-2xl shadow-primary/20 active:scale-95 transition-all"
            >
               {isRolling ? <Loader2 className="animate-spin h-8 w-8" /> : "ROLL THE ENGINE"}
            </Button>
         </Card>

         {/* Game Visualization */}
         <div className="lg:col-span-2 space-y-8">
            <Card className="bg-[#050508] border-2 border-white/5 h-full rounded-[3rem] overflow-hidden relative flex flex-col items-center justify-center p-12 group">
               <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               
               {isRolling ? (
                 <div className="text-center space-y-6 animate-pulse">
                    <div className="h-32 w-32 rounded-full border-8 border-primary/20 border-t-primary animate-spin mx-auto" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">Decrypting Roll Signal...</p>
                 </div>
               ) : lastResult ? (
                 <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Final Roll Result</p>
                       <h2 className={cn(
                         "text-9xl font-black italic tracking-tighter",
                         lastResult.isJackpot ? "text-amber-500 drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]" :
                         lastResult.isWin ? "text-green-500" : "text-white/20"
                       )}>
                         {lastResult.roll}
                       </h2>
                    </div>
                    {lastResult.isJackpot && (
                      <Badge className="bg-amber-500 text-black font-black uppercase italic text-lg px-8 py-3 rounded-full animate-bounce">
                         <Crown className="h-5 w-5 mr-2 inline" /> JACKPOT SIGNAL 8888
                      </Badge>
                    )}
                    <div className="flex flex-col items-center gap-2">
                       <p className="text-sm font-black uppercase italic text-muted-foreground">
                         {lastResult.isWin ? "System Sync: SUCCESS" : "System Signal: VOID"}
                       </p>
                       <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                          <div className={cn("h-full transition-all duration-1000", lastResult.isWin ? "bg-green-500 w-full" : "bg-red-500 w-0")} />
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="text-center space-y-8">
                    <div className="h-24 w-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto shadow-2xl">
                       <TrendingUp className="h-10 w-10 text-muted-foreground opacity-20" />
                    </div>
                    <div className="space-y-2">
                       <h3 className="text-3xl font-black uppercase italic text-white/40">Engine Standby</h3>
                       <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Ready for next tactical wager</p>
                    </div>
                 </div>
               )}

               <div className="absolute bottom-10 inset-x-0 px-12 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <ShieldCheck className="h-4 w-4 text-muted-foreground opacity-40" />
                     <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">AES-256 Randomizer Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">Live Node</span>
                  </div>
               </div>
            </Card>
         </div>
      </div>

      {/* Rules & Stats */}
      <div className="grid md:grid-cols-2 gap-8">
         <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-6">
            <h4 className="text-xl font-black uppercase italic flex items-center gap-3 text-amber-500">
               <Trophy /> Jackpot Protocol
            </h4>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-tight">
               If your roll hits exactly <span className="text-white font-bold">8888</span>, you trigger the Arena Jackpot. This pays out <span className="text-amber-500 font-black">50x your bet</span> instantly, bypassing all standard odds and multipliers.
            </p>
         </Card>

         <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 flex items-center justify-between">
            <div className="space-y-1">
               <p className="text-[10px] font-black uppercase text-muted-foreground">My Balance</p>
               <h4 className="text-3xl font-black italic text-white">
                  ₹{profile?.walletBalanceINR?.toFixed(2) || '0.00'}
               </h4>
            </div>
            <Link href="/withdraw" className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
               <RefreshCw className="h-6 w-6" />
            </Link>
         </Card>
      </div>
    </div>
  );
}
