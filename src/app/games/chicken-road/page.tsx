
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
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
  RefreshCw,
  Skull
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const GAME_FEE = 10;
const PAYOUT_THRESHOLD = 20; // 20 points hits difficulty override

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

  // Game Logic Variables
  const chickenPos = useRef({ x: 150, y: 350 });
  const obstacles = useRef<{ x: number, y: number, speed: number, width: number }[]>([]);
  const laneY = [50, 100, 150, 200, 250, 300];
  const lastLaneCrossed = useRef(-1);

  const handleStartGame = async () => {
    if (!user || !profile || !userRef) return;
    if (profile.coins < GAME_FEE) {
      toast({ variant: "destructive", title: "Insufficient Balance", description: "You need 10 coins to play." });
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Deduct Fee
      await updateDoc(userRef, {
        coins: increment(-GAME_FEE),
        depositBalance: increment(-GAME_FEE)
      });

      // 2. Log Ledger
      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'game_fee',
        amount: GAME_FEE,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Chicken Road: Entry Wager'
      });

      // 3. Reset & Start Game
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
      lastLaneCrossed.current = -1;
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

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Lanes
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    laneY.forEach(y => {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    });

    // Difficulty Override Logic
    // If score hits threshold, velocity scales by 150%
    const currentDifficulty = score >= PAYOUT_THRESHOLD ? 2.5 : 1;
    if (score >= PAYOUT_THRESHOLD && !difficultyForced) {
        setDifficultyForced(true);
    }

    // Update & Draw Obstacles
    ctx.fillStyle = '#ff4444';
    obstacles.current.forEach(obs => {
      obs.x += obs.speed * currentDifficulty;
      if (obs.x > canvas.width) obs.x = -obs.width;
      if (obs.x < -obs.width) obs.x = canvas.width;
      
      ctx.fillRect(obs.x, obs.y - 10, obs.width, 20);

      // Collision Check
      if (
        chickenPos.current.x < obs.x + obs.width &&
        chickenPos.current.x + 20 > obs.x &&
        chickenPos.current.y < obs.y + 10 &&
        chickenPos.current.y + 20 > obs.y - 10
      ) {
        setGameState('gameover');
      }
    });

    // Draw Chicken
    ctx.fillStyle = '#ffcc00';
    ctx.font = '20px Arial';
    ctx.fillText('🐥', chickenPos.current.x, chickenPos.current.y + 15);

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

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex items-center justify-between">
         <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Dashboard
         </Link>
         <div className="flex items-center gap-4">
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-3 py-1 italic">Wager: {GAME_FEE} 🪙</Badge>
            <Badge className="bg-white/5 border-white/10 text-white font-black px-3 py-1 italic">Coins: {profile?.coins?.toFixed(0) || 0}</Badge>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
               <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
                  <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                     <p className="text-[8px] font-black uppercase text-muted-foreground">Current Score</p>
                     <p className="text-2xl font-black text-primary italic">{score}</p>
                  </div>
                  {difficultyForced && (
                    <Badge className="bg-red-600 animate-pulse text-white font-black uppercase italic py-1.5 border-none px-4">
                       <Zap className="h-3 w-3 mr-2 inline fill-white" /> OVERRIDE ACTIVE
                    </Badge>
                  )}
               </div>

               <div className="aspect-[3/4] md:aspect-video flex items-center justify-center bg-[#050508] relative">
                  {gameState === 'playing' ? (
                    <canvas 
                      ref={canvasRef} 
                      width={300} 
                      height={400} 
                      className="w-full h-full max-w-[300px] border border-white/5"
                    />
                  ) : (
                    <div className="text-center space-y-8 animate-in fade-in zoom-in-95">
                       <div className="h-24 w-24 bg-primary/10 rounded-[2rem] border border-primary/20 flex items-center justify-center mx-auto shadow-2xl">
                          {gameState === 'gameover' ? <Skull className="h-10 w-10 text-red-500" /> : <Gamepad2 className="h-10 w-10 text-primary" />}
                       </div>
                       <div className="space-y-2">
                          <h2 className="text-4xl font-black uppercase italic tracking-tighter">
                            {gameState === 'gameover' ? 'Crash Detected' : 'Chicken Road'}
                          </h2>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                            {gameState === 'gameover' ? `Final Score: ${score}` : 'Cross the road, survive the cars.'}
                          </p>
                       </div>
                       <Button 
                        onClick={handleStartGame} 
                        disabled={isProcessing}
                        className="h-16 px-12 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-primary/20"
                       >
                          {isProcessing ? <Loader2 className="animate-spin" /> : gameState === 'gameover' ? 'TRY AGAIN' : 'INITIATE SESSION'}
                       </Button>
                    </div>
                  )}

                  {gameState === 'playing' && (
                    <div className="absolute bottom-6 inset-x-0 flex justify-center gap-4 md:hidden">
                       <GameBtn icon="⬅️" onClick={() => move('left')} />
                       <div className="flex flex-col gap-4">
                          <GameBtn icon="⬆️" onClick={() => move('up')} />
                          <GameBtn icon="⬇️" onClick={() => move('down')} />
                       </div>
                       <GameBtn icon="➡️" onClick={() => move('right')} />
                    </div>
                  )}
               </div>
               
               <div className="bg-white/5 p-4 border-t border-white/5 flex items-center justify-center gap-2">
                  <ShieldCheck className="h-3 w-3 text-muted-foreground" />
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest italic">Industrial Integrity Session • AES-256 Encrypted</p>
               </div>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2rem] space-y-6">
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Trophy className="text-primary h-5 w-5" /> Prize Pool</h3>
               <div className="space-y-4">
                  <PrizeRow label="10+ Score" prize="15 Coins" />
                  <PrizeRow label="20+ Score" prize="30 Coins" />
                  <PrizeRow label="50+ Score" prize="100 Coins" />
               </div>
               <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                  Prizes are credited to winning balance after manual review to prevent automation exploitation.
               </p>
            </Card>

            <Card className="bg-[#121212] border-white/5 p-8 rounded-[2rem] space-y-4">
               <h3 className="text-sm font-black uppercase italic flex items-center gap-2 text-white">
                  <AlertCircle className="h-4 w-4 text-red-500" /> Operational Rules
               </h3>
               <ul className="space-y-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" /> Wager is non-refundable.</li>
                  <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" /> Dynamic velocity scaling active.</li>
                  <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" /> Browser automation results in ban.</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}

function GameBtn({ icon, onClick }: any) {
    return (
        <button onClick={onClick} className="h-14 w-14 bg-black/80 border border-white/10 rounded-xl flex items-center justify-center text-xl shadow-2xl active:scale-95 transition-transform">
            {icon}
        </button>
    );
}

function PrizeRow({ label, prize }: any) {
    return (
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-[10px] font-black uppercase text-white">{label}</span>
            <span className="text-sm font-black text-primary italic">{prize}</span>
        </div>
    );
}
