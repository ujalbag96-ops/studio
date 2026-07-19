
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2, 
  Zap, 
  Clock, 
  Trophy,
  BrainCircuit,
  Share2,
  ShieldCheck,
  Heart,
  Globe,
  Lock,
  PlayCircle,
  X,
  AlertCircle,
  Award,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { UserProfile } from '@/app/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const url = searchParams.get('url');
  
  const [secondsRead, setSecondsRead] = useState(0);
  const [language, setLanguage] = useState('en');
  
  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [lives, setLives] = useState(3);
  
  const [isAdRunning, setIsAdRunning] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [pendingUnlock, setPendingUnlock] = useState(false);
  const [scholarRewardClaimed, setScholarRewardClaimed] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  // 30-Minute Scholar Point Sync
  const handleScholarPoints = useCallback(async () => {
    if (!user || !userRef || scholarRewardClaimed) return;
    try {
      await updateDoc(userRef, {
        scholarPoints: increment(10),
        coins: increment(5),
        lastStudyDate: new Date().toISOString().split('T')[0]
      });
      
      await addDoc(collection(firestore!, 'users', user.uid, 'ledger'), {
        type: 'scholar_reward',
        amount: 5,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Daily Study Milestone: 30 Mins (+10 Scholar Points)'
      });

      setScholarRewardClaimed(true);
      toast({ title: "SCHOLAR DIVIDEND TRIGGERED", description: "+10 Points & +5 Coins added to your node." });
    } catch (e) {
      console.error("Signal Sync Error");
    }
  }, [user, userRef, scholarRewardClaimed, firestore, toast]);

  useEffect(() => {
    if (!user || showQuiz || isAdRunning) return;
    const interval = setInterval(() => {
      setSecondsRead(prev => {
        const next = prev + 1;
        if (next === 1800) { // 30 Minutes
          handleScholarPoints();
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [user, showQuiz, isAdRunning, handleScholarPoints]);

  useEffect(() => {
    let interval: any;
    if (isAdRunning && adCountdown > 0) {
      interval = setInterval(() => setAdCountdown(c => c - 1), 1000);
    } else if (isAdRunning && adCountdown === 0) {
       setIsAdRunning(false);
       if (pendingUnlock) {
          setPendingUnlock(false);
          toast({ title: "SOLUTION NODE UNLOCKED", description: "Hint and answer options now visible." });
       } else if (quizFinished) {
          if (userRef) updateDoc(userRef, { coins: increment(10), bonusBalance: increment(10) });
          toast({ title: "10 COINS DISTRIBUTED", description: "Mastery verified via Reward Signal." });
       }
    }
    return () => clearInterval(interval);
  }, [isAdRunning, adCountdown, quizFinished, pendingUnlock, userRef, toast]);

  const startAiQuiz = async () => {
    setShowQuiz(true);
    setQuizLoading(true);
    setQuizFinished(false);
    setCurrentQuestion(0);
    setQuizScore(0);
    setLives(3);
    try {
      const res = await generateQuiz({ 
        contentSummary: "Standard NCERT curriculum content focusing on conceptual clarity and academic retention." 
      });
      setQuizData(res);
    } catch (e) {
      toast({ variant: "destructive", title: "AI HUB OFFLINE" });
      setShowQuiz(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleAnswer = async (idx: number) => {
    if (!quizData) return;
    const isCorrect = idx === quizData.questions[currentQuestion].correctIndex;
    
    if (isCorrect) {
      setQuizScore(s => s + 1);
      if (currentQuestion < 4) {
         setCurrentQuestion(c => c + 1);
      } else {
         setQuizFinished(true);
      }
    } else {
      setLives(l => l - 1);
      toast({ variant: "destructive", title: "SIGNAL VOID", description: "Heart lost. Review the NCERT material." });
      if (lives <= 1) setShowQuiz(false);
    }
  };

  const unlockSolution = () => {
     setPendingUnlock(true);
     setAdCountdown(10);
     setIsAdRunning(true);
  };

  const claimQuizReward = () => {
     setIsAdRunning(true);
     setAdCountdown(10);
     setShowQuiz(false);
  };

  const handleShare = async () => {
    if (!profile?.referralCode) return;
    const shareUrl = `${window.location.origin}/login?ref=${profile.referralCode}`;
    const shareText = `I am studying on CampusCompanion. Earn 2 Coins by sharing this industrial hub!`;
    if (navigator.share) {
      await navigator.share({ title: 'CampusCompanion NCERT', text: shareText, url: shareUrl });
    }
    // Reward for sharing
    await fetch('/api/share-reward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user!.uid })
    });
    toast({ title: "SHARE DIVIDEND", description: "+2 Coins added to your vault." });
  };

  if (!url) return <div className="p-20 text-center uppercase font-black italic">Invalid Library Signal URL</div>;

  const isDifficultQuestion = currentQuestion >= 3 && !pendingUnlock && !quizFinished;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground"><ArrowLeft className="h-3 w-3 mr-2" /> EXIT TERMINAL</Button>
            <Select value={language} onValueChange={setLanguage}>
               <SelectTrigger className="w-[140px] h-10 bg-[#0a0a0f] border-white/10 rounded-xl font-black text-[10px] uppercase shadow-xl"><Globe className="h-3 w-3 mr-2 text-primary" /><SelectValue placeholder="Language" /></SelectTrigger>
               <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                  <SelectItem value="en">English (STD)</SelectItem>
                  <SelectItem value="hi">Hindi Node</SelectItem>
                  <SelectItem value="or">Odia Node</SelectItem>
               </SelectContent>
            </Select>
         </div>

         <div className="flex flex-wrap items-center gap-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 flex items-center gap-4">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase text-white tabular-nums">STUDY TIME: {Math.floor(secondsRead/60)}m {secondsRead%60}s</span>
               <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(secondsRead / 1800) * 100}%` }} />
               </div>
            </div>
            <Button onClick={handleShare} className="h-10 px-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-black text-[9px] uppercase"><Share2 className="h-3 w-3 mr-2" /> SHARE FOR 2 🪙</Button>
            <Button onClick={startAiQuiz} className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-white font-black text-[9px] uppercase shadow-lg shadow-primary/20"><BrainCircuit className="h-3 w-3 mr-2" /> CHAPTER QUIZ</Button>
         </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
            <Card className="bg-[#050508] border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative h-[800px]">
               <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} className="w-full h-full border-none invert-[0.8] grayscale filter" />
               <div className="absolute top-6 left-6 pointer-events-none">
                  <Badge className="bg-black/60 backdrop-blur-md text-primary border-primary/20 uppercase font-black px-4 py-1.5 shadow-2xl">NCERT SECURE SIGNAL</Badge>
               </div>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 p-8 rounded-[2.5rem] space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Award className="h-32 w-32 text-primary" />
               </div>
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-white"><Trophy className="h-5 w-5 text-primary" /> Learning Pulse</h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                     <span className="text-muted-foreground">Scholar Goal</span>
                     <span className="text-white">30 Minutes</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase">
                     <span className="text-muted-foreground">Lives Hub</span>
                     <span className="text-red-500 flex items-center gap-1">{lives} <Heart className="h-3 w-3 fill-red-500" /></span>
                  </div>
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
                     <p className="text-[10px] font-bold text-primary uppercase italic tracking-widest">Master 30 Mins to unlock +10 Scholar Points.</p>
                  </div>
               </div>
            </Card>

            <Card className="bg-[#0a0a0f] border-dashed border-2 border-white/5 p-8 rounded-[2.5rem] text-center space-y-4 shadow-xl">
               <Sparkles className="h-8 w-8 text-primary mx-auto opacity-40 animate-pulse" />
               <p className="text-[9px] font-black uppercase text-muted-foreground leading-relaxed italic">
                 "NCERT Mastery is the gateway to High-Bandwidth Career Nodes (UPSC/JEE)."
               </p>
            </Card>
         </div>
      </div>

      {/* QUIZ DIALOG */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-xl rounded-[2.5rem] p-10 overflow-hidden shadow-2xl">
           {quizLoading ? (
             <div className="py-20 flex flex-col items-center gap-6"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">AI GEN MODULE ANALYZING CHAPTER...</p></div>
           ) : quizFinished ? (
             <div className="space-y-8 text-center pt-10">
                <div className="h-24 w-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-green-500/20 shadow-2xl"><Award className="h-12 w-12 text-green-500" /></div>
                <h3 className="text-4xl font-black uppercase italic tracking-tighter">Chapter Mastered</h3>
                <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest italic">Verification Dividend: 10 Coins</p>
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                   <p className="text-[9px] font-black uppercase text-primary italic">Confirm final signal to credit account balance.</p>
                </div>
                <Button onClick={claimQuizReward} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic rounded-2xl shadow-xl">WATCH AD & CLAIM DIVIDEND</Button>
             </div>
           ) : quizData ? (
             <div className="space-y-8 pt-10">
                <div className="flex justify-between items-center">
                   <Badge className="bg-primary/20 text-primary uppercase font-black text-[8px] px-3">QUESTION {currentQuestion + 1} / 5</Badge>
                   {currentQuestion >= 3 && <Badge className="bg-amber-500 text-black uppercase font-black text-[8px] px-3 italic animate-pulse">ADVANCED NODE</Badge>}
                </div>
                <h3 className={cn(
                   "text-2xl font-black uppercase italic text-white leading-tight tracking-tight",
                   isDifficultQuestion && "blur-sm opacity-20 pointer-events-none select-none"
                )}>
                  {quizData.questions[currentQuestion].question}
                </h3>

                {isDifficultQuestion ? (
                  <div className="p-10 bg-white/5 border border-white/10 rounded-3xl text-center space-y-6 animate-in fade-in duration-500 shadow-inner">
                     <Lock className="h-10 w-10 text-amber-500 mx-auto animate-bounce" />
                     <div className="space-y-2">
                        <p className="text-lg font-black uppercase italic">Unlock Solution Node</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed max-w-xs mx-auto">
                           Questions 4 & 5 verify elite conceptual depth. Watch 1 sponsor signal to unlock answer terminal.
                        </p>
                     </div>
                     <Button onClick={unlockSolution} className="h-14 px-8 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic rounded-xl shadow-xl shadow-amber-500/20">
                        WATCH TO UNLOCK HINT
                     </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {quizData.questions[currentQuestion].options.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswer(i)} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left font-bold uppercase text-xs hover:border-primary transition-all group flex items-center justify-between">
                         <div><span className="text-primary mr-4 group-hover:scale-110 inline-block transition-transform">0{i+1}.</span> {opt}</div>
                         <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary transition-all" />
                      </button>
                    ))}
                  </div>
                )}
             </div>
           ) : null}
        </DialogContent>
      </Dialog>

      {/* REWARDED AD MODAL (Simulation) */}
      {isAdRunning && (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <Card className="max-w-md w-full bg-[#0d0d12] border-white/10 rounded-[3rem] overflow-hidden relative shadow-[0_0_100px_rgba(99,102,241,0.2)]">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(10 - adCountdown) * 36}deg)` }}
                    />
                    <PlayCircle className="h-12 w-12 text-primary animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic text-white tracking-tighter">Syncing Signal...</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Verifying sponsor engagement. Do not minimize the hub to ensure {pendingUnlock ? 'solution' : 'reward'} credit.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0} 
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {adCountdown === 0 ? "SIGNAL VERIFIED" : "ENGAGING AD NODE..."}
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}

export default function PdfViewScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <ViewerContent />
    </Suspense>
  );
}
