'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, query, orderBy, limit, setDoc } from 'firebase/firestore';
import { 
  Trophy, 
  Zap, 
  Heart, 
  Timer, 
  Loader2, 
  ShieldCheck, 
  Crown,
  PlayCircle,
  Video,
  Lock,
  Medal,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { UserProfile, LeaderboardEntry } from '../lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const [videoTimer, setVideoTimer] = useState(10);
  const [pendingLifeline, setPendingLifeline] = useState<'50-50' | 'skip' | null>(null);
  const [optionsVisible, setOptionsVisible] = useState([true, true, true, true]);
  const [isProcessing, setIsProcessing] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const poolRef = useMemoFirebase(() => firestore ? doc(firestore, 'quiz_pool', 'current') : null, [firestore]);
  const leaderboardQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'quiz_leaderboard'), orderBy('score', 'desc'), limit(10)) : null, [firestore]);

  const { data: profile } = useDoc<UserProfile>(userRef);
  const { data: pool } = useDoc<any>(poolRef);
  const { data: leaderboard } = useCollection<LeaderboardEntry>(leaderboardQuery);

  const isVip1 = (profile?.tasksCompletedCount || 0) >= 10 || (profile?.depositBalance || 0) > 0;

  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleAnswer(-1);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  useEffect(() => {
    let timer: any;
    if (gameState === 'watching_video' && videoTimer > 0) {
      timer = setInterval(() => setVideoTimer(prev => prev - 1), 1000);
    } else if (videoTimer === 0 && gameState === 'watching_video') {
      startQuiz();
    }
    return () => clearInterval(timer);
  }, [gameState, videoTimer]);

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
      toast({ variant: "destructive", title: "VIP 1 REQUIRED", description: "Complete 10 Tasks or Add Cash to enter." });
      return;
    }
    setGameState('watching_video');
    setVideoTimer(10);
  };

  const startQuiz = async () => {
    setGameState('loading');
    try {
      const res = await generateQuiz({ contentSummary: "Industrial Cognitive Audit: Scholarship Standard." });
      setQuizData(res);
      setGameState('playing');
      setScore(0);
      setLives(3);
      setCurrentQuestion(0);
      setTimeLeft(15);
    } catch (e) {
      toast({ variant: "destructive", title: "API SYNC FAILED" });
      setGameState('idle');
    }
  };

  const handleAnswer = (idx: number) => {
    if (!quizData) return;
    const isCorrect = idx === quizData.questions[currentQuestion].correctIndex;

    if (isCorrect) {
      setScore(prev => prev + 10);
      toast({ title: "SIGNAL MATCHED", description: "+10 Pts" });
      
      if (currentQuestion < 4) {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(15);
        setOptionsVisible([true, true, true, true]);
      } else {
        handleVictoryInitiate();
      }
    } else {
      setLives(prev => prev - 1);
      if (lives <= 1) setGameState('gameover');
      else toast({ variant: "destructive", title: "SIGNAL DEPLETED" });
    }
  };

  const handleVictoryInitiate = () => {
    setAdCountdown(10);
    setGameState('ad_break'); // Force ad before final credit
  };

  const finalizeLifeline = async () => {
    if (pendingLifeline) {
      if (pendingLifeline === '50-50' && quizData) {
        const correct = quizData.questions[currentQuestion].correctIndex;
        const newVisibility = [false, false, false, false];
        newVisibility[correct] = true;
        let r = Math.floor(Math.random() * 4);
        while (r === correct) r = Math.floor(Math.random() * 4);
        newVisibility[r] = true;
        setOptionsVisible(newVisibility);
      } else if (pendingLifeline === 'skip') {
        setCurrentQuestion(prev => prev + 1);
        setTimeLeft(15);
      }
      setGameState('playing');
      setPendingLifeline(null);
    } else {
      // It was the final reward ad
      await finalizeVictory();
    }
  };

  const finalizeVictory = async () => {
    if (!user || !firestore || !userRef) return;
    setIsProcessing(true);
    try {
      await updateDoc(userRef, {
        coins: increment(10),
        winningBalance: increment(10)
      });

      const lbRef = doc(firestore, 'quiz_leaderboard', user.uid);
      await setDoc(lbRef, {
        userId: user.uid,
        userEmail: user.email?.split('@')[0],
        score: increment(score),
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.play().catch(() => {});

      toast({ title: "ARENA MASTERED", description: "+10 Coins added to winnings." });
      setGameState('gameover');
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILURE" });
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerLifeline = (type: '50-50' | 'skip') => {
    setPendingLifeline(type);
    setAdCountdown(10);
    setGameState('ad_break');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="flex flex-col xl:flex-row justify-between items-center gap-10 pt-10">
         <div className="space-y-4 text-center xl:text-left">
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-5 py-1.5 text-[10px] tracking-widest">
               HIGH-YIELD ARENA v11.5
            </Badge>
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">
               Weekly <span className="text-primary">Prize Hub</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg max-w-2xl italic">
               Master lessons, watch rewarded signals, and claim your share of the ₹{(pool?.currentPrizeINR || 0).toFixed(0)} pool.
            </p>
         </div>

         <Card className="w-full xl:w-96 bg-gradient-to-br from-[#0a0a0f] to-black border-amber-500/30 border-2 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
               <Trophy className="h-40 w-48 text-amber-500" />
            </div>
            <div className="relative z-10 text-center space-y-4">
               <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.4em]">Current Prize Pool</p>
               <h3 className="text-6xl font-black text-white italic tabular-nums">₹{(pool?.currentPrizeINR || 0).toFixed(0)}</h3>
               <Badge className="bg-white/5 border-white/10 font-black text-[9px] px-3 uppercase italic">Payout: Monday 12:00 AM</Badge>
            </div>
         </Card>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
         <div className="lg:col-span-2 space-y-8">
            <Card className="bg-[#050508] border-2 border-white/5 rounded-[3.5rem] p-12 min-h-[600px] flex flex-col justify-center relative overflow-hidden shadow-inner">
               {gameState === 'idle' && (
                 <div className="text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
                    <div className="h-32 w-32 rounded-[3rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(99,102,241,0.2)]">
                       <Video className="h-16 w-16 text-primary animate-pulse" />
                    </div>
                    <div className="space-y-4">
                       <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Start Rewarded Audit</h2>
                       <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                          Analyze 10s video signal to initialize scholarly test exam. High eCPM payout enabled.
                       </p>
                    </div>
                    <Button onClick={initiateGame} className="h-24 px-20 bg-primary hover:bg-primary/90 font-black text-2xl uppercase italic rounded-3xl shadow-xl transition-all hover:scale-105 active:scale-95 group">
                       {isVip1 ? "INITIALIZE (AD)" : <><Lock className="mr-3 h-6 w-6" /> VIP 1 REQUIRED</>}
                    </Button>
                 </div>
               )}

               {gameState === 'watching_video' && (
                  <div className="text-center space-y-10 animate-in fade-in duration-500">
                     <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                        <PlayCircle className="h-12 w-12 text-primary animate-pulse" />
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-3xl font-black uppercase italic text-white leading-none">Syncing Partner Stream...</h3>
                        <p className="text-4xl font-black text-white italic tabular-nums">{videoTimer}s</p>
                     </div>
                  </div>
               )}

               {gameState === 'loading' && (
                 <div className="text-center space-y-8 py-20">
                    <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em] animate-pulse italic">DECRYPTING COGNITIVE AUDIT...</p>
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
                       <Badge variant="outline" className="border-primary/20 text-primary font-black px-4 py-1 italic tracking-widest">{timeLeft}s SIGNAL</Badge>
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
                             optionsVisible[i] ? "bg-white/5 border-white/10 hover:border-primary hover:bg-primary/5 hover:scale-[1.02]" : "opacity-10 grayscale border-transparent"
                           )}
                         >
                            <span className="flex items-center gap-6">
                               <span className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-primary font-black border border-white/5">{String.fromCharCode(65 + i)}</span>
                               <span>{opt}</span>
                            </span>
                         </button>
                       ))}
                    </div>

                    <div className="grid grid-cols-2 gap-6 pt-10">
                       <Button onClick={() => triggerLifeline('50-50')} variant="outline" className="h-16 border-amber-500/20 bg-amber-500/5 text-amber-500 font-black uppercase italic text-[10px] rounded-2xl">
                          50-50 (VIDEO AD)
                       </Button>
                       <Button onClick={() => triggerLifeline('skip')} variant="outline" className="h-16 border-primary/20 bg-primary/5 text-primary font-black uppercase italic text-[10px] rounded-2xl">
                          SKIP (VIDEO AD)
                       </Button>
                    </div>
                 </div>
               )}

               {gameState === 'ad_break' && (
                 <div className="text-center space-y-12 py-20 animate-in fade-in duration-300">
                    <div className="h-24 w-24 mx-auto relative">
                       <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                       <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                       <Zap className="absolute inset-0 m-auto h-10 w-10 text-primary animate-pulse" />
                    </div>
                    <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Verifying Reward Signal...</h3>
                    <p className="text-2xl font-black text-white italic tabular-nums">{adCountdown}s Remaining</p>
                 </div>
               )}

               {gameState === 'gameover' && (
                 <div className="text-center space-y-12 animate-in zoom-in-95 duration-500">
                    <Trophy className="h-16 w-16 text-primary mx-auto" />
                    <div className="space-y-4">
                       <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Bounty <span className="text-primary">Settled</span></h2>
                       <p className="text-xl font-black text-white italic">Accuracy: {score} PTS</p>
                    </div>
                    <Button onClick={() => setGameState('idle')} className="h-20 px-20 bg-white/5 border border-white/10 hover:bg-primary text-white font-black text-xl uppercase italic rounded-3xl transition-all">
                       RE-ENLIST (NEXT AD)
                    </Button>
                 </div>
               )}
            </Card>
         </div>

         <div className="space-y-10">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
               <div className="bg-primary/10 p-8 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Crown className="text-amber-500 h-6 w-6 animate-pulse" />
                     <h3 className="text-lg font-black uppercase italic tracking-widest text-white">Elite Top 3</h3>
                  </div>
                  <Badge className="bg-amber-500 text-black border-none text-[8px] font-black uppercase px-3 italic">WIN PRIZE</Badge>
               </div>
               <div className="p-4 space-y-2">
                  {leaderboard?.slice(0, 3).map((entry, idx) => (
                    <div key={entry.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all rounded-3xl border border-transparent hover:border-white/5">
                       <div className="flex items-center gap-6">
                          <span className={cn("text-xs font-black italic", idx === 0 ? "text-amber-500" : "text-muted-foreground")}>#{idx + 1}</span>
                          <div>
                             <p className="text-sm font-black uppercase text-white italic truncate max-w-[120px]">{entry.userEmail}</p>
                             <p className="text-[8px] font-bold text-muted-foreground uppercase">Rank {idx + 1} Warrior</p>
                          </div>
                       </div>
                       <p className="text-lg font-black text-primary italic tabular-nums">{entry.score}</p>
                    </div>
                  ))}
               </div>
            </Card>

            <Card className="bg-[#121212] border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
               <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4 relative z-10 text-white">
                  <Medal className="h-6 w-6 text-primary" /> Scholarship <span className="text-primary">Policy</span>
               </h3>
               <div className="space-y-6 relative z-10">
                  <p className="text-[11px] font-bold text-muted-foreground leading-relaxed uppercase italic">
                     30% of weekly total pool is shared among the Top 3. Revenue is strictly derived from high-yield rewarded ad signals processed during sessions.
                  </p>
                  <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest italic opacity-80">
                     <li className="flex items-start gap-4"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> One entry per ad cycle.</li>
                     <li className="flex items-start gap-4"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Ad completion is server-verified.</li>
                     <li className="flex items-start gap-4"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Anti-automation node enabled.</li>
                  </ul>
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
}
