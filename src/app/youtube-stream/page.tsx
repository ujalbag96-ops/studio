'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Youtube, 
  Zap, 
  ShieldCheck, 
  ArrowLeft,
  Loader2,
  PlayCircle,
  Activity,
  Globe
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function YoutubeStreamHub() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [ytUrl, setYtUrl] = useState('');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const extractYoutubeId = (url: string) => {
    let id = "";
    if (url.includes('youtu.be/')) id = url.split('youtu.be/')[1].split('?')[0];
    else if (url.includes('watch?v=')) id = url.split('watch?v=')[1].split('&')[0];
    return id;
  };

  const handlePlay = () => {
    const id = extractYoutubeId(ytUrl);
    if (!id) {
      toast({ variant: "destructive", title: "Invalid Signal", description: "Please enter a valid YouTube URL." });
      return;
    }
    setVideoId(id);
    triggerAdReward();
  };

  const triggerAdReward = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ad-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, type: 'youtube_stream_signal' })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "MISSION TRIGGERED", description: `10% Yield: +${data.credit} Coins credited.` });
      }
    } catch (e) {
      console.error("Reward Sync Failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="flex items-center justify-between pt-10">
         <Link href="/earning-hub" className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-3 w-3" /> Earning Sector
         </Link>
         <Badge className="bg-red-600/20 text-red-500 border-none uppercase font-black px-4 py-1.5 italic">YouTube Signal Hub</Badge>
      </div>

      <header className="space-y-6">
         <div className="flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-2 text-center md:text-left">
               <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">YouTube <span className="text-primary">Hub</span></h1>
               <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest opacity-70">Stream YouTube nodes & earn scholarship dividends.</p>
            </div>
            
            <Card className="bg-[#0a0a0f] border-white/5 p-4 rounded-2xl flex items-center gap-4 shadow-xl w-full md:w-[500px]">
               <div className="relative flex-1">
                  <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-red-500" />
                  <input value={ytUrl} onChange={e => setYtUrl(e.target.value)} placeholder="PASTE YOUTUBE VIDEO LINK" className="w-full h-10 bg-black border border-white/10 pl-9 text-[10px] font-bold rounded-xl text-white outline-none focus:border-red-500/40" />
               </div>
               <Button onClick={handlePlay} className="h-10 bg-red-600 hover:bg-red-500 font-black uppercase italic text-[10px] px-6 rounded-xl">PLAY SIGNAL</Button>
            </Card>
         </div>
      </header>

      <div className="relative rounded-[3rem] overflow-hidden bg-black aspect-video border-4 border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
         {!videoId ? (
           <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm space-y-6">
              <div className="h-24 w-24 rounded-full bg-red-600/10 border-2 border-red-600/20 flex items-center justify-center animate-pulse">
                 <Youtube className="h-10 w-10 text-red-600" />
              </div>
              <p className="text-xs font-black uppercase italic tracking-widest text-muted-foreground">Waiting for valid YouTube Signal Node...</p>
           </div>
         ) : (
           <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`} className="w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
         )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
         <Card className="bg-[#121212] border-white/5 p-10 rounded-[2.5rem] space-y-6">
            <h3 className="text-xl font-black uppercase italic flex items-center gap-3 text-red-500"><ShieldCheck /> Content Lock Policy</h3>
            <ul className="space-y-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
               <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-red-600 mt-1 shrink-0" /> Rewards valid for sessions &gt; 5 minutes.</li>
               <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-red-600 mt-1 shrink-0" /> Multi-tab streaming will void reward signals.</li>
               <li className="flex items-start gap-3"><div className="h-2 w-2 rounded-full bg-red-600 mt-1 shrink-0" /> Dynamic 10% share credited instantly.</li>
            </ul>
         </Card>
         <Card className="bg-red-600/5 border-red-600/20 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center space-y-4">
            <Activity className="h-10 w-10 text-red-500 animate-pulse" />
            <h4 className="text-xl font-black uppercase italic">Real-Time Yield</h4>
            <p className="text-xs font-medium text-muted-foreground uppercase leading-relaxed">
               Every 10 minutes of verified session adds <span className="text-white">5 Coins</span> to your Mission Wallet.
            </p>
         </Card>
      </div>
    </div>
  );
}
