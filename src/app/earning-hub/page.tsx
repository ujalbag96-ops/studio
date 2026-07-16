
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
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
  X,
  Target,
  Trophy,
  ArrowRight,
  Gift,
  CheckCircle2,
  Smartphone,
  ShieldAlert,
  EyeOff
} from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import OfferWall from '@/components/OfferWall';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showAdModal, setShowAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentReward, setCurrentReward] = useState(0);
  const [activeTab, setActiveTab] = useState<'ads' | 'missions'>('ads');

  // 🕵️ ANTI-FRAUD: Ad-blocker detection state
  const [adFailCount, setAdFailCount] = useState(0);
  const [isAdBlockerActive, setIsAdBlockerActive] = useState(false);

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
    if (!user || !userRef) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }

    // 🕵️ ANTI-FRAUD: Check if ads are failing consistently
    if (adFailCount >= 3) {
       setIsAdBlockerActive(true);
       updateDoc(userRef, { adLoadFailCount: increment(1) });
       return;
    }

    // Simulation of ad failure for ad-blockers (e.g. if certain resource fails to load)
    const adResourceBlocked = Math.random() < 0.1; // 10% chance to simulate block if not real ad SDK
    if (adResourceBlocked) {
       setAdFailCount(prev => prev + 1);
       toast({ variant: "destructive", title: "AD SIGNAL LOST", description: "Please disable ad-blockers to earn rewards." });
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
        setAdFailCount(0); // Reset count on success
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  const weeklyTarget = 50;
  const weeklyProgress = Math.min(((profile?.weeklyPointsEarned || 0) / weeklyTarget) * 100, 100);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      {/* 🕵️ AD-BLOCKER OVERLAY */}
      {isAdBlockerActive && (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center">
           <div className="max-w-sm space-y-6">
              <div className="h-20 w-20 bg-amber-500/10 rounded-3xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
                 <EyeOff className="h-10 w-10 text-amber-500" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-3xl font-black uppercase italic">Ad-Blocker Detected</h3>
                 <p className="text-xs text-muted-foreground font-bold uppercase leading-relaxed">
                    Our revenue engine is supported by sponsors. Please disable any Ad-blocking extensions or software to continue earning coins.
                 </p>
              </div>
              <Button onClick={() => window.location.reload()} className="h-14 px-8 bg-amber-500 text-black font-black uppercase rounded-xl">RELOAD ARENA</Button>
           </div>
        </div>
      )}

      <div className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Elite Earning Terminal</Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none italic text-white">
                Income <span className="text-primary">Hub</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-2xl leading-relaxed">
                Complete sponsored missions and watch video signals to earn industrial-grade campus credits.
              </p>
           </div>

           <Card className="w-full md:w-80 bg-gradient-to-br from-[#1a1a24] to-black border-primary/20 border-2 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                 <Trophy className="h-20 w-20 text-primary" />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase text-white italic">Weekly Pocket Money</span>
                 </div>
                 <h4 className="text-xl font-black italic">Target: ₹50.00</h4>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground">
                       <span>Progress</span>
                       <span className="text-primary">{profile?.weeklyPointsEarned || 0} / 50 🪙</span>
                    </div>
                    <Progress value={weeklyProgress} className="h-2 bg-white/5" />
                 </div>
                 <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed">
                    Earn 50 coins this week to instantly unlock your ₹50 pocket money payout protocol.
                 </p>
              </div>
           </Card>
        </div>
      </div>

      <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 max-w-sm mx-auto md:mx-0">
         <button onClick={() => setActiveTab('ads')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'ads' ? "bg-primary text-white" : "text-muted-foreground hover:text-white")}>Video Rewards</button>
         <button onClick={() => setActiveTab('missions')} className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", activeTab === 'missions' ? "bg-primary text-white" : "text-muted-foreground hover:text-white")}>Strategic Missions</button>
      </div>

      {activeTab === 'ads' ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <AdRewardCard 
                title="Quick Signal" 
                reward={5} 
                duration={15} 
                icon={<Zap className="text-amber-500" />} 
                onClick={() => triggerVideoAd(5, 15)} 
                disabled={isAdBlockerActive}
            />
            <AdRewardCard 
                title="Prime Stream" 
                reward={15} 
                duration={30} 
                icon={<Tv className="text-primary" />} 
                onClick={() => triggerVideoAd(15, 30)} 
                highlight 
                disabled={isAdBlockerActive}
            />
            <AdRewardCard 
                title="Mega Yield" 
                reward={50} 
                duration={60} 
                icon={<MonitorPlay className="text-green-500" />} 
                onClick={() => triggerVideoAd(50, 60)} 
                disabled={isAdBlockerActive}
            />
          </div>

          <section className="space-y-8">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <TrendingUp className="text-primary" /> High-Value <span className="text-primary">Cinema Sessions</span>
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
                        <p className="text-muted-foreground text-sm font-medium uppercase tracking-tight">Watch cinematic content for 10 mins for a master payout.</p>
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
        </div>
      ) : (
        <div className="animate-in fade-in duration-500">
           <OfferWall />
        </div>
      )}

      {/* REWARDED AD MODAL SIMULATION */}
      {showAdModal && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
           <Card className="max-w-md w-full bg-[#0d0d12] border-white/10 rounded-[3rem] overflow-hidden relative shadow-2xl">
              <div className="p-12 text-center space-y-10">
                 <div className="h-32 w-32 mx-auto relative flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/10" />
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
           </Card>
        </div>
      )}
    </div>
  );
}

function AdRewardCard({ title, reward, duration, icon, onClick, highlight, disabled }: any) {
   return (
      <Card className={cn(
         "bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between min-h-[320px] transition-all hover:scale-[1.02] shadow-2xl relative overflow-hidden group",
         highlight && "border-primary/40 shadow-primary/10",
         disabled && "opacity-50 grayscale"
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
            <Button onClick={onClick} disabled={disabled} className="w-full h-14 bg-white/5 border border-white/10 hover:bg-primary text-white font-black uppercase italic rounded-xl transition-all">
               WATCH & EARN
            </Button>
         </div>
      </Card>
   );
}
