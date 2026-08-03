'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  Zap, 
  ShieldCheck, 
  ArrowLeft,
  Loader2,
  Link as LinkIcon,
  Sun,
  Volume2,
  VolumeX,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import Link from 'next/link';
import { UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import Hls from 'hls.js';

export default function DirectStreamHub() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [directUrl, setDirectUrl] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const handlePlay = () => {
    if (!directUrl.trim()) {
      toast({ variant: "destructive", title: "Empty Signal", description: "Paste a valid MP4 or M3U8 link." });
      return;
    }
    setIsPlaying(true);
    triggerAdReward();
  };

  const triggerAdReward = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ad-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, type: 'direct_stream_signal' })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "SIGNAL LOCKED", description: `10% Share Credited: +${data.credit} Coins` });
      }
    } catch (e) {
      console.error("Reward Sync Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isPlaying || !directUrl || !videoRef.current) return;
    
    const video = videoRef.current;
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (directUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(directUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = directUrl;
      }
    } else {
      video.src = directUrl;
    }
  }, [isPlaying, directUrl]);

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="flex items-center justify-between pt-10">
         <Link href="/earning-hub" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> Earning Sector
         </Link>
         <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 italic">Industrial Direct Hub</Badge>
      </div>

      <header className="space-y-6">
         <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-2 text-center md:text-left">
               <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">Direct <span className="text-primary">Stream</span></h1>
               <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-70">Analyze custom MP4/M3U8 signals & claim yield.</p>
            </div>
            
            <Card className="bg-[#0a0a0f] border-white/5 p-4 rounded-2xl flex items-center gap-4 shadow-xl w-full md:w-[500px]">
               <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
                  <input value={directUrl} onChange={e => setDirectUrl(e.target.value)} placeholder="PASTE MP4 / DOWNLOAD LINK" className="w-full h-10 bg-black border border-white/10 pl-9 text-[10px] font-bold rounded-xl text-white outline-none focus:border-primary/40" />
               </div>
               <Button onClick={handlePlay} className="h-10 bg-primary font-black uppercase italic text-[10px] px-6 rounded-xl">PLAY HUB</Button>
            </Card>
         </div>
      </header>

      <div className="relative rounded-[3rem] overflow-hidden bg-black aspect-video border-4 border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] group">
         {!isPlaying ? (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm space-y-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center animate-pulse">
                 <Video className="h-10 w-10 text-primary" />
              </div>
              <p className="text-xs font-black uppercase italic tracking-widest text-muted-foreground">Waiting for valid Direct Signal...</p>
           </div>
         ) : (
           <>
              <div className="absolute left-8 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-6 bg-black/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <Sun className="h-5 w-5 text-primary animate-pulse" />
                 <div className="h-40 flex items-center">
                    <Slider value={[brightness]} onValueChange={(val) => setBrightness(val[0])} max={150} min={40} step={1} orientation="vertical" className="h-full" />
                 </div>
                 <span className="text-[9px] font-black text-white">{brightness}%</span>
              </div>
              <video ref={videoRef} className="w-full h-full object-contain" style={{ filter: `brightness(${brightness}%)` }} controls />
           </>
         )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
         <Card className="bg-[#121212] border-white/5 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-primary"><ShieldCheck /> Integrity Protocol</h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-tight opacity-80">
               Direct streams are analyzed server-side. High-bandwidth sessions generate incremental 10% distributed yield. VPN signals result in immediate account lock.
            </p>
         </Card>
         <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 flex items-center justify-between">
            <div className="space-y-1">
               <p className="text-[9px] font-black uppercase text-muted-foreground">Estimated Yield</p>
               <h4 className="text-3xl font-black italic text-white">0.05 <span className="text-sm opacity-40">INR</span></h4>
            </div>
            <Zap className="h-8 w-8 text-primary animate-pulse" />
         </Card>
      </div>
    </div>
  );
}
