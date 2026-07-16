
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
  Globe,
  Maximize,
  Volume2
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const movieRef = useMemoFirebase(() => (firestore && params.id) ? doc(firestore, 'movies', params.id as string) : null, [firestore, params.id]);
  const { data: movie, isLoading: movieLoading } = useDoc<Movie>(movieRef);

  // Interstitial Ad Logic
  useEffect(() => {
    let interval: any;
    if (showInterstitial && adCountdown > 0) {
      interval = setInterval(() => setAdCountdown(c => c - 1), 1000);
    } else if (adCountdown === 0) {
      // Auto close ad after countdown
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
        const hls = new Hls();
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

  if (isUserLoading || movieLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;
  if (!movie) notFound();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 pb-32 bg-background">
      <div className="flex items-center justify-between">
         <Link href="/movies" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> Library
         </Link>
         <div className="flex items-center gap-3">
            <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 italic">STREAM: {movie.title}</Badge>
            <Badge variant="outline" className="border-white/10 text-[9px] font-black text-muted-foreground uppercase">{movie.category}</Badge>
         </div>
      </div>

      <div className="relative rounded-[3rem] overflow-hidden bg-black aspect-video border-4 border-white/5 shadow-[0_0_80px_rgba(0,0,0,0.8)] group">
         
         {/* CINEMA CONTROLS */}
         {isPlaying && !showInterstitial && (
           <div className="absolute left-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6 bg-black/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 animate-in fade-in slide-in-from-left-4">
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
         )}

         {/* PLAYER OVERLAY */}
         {!isPlaying && !showInterstitial && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm space-y-6">
               <button onClick={() => setIsPlaying(true)} className="h-24 w-24 rounded-full bg-primary flex items-center justify-center shadow-[0_0_50px_rgba(255,123,0,0.5)] hover:scale-110 transition-transform">
                  <PlayCircle className="h-12 w-12 text-white fill-white" />
               </button>
            </div>
         )}

         <video 
            ref={videoRef}
            className={cn("w-full h-full object-cover transition-all duration-700", isPlaying ? "opacity-100" : "opacity-40")}
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
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter">Preparing <span className="text-primary">Stream...</span></h3>
                       <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                          Synchronizing with high-bandwidth industrial video node. Signal lock in progress.
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
                          {adCountdown === 0 ? "START STREAMING" : "VERIFYING SIGNAL..."}
                       </Button>
                    </div>
                 </div>
                 <div className="bg-white/5 p-4 text-center">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Sponsored Revenue Pipeline v6.2 Active</p>
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
               <Badge className="bg-secondary/10 text-secondary border-none font-black px-4 py-1.5 uppercase italic">4K HDR</Badge>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-medium uppercase tracking-tight opacity-80 pt-4">
               High-definition signal streaming directly from our decentralized content delivery network. Encrypted via AES-256 for maximum viewer integrity.
            </p>
         </div>

         <div className="space-y-8">
            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6 shadow-2xl overflow-hidden relative">
               <div className="absolute -top-10 -right-10 opacity-5">
                  <ShieldCheck className="h-40 w-40 text-primary" />
               </div>
               <h3 className="text-xl font-black uppercase italic flex items-center gap-3">
                  <ShieldCheck className="text-primary h-6 w-6" /> Quality Intel
               </h3>
               <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative z-10">
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Low Latency Node</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Multi-Language Audio</li>
                  <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" /> Dolby Atmos Calibration</li>
               </ul>
            </Card>
         </div>
      </div>
    </div>
  );
}
