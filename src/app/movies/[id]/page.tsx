
'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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
  Maximize,
  VolumeX
} from 'lucide-react';
import Link from 'next/link';
import { useParams, notFound } from 'next/navigation';
import { Movie } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import Hls from 'hls.js';

export default function MoviePlayerPage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showInterstitial, setShowInterstitial] = useState(true);
  const [adCountdown, setAdCountdown] = useState(8);
  const [isPlaying, setIsPlaying] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const movieRef = useMemoFirebase(() => (firestore && params.id) ? doc(firestore, 'movies', params.id as string) : null, [firestore, params.id]);
  const { data: movie, isLoading: movieLoading } = useDoc<Movie>(movieRef);

  // Interstitial Ad Logic
  useEffect(() => {
    let interval: any;
    if (showInterstitial && adCountdown > 0) {
      interval = setInterval(() => setAdCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showInterstitial, adCountdown]);

  // Video Streaming Logic
  useEffect(() => {
    if (showInterstitial || !movie?.videoUrl || !videoRef.current) return;
    
    const video = videoRef.current;
    const source = movie.videoUrl;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (source.includes('.m3u8') || source.includes('.m3u')) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          autoStartLoad: true,
          enableWorker: true,
        });
        hls.loadSource(source);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsPlaying(true);
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      }
    } else {
      video.src = source;
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [showInterstitial, movie?.videoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.play().catch(() => setIsPlaying(false));
      else videoRef.current.pause();
    }
  }, [isPlaying]);

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
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
         
         {/* INDUSTRIAL OVERLAY CONTROLS */}
         {!showInterstitial && (
           <>
              {/* Brightness (Left Zone) */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6 bg-black/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Sun className="h-5 w-5 text-primary animate-pulse" />
                 <div className="h-40 flex items-center">
                    <Slider 
                      value={[brightness]} 
                      onValueChange={(val) => setBrightness(val[0])} 
                      max={150} min={40} step={1} orientation="vertical"
                      className="h-full"
                    />
                 </div>
                 <span className="text-[9px] font-black text-white">{brightness}%</span>
              </div>

              {/* Volume (Right Zone) */}
              <div className="absolute right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6 bg-black/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-5 w-5 text-red-500" /> : <Volume2 className="h-5 w-5 text-primary" />}
                 </button>
                 <div className="h-40 flex items-center">
                    <Slider 
                      value={[volume]} 
                      onValueChange={(val) => { setVolume(val[0]); if(videoRef.current) videoRef.current.volume = val[0]/100; setIsMuted(false); }} 
                      max={100} min={0} step={1} orientation="vertical"
                      className="h-full"
                    />
                 </div>
                 <span className="text-[9px] font-black text-white">{volume}%</span>
              </div>

              {/* Seek Overlay */}
              <div className="absolute inset-x-0 bottom-10 z-50 flex justify-center items-center gap-12 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => skipTime(-10)} className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
                    <RotateCcw className="h-8 w-8 text-white" />
                 </button>
                 <button onClick={() => setIsPlaying(!isPlaying)} className="h-20 w-20 rounded-full bg-primary flex items-center justify-center shadow-xl">
                    {isPlaying ? <PauseCircle className="h-10 w-10 text-white fill-white" /> : <PlayCircle className="h-10 w-10 text-white fill-white" />}
                 </button>
                 <button onClick={() => skipTime(10)} className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10">
                    <RotateCw className="h-8 w-8 text-white" />
                 </button>
              </div>
           </>
         )}

         <video 
            ref={videoRef}
            muted={isMuted}
            className={cn("w-full h-full object-contain transition-all duration-700", isPlaying ? "opacity-100" : "opacity-40")}
            style={{ filter: `brightness(${brightness}%)` }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
         />

         {/* INTERSTITIAL AD MODAL */}
         {showInterstitial && (
           <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-500">
              <Card className="max-w-md w-full bg-[#0d0d12] border-primary/20 border-2 rounded-[3rem] overflow-hidden relative shadow-[0_0_100px_rgba(255,123,0,0.2)]">
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
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter">Initializing <span className="text-primary">Stream...</span></h3>
                       <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                          Industrial signal lock in progress. High-bandwidth connection protocol active.
                       </p>
                    </div>

                    <div className="space-y-6">
                       <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                       <Button 
                         disabled={adCountdown > 0} 
                         onClick={() => setShowInterstitial(false)}
                         className={cn(
                           "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                           adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                         )}
                       >
                          {adCountdown === 0 ? "START MOVIE" : "DECRYPTING SIGNAL..."}
                       </Button>
                    </div>
                 </div>
                 <div className="bg-white/5 p-4 text-center">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Premium Ad Yield v9.2 Operational</p>
                 </div>
              </Card>
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
               <div className="absolute -top-10 -right-10 opacity-5">
                  <ShieldCheck className="h-40 w-40 text-primary" />
               </div>
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3">
                  <ShieldCheck className="text-primary h-6 w-6" /> Quality Hub
               </h3>
               <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10">
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Dynamic Bitrate Scaling</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Industrial Buffer v4.0</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Dolby Atmos Audio</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}
