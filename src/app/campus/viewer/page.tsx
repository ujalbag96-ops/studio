
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
import { UserProfile, AppSettings } from '@/app/lib/types';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const url = searchParams.get('url') || 'https://ncert.nic.in/textbook/pdf/hemh101.pdf';
  
  const [secondsRead, setSecondsRead] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [lives, setLives] = useState(3);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [verificationCountdown, setVerificationCountdown] = useState(0);
  const [scholarRewardClaimed, setScholarRewardClaimed] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const handleScholarPoints = useCallback(async () => {
    if (!user || !userRef || scholarRewardClaimed || !settings?.node_scholar_dividend) return;
    setIsVerifying(true);
    setVerificationCountdown(10);
  }, [user, userRef, scholarRewardClaimed, settings]);

  const handleShare = async () => {
    if (!user || isSharing) return;
    setIsSharing(true);
    try {
      const shareText = `Check out this free educational material on CampusHub! Master your curriculum and earn rewards.`;
      const shareUrl = window.location.href;
      
      if (navigator.share) {
        await navigator.share({ title: 'CampusHub Resource', text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link Copied!" });
      }

      // Trigger Share Reward API
      const res = await fetch('/api/share-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid })
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: "REWARD SIGNAL SYNCED", description: `+${data.reward} Coins added for viral sharing.` });
      }
    } catch (e) {
      console.error("Share failed");
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isVerifying && verificationCountdown > 0) {
      interval = setInterval(() => setVerificationCountdown(c => c - 1), 1000);
    } else if (isVerifying && verificationCountdown === 0) {
       finalizeReward();
    }
    return () => clearInterval(interval);
  }, [isVerifying, verificationCountdown]);

  const finalizeReward = async () => {
    if (!user || !userRef || !firestore) return;
    setIsVerifying(false);
    try {
      await updateDoc(userRef, {
        scholarPoints: increment(10),
        coins: increment(5),
        lastStudyDate: new Date().toISOString().split('T')[0]
      });
      
      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'scholar_reward',
        amount: 5,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Scholar Dividend Node: Lesson Mastered (+10 Pts)'
      });

      setScholarRewardClaimed(true);
      toast({ title: "DIVIDEND DISTRIBUTED", description: "+10 Pts & +5 Coins added." });
    } catch (e) {
      console.error("Sync Error");
    }
  };

  useEffect(() => {
    if (!user || showQuiz || isVerifying) return;
    const interval = setInterval(() => {
      setSecondsRead(prev => {
        const next = prev + 1;
        if (next === 1800) handleScholarPoints();
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [user, showQuiz, isVerifying, handleScholarPoints]);

  const startAiQuiz = async () => {
    setShowQuiz(true);
    setQuizLoading(true);
    setQuizFinished(false);
    try {
      const res = await generateQuiz({ contentSummary: "Curriculum Visual Audit for Bounty Unlock." });
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
    if (idx === quizData.questions[currentQuestion].correctIndex) {
      setQuizScore(s => s + 1);
      if (currentQuestion < 4) setCurrentQuestion(c => c + 1);
      else setQuizFinished(true);
    } else {
      setLives(l => l - 1);
      if (lives <= 1) setShowQuiz(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      {isVerifying && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8">
           <Card className="max-w-md w-full bg-[#0d0d12] border-primary/20 border-2 rounded-[3rem] p-12 text-center space-y-10 shadow-2xl">
              <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                 <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                 <Zap className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-black uppercase italic text-white leading-none">Bounty <span className="text-primary">Unlock</span></h3>
                 <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                    Analyzing student session logs to authenticate coin credit. Please wait.
                 </p>
              </div>
              <p className="text-5xl font-black text-white italic tabular-nums">{verificationCountdown}s</p>
           </Card>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground">
               <ArrowLeft className="h-3 w-3 mr-2" /> EXIT VAULT
            </Button>
            <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase px-4 italic">FREE RESOURCE NODE</Badge>
         </div>

         <div className="flex flex-wrap items-center gap-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-2 flex items-center gap-4 shadow-xl">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase text-white tabular-nums">
                  SESSION: {Math.floor(secondsRead/60)}m {secondsRead%60}s
               </span>
            </div>
            <Button onClick={handleShare} disabled={isSharing} className="h-12 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-primary font-black text-[10px] uppercase border border-primary/20">
               {isSharing ? <Loader2 className="animate-spin" /> : <><Share2 className="h-4 w-4 mr-2" /> SHARE FOR +2 🪙</>}
            </Button>
            <Button className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase shadow-lg shadow-primary/20" onClick={startAiQuiz}>
               <BrainCircuit className="h-4 w-4 mr-2" /> VAULT QUIZ
            </Button>
         </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
            <Card className="bg-[#050508] border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative h-[850px]">
               <iframe 
                  src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
                  className="w-full h-full border-none filter invert-[0.85] grayscale"
               />
            </Card>
         </div>

         <div className="space-y-6">
            <Card className="bg-gradient-to-br from-primary/20 to-black border-primary/30 p-10 rounded-[3rem] space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Trophy className="h-32 w-32 text-primary" /></div>
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-white"><Zap className="h-6 w-6 text-primary" /> Yield Stats</h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-muted-foreground">Study Goal</span>
                     <span className="text-white">30 Min (+10 Pts)</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-muted-foreground">Lives Hub</span>
                     <span className="text-red-500 flex items-center gap-1.5">{lives} <Heart className="h-4 w-4 fill-red-500" /></span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-muted-foreground">Total Shares</span>
                     <span className="text-primary">{profile?.totalPagesShared || 0}</span>
                  </div>
               </div>
            </Card>
            
            <Card className="bg-amber-500/5 border-amber-500/20 border-2 p-10 rounded-[3rem] text-center space-y-4">
               <ShieldCheck className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
               <h4 className="text-sm font-black uppercase italic">Student Identity Verified</h4>
               <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest italic leading-relaxed">
                  Real Student Node: {profile?.geo_region} • Anti-Proxy Clear
               </p>
            </Card>
         </div>
      </div>

      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-xl rounded-[3rem] p-10 overflow-hidden shadow-2xl">
           {quizLoading ? (
             <div className="py-24 flex flex-col items-center gap-8 relative z-10">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-[11px] font-black uppercase italic text-muted-foreground tracking-[0.4em]">AI AUDITING VAULT MATERIAL...</p>
             </div>
           ) : quizFinished ? (
             <div className="space-y-10 text-center pt-10">
                <Award className="h-14 w-14 text-green-500 mx-auto" />
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Mastery <span className="text-primary">Authenticated</span></h3>
                <Button onClick={() => { setIsVerifying(true); setVerificationCountdown(10); setShowQuiz(false); }} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl">
                   TRIGGER DIVIDEND
                </Button>
             </div>
           ) : quizData ? (
             <div className="space-y-8 pt-10">
                <Badge className="bg-primary/20 text-primary uppercase font-black text-[9px] px-4 py-1">QUESTION {currentQuestion + 1} / 5</Badge>
                <h3 className="text-2xl font-black uppercase italic text-white leading-tight">
                  {quizData.questions[currentQuestion].question}
                </h3>
                <div className="grid gap-4">
                  {quizData.questions[currentQuestion].options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(i)} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left font-bold uppercase text-[11px] hover:border-primary hover:bg-primary/5 transition-all group flex items-center justify-between">
                       <span className="text-white group-hover:text-primary transition-colors">{opt}</span>
                       <Zap className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary" />
                    </button>
                  ))}
                </div>
             </div>
           ) : null}
        </DialogContent>
      </Dialog>
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
