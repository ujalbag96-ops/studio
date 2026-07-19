
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
  Sparkles,
  ZapOff
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
  const lang = searchParams.get('lang') || 'en';
  
  const [secondsRead, setSecondsRead] = useState(0);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  
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

  // Check connection speed (simulation)
  useEffect(() => {
    if (typeof window !== 'undefined' && (navigator as any).connection) {
       const conn = (navigator as any).connection;
       if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === '3g') {
          setIsLowBandwidth(true);
       }
    }
  }, []);

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
        description: lang === 'or' ? 'ଦୈନିକ ପାଠପଢା ମାଇଲଷ୍ଟୋନ (+10 ପଏଣ୍ଟ)' : 'Daily Study Milestone: 30 Mins (+10 Scholar Points)'
      });

      setScholarRewardClaimed(true);
      toast({ 
        title: lang === 'or' ? "ସ୍କଲାର ଡିଭିଡେଣ୍ଡ ସକ୍ରିୟ" : "SCHOLAR DIVIDEND TRIGGERED", 
        description: lang === 'or' ? "+10 ପଏଣ୍ଟ ଏବଂ +5 କଏନ ଯୋଡାଗଲା |" : "+10 Points & +5 Coins added to your node." 
      });
    } catch (e) {
      console.error("Signal Sync Error");
    }
  }, [user, userRef, scholarRewardClaimed, firestore, toast, lang]);

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
      toast({ variant: "destructive", title: "SIGNAL VOID", description: "Heart lost. Review the material." });
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
    const shareText = lang === 'or' ? `ମୁଁ କ୍ୟାମ୍ପସ୍ କମ୍ପାନିଅନ୍ରେ ପଢୁଛି | ଆପଣ ବି ମାଗଣାରେ ନୋଟ୍ସ ପାଆନ୍ତୁ!` : `I am studying on CampusCompanion. Get free books and earn coins!`;
    if (navigator.share) {
      await navigator.share({ title: 'CampusCompanion Ed', text: shareText, url: shareUrl });
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
            <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground">
               <ArrowLeft className="h-3 w-3 mr-2" /> {lang === 'or' ? 'ବାହାରକୁ ଯାଆନ୍ତୁ' : 'EXIT TERMINAL'}
            </Button>
            {isLowBandwidth && (
               <Badge className="bg-amber-500/20 text-amber-500 border-none text-[8px] font-black uppercase flex items-center gap-1.5 px-3">
                  <ZapOff className="h-3 w-3" /> LOW DATA MODE
               </Badge>
            )}
         </div>

         <div className="flex flex-wrap items-center gap-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 flex items-center gap-4 shadow-xl">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase text-white tabular-nums">
                  {lang === 'or' ? 'ପଢିବା ସମୟ' : 'STUDY TIME'}: {Math.floor(secondsRead/60)}m {secondsRead%60}s
               </span>
               <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(secondsRead / 1800) * 100}%` }} />
               </div>
            </div>
            <Button onClick={handleShare} className="h-12 px-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 font-black text-[10px] uppercase shadow-lg hover:bg-green-500 hover:text-black transition-all">
               <Share2 className="h-4 w-4 mr-2" /> SHARE FOR 2 🪙
            </Button>
            <Button onClick={startAiQuiz} className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase shadow-lg shadow-primary/20 transition-all active:scale-95">
               <BrainCircuit className="h-4 w-4 mr-2" /> {lang === 'or' ? 'କୁଇଜ୍ ଆରମ୍ଭ କରନ୍ତୁ' : 'CHAPTER QUIZ'}
            </Button>
         </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
            <Card className="bg-[#050508] border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative h-[850px] group">
               <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
                  className={cn(
                     "w-full h-full border-none filter",
                     isLowBandwidth ? "grayscale opacity-80" : "invert-[0.85] grayscale"
                  )}
               />
               <div className="absolute top-6 left-6 pointer-events-none">
                  <Badge className="bg-black/60 backdrop-blur-md text-primary border-primary/20 uppercase font-black px-4 py-1.5 shadow-2xl">
                     {lang === 'or' ? 'ସୁରକ୍ଷିତ ପାଠ୍ୟପୁସ୍ତକ' : 'SECURE TEXTBOOK SIGNAL'}
                  </Badge>
               </div>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/20 to-black border-primary/30 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                  <Award className="h-32 w-32 text-primary" />
               </div>
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-white"><Trophy className="h-6 w-6 text-primary" /> Learning Pulse</h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-muted-foreground">Scholar Goal</span>
                     <span className="text-white">30 Minutes</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-muted-foreground">Lives Hub</span>
                     <span className="text-red-500 flex items-center gap-1.5">{lives} <Heart className="h-4 w-4 fill-red-500 animate-pulse" /></span>
                  </div>
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/10 text-center shadow-inner">
                     <p className="text-[10px] font-bold text-primary uppercase italic tracking-[0.2em] leading-relaxed">
                        {lang === 'or' ? "୩୦ ମିନିଟ୍ ପଢନ୍ତୁ ଏବଂ ୧୦ ସ୍କଲାର ପଏଣ୍ଟ ହାସଲ କରନ୍ତୁ |" : "Master 30 Mins to unlock +10 Scholar Points."}
                     </p>
                  </div>
               </div>
            </Card>

            <Card className="bg-[#0a0a0f] border-dashed border-2 border-white/5 p-10 rounded-[3rem] text-center space-y-6 shadow-xl">
               <Sparkles className="h-10 w-10 text-primary mx-auto opacity-40 animate-pulse" />
               <p className="text-[10px] font-black uppercase text-muted-foreground leading-relaxed italic tracking-widest">
                 {lang === 'or' ? "\"ଓଡ଼ିଶା ଶିକ୍ଷା ବିଭାଗ ଦ୍ୱାରା ଅନୁମୋଦିତ ପାଠ୍ୟପୁସ୍ତକ |\"" : "\"Education is the gateway to High-Bandwidth Career Nodes.\""}
               </p>
            </Card>
         </div>
      </div>

      {/* QUIZ DIALOG */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-xl rounded-[3rem] p-10 overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
           {quizLoading ? (
             <div className="py-24 flex flex-col items-center gap-8 relative z-10">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-[11px] font-black uppercase italic text-muted-foreground tracking-[0.4em] animate-pulse">AI ANALYZING CHAPTER...</p>
             </div>
           ) : quizFinished ? (
             <div className="space-y-10 text-center pt-10 relative z-10">
                <div className="h-28 w-28 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-green-500/20 shadow-2xl shadow-green-500/10 animate-bounce">
                   <Award className="h-14 w-14 text-green-500" />
                </div>
                <div className="space-y-3">
                   <h3 className="text-4xl font-black uppercase italic tracking-tighter">Chapter Mastered</h3>
                   <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest italic">Verification Dividend: 10 Coins</p>
                </div>
                <Button onClick={claimQuizReward} className="w-full h-20 bg-primary hover:bg-primary/90 font-black uppercase italic text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                   WATCH AD & CLAIM DIVIDEND
                </Button>
             </div>
           ) : quizData ? (
             <div className="space-y-8 pt-10 relative z-10">
                <div className="flex justify-between items-center">
                   <Badge className="bg-primary/20 text-primary uppercase font-black text-[9px] px-4 py-1 tracking-widest shadow-lg">QUESTION {currentQuestion + 1} / 5</Badge>
                   {currentQuestion >= 3 && <Badge className="bg-amber-500 text-black uppercase font-black text-[9px] px-4 py-1 italic animate-pulse shadow-xl">ADVANCED NODE</Badge>}
                </div>
                <h3 className={cn(
                   "text-2xl font-black uppercase italic text-white leading-tight tracking-tight min-h-[80px]",
                   isDifficultQuestion && "blur-md opacity-20 pointer-events-none select-none"
                )}>
                  {quizData.questions[currentQuestion].question}
                </h3>

                {isDifficultQuestion ? (
                  <div className="p-10 bg-white/5 border border-white/10 rounded-[2.5rem] text-center space-y-8 animate-in fade-in duration-500 shadow-inner">
                     <Lock className="h-12 w-12 text-amber-500 mx-auto animate-bounce" />
                     <div className="space-y-3">
                        <p className="text-2xl font-black uppercase italic tracking-tight">Unlock Solution Node</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed max-w-xs mx-auto tracking-widest opacity-60">
                           {lang === 'or' ? "ଏହି ପ୍ରଶ୍ନର ଉତ୍ତର ଦେଖିବା ପାଇଁ ଗୋଟିଏ ବିଜ୍ଞାପନ ଦେଖନ୍ତୁ |" : "Questions 4 & 5 verify elite conceptual depth. Watch 1 sponsor signal to unlock answers."}
                        </p>
                     </div>
                     <Button onClick={unlockSolution} className="h-16 px-10 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 transition-all">
                        WATCH TO UNLOCK HINT
                     </Button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {quizData.questions[currentQuestion].options.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswer(i)} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left font-bold uppercase text-[11px] hover:border-primary hover:bg-primary/5 transition-all group flex items-center justify-between shadow-lg">
                         <div className="flex items-center gap-6">
                            <span className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-primary font-black border border-white/5 group-hover:border-primary/40 group-hover:scale-110 transition-all">
                               {i+1}
                            </span> 
                            <span className="text-white group-hover:text-primary transition-colors">{opt}</span>
                         </div>
                         <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 text-primary transition-all translate-x-4 group-hover:translate-x-0" />
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
           <Card className="max-w-md w-full bg-[#0d0d12] border-primary/30 border-2 rounded-[3.5rem] overflow-hidden relative shadow-[0_0_100px_rgba(99,102,241,0.25)]">
              <div className="p-16 text-center space-y-12">
                 <div className="h-36 w-36 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                      style={{ transform: `rotate(${(10 - adCountdown) * 36}deg)` }}
                    />
                    <PlayCircle className="h-16 w-16 text-primary animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic text-white tracking-tighter">Syncing Signal...</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] leading-relaxed opacity-60">
                       Verifying sponsor engagement. Do not minimize the hub to ensure {pendingUnlock ? 'solution' : 'reward'} credit.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-6xl font-black text-white italic tabular-nums drop-shadow-lg">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0} 
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce shadow-green-500/30" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {adCountdown === 0 ? "SIGNAL VERIFIED" : "ENGAGING AD NODE..."}
                    </Button>
                 </div>
              </div>
              <div className="bg-white/5 p-4 text-center border-t border-white/5">
                 <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.5em] italic">Industrial Rewarded SDK v9.4 Active</p>
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
