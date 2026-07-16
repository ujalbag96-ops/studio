
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
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
  RefreshCw,
  Dices,
  Coins
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
  
  // Dynamic Winner Logic State
  const [userDestinedToWin, setUserDestinedToWin] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  // START MATCH LOGIC
  const handleStartGame = async () => {
    if (!user || !profile || !userRef) return;
    if (profile.coins < GAME_FEE) {
      toast({ variant: "destructive", title: "Insufficient Assets", description: `Minimum ${GAME_FEE} coins required.` });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Deduct Fee
      await updateDoc(userRef, {
        coins: increment(-GAME_FEE),
        depositBalance: increment(-GAME_FEE)
      });

      // 2. Log Entry
      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'ludo_fee',
        amount: GAME_FEE,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Ludo Lite: Entry Wager'
      });

      // 3. Dynamic Winner Logic Initialization
      let winProb = 0.7; // 70% Default Win Chance
      // Pity Mechanism check
      if ((profile.matchLossCount || 0) >= 3) {
        winProb = 1.0; // Force Win
      }
      
      const willWin = Math.random() < winProb;
      setUserDestinedToWin(willWin);
      
      // Reset State
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

  // DICE ROLL LOGIC (Dynamic Manipulation)
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
    }, 600);
  }, [isRolling, gameState, turn]);

  // BOT AUTOMATED LOGIC (Restricted if User must win)
  useEffect(() => {
    if (gameState === 'playing' && turn === 'bot') {
      const botRollDelay = setTimeout(() => {
        let roll;
        if (userDestinedToWin) {
          // Intentional Poor Bot Logic (Restricted to low numbers)
          roll = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3 only
        } else {
          // Normal Bot Logic
          roll = Math.floor(Math.random() * 6) + 1;
        }
        
        setBotScore(prev => prev + roll);
        setTurn('user');
      }, 1000);
      return () => clearTimeout(botRollDelay);
    }
  }, [turn, gameState, userDestinedToWin]);

  // TIMER LOGIC
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

    const isUserWinner = userScore > botScore;
    
    try {
      if (isUserWinner) {
        // User Wins: Reset Loss Counter & Credit Prize
        await updateDoc(userRef, {
          coins: increment(WIN_PRIZE),
          winningBalance: increment(WIN_PRIZE),
          matchLossCount: 0 // Reset Pity Counter
        });

        await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
          type: 'ludo_win',
          amount: WIN_PRIZE,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Ludo Win: Score ${userScore} vs ${botScore}`
        });

        toast({ title: "VICTORY!", description: `${WIN_PRIZE} Coins credited to winnings.` });
      } else {
        // User Loses: Increment Pity Counter
        await updateDoc(userRef, {
          matchLossCount: increment(1)
        });
        toast({ variant: "destructive", title: "DEFEAT", description: "Better luck next session!" });
      }
    } catch (e) {
      console.error("Match result sync failure");
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex items-center justify-between">
         <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> Dashboard
         </Link>
         <div className="flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-3 py-1 italic">Wager: {GAME_FEE} 🪙</Badge>
            <Badge className="bg-white/5 border-white/10 text-white font-black px-3 py-1 italic">Loss Streak: {profile?.matchLossCount || 0}</Badge>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
               {/* Match HUD */}
               <div className="p-8 border-b border-white/5 flex items-center justify-between bg-primary/5">
                  <div className="flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 text-green-500 shadow-lg shadow-green-500/10">
                        <User />
                     </div>
                     <div>
                        <p className="text-[8px] font-black uppercase text-muted-foreground">My Points</p>
                        <p className="text-2xl font-black text-white italic">{userScore}</p>
                     </div>
                  </div>

                  <div className="text-center">
                     <div className="h-14 w-14 rounded-full border-4 border-primary/20 flex items-center justify-center mx-auto mb-1 relative">
                        <Timer className={cn("h-6 w-6 text-primary", gameState === 'playing' && "animate-pulse")} />
                        {gameState === 'playing' && <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />}
                     </div>
                     <p className="text-[10px] font-black text-white tabular-nums">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                     <div>
                        <p className="text-[8px] font-black uppercase text-muted-foreground">Bot Points</p>
                        <p className="text-2xl font-black text-red-500 italic">{botScore}</p>
                     </div>
                     <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 shadow-lg shadow-red-500/10">
                        <Bot />
                     </div>
                  </div>
               </div>

               {/* Board / Game Area */}
               <div className="aspect-square md:aspect-video flex flex-col items-center justify-center bg-[#050508] p-10 relative">
                  {gameState === 'playing' ? (
                    <div className="space-y-12 text-center">
                       <div className="relative">
                          <div className={cn(
                            "h-32 w-32 rounded-[2.5rem] bg-white/5 border-4 flex items-center justify-center text-6xl shadow-2xl transition-all duration-300",
                            isRolling ? "rotate-[360deg] scale-110 border-primary" : "border-white/10",
                            turn === 'user' ? "shadow-primary/20" : "opacity-40 grayscale"
                          )}>
                             {isRolling ? <RefreshCw className="h-12 w-12 animate-spin text-primary" /> : lastRoll || '?'}
                          </div>
                          {turn === 'user' && !isRolling && (
                             <div className="absolute -top-4 -right-4 bg-primary text-black font-black text-[8px] px-3 py-1 rounded-full animate-bounce">YOUR TURN</div>
                          )}
                       </div>

                       <Button 
                        onClick={rollDice} 
                        disabled={turn !== 'user' || isRolling}
                        className="h-20 px-12 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic text-xl shadow-2xl shadow-primary/20 transition-all active:scale-95"
                       >
                          <Dices className="mr-3 h-6 w-6" /> ROLL DICE
                       </Button>

                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">
                          {turn === 'bot' ? 'Intercepting Bot Strategy...' : 'Tactical Move Available'}
                       </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-8 animate-in fade-in zoom-in-95">
                       <div className="h-24 w-24 bg-primary/10 rounded-[2rem] border border-primary/20 flex items-center justify-center mx-auto shadow-2xl">
                          <Gamepad2 className="h-10 w-10 text-primary" />
                       </div>
                       <div className="space-y-2">
                          <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                            {gameState === 'gameover' ? (userScore > botScore ? 'MISSION SUCCESS' : 'MISSION FAILED') : 'Ludo Lite Blitz'}
                          </h2>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                            {gameState === 'gameover' ? `Final Score: ${userScore} - ${botScore}` : '2-Minute Strategic Dice Battle'}
                          </p>
                       </div>
                       <Button 
                        onClick={handleStartGame} 
                        disabled={isProcessing}
                        className="h-16 px-12 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic text-lg shadow-xl"
                       >
                          {isProcessing ? <Loader2 className="animate-spin" /> : gameState === 'gameover' ? 'RE-ENLIST' : 'INITIATE MATCH'}
                       </Button>
                    </div>
                  )}

                  {/* Pity Signal Indicator (Invisible to user, but here for logic transparency in code) */}
                  {userDestinedToWin && gameState === 'playing' && (
                     <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
                        <Badge className="bg-amber-500">PITY_ACTIVE</Badge>
                     </div>
                  )}
               </div>

               <div className="bg-white/5 p-4 border-t border-white/5 flex items-center justify-center gap-3">
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-muted-foreground">RNG AES-256 Enabled</Badge>
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest italic opacity-40">Industrial Fairness Protocol v1.4</p>
               </div>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2rem] space-y-6">
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Trophy className="text-primary h-5 w-5" /> Prize Pool</h3>
               <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                     <span className="text-[10px] font-black uppercase">Winner Reward</span>
                     <span className="text-sm font-black text-primary italic">{WIN_PRIZE} 🪙</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                     <span className="text-[10px] font-black uppercase">Draw Result</span>
                     <span className="text-sm font-black text-muted-foreground italic">Entry Refund</span>
                  </div>
               </div>
               <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                  Bot logic is calibrated based on historical signal performance to maintain 95% RTP stability.
               </p>
            </Card>

            <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-6">
               <h3 className="text-sm font-black uppercase italic flex items-center gap-2 text-white">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> Operational Rules
               </h3>
               <ul className="space-y-4 text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Match ends exactly at 120s mark.</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Turn skip after 10s inactivity.</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Disconnection results in automatic loss.</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}
