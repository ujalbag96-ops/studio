
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { UserProfile } from '@/app/lib/types';

function ViewerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const url = searchParams.get('url');
  
  const [showSolution, setShowSolution] = useState(false);
  const [isAdRunning, setIsAdRunning] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);
  const [secondsRead, setSecondsRead] = useState(0);
  
  // Quiz & Share State
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizData, setQuizData] = useState<GenerateQuizOutput | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareCooldown, setShareCooldown] = useState(0);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  // Cooldown Logic
  useEffect(() => {
    let interval: any;
    if (shareCooldown > 0) {
      interval = setInterval(() => setShareCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [shareCooldown]);

  // 🛡️ ANTI-SCREENSHOT PROTECTION
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'c')) || e.key === 'PrintScreen') {
        e.preventDefault();
        toast({ variant: "destructive", title: "SECURITY VIOLATION", description: "Screenshots and Printing are disabled for IP protection." });
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Reading Timer
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

  const handleReward = async (type: 'reading' | 'quiz' | 'share') => {
    if (!user) return;
    const endpoint = type === 'share' ? '/api/share-reward' : '/api/reading-reward';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, type })
      });
      const data = await res.json();
      if (data.success) {
        toast({ 
          title: data.milestone ? `🏆 ${data.milestone} UNLOCKED` : type.toUpperCase() + " REWARD", 
          description: `+${data.reward} Coins added to your wallet!` 
        });
        if (type === 'share') setShareCooldown(30); // 30s Cooldown
        new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
      } else if (data.error) {
        toast({ variant: "destructive", title: "LIMIT REACHED", description: data.error });
      }
    } catch (e) {
      console.error("Reward sync failed");
    }
  };

  const handleShare = async () => {
    if (!user || !profile || shareCooldown > 0) return;
    setIsSharing(true);
    
    const shareUrl = `${window.location.origin}/login?ref=${profile.referralCode}`;
    const shareText = `Check out these industrial notes on CampusCompanion! Join via my link to earn coins: ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'CampusCompanion Notes',
          text: shareText,
          url: shareUrl,
        });
        handleReward('share');
      } else {
        await navigator.clipboard.writeText(shareText);
        toast({ title: "LINK COPIED", description: "Share manually to earn rewards." });
        handleReward('share');
      }
    } catch (e) {
      console.log("Share cancelled");
    } finally {
      setIsSharing(false);
    }
  };

  const startAiQuiz = async () => {
    setIsAdRunning(false);
    setShowQuiz(true);
    setQuizLoading(true);
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

  if (!url) return <div className="p-20 text-center">Invalid Resource URL</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-8 pb-32 select-none print:hidden">
      <style jsx global>{`
        @media print { body { display: none !important; } }
        * { -webkit-touch-callout: none; -webkit-user-select: none; user-select: none; }
      `}</style>

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
            <Button 
              onClick={handleShare}
              disabled={isSharing || shareCooldown > 0}
              className={cn(
                "h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                shareCooldown > 0 ? "bg-white/5 text-muted-foreground" : "bg-primary/10 border border-primary/20 hover:bg-primary text-primary hover:text-white"
              )}
            >
               {isSharing ? <Loader2 className="h-3 w-3 animate-spin" /> : shareCooldown > 0 ? <><Timer className="h-3 w-3 mr-2" /> WAIT {shareCooldown}S</> : <><Share2 className="h-3 w-3 mr-2" /> SHARE & EARN 2 🪙</>}
            </Button>
         </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-6">
            <Card className="bg-[#0a0a0f] border-2 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
               <div className="aspect-[3/4] bg-white">
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                    className="w-full h-full border-none pointer-events-auto"
                    title="Secure Viewer"
                  />
               </div>

               {!showSolution && (
                 <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col items-center justify-end p-12 space-y-6 z-10">
                    <h3 className="text-2xl font-black uppercase italic text-white text-center">Solution is <span className="text-green-500">FREE</span></h3>
                    <Button 
                      onClick={() => { setIsAdRunning(true); setAdCountdown(10); }}
                      className="h-16 px-10 bg-green-600 hover:bg-green-500 font-black uppercase italic rounded-2xl shadow-xl"
                    >
                       UNLOCK FOR FREE (AD) <Zap className="ml-3 h-5 w-5 fill-white" />
                    </Button>
                 </div>
               )}
            </Card>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 opacity-5"><ShieldCheck className="h-40 w-40 text-primary" /></div>
               <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" /> Live Bounty
               </h3>
               <div className="space-y-5">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                     <span className="text-[10px] font-black uppercase text-muted-foreground">15 Mins Read</span>
                     <span className="text-sm font-black text-primary italic">+2 🪙</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                     <span className="text-[10px] font-black uppercase text-muted-foreground">Social Share</span>
                     <span className="text-sm font-black text-primary italic">+2 🪙</span>
                  </div>
               </div>
               <Button 
                onClick={() => { setIsAdRunning(true); setAdCountdown(10); }}
                className="w-full h-12 bg-white/5 border border-white/10 hover:bg-primary text-[10px] font-black uppercase rounded-xl transition-all"
               >
                  <BrainCircuit className="h-4 w-4 mr-2" /> TAKE QUIZ (AD)
               </Button>
            </Card>

            <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-4">
               <h3 className="text-sm font-black uppercase italic flex items-center gap-2 text-white">
                  <Lock className="h-4 w-4 text-red-500" /> Security Protocol
               </h3>
               <ul className="space-y-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" /> Screenshots Blocked</li>
                  <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" /> Share Cooldown Active</li>
               </ul>
            </Card>
         </div>
      </div>

      {/* REWARDED MODAL */}
      {isAdRunning && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8">
           <Card className="max-w-md w-full bg-[#0d0d12] border-primary/20 border-2 rounded-[3rem] overflow-hidden p-12 text-center space-y-10">
              <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                 <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                 <div className="absolute inset-0 rounded-full border-t-4 border-primary animate-spin" />
                 <Eye className="h-12 w-12 text-primary animate-pulse" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-3xl font-black uppercase italic">Verifying Slot...</h3>
                 <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
              </div>
              <Button 
                disabled={adCountdown > 0} 
                onClick={() => adCountdown === 0 && (showQuiz === false ? startAiQuiz() : (setShowSolution(true), setIsAdRunning(false)))}
                className={cn("w-full h-20 rounded-2xl font-black text-xl uppercase italic", adCountdown === 0 ? "bg-green-600 animate-bounce" : "bg-white/5 opacity-50")}
              >
                 {adCountdown === 0 ? "CONFIRM UNLOCK" : "WATCHING SPONSOR..."}
              </Button>
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
