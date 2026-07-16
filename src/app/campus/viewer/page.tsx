
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore } from '@/firebase';
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
  BrainCircuit,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const url = searchParams.get('url');
  
  const [showSolution, setShowSolution] = useState(false);
  const [isAdRunning, setIsAdRunning] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  
  // Earning State
  const [secondsRead, setSecondsRead] = useState(0);
  
  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Reading Timer (15 mins = 900 seconds)
  useEffect(() => {
    if (!user || isAdRunning || showQuiz) return;
    const interval = setInterval(() => {
      setSecondsRead(prev => {
        const next = prev + 1;
        if (next === 900) {
          handleReward('reading');
          return 0; 
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [user, isAdRunning, showQuiz]);

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

  const handleTakeQuizClick = () => {
    setIsAdRunning(true);
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

  const startAiQuiz = async () => {
    setIsAdRunning(false);
    setShowQuiz(true);
    setQuizLoading(true);
    setQuizFinished(false);
    setQuizStep(0);
    setScore(0);

    try {
      // Logic: Use URL or dummy text to generate quiz via Genkit
      const res = await generateQuiz({ 
        contentSummary: "This is a technical engineering resource covering industrial logic, AES-256 encryption, and secure node communication protocols." 
      });
      setQuizData(res);
    } catch (e) {
      toast({ variant: "destructive", title: "AI Error", description: "Failed to generate quiz signals." });
      setShowQuiz(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (selectedOption === null || !quizData) return;

    // Check Answer
    if (selectedOption === quizData.questions[quizStep].correctIndex) {
      setScore(s => s + 1);
    }

    if (quizStep < 4) {
      setQuizStep(s => s + 1);
      setSelectedOption(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setQuizFinished(true);
    // Logic: If score >= 3, give 5 coins
    const finalScore = score + (selectedOption === quizData?.questions[quizStep].correctIndex ? 1 : 0);
    if (finalScore >= 3) {
      handleReward('quiz');
    }
  };

  const handleSolutionAd = () => {
    setIsAdRunning(true);
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

               {!showSolution && (
                 <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end p-12 space-y-6 z-10">
                    <div className="text-center space-y-2">
                       <h3 className="text-2xl font-black uppercase italic text-white">Full Solution is <span className="text-green-500">FREE</span></h3>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Watch one ad to unlock premium detailed analysis for free</p>
                    </div>
                    <Button 
                      onClick={handleSolutionAd}
                      className="h-16 px-10 bg-green-600 hover:bg-green-500 text-white font-black uppercase italic rounded-2xl shadow-xl"
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
                onClick={handleTakeQuizClick}
                className="w-full h-12 bg-white/5 border border-white/10 hover:bg-primary text-[10px] font-black uppercase rounded-xl transition-all"
               >
                  <BrainCircuit className="h-4 w-4 mr-2" /> TAKE QUIZ (AD)
               </Button>
            </Card>

            <Card className="bg-amber-500/5 border-amber-500/20 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
               <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 border border-amber-500/20">
                  <AlertTriangle className="h-6 w-6" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-sm font-black uppercase italic text-white">Earn Policy</h4>
                  <p className="text-[10px] text-muted-foreground font-medium uppercase leading-relaxed text-center">
                     Rewards are credited after verification. Closing the tab early resets progress.
                  </p>
               </div>
            </Card>
         </div>
      </div>

      {/* QUIZ DIALOG */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
         <DialogContent className="bg-[#0a0a0f] border-primary/20 text-white max-w-lg rounded-[3rem] p-0 overflow-hidden">
            {quizLoading ? (
              <div className="p-20 text-center space-y-6">
                 <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                 <p className="text-[10px] font-black uppercase tracking-widest italic">AI generating quiz signals...</p>
              </div>
            ) : quizFinished ? (
               <div className="p-12 text-center space-y-8">
                  <div className={cn(
                    "h-24 w-24 rounded-[2rem] flex items-center justify-center mx-auto border-2",
                    score >= 3 ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                  )}>
                     {score >= 3 ? <CheckCircle2 className="h-12 w-12" /> : <AlertTriangle className="h-12 w-12" />}
                  </div>
                  <div className="space-y-2">
                     <h3 className="text-3xl font-black uppercase italic">{score >= 3 ? "SUCCESS!" : "FAILED"}</h3>
                     <p className="text-lg font-black italic">Score: {score}/5</p>
                     <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {score >= 3 ? "+5 Coins added to your wallet!" : "You need 3 correct answers to earn rewards."}
                     </p>
                  </div>
                  <Button onClick={() => setShowQuiz(false)} className="w-full h-16 bg-primary font-black uppercase italic rounded-2xl">CONTINUE READING</Button>
               </div>
            ) : quizData ? (
               <div className="p-10 space-y-8">
                  <div className="flex items-center justify-between">
                     <Badge className="bg-primary/20 text-primary uppercase font-black text-[8px]">Step {quizStep + 1} of 5</Badge>
                     <div className="flex gap-1">
                        {[0,1,2,3,4].map(i => (
                           <div key={i} className={cn("h-1 w-8 rounded-full", i === quizStep ? "bg-primary" : i < quizStep ? "bg-primary/40" : "bg-white/5")} />
                        ))}
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-xl font-black uppercase italic leading-tight">"{quizData.questions[quizStep].question}"</h4>
                     <RadioGroup onValueChange={(val) => setSelectedOption(parseInt(val))} className="grid gap-3">
                        {quizData.questions[quizStep].options.map((opt, i) => (
                           <div key={i} className={cn(
                             "flex items-center space-x-3 bg-white/5 p-5 rounded-2xl border transition-all cursor-pointer",
                             selectedOption === i ? "border-primary bg-primary/10" : "border-white/5 hover:border-white/10"
                           )}>
                              <RadioGroupItem value={i.toString()} id={`q-${i}`} />
                              <Label htmlFor={`q-${i}`} className="flex-1 text-[11px] font-bold uppercase cursor-pointer">{opt}</Label>
                           </div>
                        ))}
                     </RadioGroup>
                  </div>

                  <Button 
                    onClick={handleNextQuestion} 
                    disabled={selectedOption === null}
                    className="w-full h-16 bg-primary font-black uppercase italic rounded-2xl shadow-xl flex items-center justify-center gap-3"
                  >
                     {quizStep < 4 ? "NEXT QUESTION" : "SUBMIT & FINALIZE"} <ChevronRight className="h-5 w-5" />
                  </Button>
               </div>
            ) : null}
         </DialogContent>
      </Dialog>

      {/* REWARDED AD MODAL SIMULATION */}
      {isAdRunning && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <Card className="max-w-md w-full bg-[#0d0d12] border-primary/20 border-2 rounded-[3rem] overflow-hidden relative shadow-[0_0_100px_rgba(99,102,241,0.2)]">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(10 - adCountdown) * 36}deg)` }}
                    />
                    <Eye className="h-12 w-12 text-primary animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic">Ad Signal Locked</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Watching sponsor video to authorize your next intelligence session.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0} 
                      onClick={() => adCountdown === 0 && (showQuiz === false ? startAiQuiz() : (setShowSolution(true), setIsAdRunning(false)))}
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {adCountdown === 0 ? "CONFIRM UNLOCK" : "WATCHING SPONSOR..."}
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
