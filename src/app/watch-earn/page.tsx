
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
  Video,
  PauseCircle,
  Sun,
  Globe,
  Link as LinkIcon,
  Terminal,
  Youtube
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import Hls from 'hls.js';

const REWARD_AMOUNT = 300;
const WATCH_DURATION_SECONDS = 600;
const SUCCESS_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3';

export default function WatchToEarnMovie() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [streamType, setStreamType] = useState<'direct' | 'youtube' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [secondsWatched, setSecondsWatched] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [brightness, setBrightness] = useState(100);
  const [directUrl, setDirectUrl] = useState('');
  const [ytUrl, setYtUrl] = useState('');
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const extractYoutubeId = (url: string) => {
    let videoId = "";
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    } else if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    }
    return videoId;
  };

  const handlePlayDirect = () => {
    if (!directUrl.trim()) {
      toast({ variant: "destructive", title: "Empty Signal", description: "Paste a valid MP4 or M3U8 link." });
      return;
    }
    setStreamType('direct');
    setIsPlaying(true);
    toast({ title: "DIRECT SIGNAL DETECTED", description: "Decrypting custom stream node..." });
  };

  const handlePlayYoutube = () => {
    const id = extractYoutubeId(ytUrl);
    if (!id) {
      toast({ variant: "destructive", title: "Invalid YouTube Signal", description: "Please enter a valid YouTube URL." });
      return;
    }
    setYtVideoId(id);
    setStreamType('youtube');
    setIsPlaying(true);
    toast({ title: "YOUTUBE SIGNAL DETECTED", description: "Syncing global video signal..." });
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying && !isCompleted && secondsWatched < WATCH_DURATION_SECONDS) {
      interval = setInterval(() => {
        setSecondsWatched((prev) => prev + 1);
      }, 1000);
    } else if (secondsWatched >= WATCH_DURATION_SECONDS && !isCompleted) {
      handleClaimReward();
    }
    return () => clearInterval(interval);
  }, [isPlaying, secondsWatched, isCompleted]);

  useEffect(() => {
    if (streamType !== 'direct' || !directUrl || !videoRef.current) return;
    
    const video = videoRef.current;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (directUrl.includes('.m3u') || directUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(directUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => { if (isPlaying) video.play().catch(() => {}); });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = directUrl;
      }
    } else {
      video.src = directUrl;
    }
  }, [streamType, directUrl]);

  useEffect(() => {
    if (videoRef.current && streamType === 'direct') {
      if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
      else videoRef.current.pause();
    }
  }, [isPlaying, streamType]);

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
        new Audio(SUCCESS_SOUND).play().catch(() => {});
        toast({ title: "300 COINS DISTRIBUTED", description: "Session verified. Reward added to task balance." });
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
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="flex items-center justify-between pt-10">
         <Link href="/earning-hub" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to Earning Hub
         </Link>
         <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 italic">SESSION YIELD: {REWARD_AMOUNT} 🪙</Badge>
         </div>
      </div>

      <header className="space-y-6">
         <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-2 text-center md:text-left">
               <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">Video <span className="text-primary">Hub</span></h1>
               <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-70">Analyze high-bandwidth signals for rewards.</p>
            </div>
            
            <div className="grid gap-4 w-full md:w-[500px]">
               <Card className="bg-[#0a0a0f] border-white/5 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
                  <div className="relative flex-1">
                     <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-red-500" />
                     <Input value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="PASTE YOUTUBE URL" className="h-10 bg-black border-white/10 pl-9 text-[10px] font-bold rounded-xl" />
                  </div>
                  <Button onClick={handlePlayYoutube} className="h-10 bg-red-600 hover:bg-red-500 font-black uppercase italic text-[10px] px-6 rounded-xl">PLAY YT</Button>
               </Card>
               <Card className="bg-[#0a0a0f] border-white/5 p-4 rounded-2xl flex items-center gap-4 shadow-xl">
                  <div className="relative flex-1">
                     <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
                     <Input value={directUrl} onChange={e => setDirectUrl(e.target.value)} placeholder="PASTE MP4 / M3U8 LINK" className="h-10 bg-black border-white/10 pl-9 text-[10px] font-bold rounded-xl" />
                  </div>
                  <Button onClick={handlePlayDirect} className="h-10 bg-primary font-black uppercase italic text-[10px] px-6 rounded-xl">PLAY DIRECT</Button>
               </Card>
            </div>
         </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-8">
            <div className="relative rounded-[2.5rem] overflow-hidden bg-black aspect-video border-4 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
               
               {streamType === 'direct' && isPlaying && !isCompleted && (
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-4 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 animate-in slide-in-from-left-4 duration-300">
                    <Sun className="h-4 w-4 text-primary animate-pulse" />
                    <div className="h-32 flex items-center">
                       <Slider value={[brightness]} onValueChange={(val) => setBrightness(val[0])} max={150} min={30} step={1} orientation="vertical" className="h-full" />
                    </div>
                    <span className="text-[8px] font-black text-white">{brightness}%</span>
                 </div>
               )}

               {!streamType && !isCompleted && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm space-y-6">
                     <div className="h-24 w-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center animate-pulse">
                        <Video className="h-10 w-10 text-primary" />
                     </div>
                     <p className="text-xs font-black uppercase italic tracking-widest text-muted-foreground">Waiting for valid signal node...</p>
                  </div>
               )}

               {isCompleted && (
                  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl space-y-8 text-center p-8">
                     <div className="h-24 w-24 rounded-[2rem] bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.2)]">
                        <ShieldCheck className="h-12 w-12 text-green-500" />
                     </div>
                     <div className="space-y-3">
                        <h3 className="text-4xl font-black uppercase italic text-white">Session Verified</h3>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                           {REWARD_AMOUNT} Coins credited to wallet signals.<br/>
                           (≈ {profile?.country === 'India' ? '₹3.00' : '$0.30'} Value Synced)
                        </p>
                     </div>
                     <Button asChild variant="outline" className="h-14 px-10 border-white/10 rounded-2xl font-black uppercase hover:bg-white/5"><Link href="/earning-hub">NEXT MISSION</Link></Button>
                  </div>
               )}

               {streamType === 'direct' ? (
                  <video ref={videoRef} className={cn("w-full h-full object-cover transition-all duration-700", isPlaying ? "opacity-100" : "opacity-40")} style={{ filter: `brightness(${brightness}%)` }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} playsInline />
               ) : streamType === 'youtube' && ytVideoId ? (
                  <iframe src={`https://www.youtube.com/embed/${ytVideoId}?autoplay=1&controls=1&rel=0`} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
               ) : null}

               <div className="absolute bottom-0 left-0 right-0 h-2 bg-white/5 z-30">
                  <div className="h-full bg-primary transition-all duration-1000 ease-linear shadow-[0_0_20px_rgba(255,123,0,0.8)]" style={{ width: `${progress}%` }} />
               </div>
            </div>

            <div className="space-y-6">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center"><Terminal className="text-primary h-5 w-5" /></div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Signal <span className="text-primary">Policy</span></h2>
               </div>
               <p className="text-muted-foreground text-sm leading-relaxed font-medium uppercase tracking-tight opacity-80">
                  By providing a direct signal link, you are responsible for the content legality. Our industrial engine will perform a cognitive audit of the session. 10 minutes of uninterrupted signal data results in an instant 300 coin reward.
               </p>
            </div>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 opacity-5"><Zap className="h-40 w-40 text-primary" /></div>
               <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl"><Zap className="h-8 w-8" /></div>
               <div className="space-y-6 relative z-10">
                  <h3 className="text-2xl font-black uppercase italic">Live Pulse</h3>
                  <div className="space-y-5">
                     <StatRow label="Session Reward" value={`${REWARD_AMOUNT} 🪙`} />
                     <StatRow label="Progress" value={`${Math.floor(progress)}%`} />
                     <StatRow label="Time Remaining" value={`${Math.max(0, Math.floor((WATCH_DURATION_SECONDS - secondsWatched)/60))}m ${Math.max(0, (WATCH_DURATION_SECONDS - secondsWatched)%60)}s`} />
                  </div>
               </div>
            </Card>

            <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-6">
               <h3 className="text-sm font-black uppercase italic flex items-center gap-3 text-white"><AlertCircle className="h-5 w-5 text-red-500" /> Integrity Check</h3>
               <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Session must be 10m continuous.</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> No multiple tabs allowed.</li>
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
