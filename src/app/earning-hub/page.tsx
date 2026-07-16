
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Zap, 
  PlayCircle,
  ShieldCheck,
  Video,
  TrendingUp,
  Coins,
  Tv,
  MonitorPlay,
  X
} from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentReward, setCurrentReward] = useState(0);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    let interval: any;
    if (showAdModal && adCountdown > 0) {
      interval = setInterval(() => setAdCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [showAdModal, adCountdown]);

  const triggerVideoAd = (reward: number, duration: number) => {
    if (!user) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }
    setCurrentReward(reward);
    setAdCountdown(duration);
    setShowAdModal(true);
  };

  const handleClaimAdReward = async () => {
    if (!user || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ad-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, reward: currentReward })
      });

      const result = await res.json();
      if (result.success) {
        toast({ 
          title: "REWARD CREDITED", 
          description: `+${currentReward} Coins added via Video Ad Signal.` 
        });
        new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
        setShowAdModal(false);
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-4">
           <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Simulated AdMob Network</Badge>
           <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-green-500" /> S2S Video Verification Active
           </div>
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none italic text-white">
          Video <span className="text-primary">Rewards</span>
        </h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl leading-relaxed">
          Watch high-bandwidth video signals to claim instant coins. No app installs, no tasks. 100% Free capital.
        </p>
      </div>

      {/* Industrial Banner Ad Simulation */}
      <Card className="bg-[#0a0a0f] border-dashed border-2 border-white/10 p-6 rounded-[2rem] flex items-center justify-center overflow-hidden relative group">
         <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.5em] italic">Sponsored Segment • Banner Ad Slot #1</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <AdRewardCard 
            title="Quick Signal" 
            reward={5} 
            duration={15} 
            icon={<Zap className="text-amber-500" />} 
            onClick={() => triggerVideoAd(5, 15)} 
         />
         <AdRewardCard 
            title="Prime Stream" 
            reward={15} 
            duration={30} 
            icon={<Tv className="text-primary" />} 
            onClick={() => triggerVideoAd(15, 30)} 
            highlight 
         />
         <AdRewardCard 
            title="Mega Yield" 
            reward={50} 
            duration={60} 
            icon={<MonitorPlay className="text-green-500" />} 
            onClick={() => triggerVideoAd(50, 60)} 
         />
      </div>

      <section className="space-y-8">
         <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            <TrendingUp className="text-primary" /> High-Value <span className="text-primary">Cinema Missions</span>
         </h2>
         
         <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[3rem] overflow-hidden group shadow-2xl relative">
            <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="flex items-center gap-8">
                  <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                     <Video className="h-10 w-10" />
                  </div>
                  <div className="space-y-2">
                     <Badge className="bg-green-500/20 text-green-500 border-none uppercase font-black px-3">MASSIVE REWARD</Badge>
                     <h3 className="text-3xl font-black uppercase italic text-white">Movie Watch Session</h3>
                     <p className="text-muted-foreground text-sm font-medium uppercase tracking-tight">Watch a full cinematic sample (10 mins) for a master payout.</p>
                  </div>
               </div>
               <div className="text-center md:text-right">
                  <p className="text-[10px] font-black uppercase text-muted-foreground mb-1 italic">Distributed Dividend</p>
                  <p className="text-5xl font-black text-white italic">300 <span className="text-xl text-primary opacity-40">🪙</span></p>
                  <Button asChild className="mt-6 h-16 px-12 bg-primary hover:bg-primary/90 font-black uppercase italic rounded-2xl shadow-xl">
                     <Link href="/watch-earn">ENTER CINEMA ENGINE</Link>
                  </Button>
               </div>
            </div>
         </Card>
      </section>

      {/* REWARDED AD MODAL SIMULATION */}
      {showAdModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <Card className="max-w-md w-full bg-[#0d0d12] border-white/10 rounded-[3rem] overflow-hidden relative shadow-2xl">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                    <div 
                      className="absolute inset-0 rounded-full border-t-4 border-primary transition-all duration-1000 ease-linear" 
                      style={{ transform: `rotate(${(30 - adCountdown) * 12}deg)` }}
                    />
                    <PlayCircle className="h-12 w-12 text-primary animate-pulse" />
                 </div>

                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic">Ad Stream Active</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                       Watching sponsor signal to unlock reward. Please wait for the transmission to conclude.
                    </p>
                 </div>

                 <div className="space-y-6">
                    <p className="text-5xl font-black text-white italic tabular-nums">{adCountdown}s</p>
                    <Button 
                      disabled={adCountdown > 0 || isProcessing} 
                      onClick={handleClaimAdReward}
                      className={cn(
                        "w-full h-20 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all",
                        adCountdown === 0 ? "bg-green-600 hover:bg-green-500 animate-bounce" : "bg-white/5 text-white/20 border border-white/10"
                      )}
                    >
                       {isProcessing ? <Loader2 className="animate-spin" /> : adCountdown === 0 ? "CLAIM COINS" : "WATCHING SPONSOR..."}
                    </Button>
                 </div>
              </div>
              <div className="bg-white/5 p-4 text-center">
                 <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest italic opacity-40">Industrial Ad Transmission v4.1 Operational</p>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}

function AdRewardCard({ title, reward, duration, icon, onClick, highlight }: any) {
   return (
      <Card className={cn(
         "bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[320px] transition-all hover:scale-[1.02] shadow-2xl relative overflow-hidden group",
         highlight && "border-primary/40 shadow-primary/10"
      )}>
         <div className="space-y-6 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl group-hover:rotate-6 transition-transform">
               {icon}
            </div>
            <div>
               <h4 className="text-2xl font-black uppercase italic text-white">{title}</h4>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Video Ad • {duration}s Signal</p>
            </div>
         </div>

         <div className="space-y-6 relative z-10">
            <div className="flex items-end gap-1">
               <span className="text-4xl font-black text-white italic">{reward}</span>
               <span className="text-sm font-bold text-primary opacity-40 mb-1">🪙</span>
            </div>
            <Button onClick={onClick} className="w-full h-14 bg-white/5 border border-white/10 hover:bg-primary text-white font-black uppercase italic rounded-xl transition-all">
               WATCH & EARN
            </Button>
         </div>
         {highlight && <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="h-32 w-32" /></div>}
      </Card>
   );
}
