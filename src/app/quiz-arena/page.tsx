
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, query, orderBy, limit, setDoc } from 'firebase/firestore';
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
  Target,
  Gift,
  Lock,
  Video,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { UserProfile, LeaderboardEntry } from '../lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function QuizArena() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'idle' | 'watching_video' | 'loading' | 'playing' | 'gameover' | 'ad_break'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(15);
  const [adCountdown, setAdCountdown] = useState(0);
  const [videoTimer, setVideoTimer] = useState(15);
  const [pendingLifeline, setPendingLifeline] = useState<'50-50' | 'skip' | null>(null);
  const [optionsVisible, setOptionsVisible] = useState([true, true, true, true]);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const poolRef = useMemoFirebase(() => firestore ? doc(firestore, 'quiz_pool', 'current') : null, [firestore]);
  const leaderboardQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'quiz_leaderboard'), orderBy('score', 'desc'), limit(10)) : null, [firestore]);

  const { data: profile } = useDoc<UserProfile>(userRef);
  const { data: pool } = useDoc<any>(poolRef);
  const { data: leaderboard } = useCollection<LeaderboardEntry>(leaderboardQuery);

  const isVip1 = (profile?.vipLevel || 0) >= 1 || (profile?.tasksCompletedCount || 0) >= 10;

  // Timer Engine
  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleAnswer(-1); // Timeout
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Video Watch Timer
  useEffect(() => {
    let timer: any;
    if (gameState === 'watching_video' && videoTimer > 0) {
      timer = setInterval(() => setVideoTimer(prev => prev - 1), 1000);
    } else if (videoTimer === 0 && gameState === 'watching_video') {
      startQuiz();
    }
    return () => clearInterval(timer);
  }, [gameState, videoTimer]);

  // Ad Break Timer for Lifelines
  useEffect(() => {
    let timer: any;
    if (gameState === 'ad_break' && adCountdown > 0) {
      timer = setInterval(() => setAdCountdown(prev => prev - 1), 1000);
    } else if (gameState === 'ad_break' && adCountdown === 0) {
      finalizeLifeline();
    }
    return () => clearInterval(timer);
  }, [gameState, adCountdown]);

  const initiateGame = async () => {
    if (!user || !profile || !isVip1) {
      toast({ variant: "destructive", title: "VIP 1 REQUIRED", description: "Complete 10 tasks to enter this arena." });
      return;
    }
    if (profile.coins < 2) {
      toast({ variant: "destructive", title: "INSUFFICIENT ASSETS", description: "Entry fee is 2 coins." });
      return;
    }

    // Deduct 2 Coins
    if (userRef) {
      await updateDoc(userRef, { 
        coins: increment(-2),
        winningBalance: increment(-2)
      });
      // Increment Pool
      if (poolRef) {
        await updateDoc(poolRef, { currentPrizeINR: increment(2) });
      }
    }

    setGameState('watching_video');
    setVideoTimer(15);
  };

  const startQuiz = async () => {
    setGameState('loading');
    try {
      // High Difficulty Anti-Cheat AI Prompt
      const res = await generateQuiz({ contentSummary: "Global Video Arena: Scientific Visual Audit. Difficulty: High-Temporal." });
      setQuizData(res);
      setGameState('playing');
      setScore(0);
      setLives(3);
      setCurrentQuestion(0);
      setTimeLeft(15);
    } catch (e) {
      toast({ variant: "destructive", title: "AI HUB OFFLINE" });
      setGameState('idle');
    }
  };

  const handleAnswer = (idx: number) => {
    if (!quizData) return;
    const isCorrect = idx === quizData.questions[currentQuestion].correctIndex;

    if (isCorrect) {
      const bonus = (currentQuestion + 1) * 10;
      setScore(prev => prev + bonus);
      toast({ title: "SIGNAL MATCHED", description: `+${bonus} Accuracy Points` });
      
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
        toast({ variant: "destructive", title: "ELIMINATION RISK", description: "Heart lost. Stay focused." });
      }
    }
  };

  const triggerLifeline = (type: '50-50' | 'skip') => {
    setPendingLifeline(type);
    setAdCountdown(10); // Required Ad duration
    setGameState('ad_break');
  };

  const finalizeLifeline = async () => {
    // 1. Sync Ad view to Global Prize Pool (Backend Signal)
    await fetch('/api/quiz/pool-sync', { method: 'POST', body: JSON.stringify({ userId: user?.uid }) });

    if (pendingLifeline === '50-50' && quizData) {
      const correct = quizData.questions[currentQuestion].correctIndex;
      const newVisibility = [false, false, false, false];
      newVisibility[correct] = true;
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
    toast({ title: "LIFELINE VERIFIED", description: "Sponsor signal synced." });
  };

  const handleVictory = async () => {
    setGameState('gameover');
    if (!user || !firestore) return;

    const lbRef = doc(firestore, 'quiz_leaderboard', user.uid);
    await setDoc(lbRef, {
      userId: user.uid,
      userEmail: user.email?.split('@')[0],
      score: increment(score),
      lastUpdated: new Date().toISOString()
    }, { merge: true });

    // Weekly distribution logic applies later, instant coin reward:
    if (userRef) {
      await updateDoc(userRef, {
        coins: increment(10),
        winningBalance: increment(10)
      });
    }

    toast({ title: "ARENA MASTERED", description: "Score logged for weekly 30% prize." });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="flex flex-col xl:flex-row justify-between items-center gap-10 pt-10">
         <div className="space-y-4 text-center xl:text-left">
            <div className="flex flex-wrap items-center justify-center xl:justify-start gap-4">
               <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-5 py-1.5 text-[10px] tracking-widest">
                  VIDEO QUIZ ARENA v1.2
               </Badge>
               <Badge className="bg-amber-500/10 text-amber-500 border-none uppercase font-black text-[10px] px-5 py-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> VIP 1 MANDATORY
               </Badge>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">
               Global <span className="text-primary italic">Video Quiz</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg max-w-2xl italic">
               Watch global video signals and answer AI-audited questions. 30% weekly pool for Top 5 warriors.
            </p>
         </div>

         <Card className="w-full xl:w-96 bg-gradient-to-br from-[#0a0a0f] to-black border-amber-500/30 border-2 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-1000">
               <Trophy className="h-40 w-48 text-amber-500" />
            </div>
            <div className="relative z-10 text-center space-y-4">
               <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.4em]">Current Prize Hub</p>
               <h3 className="text-6xl font-black text-white italic tabular-nums">₹{(pool?.currentPrizeINR || 0).toFixed(0)}</h3>
               <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">Weekly Pool Share: 30% to Top 5</p>
               </div>
            </div>
         </Card>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
         <div className="lg:col-span-2 space-y-8">
            <Card className="bg-[#050508] border-2 border-white/5 rounded-[3.5rem] p-12 min-h-[600px] flex flex-col justify-center relative overflow-hidden shadow-inner">
               {gameState === 'idle' && (
                 <div className="text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
                    <div className="h-32 w-32 rounded-[3rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                       <Video className="h-16 w-16 text-primary" />
                    </div>
                    <div className="space-y-4">
                       <h2 className="text-4xl font-black uppercase italic tracking-tighter">Anti-Cheat Challenge</h2>
                       <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest max-w-sm mx-auto">
                          Entry: 2 Coins. High difficulty questions about the video signal. No Google answers.
                       </p>
                    </div>
                    <div className="flex flex-col items-center gap-4">
                       <Button onClick={initiateGame} className="h-24 px-20 bg-primary hover:bg-primary/90 font-black text-2xl uppercase italic rounded-3xl shadow-xl transition-all hover:scale-105 active:scale-95 group">
                          {isVip1 ? "START VIDEO SESSION" : <><Lock className="mr-3 h-6 w-6" /> VIP 1 REQUIRED</>}
                       </Button>
                       <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em] italic">Instant Asset Verification Node</p>
                    </div>
                 </div>
               )}

               {gameState === 'watching_video' && (
                  <div className="space-y-12 animate-in fade-in duration-500">
                     <div className="aspect-video bg-black rounded-3xl border border-white/10 flex items-center justify-center relative group overflow-hidden">
                        <div className="absolute inset-0 bg-primary/5 opacity-20" />
                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                           <Play className="h-20 w-20 text-white fill-white animate-pulse" />
                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Analyzing Global Signal...</p>
                        </div>
                        <div className="absolute bottom-6 inset-x-6 flex items-center justify-between">
                           <Badge className="bg-red-600 text-white border-none font-black px-4">ANALYSIS IN PROGRESS</Badge>
                           <p className="text-3xl font-black text-white italic tabular-nums">{videoTimer}s</p>
                        </div>
                     </div>
                     <div className="text-center space-y-2">
                        <h4 className="text-xl font-black uppercase italic">Study the Signal</h4>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Visual details will be audited in the quiz. Stay focused.</p>
                     </div>
                  </div>
               )}

               {gameState === 'loading' && (
                 <div className="text-center space-y-8 py-20">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em] animate-pulse italic">AI GENERATING ANTI-CHEAT AUDIT...</p>
                 </div>
               )}

               {gameState === 'playing' && quizData && (
                 <div className="space-y-12 animate-in fade-in duration-500 relative z-10">
                    <div className="flex justify-between items-center">
                       <div className="flex items-center gap-6">
                          <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 font-black text-primary italic">#{currentQuestion + 1}</div>
                          <div className="flex gap-2">
                             {[...Array(3)].map((_, i) => (
                               <Heart key={i} className={cn("h-6 w-6 transition-all duration-500", i < lives ? "fill-red-500 text-red-500 animate-pulse" : "text-white/10")} />
                             ))}
                          </div>
                       </div>
                       <div className="bg-black/60 backdrop-blur-xl px-8 py-3 rounded-2xl border border-white/10 shadow-2xl">
                          <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Signal Time</p>
                          <div className="flex items-center gap-3">
                             <Timer className={cn("h-5 w-5", timeLeft < 5 ? "text-red-500 animate-bounce" : "text-primary")} />
                             <span className={cn("text-2xl font-black tabular-nums", timeLeft < 5 ? "text-red-500" : "text-white")}>{timeLeft}s</span>
                          </div>
                       </div>
                    </div>

                    <h3 className="text-3xl md:text-5xl font-black uppercase italic text-white leading-tight tracking-tighter min-h-[160px]">
                       {quizData.questions[currentQuestion].question}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                       {quizData.questions[currentQuestion].options.map((opt, i) => (
                         <button 
                           key={i} 
                           onClick={() => handleAnswer(i)}
                           disabled={!optionsVisible[i]}
                           className={cn(
                             "p-8 rounded-[1.5rem] border-2 text-left font-black uppercase text-xs tracking-tight transition-all flex items-center justify-between group h-24",
                             optionsVisible[i] ? "bg-white/5 border-white/10 hover:border-primary hover:bg-primary/5 hover:scale-[1.02]" : "opacity-10 grayscale cursor-not-allowed border-transparent"
                           )}
                         >
                            <span className="flex items-center gap-8">
                               <span className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-primary group-hover:scale-110 transition-transform font-black border border-white/5">
                                  {String.fromCharCode(65 + i)}
                               </span>
                               <span className="max-w-[180px]">{opt}</span>
                            </span>
                         </button>
                       ))}
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-10">
                       <Button onClick={() => triggerLifeline('50-50')} variant="outline" className="h-16 border-amber-500/20 bg-amber-500/5 text-amber-500 font-black uppercase italic text-[10px] rounded-2xl hover:bg-amber-500/10 shadow-xl group">
                          <Zap className="h-4 w-4 mr-2 group-hover:animate-pulse" /> ACTIVATE 50-50 (AD)
                       </Button>
                       <Button onClick={() => triggerLifeline('skip')} variant="outline" className="h-16 border-primary/20 bg-primary/5 text-primary font-black uppercase italic text-[10px] rounded-2xl hover:bg-primary/10 shadow-xl group">
                          <Target className="h-4 w-4 mr-2 group-hover:animate-pulse" /> ACTIVATE SKIP (AD)
                       </Button>
                    </div>
                 </div>
               )}

               {gameState === 'ad_break' && (
                 <div className="text-center space-y-12 py-20 animate-in fade-in duration-300">
                    <div className="h-48 w-48 relative mx-auto flex items-center justify-center">
                       <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                       <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" style={{ animationDuration: '1.5s' }} />
                       <Zap className="h-20 w-20 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-4">
                       <h3 className="text-4xl font-black uppercase italic tracking-tighter">Syncing Sponsor Signal...</h3>
                       <p className="text-2xl font-black text-white italic tabular-nums">{adCountdown}s Remaining</p>
                    </div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] italic opacity-40 leading-relaxed max-w-sm mx-auto">
                       Verification node analysis contributing to the 30% elite prize hub.
                    </p>
                 </div>
               )}

               {gameState === 'gameover' && (
                 <div className="text-center space-y-12 animate-in zoom-in-95 duration-500">
                    <div className="h-32 w-32 bg-primary/10 rounded-[3rem] flex items-center justify-center mx-auto border-2 border-primary/20 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                       <Trophy className="h-16 w-16 text-primary" />
                    </div>
                    <div className="space-y-4">
                       <h2 className="text-5xl font-black uppercase italic tracking-tighter">Match <span className="text-primary">Settled</span></h2>
                       <p className="text-xl font-black text-white italic">Accuracy Hub: {score} PTS</p>
                       <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest italic opacity-60">Result logged for weekly dividend calculation.</p>
                    </div>
                    <Button onClick={() => setGameState('idle')} className="h-20 px-20 bg-white/5 border border-white/10 hover:bg-primary text-white font-black text-xl uppercase italic rounded-3xl shadow-xl transition-all">
                       RE-ENTER ARENA
                    </Button>
                 </div>
               )}
            </Card>
         </div>

         <div className="space-y-10">
            {/* Weekly Elite Leaderboard */}
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative group">
               <div className="bg-primary/10 p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Crown className="text-amber-500 h-6 w-6 animate-bounce" />
                     <h3 className="text-lg font-black uppercase italic tracking-widest text-white">Top 5 Warriors</h3>
                  </div>
                  <Badge className="bg-amber-500 text-black border-none text-[8px] font-black uppercase px-3 italic">30% HUB SHARE</Badge>
               </div>
               <div className="p-4 space-y-2">
                  {leaderboard?.slice(0, 5).map((entry, idx) => (
                    <div key={entry.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-all rounded-3xl group/item border border-transparent hover:border-white/5">
                       <div className="flex items-center gap-6">
                          <span className={cn("text-xs font-black italic", idx === 0 ? "text-amber-500 scale-125" : "text-muted-foreground")}>#{idx + 1}</span>
                          <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white text-sm shadow-xl">
                             {entry.userEmail?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                             <p className="text-sm font-black uppercase text-white truncate max-w-[100px] italic">{entry.userEmail}</p>
                             <p className="text-[8px] font-bold text-muted-foreground uppercase">Lvl {idx + 1} Node</p>
                          </div>
                       </div>
                       <p className="text-lg font-black text-primary italic tabular-nums">{entry.score}</p>
                    </div>
                  ))}
                  {(!leaderboard || leaderboard.length === 0) && (
                    <div className="p-20 text-center text-muted-foreground italic font-black uppercase text-[10px] tracking-[0.4em] opacity-10">Awaiting Signal Ingestion</div>
                  )}
               </div>
            </Card>

            {/* Arena Dividend Policy */}
            <Card className="bg-[#121212] border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute -bottom-10 -left-10 opacity-5">
                  <Users className="h-48 w-48 text-white" />
               </div>
               <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4 relative z-10">
                  <Gift className="h-6 w-6 text-primary" /> Operational <span className="text-primary">Policy</span>
               </h3>
               <div className="space-y-6 relative z-10">
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                     <p className="text-[10px] font-black uppercase text-primary italic tracking-widest">Reward Split Protocol</p>
                     <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase">
                        30% of weekly total pool is distributed strictly to the Top 5 Rankers. 70% is split between active participants based on accuracy.
                     </p>
                  </div>
                  <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest italic opacity-80">
                     <li className="flex items-start gap-4"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0 shadow-xl" /> High difficulty Anti-Cheat active.</li>
                     <li className="flex items-start gap-4"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0 shadow-xl" /> Entry: 2 Coins (VIP 1 Only).</li>
                     <li className="flex items-start gap-4"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0 shadow-xl" /> Distribution every Monday 00:00 AM.</li>
                  </ul>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
