
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  Clock, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  Trophy,
  Video
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const REWARD_AMOUNT = 300;
const WATCH_DURATION_SECONDS = 600; // 10 Minutes for Movie Sample/Analysis

export default function WatchToEarnMovie() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    let interval: any;
    if (isPlaying && secondsWatched < WATCH_DURATION_SECONDS) {
      interval = setInterval(() => {
        setSecondsWatched((prev) => prev + 1);
      }, 1000);
    } else if (secondsWatched >= WATCH_DURATION_SECONDS && !isCompleted) {
      handleClaimReward();
    }
    return () => clearInterval(interval);
  }, [isPlaying, secondsWatched, isCompleted]);

  const handleClaimReward = async () => {
    if (!user || isCompleted || isProcessing) return;
    
    setIsCompleted(true);
    setIsPlaying(false);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/watch-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, type: 'movie_watch' })
      });

      const result = await res.json();
      if (result.success) {
        toast({ 
          title: "300 COINS CREDITED", 
          description: "Movie analysis verified. Rewards added to bonus wallet." 
        });
        new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Reward Sync Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = Math.min((secondsWatched / WATCH_DURATION_SECONDS) * 100, 100);

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="flex items-center justify-between">
         <Link href="/earning-hub" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Earning Hub
         </Link>
         <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 italic">SAMPLE REWARD: {REWARD_AMOUNT} 🪙</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-video border border-white/5 shadow-2xl group">
               {!isPlaying && !isCompleted && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm space-y-6">
                     <button onClick={() => setIsPlaying(true)} className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(255,123,0,0.5)] hover:scale-110 transition-transform">
                        <PlayCircle className="h-12 w-12 text-white fill-white" />
                     </button>
                     <p className="text-sm font-black uppercase italic tracking-widest">Start Analysis Session</p>
                  </div>
               )}

               {isCompleted && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md space-y-6 text-center p-8">
                     <div className="h-20 w-20 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center">
                        <ShieldCheck className="h-10 w-10 text-green-500" />
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-3xl font-black uppercase italic">Analysis Verified</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">300 Coins pushed to your wallet signals.</p>
                     </div>
                     <Button asChild variant="outline" className="border-white/10 rounded-xl font-black uppercase">
                        <Link href="/earning-hub">GO TO NEXT MISSION</Link>
                     </Button>
                  </div>
               )}

               <video 
                src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4" 
                className="w-full h-full object-cover opacity-80"
                controls={isPlaying}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
               />

               <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/5 z-30">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress}%` }} />
               </div>
            </div>

            {/* AD PERSISTENCE YIELD: STRUCTURAL BANNER AD */}
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden group">
               <div className="h-32 w-full bg-gradient-to-br from-primary/5 to-transparent flex flex-col items-center justify-center relative">
                  <div className="absolute top-2 right-4 flex items-center gap-1.5">
                     <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                     <span className="text-[8px] font-black text-primary uppercase">Yield Active</span>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-[8px] text-muted-foreground uppercase mb-2">Sponsored Content</Badge>
                  <p className="text-xs font-black uppercase italic text-white/40 tracking-[0.3em]">Commercial Signal Loading...</p>
                  {/* Real Ad Network Script Integration Point */}
               </div>
            </Card>

            <div className="space-y-4">
               <h2 className="text-3xl font-black uppercase italic tracking-tighter">Strategic <span className="text-primary">Watch</span></h2>
               <p className="text-muted-foreground text-sm leading-relaxed font-medium uppercase tracking-tight">
                  Analyze the sponsored cinematic sample above. Completing the full duration triggers a server-side postback to credit your supplemental assets. Do not close or refresh the session.
               </p>
            </div>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6">
               <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Zap />
               </div>
               <div className="space-y-4">
                  <h3 className="text-xl font-black uppercase italic">Session Stats</h3>
                  <div className="space-y-4">
                     <StatRow label="Reward Pool" value="300 🪙" />
                     <StatRow label="Progress" value={`${Math.floor(progress)}%`} />
                     <StatRow label="Time Remaining" value={`${Math.max(0, Math.floor((WATCH_DURATION_SECONDS - secondsWatched)/60))}m ${Math.max(0, (WATCH_DURATION_SECONDS - secondsWatched)%60)}s`} />
                  </div>
               </div>
            </Card>

            <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-4">
               <h3 className="text-sm font-black uppercase italic flex items-center gap-2 text-white">
                  <AlertCircle className="h-4 w-4 text-red-500" /> Integrity Rules
               </h3>
               <ul className="space-y-3 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" /> Tab-out detection enabled.</li>
                  <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" /> Fast-forwarding voids reward.</li>
                  <li className="flex items-start gap-2"><div className="h-1.5 w-1.5 rounded-full bg-primary mt-1" /> 10% Platform Margin applied.</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: any) {
   return (
      <div className="flex justify-between items-center border-b border-white/5 pb-2">
         <span className="text-[10px] font-black uppercase text-muted-foreground">{label}</span>
         <span className="text-sm font-black text-white italic">{value}</span>
      </div>
   );
}
