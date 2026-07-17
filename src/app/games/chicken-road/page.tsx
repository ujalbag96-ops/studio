
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Gamepad2, 
  Trophy, 
  Coins, 
  Loader2, 
  AlertCircle, 
  Zap, 
  ShieldCheck,
  ArrowLeft,
  Skull,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GAME_FEE = 10;
const REWARD_THRESHOLD = 15;

export default function ChickenRoadGame() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [difficultyForced, setDifficultyForced] = useState(false);
  
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(null);

  // Game Logic Ref-based state for performance
  const chickenPos = useRef({ x: 150, y: 350 });
  const obstacles = useRef<{ x: number, y: number, speed: number, width: number }[]>([]);
  const laneY = [50, 100, 150, 200, 250, 300];

  const handleStartGame = async () => {
    if (!user || !profile || !userRef) return;
    if (profile.coins < GAME_FEE) {
      toast({ variant: "destructive", title: "Insufficient Assets", description: `You need ${GAME_FEE} coins to start.` });
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
        description: 'Chicken Road: Entry Wager'
      });

      setScore(0);
      setDifficultyForced(false);
      chickenPos.current = { x: 150, y: 350 };
      obstacles.current = laneY.map(y => ({
        x: Math.random() * 300,
        y,
        speed: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1),
        width: 40
      }));
      setGameState('playing');
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const gameLoop = (time: number) => {
    if (gameState !== 'playing' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Lanes
    ctx.fillStyle = '#121216';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    laneY.forEach(y => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });

    // Forced Difficulty at score threshold
    const currentDifficulty = score >= 10 ? 2.2 : 1;
    if (score >= 10 && !difficultyForced) setDifficultyForced(true);

    // Update & Draw Obstacles
    ctx.fillStyle = '#f43f5e'; // Red obstacles
    obstacles.current.forEach(obs => {
      obs.x += obs.speed * currentDifficulty;
      if (obs.x > canvas.width) obs.x = -obs.width;
      if (obs.x < -obs.width) obs.x = canvas.width;
      
      ctx.roundRect ? ctx.beginPath() || ctx.roundRect(obs.x, obs.y - 12, obs.width, 24, 8) || ctx.fill() : ctx.fillRect(obs.x, obs.y - 12, obs.width, 24);

      // Collision Signal
      if (
        chickenPos.current.x < obs.x + obs.width &&
        chickenPos.current.x + 20 > obs.x &&
        chickenPos.current.y < obs.y + 12 &&
        chickenPos.current.y + 20 > obs.y - 12
      ) {
        setGameState('gameover');
      }
    });

    // Draw Chicken
    ctx.font = '24px Arial';
    ctx.fillText('🐥', chickenPos.current.x, chickenPos.current.y + 20);

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (gameState === 'playing') {
      requestRef.current = requestAnimationFrame(gameLoop);
    } else if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState, score]);

  const move = (dir: 'up' | 'left' | 'right' | 'down') => {
    if (gameState !== 'playing') return;
    const step = 25;
    if (dir === 'up') {
        chickenPos.current.y -= step;
        if (chickenPos.current.y < 0) {
            chickenPos.current.y = 350;
            setScore(s => s + 1);
        }
    }
    if (dir === 'down') chickenPos.current.y = Math.min(350, chickenPos.current.y + step);
    if (dir === 'left') chickenPos.current.x = Math.max(0, chickenPos.current.x - step);
    if (dir === 'right') chickenPos.current.x = Math.min(280, chickenPos.current.x + step);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') move('up');
      if (e.key === 'ArrowDown') move('down');
      if (e.key === 'ArrowLeft') move('left');
      if (e.key === 'ArrowRight') move('right');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex items-center justify-between">
         <Link href="/games" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> All Arenas
         </Link>
         <div className="flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 italic shadow-xl shadow-primary/10">Wager: {GAME_FEE} 🪙</Badge>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative border-2 border-dashed">
               <div className="absolute top-8 left-8 z-20 flex items-center gap-4">
                  <div className="bg-black/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
                     <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Industrial Score</p>
                     <p className="text-3xl font-black text-primary italic tabular-nums">{score}</p>
                  </div>
                  {difficultyForced && (
                    <Badge className="bg-red-600 animate-pulse text-white font-black uppercase italic py-2 border-none px-6 rounded-xl shadow-2xl">
                       <Zap className="h-3 w-3 mr-2 inline fill-white" /> OVERRIDE ON
                    </Badge>
                  )}
               </div>

               <div className="aspect-[3/4] md:aspect-video flex items-center justify-center bg-[#050508] relative">
                  {gameState === 'playing' ? (
                    <canvas 
                      ref={canvasRef} 
                      width={300} 
                      height={400} 
                      className="w-full h-full max-w-[300px] border-x border-white/5"
                    />
                  ) : (
                    <div className="text-center space-y-10 animate-in fade-in zoom-in-95 duration-500">
                       <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] border border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                          {gameState === 'gameover' ? <Skull className="h-12 w-12 text-red-500 animate-bounce" /> : <Gamepad2 className="h-12 w-12 text-primary" />}
                       </div>
                       <div className="space-y-3">
                          <h2 className="text-5xl font-black uppercase italic tracking-tighter">
                            {gameState === 'gameover' ? 'Crash Protocol' : 'Chicken Road'}
                          </h2>
                          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
                            {gameState === 'gameover' ? `Session End: ${score} Points` : 'Survival Tactics: Cross the high-speed lanes.'}
                          </p>
                       </div>
                       <Button 
                        onClick={handleStartGame} 
                        disabled={isProcessing}
                        className="h-20 px-16 bg-primary hover:bg-primary/90 rounded-[1.5rem] font-black uppercase italic text-xl shadow-[0_0_30px_rgba(99,102,241,0.3)]"
                       >
                          {isProcessing ? <Loader2 className="animate-spin" /> : gameState === 'gameover' ? 'RE-DEPLOY' : 'INITIATE SESSION'}
                       </Button>
                    </div>
                  )}

                  {gameState === 'playing' && (
                    <div className="absolute bottom-10 inset-x-0 flex justify-center gap-6 md:hidden">
                       <button onClick={() => move('left')} className="h-16 w-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-2xl active:scale-95 transition-all shadow-2xl">⬅️</button>
                       <div className="flex flex-col gap-4">
                          <button onClick={() => move('up')} className="h-16 w-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-2xl active:scale-95 transition-all shadow-2xl">⬆️</button>
                          <button onClick={() => move('down')} className="h-16 w-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-2xl active:scale-95 transition-all shadow-2xl">⬇️</button>
                       </div>
                       <button onClick={() => move('right')} className="h-16 w-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-2xl active:scale-95 transition-all shadow-2xl">➡️</button>
                    </div>
                  )}
               </div>
               
               <div className="bg-white/5 p-5 border-t border-white/5 flex items-center justify-center gap-4">
                  <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-muted-foreground px-3">RNG INTEGRITY ACTIVE</Badge>
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.4em] italic opacity-40">Industrial Session v1.8</p>
               </div>
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 p-10 rounded-[2.5rem] space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Trophy className="h-40 w-40 text-primary" />
               </div>
               <h3 className="text-2xl font-black uppercase italic flex items-center gap-3"><Trophy className="text-primary h-6 w-6" /> Bounty Logic</h3>
               <div className="space-y-5 relative z-10">
                  <PrizeRow label="10+ Points" prize="15 Coins" />
                  <PrizeRow label="20+ Points" prize="40 Coins" />
                  <PrizeRow label="50+ Points" prize="150 Coins" />
               </div>
               <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic border-t border-white/5 pt-4">
                  *Prizes distributed after industrial review to prevent macro exploitation.
               </p>
            </Card>

            <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-6">
               <h3 className="text-sm font-black uppercase italic flex items-center gap-2 text-white">
                  <AlertCircle className="h-4 w-4 text-red-500" /> Operational Rules
               </h3>
               <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                  <li className="flex items-start gap-3"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Entry fee is non-refundable.</li>
                  <li className="flex items-start gap-3"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Dynamic velocity override at 10 pts.</li>
                  <li className="flex items-start gap-3"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" /> Automation detected = Signal Block.</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}

function PrizeRow({ label, prize }: any) {
    return (
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className="text-[11px] font-black uppercase text-white tracking-widest">{label}</span>
            <span className="text-lg font-black text-primary italic drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">{prize}</span>
        </div>
    );
}
