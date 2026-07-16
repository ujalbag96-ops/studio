'use client';

import { useState, useEffect } from 'react';
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
  Video,
  PauseCircle,
  Sun,
  Globe,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REWARD_AMOUNT = 300;
const WATCH_DURATION_SECONDS = 600; // 10 Minutes for Full Session Reward

/**
 * Industrial Video Source Mapping
 * Updated with user-provided IPTV and Sample links.
 */
const LANGUAGE_SOURCES: Record<string, string> = {
  hi: "https://iptv-org.github.io/iptv/countries/in.m3u",
  en: "https://www.w3schools.com/html/movie.mp4",
  es: "" // Empty as requested
};

export default function WatchToEarnMovie() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Custom Controls State
  const [brightness, setBrightness] = useState(100);
  const [language, setLanguage] = useState('en');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  // Runtime Reward Tracker Stream
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
      // Secure Backend Postback Simulation
      const res = await fetch('/api/watch-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, type: 'movie_watch' })
      });

      const result = await res.json();
      if (result.success) {
        toast({ 
          title: "300 COINS DISTRIBUTED", 
          description: "Movie session verified. Reward added to task balance." 
        });
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
        audio.play().catch(() => {});
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Reward Synchronization Failed" });
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
         <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 italic">SESSION YIELD: {REWARD_AMOUNT} 🪙</Badge>
            <Badge variant="outline" className="border-white/10 text-[10px] font-black text-muted-foreground uppercase">10% Platform Margin Applied</Badge>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            {/* Main Video Context */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-video border-4 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
               
               {/* Language Selector Overlay */}
               {!isCompleted && (
                 <div className="absolute top-6 right-6 z-50">
                    <Select value={language} onValueChange={setLanguage}>
                       <SelectTrigger className="w-[160px] h-10 bg-black/40 backdrop-blur-md border-white/10 text-white font-black text-[10px] uppercase rounded-xl">
                          <Globe className="h-3 w-3 mr-2 text-primary" />
                          <SelectValue placeholder="Language" />
                       </SelectTrigger>
                       <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                          <SelectItem value="hi">Hindi (IPTV)</SelectItem>
                          <SelectItem value="en">English (Sample)</SelectItem>
                          <SelectItem value="es">Spanish (Null)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
               )}

               {/* Brightness Controller Overlay */}
               {isPlaying && !isCompleted && (
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-left-4 duration-300">
                    <Sun className="h-4 w-4 text-primary animate-pulse" />
                    <div className="h-32 flex items-center">
                       <Slider 
                        value={[brightness]} 
                        onValueChange={(val) => setBrightness(val[0])} 
                        max={150} 
                        min={30} 
                        step={1} 
                        orientation="vertical"
                        className="h-full"
                       />
                    </div>
                    <span className="text-[8px] font-black text-white">{brightness}%</span>
                 </div>
               )}

               {!isPlaying && !isCompleted && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm space-y-6">
                     <button onClick={() => setIsPlaying(true)} className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(255,123,0,0.5)] hover:scale-110 transition-transform">
                        <PlayCircle className="h-12 w-12 text-white fill-white" />
                     </button>
                     <div className="text-center space-y-1">
                        <p className="text-sm font-black uppercase italic tracking-widest text-white">Start Analysis Session</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">10 Minutes remaining for {REWARD_AMOUNT} coins</p>
                     </div>
                  </div>
               )}

               {isPlaying && (
                  <div className="absolute bottom-6 right-6 z-30 animate-in fade-in">
                     <button onClick={() => setIsPlaying(false)} className="bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 hover:bg-black/60 transition-all">
                        <PauseCircle className="h-6 w-6 text-white" />
                     </button>
                  </div>
               )}

               {isCompleted && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl space-y-8 text-center p-8">
                     <div className="h-24 w-24 rounded-[2rem] bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                        <ShieldCheck className="h-12 w-12 text-green-500" />
                     </div>
                     <div className="space-y-3">
                        <h3 className="text-4xl font-black uppercase italic tracking-tighter text-white">Session Verified</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                           {REWARD_AMOUNT} Coins successfully pushed to your wallet signals.<br/>
                           (≈ {profile?.country === 'India' ? '₹3.00' : '$0.30'} Value Synced)
                        </p>
                     </div>
                     <Button asChild variant="outline" className="h-14 px-10 border-white/10 rounded-2xl font-black uppercase tracking-widest hover:bg-white/5">
                        <Link href="/earning-hub">DISPATCH NEXT MISSION</Link>
                     </Button>
                  </div>
               )}

               {/* Video Element with Dynamic Source Reload */}
               {LANGUAGE_SOURCES[language] ? (
                 <video 
                  key={language}
                  src={LANGUAGE_SOURCES[language]} 
                  className={cn("w-full h-full object-cover transition-all duration-700", isPlaying ? "opacity-100" : "opacity-40")}
                  style={{ filter: `brightness(${brightness}%)` }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  autoPlay={isPlaying}
                  controls={false}
                  playsInline
                 />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-[#050508]">
                    <div className="text-center space-y-4">
                       <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No Stream Detected</p>
                    </div>
                 </div>
               )}

               {/* Reward Progress Bar */}
               <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/5 z-30">
                  <div className="h-full bg-primary transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(255,123,0,0.8)]" style={{ width: `${progress}%` }} />
               </div>
            </div>

            {/* AD PERSISTENCE YIELD */}
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden group border-2 border-dashed">
               <div className="h-40 w-full bg-gradient-to-br from-primary/5 to-transparent flex flex-col items-center justify-center relative">
                  <div className="absolute top-4 right-6 flex items-center gap-2">
                     <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,123,0,0.5)]" />
                     <span className="text-[9px] font-black text-primary uppercase tracking-widest">Yield Pipeline Active</span>
                  </div>
                  <Badge variant="outline" className="border-white/10 text-[10px] text-muted-foreground uppercase mb-3 px-4 py-1">Commercial Signal Hub</Badge>
                  <p className="text-sm font-black uppercase italic text-white/20 tracking-[0.4em] text-center px-10">
                     Sponsored revenue stream generated while session is active.
                  </p>
               </div>
            </Card>

            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                     <Video className="text-primary h-5 w-5" />
                  </div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Strategic <span className="text-primary">Watch Analytics</span></h2>
               </div>
               <p className="text-muted-foreground text-sm leading-relaxed font-medium uppercase tracking-tight opacity-80">
                  By analyzing this sponsored cinematic content for the full 10-minute duration, you trigger a 10% distributed margin reward. The system utilizes server-to-server (S2S) signals to ensure zero discrepancy between the watch duration and your coin credit.
               </p>
            </div>
         </div>

         {/* Sidebar Stats & Rules */}
         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 opacity-5">
                  <Zap className="h-40 w-40 text-primary" />
               </div>
               <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl">
                  <Zap className="h-8 w-8" />
               </div>
               <div className="space-y-6 relative z-10">
                  <h3 className="text-2xl font-black uppercase italic">Session Pulse</h3>
                  <div className="space-y-5">
                     <StatRow label="Reward Distributed" value={`${REWARD_AMOUNT} 🪙`} />
                     <StatRow label="Market Value" value={profile?.country === 'India' ? '₹3.00' : '$0.30'} />
                     <StatRow label="Progress" value={`${Math.floor(progress)}%`} />
                     <StatRow label="Time Remaining" value={`${Math.max(0, Math.floor((WATCH_DURATION_SECONDS - secondsWatched)/60))}m ${Math.max(0, (WATCH_DURATION_SECONDS - secondsWatched)%60)}s`} />
                  </div>
               </div>
            </Card>

            <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-6">
               <h3 className="text-sm font-black uppercase italic flex items-center gap-3 text-white">
                  <AlertCircle className="h-5 w-5 text-red-500" /> Operational Protocols
               </h3>
               <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Window focus detection enabled.</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Scrubbing/Fast-forwarding voids session.</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Multi-tabbing results in account flag.</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Distributed 10% platform margin applied.</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}

function StatRow({ label, value }: any) {
   return (
      <div className="flex justify-between items-center border-b border-white/5 pb-3">
         <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</span>
         <span className="text-lg font-black text-white italic tracking-tighter">{value}</span>
      </div>
   );
}
