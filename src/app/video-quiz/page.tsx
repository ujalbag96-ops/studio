'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  Zap, 
  Target, 
  Loader2, 
  Video,
  CheckCircle2,
  Clock,
  Youtube,
  ShieldCheck
} from 'lucide-react';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';

export default function VideoQuizArena() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [gameState, setGameState] = useState<'idle' | 'watching' | 'quiz' | 'settling'>('idle');
  const [watchTime, setWatchTime] = useState(0);
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('https://ipapi.co/json/').then(res => res.json()).then(data => setGeoData(data)).catch(() => {});
  }, []);

  useEffect(() => {
    let interval: any;
    if (gameState === 'watching') {
      interval = setInterval(() => setWatchTime(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  const startVideo = () => {
    setGameState('watching');
    setWatchTime(0);
  };

  const finishVideo = async () => {
    if (watchTime < 15) {
      toast({ variant: "destructive", title: "RETENTION FAILED", description: "Watch at least 15s to unlock quiz." });
      return;
    }
    setGameState('quiz');
    setIsProcessing(true);
    try {
      const res = await generateQuiz({ contentSummary: "Industrial yield node session." });
      setQuizData(res);
    } catch (e) {
      toast({ variant: "destructive", title: "AI SYNC FAILED" });
      setGameState('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswer = async (correct: boolean) => {
    if (!correct) {
      toast({ variant: "destructive", title: "SIGNAL MISMATCH", description: "Try another video." });
      setGameState('idle');
      return;
    }

    setGameState('settling');
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ad-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.uid, 
          type: 'video_quiz_reward',
          watchTimeSec: watchTime,
          completed: true,
          country: geoData?.country_name || 'Global',
          ip: geoData?.ip || 'Unknown'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "YIELD SETTLED", description: `+${data.credit} Coins credited to wallet.` });
        setGameState('idle');
      }
    } catch (e) {
      toast({ variant: "destructive", title: "SETTLEMENT FAILED" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-6 pt-10 text-center md:text-left">
         <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Target className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Video Audit Arena v1.0</span>
         </div>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Video <span className="text-primary">Quiz</span></h1>
         <p className="text-muted-foreground font-medium text-lg max-w-xl italic">Watch verified signals, solve cognitive audits, and claim distributed yield.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <Card className="bg-[#050508] border-2 border-white/5 rounded-[3rem] overflow-hidden min-h-[450px] flex flex-col items-center justify-center relative shadow-2xl">
               {gameState === 'idle' && (
                 <div className="text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
                    <div className="h-32 w-32 rounded-[3rem] bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto shadow-2xl">
                       <PlayCircle className="h-16 w-16 text-primary animate-pulse" />
                    </div>
                    <Button onClick={startVideo} className="h-20 px-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-xl uppercase italic shadow-xl">INITIALIZE STREAM</Button>
                 </div>
               )}

               {gameState === 'watching' && (
                 <div className="w-full h-full flex flex-col items-center justify-center space-y-10 p-12">
                    <div className="aspect-video w-full bg-black rounded-3xl border border-white/10 flex items-center justify-center relative overflow-hidden">
                       <Youtube className="h-20 w-20 text-red-600 opacity-20" />
                       <div className="absolute top-6 right-6 bg-black/60 px-4 py-2 rounded-xl border border-white/10 text-white font-black text-xs tabular-nums">
                          {watchTime}s
                       </div>
                    </div>
                    <Button onClick={finishVideo} className="h-16 px-12 bg-white/5 border border-white/10 hover:bg-primary text-white rounded-xl font-black uppercase text-sm">FINISH & AUDIT</Button>
                 </div>
               )}

               {gameState === 'quiz' && (
                 <div className="p-12 space-y-10 animate-in fade-in duration-500 w-full">
                    {isProcessing ? (
                      <div className="text-center space-y-6">
                         <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">DECRYPTING AUDIT QUESTIONS...</p>
                      </div>
                    ) : quizData && (
                      <div className="space-y-10">
                         <h3 className="text-3xl font-black uppercase italic text-white leading-tight">{quizData.questions[0].question}</h3>
                         <div className="grid gap-4">
                            {quizData.questions[0].options.map((opt, i) => (
                              <button 
                                key={i} 
                                onClick={() => handleAnswer(i === quizData.questions[0].correctIndex)}
                                className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary hover:bg-primary/5 text-left font-black uppercase text-xs transition-all"
                              >
                                {opt}
                              </button>
                            ))}
                         </div>
                      </div>
                    )}
                 </div>
               )}

               {gameState === 'settling' && (
                 <div className="text-center space-y-8 animate-pulse">
                    <ShieldCheck className="h-20 w-20 text-primary mx-auto" />
                    <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em]">SYNCHRONIZING REWARD SIGNAL...</p>
                 </div>
               )}
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                  <Zap className="h-40 w-40 text-primary" />
               </div>
               <h3 className="text-2xl font-black uppercase italic flex items-center gap-3"><Zap className="text-primary" /> Session Logic</h3>
               <div className="space-y-4 relative z-10 text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" /> Watch for 15s to trigger AI Quiz.</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" /> One correct answer settles reward.</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" /> Distributed Member share credited instantly.</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}
