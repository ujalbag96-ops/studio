'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
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
  School
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { askHumanTutor, type AskHumanTutorOutput } from '@/ai/flows/ask-human-tutor-flow';
import { UserProfile } from '@/app/lib/types';

const SUCCESS_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const url = searchParams.get('url') || 'https://ncert.nic.in/textbook/pdf/hemh101.pdf';
  
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
      trackAdminRevenue();
    } catch (e) {
      toast({ variant: "destructive", title: "TUTOR NODE DISCONNECTED" });
    } finally {
      setTutorLoading(false);
    }
  };

  const trackAdminRevenue = async () => {
     // Mock tracking of 100% admin profit ad completion
     console.log("[ADMIN MONETIZATION] Universal Tutor Session Verified. 100% Margin Collected.");
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
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8 pb-32">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-[10px] font-black uppercase text-muted-foreground">
               <ArrowLeft className="h-3 w-3 mr-2" /> EXIT VAULT
            </Button>
            <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase px-4 italic">INDUSTRIAL RESOURCE NODE</Badge>
         </div>

         <div className="flex flex-wrap items-center gap-4">
            <Button onClick={() => setShowTutor(true)} variant="outline" className="h-12 px-6 rounded-2xl border-primary/20 bg-primary/5 text-primary font-black text-[10px] uppercase shadow-lg">
               <School className="h-4 w-4 mr-2" /> UNIVERSAL TUITION TEACHER
            </Button>
            <Button onClick={startAiQuiz} className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase shadow-lg shadow-primary/20">
               <BrainCircuit className="h-4 w-4 mr-2" /> VAULT QUIZ (+10 🪙)
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
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-white"><Zap className="h-6 w-6 text-primary" /> Yield Hub</h3>
               <div className="space-y-6 relative z-10">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-muted-foreground">Mastery Score</span>
                     <span className="text-primary">{profile?.scholarPoints || 0} Pts</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                     <span className="text-muted-foreground">Advance Tutor</span>
                     <span className="text-amber-500 italic">Universal Mode</span>
                  </div>
               </div>
            </Card>
            
            <Card className="bg-amber-500/5 border-amber-500/20 border-2 p-10 rounded-[3rem] text-center space-y-4">
               <ShieldCheck className="h-8 w-8 text-amber-500 mx-auto animate-pulse" />
               <h4 className="text-sm font-black uppercase italic">Audit Node Active</h4>
               <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest italic leading-relaxed">
                  Advance Subject Expert Node • 100% Monetized AI Interaction.
               </p>
            </Card>
         </div>
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

export default function PdfViewScreen() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>}>
      <ViewerContent />
    </Suspense>
  );
}
