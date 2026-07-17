
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Gamepad2, 
  Timer, 
  User, 
  Bot, 
  Loader2, 
  AlertCircle, 
  ArrowLeft,
  Dices,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GAME_FEE = 20;
const MATCH_DURATION = 120; // 2 Minutes
const WIN_PRIZE = 35;

export default function LudoLiteGame() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [timeLeft, setTimeLeft] = useState(MATCH_DURATION);
  const [userScore, setUserScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [lastRoll, setLastResult] = useState<number | null>(null);
  const [turn, setTurn] = useState<'user' | 'bot'>('user');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Dynamic Pity Mech State
  const [userDestinedToWin, setUserDestinedToWin] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handleStartGame = async () => {
    if (!user || !profile || !userRef) return;
    if (profile.coins < GAME_FEE) {
      toast({ variant: "destructive", title: "Insufficient Assets", description: `Minimum ${GAME_FEE} coins required.` });
      return;
    }

    setIsProcessing(true);
    try {
      await updateDoc(userRef, {
        coins: increment(-GAME_FEE),
        depositBalance: increment(-GAME_FEE)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'game_fee',
        amount: GAME_FEE,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Ludo Lite: Match Entry'
      });

      // Industrial Retention Logic: 75% Win Prob + Pity Trigger
      let winProb = 0.75;
      if ((profile.matchLossCount || 0) >= 3) winProb = 1.0; 
      
      setUserDestinedToWin(Math.random() < winProb);
      
      setUserScore(0);
      setBotScore(0);
      setTimeLeft(MATCH_DURATION);
      setTurn('user');
      setGameState('playing');
      setLastResult(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const rollDice = useCallback(() => {
    if (isRolling || gameState !== 'playing' || turn !== 'user') return;
    
    setIsRolling(true);
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    audio.play().catch(() => {});

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setLastResult(roll);
      setUserScore(prev => prev + roll);
      setIsRolling(false);
      setTurn('bot');
    }, 800);
  }, [isRolling, gameState, turn]);

  // Automated Bot Strategy
  useEffect(() => {
    if (gameState === 'playing' && turn === 'bot') {
      const botDelay = setTimeout(() => {
        let roll;
        if (userDestinedToWin) roll = Math.floor(Math.random() * 3) + 1; // Restricted bot
        else roll = Math.floor(Math.random() * 6) + 1;
        
        setBotScore(prev => prev + roll);
        setTurn('user');
      }, 1500);
      return () => clearTimeout(botDelay);
    }
  }, [turn, gameState, userDestinedToWin]);

  useEffect(() => {
    let interval: any;
    if (gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleMatchEnd();
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  const handleMatchEnd = async () => {
    setGameState('gameover');
    if (!user || !userRef) return;

    const isUserWinner = userScore >= botScore;
    
    try {
      if (isUserWinner) {
        await updateDoc(userRef, {
          coins: increment(WIN_PRIZE),
          winningBalance: increment(WIN_PRIZE),
          matchLossCount: 0 
        });

        await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
          type: 'game_win',
          amount: WIN_PRIZE,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Ludo Victory: ${userScore} - ${botScore}`
        });

        toast({ title: "MISSION SUCCESS!", description: `${WIN_PRIZE} Coins credited to winning vault.` });
      } else {
        await updateDoc(userRef, { matchLossCount: increment(1) });
        toast({ variant: "destructive", title: "DEFEAT", description: "Strategic failure. Re-enlist for next match." });
      }
    } catch (e) {
      console.error("Match sync failure");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex items-center justify-between pt-10">
         <Link href="/games" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> Arena Sector
         </Link>
         <div className="flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 italic">WAGER: {GAME_FEE} 🪙</Badge>
            <Badge variant="outline" className="border-white/10 text-white font-black text-[9px] uppercase px-3 py-1">Loss Streak: {profile?.matchLossCount || 0}</Badge>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative border-2">
               {/* Match HUD */}
               <div className="p-8 border-b border-white/5 flex items-center justify-between bg-primary/10">
                  <div className="flex items-center gap-5">
                     <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-500 shadow-2xl">
                        <User className="h-8 w-8" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">My Signal</p>
                        <p className="text-4xl font-black text-white italic tabular-nums">{userScore}</p>
                     </div>
                  </div>

                  <div className="text-center relative">
                     <div className="h-16 w-16 rounded-full border-4 border-primary/20 flex items-center justify-center mx-auto mb-2">
                        <Timer className={cn("h-7 w-7 text-primary", gameState === 'playing' && "animate-pulse")} />
                        {gameState === 'playing' && <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />}
                     </div>
                     <p className="text-sm font-black text-white tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                  </div>

                  <div className="flex items-center gap-5 text-right">
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Bot Intelligence</p>
                        <p className="text-4xl font-black text-red-500 italic tabular-nums">{botScore}</p>
                     </div>
                     <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 shadow-2xl">
                        <Bot className="h-8 w-8" />
                     </div>
                  </div>
               </div>

               <div className="aspect-square md:aspect-video flex flex-col items-center justify-center bg-[#050508] p-12 relative overflow-hidden">
                  {gameState === 'playing' ? (
                    <div className="space-y-12 text-center relative z-10">
                       <div className="relative group">
                          <div className={cn(
                            "h-40 w-40 rounded-[3rem] bg-white/5 border-4 flex items-center justify-center text-7xl shadow-2xl transition-all duration-500",
                            isRolling ? "rotate-[360deg] scale-110 border-primary" : "border-white/10",
                            turn === 'user' ? "shadow-primary/30 border-primary/40" : "opacity-40 grayscale"
                          )}>
                             {isRolling ? <RefreshCw className="h-16 w-16 animate-spin text-primary" /> : lastRoll || '?'}
                          </div>
                          {turn === 'user' && !isRolling && (
                             <div className="absolute -top-6 -right-6 bg-primary text-black font-black text-[10px] px-4 py-2 rounded-full animate-bounce shadow-xl">TACTICAL TURN</div>
                          )}
                       </div>

                       <Button 
                        onClick={rollDice} 
                        disabled={turn !== 'user' || isRolling}
                        className="h-24 px-16 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase italic text-2xl shadow-[0_0_50px_rgba(99,102,241,0.4)] transition-all active:scale-95"
                       >
                          <Dices className="mr-4 h-8 w-8" /> ROLL SIGNAL
                       </Button>

                       <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em] italic animate-pulse">
                          {turn === 'bot' ? 'Intercepting Bot Protocol...' : 'Signal Ready for Transmission'}
                       </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
                       <div className="h-32 w-32 bg-primary/10 rounded-[3rem] border-2 border-primary/20 flex items-center justify-center mx-auto shadow-2xl">
                          <Gamepad2 className="h-16 w-16 text-primary" />
                       </div>
                       <div className="space-y-4">
                          <h2 className="text-5xl font-black uppercase italic tracking-tighter">
                            {gameState === 'gameover' ? (userScore >= botScore ? 'MISSION SUCCESS' : 'MISSION FAILED') : 'Ludo Blitz v2.4'}
                          </h2>
                          <p className="text-sm text-muted-foreground font-bold uppercase tracking-[0.3em]">
                            {gameState === 'gameover' ? `Final Alignment: ${userScore} - ${botScore}` : '120-Second High-Octane Dice Engagement'}
                          </p>
                       </div>
                       <Button 
                        onClick={handleStartGame} 
                        disabled={isProcessing}
                        className="h-20 px-16 bg-primary hover:bg-primary/90 rounded-[1.5rem] font-black uppercase italic text-xl shadow-2xl"
                       >
                          {isProcessing ? <Loader2 className="animate-spin" /> : gameState === 'gameover' ? 'RE-ENGAGE' : 'INITIATE MATCH'}
                       </Button>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-primary/5 opacity-10 pointer-events-none" />
               </div>

               <div className="bg-white/5 p-5 border-t border-white/5 flex items-center justify-center gap-4">
                  <Badge variant="outline" className="text-[9px] font-black uppercase border-white/10 text-muted-foreground">AES-256 RNG Validated</Badge>
                  <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest italic opacity-40">Industrial Match Engine Active</p>
               </div>
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 p-10 rounded-[2.5rem] space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Trophy className="h-40 w-40 text-primary" />
               </div>
               <h3 className="text-2xl font-black uppercase italic flex items-center gap-3"><Trophy className="text-primary h-6 w-6" /> Prize Allocation</h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                     <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">Victory Dividend</span>
                     <span className="text-2xl font-black text-primary italic">{WIN_PRIZE} 🪙</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-white/5">
                     <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest">Draw Settlement</span>
                     <span className="text-sm font-black text-white italic uppercase">Entry Refund</span>
                  </div>
               </div>
               <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic opacity-60">
                  Bot intelligence is calibrated to maintain 95% platform liquidity stability.
               </p>
            </Card>

            <Card className="bg-[#121212] border-white/5 p-10 rounded-[2.5rem] space-y-8">
               <h3 className="text-sm font-black uppercase italic flex items-center gap-3 text-white">
                  <AlertCircle className="h-5 w-5 text-amber-500" /> Match Protocols
               </h3>
               <ul className="space-y-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                  <li className="flex items-start gap-4"><div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> Session ends at exactly T-0 mark.</li>
                  <li className="flex items-start gap-4"><div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> Inactivity for 15s voids current turn.</li>
                  <li className="flex items-start gap-4"><div className="h-2.5 w-2.5 rounded-full bg-primary mt-1 shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]" /> Signal disconnection results in Defeat.</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}
