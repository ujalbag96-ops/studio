
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Eye, 
  Sparkles, 
  Clock, 
  Trophy,
  CheckCircle2,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const url = searchParams.get('url');
  
  const [showSolution, setShowSolution] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  
  // Earning State
  const [secondsRead, setSecondsRead] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);

  // Reading Timer (15 mins = 900 seconds)
  useEffect(() => {
    if (!user || isProcessing) return;
    const interval = setInterval(() => {
      setSecondsRead(prev => {
        const next = prev + 1;
        if (next === 900) {
          handleReward('reading');
          return 0; // Reset for next milestone
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [user, isProcessing]);

  const handleReward = async (type: 'reading' | 'quiz') => {
    if (!user) return;
    try {
      const res = await fetch('/api/reading-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, type })
      });
      const data = await res.json();
      if (data.success) {
        toast({ 
          title: type === 'reading' ? "READING REWARD" : "QUIZ REWARD", 
          description: `+${data.reward} Coins added to your wallet!` 
        });
        new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
      }
    } catch (e) {
      console.error("Reward sync failed");
    }
  };

  const handleRewardedAd = () => {
    setIsProcessing(true);
    setAdCountdown(10);
    const interval = setInterval(() => {
      setAdCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const confirmReward = () => {
    setShowSolution(true);
    setIsProcessing(false);
  };

  const submitQuiz = () => {
    // Simple logic: all correct for now in prototype
    handleReward('quiz');
    setShowQuiz(false);
    setQuizStep(0);
  };

  if (!url) return <div className="p-20 text-center">Invalid Resource URL</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex items-center justify-between">
         <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground">
            <ArrowLeft className="h-3 w-3 mr-2" /> Back
         </Button>
         <div className="flex items-center gap-3">
            <div className="bg-black/40 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
               <Clock className="h-3 w-3 text-primary animate-pulse" />
               <span className="text-[10px] font-black text-white tabular-nums">
                 {Math.floor(secondsRead / 60)}m {secondsRead % 60}s Read
               </span>
               <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${(secondsRead / 900) * 100}%` }} />
               </div>
            </div>
            <Badge variant="outline" className="border-white/10 text-primary font-black uppercase text-[9px] italic">Free Reader v4.1</Badge>
         </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-6">
            <Card className="bg-[#0a0a0f] border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
               <div className="aspect-[3/4] bg-white">
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                    className="w-full h-full border-none"
                    title="Resource Viewer"
                  />
               </div>

               {/* Locked Solution Overlay */}
               {!showSolution && (
                 <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end p-12 space-y-6 z-10">
                    <div className="h-16 w-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-green-500 shadow-2xl">
                       <Sparkles className="h-8 w-8" />
                    </div>
                    <div className="text-center space-y-2">
                       <h3 className="text-2xl font-black uppercase italic text-white">Full Solution is <span className="text-green-500">FREE</span></h3>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Watch one ad to unlock premium detailed analysis for free</p>
                    </div>
                    <Button 
                      onClick={handleRewardedAd}
                      className="h-16 px-10 bg-green-600 hover:bg-green-500 text-white font-black uppercase italic rounded-2xl shadow-xl shadow-green-500/20"
                    >
                       UNLOCK FOR FREE (AD) <Zap className="ml-3 h-5 w-5 fill-white" />
                    </Button>
                 </div>
               )}
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] space-y-6 shadow-2xl overflow-hidden relative">
               <div className="absolute -top-10 -right-10 opacity-5">
                  <ShieldCheck className="h-40 w-40 text-primary" />
               </div>
               <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" /> Smart Rewards
               </h3>
               <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10">
                  <li className="flex items-center justify-between">
                     <span>15 Mins Read</span>
                     <span className="text-primary font-black">+2 🪙</span>
                  </li>
                  <li className="flex items-center justify-between">
                     <span>Chapter Quiz</span>
                     <span className="text-primary font-black">+5 🪙</span>
                  </li>
               </ul>
               <Button 
                onClick={() => setShowQuiz(true)}
                className="w-full h-12 bg-white/5 border border-white/10 hover:bg-primary text-[10px] font-black uppercase rounded-xl transition-all"
               >
                  <BrainCircuit className="h-4 w-4 mr-2" /> TAKE QUIZ
               </Button>
            </Card>

            <Card className="bg-amber-500/5 border-amber-500/20 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
               <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase italic text-white">Earn Policy</h4>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed">
                     Rewards are credited after verification. Closing the tab early may reset the reading timer.
                  </p>
               </div>
            </Card>
         </div>
      </div>

      {/* QUIZ DIALOG */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
         <DialogContent className="bg-[#0a0a0f] border-primary/20 text-white max-w-sm rounded-[2.5rem] p-8">
            <DialogHeader className="text-center space-y-4">
               <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
                  <BrainCircuit className="h-8 w-8 text-primary" />
               </div>
               <DialogTitle className="text-2xl font-black uppercase italic">Knowledge Check</DialogTitle>
               <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Complete 3 questions for +5 coins</DialogDescription>
            </DialogHeader>
            <div className="py-8 space-y-6">
               <div className="space-y-4">
                  <p className="text-sm font-bold uppercase italic text-center">"{quizStep === 0 ? "What is the primary topic of this material?" : quizStep === 1 ? "Which concept was explained on Page 2?" : "What is the main conclusion?"}"</p>
                  <RadioGroup className="grid gap-3">
                     {["A) Engineering Logic", "B) Industrial Design", "C) Applied Science"].map((opt, i) => (
                        <div key={i} className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-primary/40 cursor-pointer">
                           <RadioGroupItem value={opt} id={`opt-${i}`} />
                           <Label htmlFor={`opt-${i}`} className="text-[10px] font-bold uppercase">{opt}</Label>
                        </div>
                     ))}
                  </RadioGroup>
               </div>
            </div>
            <DialogFooter>
               <Button 
                onClick={() => quizStep < 2 ? setQuizStep(s => s + 1) : submitQuiz()}
                className="w-full h-14 bg-primary font-black uppercase italic rounded-xl"
               >
                  {quizStep < 2 ? "NEXT QUESTION" : "SUBMIT & CLAIM"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* REWARDED AD MODAL SIMULATION */}
      {isProcessing && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <Card className="max-w-md w-full bg-[#0d0d12] border-green-500/20 border-2 rounded-[3rem] overflow-hidden relative shadow-[0_0_100px_rgba(34,197,94,0.2)]">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-green-500/10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-green-500 transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(10 - adCountdown) * 36}deg)` }}
                    />
                    <Eye className="h-12 w-12 text-green-500 animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">Decrypting <span className="text-green-500">Free Solution...</span></h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Watching sponsor signal to finalize free unlock protocol.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0} 
                      onClick={confirmReward}
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {adCountdown === 0 ? "CONFIRM FREE UNLOCK" : "WATCHING SPONSOR..."}
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
