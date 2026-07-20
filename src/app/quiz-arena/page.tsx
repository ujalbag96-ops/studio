
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Zap, 
  BrainCircuit, 
  Users, 
  Heart, 
  Timer, 
  Loader2, 
  PlayCircle, 
  ShieldCheck, 
  AlertCircle,
  Crown,
  Flame,
  X,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { UserProfile, LeaderboardEntry } from '../lib/types';
import { useToast } from '@/hooks/use-toast';

const PRIZE_GOAL_INR = 500;

export default function QuizArena() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'idle' | 'loading' | 'playing' | 'gameover' | 'ad_break'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15);
  const [adCountdown, setAdCountdown] = useState(0);
  const [pendingLifeline, setPendingLifeline] = useState<'50-50' | 'skip' | null>(null);
  const [optionsVisible, setOptionsVisible] = useState([true, true, true, true]);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const poolRef = useMemoFirebase(() => firestore ? doc(firestore, 'daily_pool', 'config') : null, [firestore]);
  const leaderboardQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'quiz_leaderboard'), orderBy('score', 'desc'), limit(10)) : null, [firestore]);

  const { data: profile } = useDoc<UserProfile>(userRef);
  const { data: pool } = useDoc<any>(poolRef);
  const { data: leaderboard } = useCollection<LeaderboardEntry>(leaderboardQuery);

  // Industrial Timer Engine
  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleAnswer(-1); // Auto-fail on timeout
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Ad Break Timer
  useEffect(() => {
    let timer: any;
    if (gameState === 'ad_break' && adCountdown > 0) {
      timer = setInterval(() => setAdCountdown(prev => prev - 1), 1000);
    } else if (gameState === 'ad_break' && adCountdown === 0) {
      finalizeLifeline();
    }
    return () => clearInterval(timer);
  }, [gameState, adCountdown]);

  const startQuiz = async () => {
    setGameState('loading');
    try {
      // Adaptive Logic: Pulla metadata based on user rank
      const difficulty = score > 50 ? "Elite Scientific" : "Standard Academic";
      const res = await generateQuiz({ contentSummary: `Category: General Knowledge & Science. Difficulty: ${difficulty}` });
      setQuizData(res);
      setGameState('playing');
      setScore(0);
      setLives(3);
      setCurrentQuestion(0);
      setTimeLeft(15);
    } catch (e) {
      toast({ variant: "destructive", title: "AI NODE SILENT" });
      setGameState('idle');
    }
  };

  const handleAnswer = (idx: number) => {
    if (!quizData) return;
    const isCorrect = idx === quizData.questions[currentQuestion].correctIndex;

    if (isCorrect) {
      const pointValue = (currentQuestion + 1) * 10;
      setScore(prev => prev + pointValue);
      toast({ title: "SIGNAL MATCHED", description: `+${pointValue} Points Syncing...` });
      
      if (currentQuestion < 4) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(15);
        setOptionsVisible([true, true, true, true]);
      } else {
        handleVictory();
      }
    } else {
      setLives(prev => prev - 1);
      if (lives <= 1) {
        setGameState('gameover');
      } else {
        toast({ variant: "destructive", title: "SIGNAL MISMATCH", description: "Heart lost. Adjusting protocol." });
      }
    }
  };

  const useLifeline = (type: '50-50' | 'skip') => {
    setPendingLifeline(type);
    setAdCountdown(10);
    setGameState('ad_break');
  };

  const finalizeLifeline = async () => {
    // 1. Sync Ad Revenue Signal to Pool
    if (poolRef) {
      await updateDoc(poolRef, { total_participants: increment(1) }); // Simulation of ad revenue adding to pool
    }

    if (pendingLifeline === '50-50' && quizData) {
      const correct = quizData.questions[currentQuestion].correctIndex;
      const newVisibility = [false, false, false, false];
      newVisibility[correct] = true;
      // Keep one random wrong option
      let randomWrong = Math.floor(Math.random() * 4);
      while (randomWrong === correct) randomWrong = Math.floor(Math.random() * 4);
      newVisibility[randomWrong] = true;
      setOptionsVisible(newVisibility);
    } else if (pendingLifeline === 'skip') {
      setCurrentQuestion(prev => prev + 1);
      setTimeLeft(15);
    }

    setGameState('playing');
    setPendingLifeline(null);
    toast({ title: "LIFELINE SYNCED", description: "Sponsor signal verified." });
  };

  const handleVictory = async () => {
    setGameState('gameover');
    if (!user || !firestore) return;

    // Update Leaderboard
    const lbRef = doc(firestore, 'quiz_leaderboard', user.uid);
    await setDoc(lbRef, {
      userId: user.uid,
      userEmail: user.email?.split('@')[0],
      score: increment(score),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // Update User Balance
    if (userRef) {
      await updateDoc(userRef, {
        coins: increment(25),
        bonusBalance: increment(25)
      });
    }

    toast({ title: "SCHOLAR DIVIDEND", description: "+25 Coins added to vault." });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10">
         <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 border border-primary/20">
               <BrainCircuit className="h-4 w-4 text-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest text-primary">AI Gamified Arena</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Quiz <span className="text-primary">Master</span></h1>
         </div>

         <Card className="bg-[#0a0a0f] border-amber-500/20 border-2 rounded-[2.5rem] p-8 flex items-center gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-5"><Flame className="h-20 w-20 text-amber-500" /></div>
            <div className="text-center">
               <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Global Prize Pool</p>
               <p className="text-4xl font-black text-amber-500 italic tabular-nums">₹{( (pool?.total_participants || 0) * 8.4 ).toFixed(0)}</p>
               <p className="text-[8px] font-bold text-green-500 uppercase mt-1">Sponsor Boost Active</p>
            </div>
         </Card>
      </header>

      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-6">
            <Card className="bg-[#050508] border-white/5 rounded-[3rem] p-10 min-h-[500px] flex flex-col justify-center relative overflow-hidden shadow-inner border-2">
               {gameState === 'idle' && (
                 <div className="text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="h-32 w-32 rounded-[2.5rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-2xl">
                       <PlayCircle className="h-16 w-16 text-primary" />
                    </div>
                    <div className="space-y-3">
                       <h2 className="text-4xl font-black uppercase italic">Enlist for Arena</h2>
                       <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">15 Seconds per Signal. 3 Hearts. Ultimate Rewards.</p>
                    </div>
                    <Button onClick={startQuiz} className="h-20 px-16 bg-primary hover:bg-primary/90 font-black text-xl uppercase italic rounded-2xl shadow-xl active:scale-95 transition-all">
                       INITIATE SESSION
                    </Button>
                 </div>
               )}

               {gameState === 'loading' && (
                 <div className="text-center space-y-8 py-20">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em] animate-pulse">AI DECRYPTING SYLLABUS...</p>
                 </div>
               )}

               {gameState === 'playing' && quizData && (
                 <div className="space-y-12 animate-in fade-in duration-500 relative z-10">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 font-black text-primary text-xs">#{currentQuestion + 1}</div>
                          <div className="flex gap-1.5">
                             {[...Array(3)].map((_, i) => (
                               <Heart key={i} className={cn("h-5 w-5", i < lives ? "fill-red-500 text-red-500 animate-pulse" : "text-white/10")} />
                             ))}
                          </div>
                       </div>
                       <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-2xl border border-white/5">
                          <Timer className={cn("h-4 w-4", timeLeft < 5 ? "text-red-500 animate-bounce" : "text-primary")} />
                          <span className={cn("text-xl font-black tabular-nums", timeLeft < 5 ? "text-red-500" : "text-white")}>{timeLeft}s</span>
                       </div>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-black uppercase italic text-white leading-tight tracking-tight min-h-[120px]">
                       {quizData.questions[currentQuestion].question}
                    </h3>

                    <div className="grid gap-4">
                       {quizData.questions[currentQuestion].options.map((opt, i) => (
                         <button 
                           key={i} 
                           onClick={() => handleAnswer(i)}
                           disabled={!optionsVisible[i]}
                           className={cn(
                             "w-full p-6 rounded-2xl border-2 text-left font-black uppercase text-xs transition-all flex items-center justify-between group",
                             optionsVisible[i] ? "bg-white/5 border-white/10 hover:border-primary hover:bg-primary/5" : "opacity-10 grayscale cursor-not-allowed border-transparent"
                           )}
                         >
                            <span className="flex items-center gap-6">
                               <span className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                  {String.fromCharCode(65 + i)}
                               </span>
                               {opt}
                            </span>
                            <Target className="h-4 w-4 opacity-0 group-hover:opacity-40" />
                         </button>
                       ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6">
                       <Button onClick={() => useLifeline('50-50')} variant="outline" className="h-14 border-primary/20 bg-primary/5 text-primary font-black uppercase italic text-[10px]">
                          WATCH AD: 50-50 LIFELINE
                       </Button>
                       <Button onClick={() => useLifeline('skip')} variant="outline" className="h-14 border-secondary/20 bg-secondary/5 text-secondary font-black uppercase italic text-[10px]">
                          WATCH AD: SKIP SIGNAL
                       </Button>
                    </div>
                 </div>
               )}

               {gameState === 'ad_break' && (
                 <div className="text-center space-y-10 py-20 animate-in fade-in duration-300">
                    <div className="h-32 w-32 relative mx-auto">
                       <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                       <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" style={{ animationDuration: '3s' }} />
                       <Zap className="absolute inset-0 m-auto h-12 w-12 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter">Syncing Lifeline...</h3>
                       <p className="text-sm font-bold text-white italic tabular-nums">{adCountdown}s Signal Remaining</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] italic">Sponsor engagement verifies your tactical advantage.</p>
                 </div>
               )}

               {gameState === 'gameover' && (
                 <div className="text-center space-y-10 animate-in zoom-in-95 duration-500">
                    <div className="h-28 w-28 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-primary/20 shadow-2xl">
                       <Trophy className="h-14 w-14 text-primary" />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-5xl font-black uppercase italic tracking-tighter">Mission <span className="text-primary">Complete</span></h2>
                       <p className="text-lg font-black text-white italic">Score Alignment: {score} Pts</p>
                    </div>
                    <Button onClick={startQuiz} className="h-20 px-16 bg-primary hover:bg-primary/90 font-black text-xl uppercase italic rounded-2xl shadow-xl">
                       RE-ENLIST
                    </Button>
                 </div>
               )}
            </Card>
         </div>

         <div className="space-y-8">
            {/* Real-time Leaderboard */}
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
               <div className="bg-primary/10 p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-3">
                     <Crown className="text-amber-500 h-4 w-4" /> Weekly Elites
                  </h3>
                  <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase">Real-time</Badge>
               </div>
               <div className="p-2 space-y-1">
                  {leaderboard?.map((entry, idx) => (
                    <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all rounded-2xl group/item">
                       <div className="flex items-center gap-4">
                          <span className={cn("text-xs font-black italic", idx < 3 ? "text-primary" : "text-muted-foreground")}>#{idx + 1}</span>
                          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-xs">
                             {entry.userEmail?.[0] || 'U'}
                          </div>
                          <p className="text-[11px] font-black uppercase text-white truncate max-w-[100px]">{entry.userEmail}</p>
                       </div>
                       <p className="text-xs font-black text-primary italic tabular-nums">{entry.score}</p>
                    </div>
                  ))}
                  {(!leaderboard || leaderboard.length === 0) && (
                    <div className="p-12 text-center text-muted-foreground italic font-black uppercase text-[10px]">No Signals Detected</div>
                  )}
               </div>
            </Card>

            {/* Achievement Node */}
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><Users className="h-40 w-40 text-primary" /></div>
               <h3 className="text-xl font-black uppercase italic tracking-tighter relative z-10">Elite Rewards</h3>
               <div className="space-y-4 relative z-10">
                  <RewardRow label="Rank #1" reward="100 Coins + Elite Badge" />
                  <RewardRow label="Rank #2-5" reward="50 Coins + Gold Badge" />
                  <RewardRow label="Rank #6-10" reward="25 Coins" />
               </div>
               <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed italic border-t border-white/5 pt-4">
                  Weekly rewards distributed every Monday at 00:00 server time.
               </p>
            </Card>
         </div>
      </div>
    </div>
  );
}

function RewardRow({ label, reward }: any) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-3">
       <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
       <span className="text-[10px] font-black text-white italic">{reward}</span>
    </div>
  );
}
