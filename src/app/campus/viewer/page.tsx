
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
  const lang = searchParams.get('lang') || 'en';
  
  const [secondsRead, setSecondsRead] = useState(0);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);
  
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
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  // 30-Minute Scholar Point Sync linked to Node 1
  const handleScholarPoints = useCallback(async () => {
    if (!user || !userRef || scholarRewardClaimed || !settings?.node_scholar_dividend) return;
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
        description: lang === 'or' ? 'ସ୍କଲାର ଡିଭିଡେଣ୍ଡ ସକ୍ରିୟ (+10 ପଏଣ୍ଟ)' : 'Scholar Dividend Node Triggered (+10 Scholar Points)'
      });

      setScholarRewardClaimed(true);
      toast({ 
        title: "SCHOLAR DIVIDEND TRIGGERED", 
        description: "+10 Points & +5 Coins added via Node 1." 
      });
    } catch (e) {
      console.error("Signal Sync Error");
    }
  }, [user, userRef, scholarRewardClaimed, firestore, toast, lang, settings]);

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
          toast({ title: "SOLUTION NODE UNLOCKED" });
       } else if (quizFinished) {
          if (userRef) updateDoc(userRef, { coins: increment(10), bonusBalance: increment(10) });
          toast({ title: "MASTERY REWARD SYNCED" });
       }
    }
    return () => clearInterval(interval);
  }, [isAdRunning, adCountdown, quizFinished, pendingUnlock, userRef, toast]);

  const startAiQuiz = async () => {
    setShowQuiz(true);
    setQuizLoading(true);
    setQuizFinished(false);
    try {
      const res = await generateQuiz({ 
        contentSummary: "Vault Material completion verification for Scholar Dividend." 
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
      if (currentQuestion < 4) setCurrentQuestion(c => c + 1);
      else setQuizFinished(true);
    } else {
      setLives(l => l - 1);
      if (lives <= 1) setShowQuiz(false);
    }
  };

  const handleShare = async () => {
    if (!profile?.referralCode) return;
    const shareUrl = `${window.location.origin}/login?ref=${profile.referralCode}`;
    const shareText = `I am studying on CampusCompanion. Access the Global Vault and earn rewards!`;
    if (navigator.share) await navigator.share({ title: 'CampusCompanion Ed', text: shareText, url: shareUrl });
    toast({ title: "SHARE DIVIDEND LOCKED" });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground">
               <ArrowLeft className="h-3 w-3 mr-2" /> EXIT TERMINAL
            </Button>
            {!settings?.node_scholar_dividend && (
               <Badge className="bg-red-500/20 text-red-500 border-none text-[8px] font-black uppercase px-3">
                  DIVIDEND NODE OFFLINE
               </Badge>
            )}
         </div>

         <div className="flex flex-wrap items-center gap-4">
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 flex items-center gap-4 shadow-xl">
               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase text-white tabular-nums">
                  STUDY TIME: {Math.floor(secondsRead/60)}m {secondsRead%60}s
               </span>
               <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${(secondsRead / 1800) * 100}%` }} />
               </div>
            </div>
            <Button onClick={handleShare} className="h-12 px-6 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 font-black text-[10px] uppercase shadow-lg hover:bg-green-500 hover:text-black transition-all">
               <Share2 className="h-4 w-4 mr-2" /> SHARE SIGNAL
            </Button>
            <Button onClick={startAiQuiz} className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase shadow-lg shadow-primary/20 transition-all active:scale-95">
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
            <Card className="bg-gradient-to-br from-primary/20 to-black border-primary/30 p-10 rounded-[3rem] space-y-8 shadow-2xl">
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-white"><Trophy className="h-6 w-6 text-primary" /> Learning Pulse</h3>
               <div className="space-y-6">
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
                        Complete study targets to activate Scholar Dividend payouts.
                     </p>
                  </div>
               </div>
            </Card>
            
            <Card className="bg-amber-500/5 border-amber-500/20 border-2 p-10 rounded-[3rem] text-center space-y-4">
               <Sparkles className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
               <h4 className="text-sm font-black uppercase italic">Mastery Verified</h4>
               <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Signal integrity pass for region: {profile?.geo_region}</p>
            </Card>
         </div>
      </div>

      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-xl rounded-[3rem] p-10 overflow-hidden shadow-2xl">
           {quizLoading ? (
             <div className="py-24 flex flex-col items-center gap-8 relative z-10">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-[11px] font-black uppercase italic text-muted-foreground tracking-[0.4em]">AI SCANNING VAULT...</p>
             </div>
           ) : quizFinished ? (
             <div className="space-y-10 text-center pt-10">
                <Award className="h-14 w-14 text-green-500 mx-auto" />
                <h3 className="text-3xl font-black uppercase italic">Curriculum Mastered</h3>
                <Button onClick={() => { setIsAdRunning(true); setAdCountdown(10); setShowQuiz(false); }} className="w-full h-20 bg-primary font-black uppercase italic rounded-2xl shadow-xl">
                   CLAIM DIVIDEND
                </Button>
             </div>
           ) : quizData ? (
             <div className="space-y-8 pt-10">
                <Badge className="bg-primary/20 text-primary uppercase font-black text-[9px] px-4 py-1">QUESTION {currentQuestion + 1} / 5</Badge>
                <h3 className="text-2xl font-black uppercase italic text-white leading-tight min-h-[80px]">
                  {quizData.questions[currentQuestion].question}
                </h3>
                <div className="grid gap-4">
                  {quizData.questions[currentQuestion].options.map((opt, i) => (
                    <button key={i} onClick={() => handleAnswer(i)} className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left font-bold uppercase text-[11px] hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group">
                       <span className="text-white group-hover:text-primary transition-colors">{opt}</span>
                       <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary transition-all" />
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
