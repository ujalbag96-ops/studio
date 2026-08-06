
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, addDoc, collection } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  X, 
  Zap, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft,
  Loader2,
  Video,
  PauseCircle,
  Sun,
  Volume2,
  RotateCcw,
  RotateCw,
  VolumeX,
  Lock,
  Gift,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { Movie } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import Hls from 'hls.js';

// Required for static export
export function generateStaticParams() {
  return [
    { id: 'movie-1' },
    { id: 'movie-2' }
  ];
}

export default function MoviePlayerPage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Phase Management: 'locked' -> 'rewarded' -> 'interstitial' -> 'ready'
  const [phase, setPhase] = useState<'locked' | 'rewarded' | 'interstitial' | 'ready'>('locked');
  const [adCountdown, setAdCountdown] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const movieId = params?.id as string || 'movie-1';
  const movieRef = useMemoFirebase(() => (firestore && movieId) ? doc(firestore, 'movies', movieId) : null, [firestore, movieId]);
  const { data: movie, isLoading: movieLoading } = useDoc<Movie>(movieRef);

  // Ad Timer Logic
  useEffect(() => {
    let interval: any;
    if (adCountdown > 0) {
      interval = setInterval(() => setAdCountdown(c => c - 1), 1000);
    } else if (adCountdown === 0) {
       if (phase === 'rewarded') {
          handleClaimUnlock();
       } else if (phase === 'interstitial') {
          setPhase('ready');
          trackEvent('Video_Access_Success');
       }
    }
    return () => clearInterval(interval);
  }, [adCountdown, phase]);

  // Video Streaming Logic
  useEffect(() => {
    if (phase !== 'ready' || !movie?.videoUrl || !videoRef.current) return;
    
    const video = videoRef.current;
    const source = movie.videoUrl;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (source.includes('.m3u8') || source.includes('.m3u')) {
      if (Hls.isSupported()) {
        const hls = new Hls({ capLevelToPlayerSize: true, autoStartLoad: true });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => setIsPlaying(true));
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      }
    } else {
      video.src = source;
    }

    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
  }, [phase, movie?.videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
      else videoRef.current.pause();
    }
  }, [isPlaying]);

  const trackEvent = async (eventName: string) => {
    if (!user || !firestore) return;
    try {
      await addDoc(collection(firestore, 'analytics_events'), {
        userId: user.uid,
        movieId,
        movieTitle: movie?.title,
        event: eventName,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Analytics Signal Lost");
    }
  };

  const startRewardedAd = () => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required", description: "You must be enlisted to earn rewards." });
      return;
    }
    setPhase('rewarded');
    setAdCountdown(10); // Rewarded Ad: 10s
  };

  const handleClaimUnlock = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ad-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, reward: 2 })
      });
      const result = await res.json();
      if (result.success) {
        toast({ title: "2 COINS EARNED", description: "Movie signal unlocked successfully!" });
        new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
        // Move to Interstitial Phase
        setPhase('interstitial');
        setAdCountdown(8); // Interstitial: 8s
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Synchronization Failure" });
      setPhase('locked');
    } finally {
      setIsProcessing(false);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  };

  if (isUserLoading || movieLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;
  if (!movie) notFound();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 pb-32 bg-background">
      <div className="flex items-center justify-between">
         <Link href="/movies" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> All Cinema
         </Link>
         <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 italic">NOW STREAMING: {movie.title}</Badge>
         </div>
      </div>

      <div className="relative rounded-[3rem] overflow-hidden bg-black aspect-video border-4 border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] group">
         
         {/* PLAYER INTERFACE */}
         {phase === 'ready' && (
           <>
              <div className="absolute left-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6 bg-black/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Sun className="h-5 w-5 text-primary animate-pulse" />
                 <div className="h-40 flex items-center">
                    <Slider value={[brightness]} onValueChange={(val) => setBrightness(val[0])} max={150} min={40} step={1} orientation="vertical" className="h-full" />
                 </div>
                 <span className="text-[9px] font-black text-white">{brightness}%</span>
              </div>

              <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6 bg-black/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => setIsMuted(!isMuted)}>{isMuted ? <VolumeX className="h-5 w-5 text-red-500" /> : <Volume2 className="h-5 w-5 text-primary" />}</button>
                 <div className="h-40 flex items-center">
                    <Slider value={[volume]} onValueChange={(val) => { setVolume(val[0]); if(videoRef.current) videoRef.current.volume = val[0]/100; setIsMuted(false); }} max={100} min={0} step={1} orientation="vertical" className="h-full" />
                 </div>
                 <span className="text-[9px] font-black text-white">{volume}%</span>
              </div>

              <div className="absolute inset-x-0 bottom-10 z-50 flex justify-center items-center gap-12 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => skipTime(-10)} className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><RotateCcw className="h-8 w-8 text-white" /></button>
                 <button onClick={() => setIsPlaying(!isPlaying)} className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-xl">
                    {isPlaying ? <PauseCircle className="h-10 w-10 text-white fill-white" /> : <PlayCircle className="h-10 w-10 text-white fill-white" />}
                 </button>
                 <button onClick={() => skipTime(10)} className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10"><RotateCw className="h-8 w-8 text-white" /></button>
              </div>

              <video 
                ref={videoRef} muted={isMuted} 
                className={cn("w-full h-full object-contain transition-all duration-700", isPlaying ? "opacity-100" : "opacity-40")}
                style={{ filter: `brightness(${brightness}%)` }}
                onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
                playsInline
              />
           </>
         )}

         {/* REWARDED UNLOCK PHASE */}
         {phase === 'locked' && (
           <div className="absolute inset-0 z-[150] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 space-y-8 text-center">
              <div className="h-24 w-24 rounded-[2rem] bg-primary/10 border-2 border-primary/20 flex items-center justify-center shadow-2xl">
                 <Lock className="h-12 w-12 text-primary" />
              </div>
              <div className="space-y-3">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Signal <span className="text-primary">Locked</span></h2>
                 <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Watch a short ad to earn rewards and access this content.</p>
              </div>
              <Button 
                onClick={startRewardedAd}
                className="h-20 px-12 bg-primary hover:bg-primary/90 rounded-[1.5rem] font-black text-xl uppercase italic shadow-[0_0_50px_rgba(99,102,241,0.3)] group"
              >
                 <Gift className="mr-3 h-6 w-6 animate-bounce" /> WATCH TO EARN 2 COINS & UNLOCK
              </Button>
              <p className="text-[9px] font-black uppercase text-muted-foreground italic">Instant credit to Supplemental Wallet</p>
           </div>
         )}

         {/* AD MODAL (Simulation for both phases) */}
         {(phase === 'rewarded' || phase === 'interstitial') && (
           <div className="absolute inset-0 z-[200] bg-[#050508] flex items-center justify-center p-8 animate-in fade-in duration-500">
              <div className="max-w-md w-full text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(phase === 'rewarded' ? 10 - adCountdown : 8 - adCountdown) * 45}deg)` }}
                    />
                    {phase === 'rewarded' ? <Gift className="h-12 w-12 text-primary animate-pulse" /> : <Zap className="h-12 w-12 text-primary animate-pulse" />}
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                      {phase === 'rewarded' ? 'Collecting Reward...' : 'Initializing Stream...'}
                    </h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       {phase === 'rewarded' ? 'Sponsor signal analysis in progress. Do not minimize.' : 'High-bandwidth connection protocol active.'}
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-6xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-primary animate-shimmer" style={{ width: `${((phase === 'rewarded' ? 10 - adCountdown : 8 - adCountdown) / (phase === 'rewarded' ? 10 : 8)) * 100}%` }} />
                    </div>
                 </div>
              </div>
           </div>
         )}
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 space-y-6">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">{movie.title}</h2>
            <div className="flex gap-4">
               <Badge className="bg-white/5 text-muted-foreground border-none font-black px-4 py-1.5 uppercase italic">{movie.category}</Badge>
               <Badge className="bg-secondary/10 text-secondary border-none font-black px-4 py-1.5 uppercase italic">4K ULTRA HD</Badge>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium uppercase tracking-tight opacity-80 pt-4">
               Tactical content delivery network active. This stream is encrypted via industrial AES-256 protocols. No download signal available to maintain viewer integrity.
            </p>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute -top-10 -right-10 opacity-5"><ShieldCheck className="h-40 w-40 text-primary" /></div>
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Activity className="text-primary h-6 w-6" /> Quality Hub</h3>
               <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10">
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Server-side Watch Verification</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> High-Bandwidth Decryption</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> S2S Reward Synchronization</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}
