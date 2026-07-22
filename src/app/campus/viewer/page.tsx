'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Loader2, 
  Zap, 
  Clock, 
  Trophy,
  BrainCircuit,
  ShieldCheck,
  Heart,
  Globe,
  PlayCircle,
  X,
  Award,
  Timer,
  MessageSquare,
  Sparkles,
  BookOpen,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  School,
  Type,
  Palette,
  Layers,
  Settings2,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { askHumanTutor, type AskHumanTutorOutput } from '@/ai/flows/ask-human-tutor-flow';
import { UserProfile } from '@/app/lib/types';

const SUCCESS_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3';

type ReaderTheme = 'white' | 'sepia' | 'dark';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const url = searchParams.get('url') || 'https://ncert.nic.in/textbook/pdf/hemh101.pdf';
  
  // UI States
  const [theme, setTheme] = useState<ReaderTheme>('white');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPageTurning, setIsPageTurning] = useState(false);

  // Quiz State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(20);

  // Tutor State
  const [showTutor, setShowTutor] = useState(false);
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorResponse, setTutorResponse] = useState<AskHumanTutorOutput | null>(null);
  const [showAdInter, setShowAdInter] = useState(false);
  const [adCountdown, setAdCountdown] = useState(8);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const playSound = () => {
    const audio = new Audio(SUCCESS_SOUND);
    audio.play().catch(() => {});
  };

  const handlePageTurn = (direction: 'next' | 'prev') => {
    setIsPageTurning(true);
    setTimeout(() => setIsPageTurning(false), 600);
    toast({ title: "PAGE SYNCED", description: "Navigating to next content block." });
  };

  const startAiQuiz = async () => {
    if (!profile) return;
    setShowQuiz(true);
    setQuizLoading(true);
    setQuizFinished(false);
    try {
      const difficulty = profile.rank === 'Elite' ? 'Very High' : profile.rank === 'Gold' ? 'High' : 'Medium';
      const res = await generateQuiz({ 
        contentSummary: `Student Lesson Audit for URL: ${url}. Category: ${profile.geo_region}. Difficulty: ${difficulty}`,
        difficulty 
      });
      setQuizData(res);
      setCurrentQuestion(0);
      setQuizScore(0);
      setLives(3);
      setTimeLeft(20);
    } catch (e) {
      toast({ variant: "destructive", title: "AI HUB OFFLINE" });
      setShowQuiz(false);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleTutorSubmit = () => {
    if (!tutorQuery.trim()) return;
    setShowAdInter(true);
    setAdCountdown(8);
    
    const interval = setInterval(() => {
      setAdCountdown(p => {
        if (p <= 1) {
          clearInterval(interval);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
  };

  const callTutorAi = async () => {
    setShowAdInter(false);
    setTutorLoading(true);
    setTutorResponse(null);
    try {
      const res = await askHumanTutor({
        query: tutorQuery,
        context: `Current Lesson Material: ${url}`,
        preferredLanguage: profile?.preferredLanguage || 'en'
      });
      setTutorResponse(res);
    } catch (e) {
      toast({ variant: "destructive", title: "TUTOR NODE DISCONNECTED" });
    } finally {
      setTutorLoading(false);
    }
  };

  const handleAnswer = async (idx: number) => {
    if (!quizData) return;
    const isCorrect = idx === quizData.questions[currentQuestion].correctIndex;
    
    if (isCorrect) {
      setQuizScore(s => s + 1);
      if (currentQuestion < 4) {
        setCurrentQuestion(c => c + 1);
        setTimeLeft(20);
        toast({ title: "SIGNAL MATCHED", description: "+10 Intelligence Points" });
      } else {
        setQuizFinished(true);
      }
    } else {
      setLives(l => l - 1);
      if (lives <= 1) {
        setShowQuiz(false);
        toast({ variant: "destructive", title: "SIGNAL LOST", description: "Audit failed. Try re-reading." });
      } else {
        toast({ variant: "destructive", title: "INCORRECT", description: "Heart signal depleted." });
      }
    }
  };

  useEffect(() => {
    let timer: any;
    if (showQuiz && !quizLoading && !quizFinished && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && showQuiz && !quizFinished) {
      handleAnswer(-1);
    }
    return () => clearInterval(timer);
  }, [showQuiz, quizLoading, quizFinished, timeLeft]);

  const finalizeQuizReward = async () => {
    if (!user || !userRef || !firestore) return;
    try {
      await updateDoc(userRef, {
        coins: increment(10),
        winningBalance: increment(10),
        scholarPoints: increment(50)
      });
      
      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'quiz_reward',
        amount: 10,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Lesson Mastery Dividend'
      });

      playSound();
      toast({ title: "DIVIDEND DISPATCHED" });
      setShowQuiz(false);
    } catch (e) {
      console.error("Sync Error");
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 flex flex-col",
      theme === 'white' ? "bg-[#f8f9fa]" : theme === 'sepia' ? "bg-[#f4ecd8]" : "bg-[#09090b]"
    )}>
      {/* Immersive Header */}
      <header className="h-16 border-b border-black/5 flex items-center justify-between px-6 backdrop-blur-md sticky top-0 z-50">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground hover:text-primary">
               <ArrowLeft className="h-3 w-3 mr-2" /> EXIT ARENA
            </Button>
            <div className="h-4 w-px bg-black/10 mx-2" />
            <h1 className="text-xs font-black uppercase italic tracking-tighter truncate max-w-[200px]">
              {url.split('/').pop()}
            </h1>
         </div>

         <div className="flex items-center gap-2">
            <ThemeButton active={theme === 'white'} color="#ffffff" onClick={() => setTheme('white')} />
            <ThemeButton active={theme === 'sepia'} color="#f4ecd8" onClick={() => setTheme('sepia')} />
            <ThemeButton active={theme === 'dark'} color="#1a1a1a" onClick={() => setTheme('dark')} />
            <div className="h-4 w-px bg-black/10 mx-2" />
            <Button onClick={() => setIsFullscreen(!isFullscreen)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
               <Maximize2 className="h-4 w-4" />
            </Button>
         </div>
      </header>

      {/* Flipbook Reading Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-12 relative overflow-hidden">
         <div className={cn(
           "relative max-w-5xl w-full aspect-[3/4] md:aspect-[1.4/1] shadow-[0_50px_100px_rgba(0,0,0,0.2)] rounded-lg transition-all duration-700",
           isPageTurning ? "scale-95 opacity-80" : "scale-100 opacity-100",
           theme === 'dark' ? "shadow-primary/5 border border-white/5" : "border-white"
         )}>
            {/* Realistic Binding */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-16 bg-gradient-to-r from-transparent via-black/10 to-transparent z-10 pointer-events-none hidden md:block" />
            
            <div className="flex h-full w-full bg-white overflow-hidden rounded-lg">
               {/* Left Page (Simulated) */}
               <div className={cn(
                 "flex-1 relative transition-colors duration-500 hidden md:block",
                 theme === 'white' ? "bg-white" : theme === 'sepia' ? "bg-[#fcf5e5]" : "bg-[#18181b]"
               )}>
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
                    className={cn(
                      "w-full h-full border-none transition-all",
                      theme === 'dark' && "filter invert-[0.85] grayscale"
                    )}
                  />
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent" />
               </div>

               {/* Right Page (Active View) */}
               <div className={cn(
                 "flex-1 relative transition-colors duration-500",
                 theme === 'white' ? "bg-white" : theme === 'sepia' ? "bg-[#fcf5e5]" : "bg-[#18181b]"
               )}>
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} 
                    className={cn(
                      "w-full h-full border-none transition-all",
                      theme === 'dark' && "filter invert-[0.85] grayscale"
                    )}
                  />
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent" />
               </div>
            </div>

            {/* Navigation Handles */}
            <button 
              onClick={() => handlePageTurn('prev')}
              className="absolute left-[-20px] md:left-[-60px] top-1/2 -translate-y-1/2 h-20 w-20 rounded-full flex items-center justify-center hover:bg-black/5 transition-all text-muted-foreground hover:text-primary group"
            >
               <ChevronLeft className="h-10 w-10 group-hover:scale-125 transition-transform" />
            </button>
            <button 
              onClick={() => handlePageTurn('next')}
              className="absolute right-[-20px] md:right-[-60px] top-1/2 -translate-y-1/2 h-20 w-20 rounded-full flex items-center justify-center hover:bg-black/5 transition-all text-muted-foreground hover:text-primary group"
            >
               <ChevronRight className="h-10 w-10 group-hover:scale-125 transition-transform" />
            </button>
         </div>
      </main>

      {/* Floating Tactical Toolbar */}
      <div className="fixed bottom-10 inset-x-0 flex justify-center z-[100] px-4 pointer-events-none">
         <Card className="pointer-events-auto bg-black/80 backdrop-blur-2xl border-white/10 rounded-full h-16 md:h-20 flex items-center px-4 md:px-10 gap-4 md:gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-2">
            <div className="flex items-center gap-2 md:gap-4 pr-4 md:pr-8 border-r border-white/10">
               <button onClick={() => setShowTutor(true)} className="flex items-center gap-3 group text-primary hover:text-white transition-all">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                     <School className="h-5 w-5" />
                  </div>
                  <span className="text-[9px] md:text-[10px] font-black uppercase italic tracking-widest hidden sm:block">Ask Human Tutor</span>
               </button>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
               <div className="flex flex-col items-center">
                  <p className="text-[7px] md:text-[8px] font-black text-muted-foreground uppercase tracking-widest italic">Reader Pulse</p>
                  <div className="flex items-center gap-3">
                     <span className="text-sm md:text-lg font-black text-white italic tabular-nums">{profile?.scholarPoints || 0}</span>
                     <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                  </div>
               </div>
               
               <Button onClick={startAiQuiz} className="h-10 md:h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-white font-black text-[9px] md:text-[10px] uppercase shadow-lg shadow-primary/20 italic">
                  <BrainCircuit className="h-4 w-4 mr-2" /> Start Mastery Quiz
               </Button>
            </div>

            <div className="pl-4 md:pl-8 border-l border-white/10 flex items-center gap-4">
               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                  <Layers className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[9px] font-black text-white italic">CH 4</span>
               </div>
            </div>
         </Card>
      </div>

      {/* HUMAN TUTOR DIALOG */}
      <Dialog open={showTutor} onOpenChange={setShowTutor}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-2xl rounded-[3rem] p-10 overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
           
           <DialogHeader className="text-center space-y-3 relative z-10">
              <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-2">
                 <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Advance <span className="text-primary">Tutor Node</span></DialogTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Universal Subject Expert • Experienced Professor Persona</p>
           </DialogHeader>

           <div className="space-y-8 py-8 relative z-10">
              {tutorResponse ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-4">
                      <p className="text-sm text-white font-medium leading-relaxed italic">"{tutorResponse.explanation}"</p>
                   </div>
                   
                   {tutorResponse.steps && tutorResponse.steps.length > 0 && (
                     <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                           <Sparkles className="h-3 w-3" /> Expert Step-by-Step Breakdown
                        </p>
                        <div className="space-y-3">
                           {tutorResponse.steps.map((step, i) => (
                             <div key={i} className="flex gap-4 items-start p-4 bg-black/40 border border-white/5 rounded-2xl group hover:border-primary/40 transition-all">
                                <span className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20 shrink-0">{i+1}</span>
                                <p className="text-xs text-muted-foreground font-medium">{step}</p>
                             </div>
                           ))}
                        </div>
                     </div>
                   )}
                   <Button onClick={() => { setTutorResponse(null); setTutorQuery(''); }} className="w-full h-16 bg-white/5 border border-white/10 hover:bg-primary text-white font-black uppercase italic rounded-2xl">
                      NEW TUITION QUERY
                   </Button>
                </div>
              ) : tutorLoading ? (
                <div className="py-20 flex flex-col items-center gap-8">
                   <Loader2 className="h-16 w-16 animate-spin text-primary" />
                   <p className="text-[11px] font-black uppercase italic text-muted-foreground tracking-[0.4em]">PROFESSOR ANALYZING SUBJECT SIGNAL...</p>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Ask any Subject (Math, Science, History, etc.)</Label>
                      <textarea 
                        value={tutorQuery} 
                        onChange={e => setTutorQuery(e.target.value)} 
                        placeholder="E.G. EXPLAIN THE FRENCH REVOLUTION IN ODIA OR SOLVE A CALCULUS PROBLEM..."
                        className="w-full h-40 bg-black border-2 border-white/10 rounded-2xl p-6 font-bold text-sm text-white focus:border-primary/40 focus:ring-0 outline-none uppercase resize-none"
                      />
                   </div>
                   <Button 
                    onClick={handleTutorSubmit} 
                    disabled={!tutorQuery.trim()}
                    className="w-full h-20 bg-primary hover:bg-primary/90 font-black text-xl uppercase italic rounded-2xl shadow-xl shadow-primary/20 transition-all group"
                   >
                      <Zap className="mr-3 h-6 w-6 group-hover:fill-white" /> START ADVANCE TUITION (AD)
                   </Button>
                   <p className="text-[9px] font-bold text-center text-muted-foreground uppercase italic">100% Gated for Admin Profit Management</p>
                </div>
              )}
           </div>
        </DialogContent>
      </Dialog>

      {/* AD INTERSTITIAL MODAL */}
      {showAdInter && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <Card className="max-w-md w-full bg-[#0d0d12] border-primary/20 border-2 rounded-[3rem] overflow-hidden relative shadow-2xl">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(8 - adCountdown) * 45}deg)` }}
                    />
                    <Zap className="h-12 w-12 text-primary animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Generating <span className="text-primary">Tuition...</span></h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Sponsor signal verified. Your Universal Tutor response is being decrypted.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0} 
                      onClick={callTutorAi}
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce shadow-green-500/20" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {adCountdown === 0 ? "ACCESS TUITION" : "VERIFYING SIGNAL..."}
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      )}

      {/* QUIZ DIALOG */}
      <Dialog open={showQuiz} onOpenChange={setShowQuiz}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-2xl rounded-[3rem] p-10 overflow-hidden shadow-2xl">
           <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
           
           {quizLoading ? (
             <div className="py-24 flex flex-col items-center gap-8 relative z-10">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
                <p className="text-[11px] font-black uppercase italic text-muted-foreground tracking-[0.4em]">AI AUDITING LESSON MATERIAL...</p>
             </div>
           ) : quizFinished ? (
             <div className="space-y-10 text-center pt-10 animate-in zoom-in-95 duration-500 relative z-10">
                <div className="h-24 w-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                   <Award className="h-12 w-12 text-green-500" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-4xl font-black uppercase italic tracking-tighter">Lesson <span className="text-primary">Mastered</span></h3>
                   <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Score: {quizScore}/5 Questions Correct</p>
                </div>
                <Button onClick={finalizeQuizReward} className="w-full h-20 bg-primary hover:bg-primary/90 font-black uppercase italic text-xl rounded-2xl shadow-xl shadow-primary/20 transition-all">
                   COLLECT 10 COINS & EXIT
                </Button>
             </div>
           ) : quizData ? (
             <div className="space-y-8 pt-10 relative z-10">
                <div className="flex justify-between items-center">
                   <Badge className="bg-primary/20 text-primary uppercase font-black text-[9px] px-5 py-2">STAGE {currentQuestion + 1} / 5</Badge>
                   <div className="flex items-center gap-6">
                      <div className="flex gap-2">
                         {[...Array(3)].map((_, i) => (
                           <Heart key={i} className={cn("h-5 w-5", i < lives ? "fill-red-500 text-red-500" : "text-white/10")} />
                         ))}
                      </div>
                      <div className="flex items-center gap-3 bg-white/5 px-5 py-2 rounded-xl border border-white/10">
                         <Timer className={cn("h-4 w-4", timeLeft < 5 ? "text-red-500 animate-pulse" : "text-primary")} />
                         <span className={cn("font-black tabular-nums text-lg", timeLeft < 5 ? "text-red-500" : "text-white")}>{timeLeft}s</span>
                      </div>
                   </div>
                </div>

                <h3 className="text-3xl font-black uppercase italic text-white leading-tight min-h-[120px] tracking-tight">
                  {quizData.questions[currentQuestion].question}
                </h3>

                <div className="grid gap-4">
                  {quizData.questions[currentQuestion].options.map((opt, i) => (
                    <button 
                      key={i} 
                      onClick={() => handleAnswer(i)} 
                      className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left font-bold uppercase text-[12px] hover:border-primary hover:bg-primary/5 transition-all group flex items-center justify-between"
                    >
                       <span className="flex items-center gap-6">
                          <span className="h-10 w-10 rounded-xl bg-black border border-white/10 flex items-center justify-center text-primary font-black">{String.fromCharCode(65 + i)}</span>
                          <span className="text-white group-hover:text-primary transition-colors max-w-[400px]">{opt}</span>
                       </span>
                       <Zap className="h-4 w-4 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
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

function ThemeButton({ active, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "h-6 w-6 rounded-full border transition-all",
        active ? "ring-2 ring-primary ring-offset-2 scale-110" : "border-black/10 hover:scale-105"
      )}
      style={{ backgroundColor: color }}
    />
  );
}

export default function PdfViewScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <ViewerContent />
    </Suspense>
  );
}
