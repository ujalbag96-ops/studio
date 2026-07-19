
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
  Eye, 
  Clock, 
  Trophy,
  BrainCircuit,
  Share2,
  Lock,
  ShieldCheck,
  Timer,
  PlayCircle,
  X,
  Sparkles,
  ArrowRight,
  Heart,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { UserProfile } from '@/app/lib/types';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const url = searchParams.get('url');
  
  const [isAdRunning, setIsAdRunning] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  const [secondsRead, setSecondsRead] = useState(0);
  
  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [lives, setLives] = useState(3);
  const [showReviveAd, setShowReviveAd] = useState(false);
  
  const [isSharing, setIsSharing] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    if (profile?.quizLives !== undefined) setLives(profile.quizLives);
  }, [profile?.quizLives]);

  // Reading Timer
  useEffect(() => {
    if (!user || isAdRunning || showQuiz) return;
    const interval = setInterval(() => {
      setSecondsRead(prev => {
        const next = prev + 1;
        if (next === 900) {
          toast({ title: "STUDY MILESTONE", description: "You've read for 15 mins! Take a quiz to earn coins." });
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [user, isAdRunning, showQuiz]);

  const startAiQuiz = async () => {
    if (lives <= 0) {
      setShowReviveAd(true);
      return;
    }
    setIsAdRunning(false);
    setShowQuiz(true);
    setQuizLoading(true);
    setQuizFinished(false);
    setCurrentQuestion(0);
    setQuizScore(0);
    try {
      const res = await generateQuiz({ 
        contentSummary: "Technical industrial notes with high-level encryption and secure node communication logic." 
      });
      setQuizData(res);
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error" });
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
      // Wrong answer - lose a life
      const newLives = lives - 1;
      setLives(newLives);
      if (userRef) {
        updateDoc(userRef, { quizLives: newLives });
      }
      
      toast({ variant: "destructive", title: "WRONG SIGNAL", description: "You lost 1 Heart! Re-read carefully." });
      
      if (newLives <= 0) {
        setShowQuiz(false);
        setShowReviveAd(true);
      }
    }
  };

  const handleRevive = async () => {
    if (!userRef) return;
    setIsAdRunning(true);
    setAdCountdown(15);
    
    setTimeout(async () => {
      await updateDoc(userRef, { quizLives: 3 });
      setLives(3);
      setIsAdRunning(false);
      setShowReviveAd(false);
      toast({ title: "HEARTS RESTORED", description: "Lives refilled via sponsor signal." });
    }, 15000);
  };

  const claimQuizReward = async (isDouble: boolean = false) => {
    if (!user || !userRef) return;
    const baseReward = quizScore * 2; 
    const finalReward = isDouble ? baseReward * 2 : baseReward;
    
    try {
      await updateDoc(userRef, {
        coins: increment(finalReward),
        taskBalance: increment(finalReward),
        engagementCount: increment(1)
      });
      toast({ title: "REWARD CLAIMED", description: `+${finalReward} Coins added to your wallet!` });
      setShowQuiz(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    }
  };

  const handleViralShare = async () => {
    if (!profile?.referralCode || isSharing) return;
    setIsSharing(true);
    const shareUrl = `${window.location.origin}/login?ref=${profile.referralCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CampusCompanion Notes', text: 'Master these industrial notes and earn coins!', url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied!" });
      }
      await fetch('/api/share-reward', { method: 'POST', body: JSON.stringify({ userId: user?.uid }) });
    } catch (e) {
      console.error("Share signal lost");
    } finally {
      setIsSharing(false);
    }
  };

  if (!url) return <div className="p-20 text-center">Invalid Resource URL</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 pb-32 select-none print:hidden">
      <style jsx global>{`
        @media print { body { display: none !important; } }
        * { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
      `}</style>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground">
               <ArrowLeft className="h-3 w-3 mr-2" /> Back
            </Button>
            <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <Heart className={cn("h-3 w-3", lives > 0 ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
                 <span className="text-[10px] font-black text-white">{lives}</span>
               </div>
               <div className="w-px h-3 bg-white/10" />
               <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-primary animate-pulse" />
                  <span className="text-[10px] font-black text-white tabular-nums">
                    {Math.floor(secondsRead / 60)}m {secondsRead % 60}s Read
                  </span>
               </div>
            </div>
         </div>

         <div className="flex items-center gap-3">
            <Button onClick={handleViralShare} disabled={isSharing} className="h-10 px-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-black text-[9px] uppercase tracking-widest">
               <Share2 className="h-3 w-3 mr-2" /> SHARE TO EARN
            </Button>
            <Button onClick={startAiQuiz} className="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary font-black text-[9px] uppercase tracking-widest">
               <BrainCircuit className="h-3 w-3 mr-2" /> BOSS LEVEL QUIZ
            </Button>
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

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 opacity-5"><ShieldCheck className="h-40 w-48 text-primary" /></div>
               <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3"><Trophy className="h-6 w-6 text-primary" /> Study Bounty</h3>
               <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                     <span className="text-[10px] font-black uppercase text-muted-foreground">Perfect Quiz</span>
                     <span className="text-sm font-black text-primary italic">+10 🪙</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                     <span className="text-[10px] font-black uppercase text-muted-foreground">Reading Goal</span>
                     <span className="text-sm font-black text-primary italic">+2 🪙</span>
                  </div>
               </div>
               <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic border-t border-white/5 pt-4">
                  Pass the quiz to prove lesson mastery. 3 lives per session.
               </p>
            </Card>

            {lives <= 1 && (
               <Card className="bg-red-500/5 border-red-500/20 p-8 rounded-[2.5rem] space-y-4 shadow-2xl animate-pulse">
                  <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /><h4 className="text-[10px] font-black uppercase text-red-500">Critical Status</h4></div>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase leading-relaxed">Signal weakening. Restore hearts via sponsor signal to continue quizzes.</p>
                  <Button onClick={handleRevive} className="w-full h-10 bg-red-600/20 text-red-500 border border-red-500/20 text-[9px] font-black uppercase">RESTORE LIVES</Button>
               </Card>
            )}
         </div>
      </div>

      {/* QUIZ DIALOG */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-xl rounded-[2.5rem] p-10 overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/20 to-transparent pointer-events-none" />
           {quizLoading ? (
             <div className="py-20 flex flex-col items-center gap-6"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">AI GENERATING BOSS QUIZ...</p></div>
           ) : quizFinished ? (
             <div className="space-y-8 text-center pt-10 animate-in zoom-in-95">
                <div className="h-24 w-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto border-2 border-green-500/20 shadow-2xl"><Trophy className="h-12 w-12 text-green-500" /></div>
                <div className="space-y-2"><h3 className="text-4xl font-black uppercase italic">Lesson Master!</h3><p className="text-sm text-muted-foreground font-bold uppercase">You scored {quizScore} / 5 correctly.</p></div>
                <div className="grid gap-4">
                   <Button onClick={() => claimQuizReward(false)} className="h-16 bg-white/5 border border-white/10 text-white rounded-2xl font-black uppercase italic">CLAIM {quizScore * 2} COINS</Button>
                   <Button onClick={() => { setIsAdRunning(true); setAdCountdown(10); }} className="h-16 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl"><Zap className="mr-2 h-5 w-5 fill-white" /> WATCH AD FOR 2X ({quizScore * 4} 🪙)</Button>
                </div>
             </div>
           ) : quizData ? (
             <div className="space-y-8 pt-10 relative z-10">
                <div className="flex justify-between items-center">
                   <Badge className="bg-primary/20 text-primary border-none uppercase font-black text-[8px] px-3">QUESTION {currentQuestion + 1} / 5</Badge>
                   <div className="flex gap-1">{Array(3).fill(0).map((_, i) => <Heart key={i} className={cn("h-4 w-4", i < lives ? "text-red-500 fill-red-500" : "text-muted-foreground opacity-20")} />)}</div>
                </div>
                <h3 className="text-2xl font-black uppercase italic leading-tight text-white">{quizData.questions[currentQuestion].question}</h3>
                <div className="grid gap-3">
                   {quizData.questions[currentQuestion].options.map((opt, i) => (
                     <button key={i} onClick={() => handleAnswer(i)} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left font-bold uppercase text-xs hover:border-primary hover:bg-primary/5 transition-all active:scale-[0.98]">
                        <span className="text-primary mr-4">0{i+1}.</span> {opt}
                     </button>
                   ))}
                </div>
             </div>
           ) : null}
        </DialogContent>
      </Dialog>

      {/* REVIVE DIALOG */}
      <Dialog open={showReviveAd} onOpenChange={setShowReviveAd}>
        <DialogContent className="bg-[#0d0d12] border-red-500/20 text-white max-w-md rounded-[2.5rem] p-12 text-center">
           <div className="space-y-8">
              <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20"><Heart className="h-10 w-10 text-red-500 opacity-20" /></div>
              <div className="space-y-2"><h3 className="text-3xl font-black uppercase italic">Out of Hearts</h3><p className="text-xs text-muted-foreground font-bold uppercase">Reading session signal interrupted. Restore lives to continue quiz access.</p></div>
              <Button onClick={handleRevive} className="w-full h-16 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black uppercase italic">WATCH AD TO REVIVE <Zap className="ml-2 h-4 w-4 fill-white" /></Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* AD OVERLAY */}
      {isAdRunning && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8">
           <Card className="max-w-md w-full bg-[#0d0d12] border-primary/20 border-2 rounded-[3rem] p-12 text-center space-y-10">
              <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-primary/10" /><div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" /><PlayCircle className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <div className="space-y-4"><h3 className="text-3xl font-black uppercase italic">Sponsor Signal...</h3><p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p></div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest italic">Restoring hearts after transmission</p>
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
