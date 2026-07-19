
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
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
  AlertCircle
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

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    if (!user || showQuiz || isAdRunning) return;
    const interval = setInterval(() => {
      setSecondsRead(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [user, showQuiz, isAdRunning]);

  useEffect(() => {
    let interval: any;
    if (isAdRunning && adCountdown > 0) {
      interval = setInterval(() => setAdCountdown(c => c - 1), 1000);
    } else if (isAdRunning && adCountdown === 0) {
       setIsAdRunning(false);
       if (pendingUnlock) {
          setPendingUnlock(false);
          // Reward logic for quiz answer unlock
          toast({ title: "DIFFICULT ANSWER UNLOCKED", description: "Signal verified. Options are now visible." });
       } else if (quizFinished) {
          // Final reward logic
          if (userRef) updateDoc(userRef, { coins: increment(10), bonusBalance: increment(10) });
          toast({ title: "10 COINS CREDITED", description: "Lesson mastery verified via Ad Signal." });
       }
    }
    return () => clearInterval(interval);
  }, [isAdRunning, adCountdown, quizFinished, pendingUnlock, userRef]);

  const startAiQuiz = async () => {
    setShowQuiz(true);
    setQuizLoading(true);
    setQuizFinished(false);
    setCurrentQuestion(0);
    setQuizScore(0);
    setLives(3);
    try {
      const res = await generateQuiz({ 
        contentSummary: "Advanced technical notes focusing on high-performance industrial logic and secure node communication." 
      });
      setQuizData(res);
    } catch (e) {
      toast({ variant: "destructive", title: "AI Node Failure" });
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
      toast({ variant: "destructive", title: "SIGNAL VOID", description: "Life lost. Re-read material." });
      if (lives <= 1) setShowQuiz(false);
    }
  };

  const unlockDifficultAnswer = () => {
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
    if (navigator.share) {
      await navigator.share({ title: 'CampusCompanion', text: 'Master these industrial notes!', url: shareUrl });
    }
    // Reward for sharing
    if (userRef) {
       await fetch('/api/share-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user!.uid })
       });
    }
    toast({ title: "SHARE DIVIDEND", description: "+2 Coins added." });
  };

  if (!url) return <div className="p-20 text-center">Invalid Signal URL</div>;

  const isDifficultQuestion = currentQuestion >= 3 && !pendingUnlock && !quizFinished;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground"><ArrowLeft className="h-3 w-3 mr-2" /> Back</Button>
            <Select value={language} onValueChange={setLanguage}>
               <SelectTrigger className="w-[140px] h-10 bg-white/5 border-white/10 rounded-xl font-black text-[10px] uppercase"><Globe className="h-3 w-3 mr-2" /><SelectValue placeholder="Language" /></SelectTrigger>
               <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="or">Odia</SelectItem>
                  <SelectItem value="bn">Bengali</SelectItem>
               </SelectContent>
            </Select>
         </div>

         <div className="flex items-center gap-3">
            <Button onClick={handleShare} className="h-10 px-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-black text-[9px] uppercase"><Share2 className="h-3 w-3 mr-2" /> SHARE FOR 2 🪙</Button>
            <Button onClick={startAiQuiz} className="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-[9px] uppercase"><BrainCircuit className="h-3 w-3 mr-2" /> START QUIZ</Button>
         </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
            <Card className="bg-[#0a0a0f] border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
               <div className="aspect-[3/4] bg-white">
                  <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} className="w-full h-full border-none" />
               </div>
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] space-y-6">
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-white"><Trophy className="h-5 w-5 text-primary" /> Session Hub</h3>
               <div className="space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                     <span className="text-muted-foreground">Reading Time</span>
                     <span className="text-white">{Math.floor(secondsRead/60)}m {secondsRead%60}s</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase">
                     <span className="text-muted-foreground">Lives Remaining</span>
                     <span className="text-red-500 flex items-center gap-1">{lives} <Heart className="h-3 w-3 fill-red-500" /></span>
                  </div>
               </div>
            </Card>

            <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-4">
               <p className="text-[9px] font-black uppercase text-muted-foreground leading-relaxed italic text-center">
                 "Master the lesson to unlock the Quiz Dividend. High-value rewards require ad signal validation."
               </p>
            </Card>
         </div>
      </div>

      {/* QUIZ DIALOG */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-xl rounded-[2.5rem] p-10 overflow-hidden">
           {quizLoading ? (
             <div className="py-20 flex flex-col items-center gap-6"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-[10px] font-black uppercase italic text-muted-foreground">AI GEN MODULE BUSY...</p></div>
           ) : quizFinished ? (
             <div className="space-y-8 text-center pt-10">
                <div className="h-24 w-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-green-500/20 shadow-2xl"><Trophy className="h-12 w-12 text-green-500" /></div>
                <h3 className="text-4xl font-black uppercase italic">Lesson Mastered</h3>
                <p className="text-sm text-muted-foreground font-bold uppercase">Reward Unlocked: 10 Coins</p>
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl">
                   <p className="text-[9px] font-black uppercase text-primary italic">Sponsor Ad required to verify reward signal</p>
                </div>
                <Button onClick={claimQuizReward} className="w-full h-16 bg-primary font-black uppercase italic rounded-2xl">WATCH AD & CLAIM</Button>
             </div>
           ) : quizData ? (
             <div className="space-y-8 pt-10">
                <div className="flex justify-between items-center">
                   <Badge className="bg-primary/20 text-primary uppercase font-black text-[8px] px-3">QUESTION {currentQuestion + 1} / 5</Badge>
                   {currentQuestion >= 3 && <Badge className="bg-amber-500 text-black uppercase font-black text-[8px] px-3 italic animate-pulse">DIFFICULT SIGNAL</Badge>}
                </div>
                <h3 className={cn(
                   "text-2xl font-black uppercase italic text-white leading-tight",
                   isDifficultQuestion && "blur-sm opacity-20 pointer-events-none select-none"
                )}>
                  {quizData.questions[currentQuestion].question}
                </h3>

                {isDifficultQuestion ? (
                  <div className="p-10 bg-white/5 border border-white/10 rounded-3xl text-center space-y-6">
                     <Lock className="h-10 w-10 text-amber-500 mx-auto" />
                     <div className="space-y-2">
                        <p className="text-lg font-black uppercase italic">Unlock Difficult Phase</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">
                           Questions 4 & 5 test high-performance mastery. Watch 1 rewarded ad to unlock the answer terminal.
                        </p>
                     </div>
                     <Button onClick={unlockDifficultAnswer} className="h-14 px-8 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic rounded-xl">
                        WATCH TO UNLOCK
                     </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {quizData.questions[currentQuestion].options.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswer(i)} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left font-bold uppercase text-xs hover:border-primary transition-all group">
                         <span className="text-primary mr-4 group-hover:scale-110 inline-block transition-transform">0{i+1}.</span> {opt}
                      </button>
                    ))}
                  </div>
                )}
             </div>
           ) : null}
        </DialogContent>
      </Dialog>

      {/* REWARDED AD MODAL */}
      {isAdRunning && (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <Card className="max-w-md w-full bg-[#0d0d12] border-white/10 rounded-[3rem] overflow-hidden relative shadow-2xl">
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
                    <h3 className="text-3xl font-black uppercase italic text-white">Verifying Signal...</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Sponsor signal analysis in progress. Do not minimize this node to ensure {pendingUnlock ? 'unlock' : 'reward'} credit.
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
                       {adCountdown === 0 ? "SIGNAL VERIFIED" : "WATCHING AD..."}
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
