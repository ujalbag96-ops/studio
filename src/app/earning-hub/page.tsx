
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PlayCircle, 
  ClipboardList, 
  Sparkles, 
  Loader2, 
  Zap, 
  Clock, 
  ArrowRight,
  MousePointerClick,
  TrendingUp,
  Gift,
  Ban
} from 'lucide-react';
import { AppSettings } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  // Cooldown Logic
  useEffect(() => {
    const checkCooldown = () => {
      const lastWatchTime = localStorage.getItem('last_video_watch_time');
      if (lastWatchTime) {
        const elapsed = Date.now() - parseInt(lastWatchTime);
        const cooldownMs = 5 * 60 * 1000;
        if (elapsed < cooldownMs) {
          setCooldownRemaining(Math.ceil((cooldownMs - elapsed) / 1000));
        } else {
          setCooldownRemaining(0);
        }
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleWatchVideo = async () => {
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Login Required", description: "Sign in to earn rewards." });
      return;
    }

    if (cooldownRemaining > 0) {
      toast({ variant: "destructive", title: "Wait", description: `Try again in ${formatCooldown(cooldownRemaining)}` });
      return;
    }

    setIsVideoLoading(true);
    
    setTimeout(async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

        await updateDoc(userRef, { coins: increment(5) });
        await addDoc(ledgerRef, {
          type: 'income',
          amount: 5,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: 'Video Wall Reward'
        });

        localStorage.setItem('last_video_watch_time', Date.now().toString());
        setCooldownRemaining(300);

        toast({ title: "Earned!", description: "5 🪙 added to your wallet." });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Error", description: "Failed to sync reward." });
      } finally {
        setIsVideoLoading(false);
      }
    }, 3000);
  };

  if (settingsLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const showVideoWall = settings?.videoWallEnabled ?? true;
  const showOfferWall = settings?.offerWallEnabled ?? true;
  const showCpaLead = settings?.cpaLeadEnabled ?? true;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      {/* Header */}
      <div className="space-y-4 pt-8">
        <div className="flex items-center gap-3 text-secondary font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
          <Zap className="h-4 w-4" />
          Earning Hub Active
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
          Earning <span className="text-primary italic">Hub</span>
        </h1>
        <p className="text-muted-foreground font-medium text-lg max-w-xl">
          Complete tasks, watch videos, and take surveys to fill your wallet with elite rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Video Wall */}
        {showVideoWall ? (
          <Card className="bg-[#1a1a1a] border-primary/30 border-2 rounded-[2.5rem] overflow-hidden relative group hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <PlayCircle className="h-40 w-40 text-primary" />
            </div>
            <CardHeader className="p-8">
              <Badge className="bg-primary/20 text-primary border-primary/20 w-fit mb-4">VIDEO WALL</Badge>
              <CardTitle className="text-3xl font-black uppercase tracking-tight">Watch & Earn</CardTitle>
              <CardDescription className="text-base font-bold text-primary italic">Earn 5 Coins Instantly</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">Watch high-definition video ads to unlock quick arena coins. High availability daily.</p>
              <Button 
                onClick={handleWatchVideo}
                disabled={isVideoLoading || cooldownRemaining > 0}
                className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl shadow-primary/20"
              >
                {isVideoLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 
                 cooldownRemaining > 0 ? formatCooldown(cooldownRemaining) : "WATCH VIDEO"}
              </Button>
            </CardContent>
            {cooldownRemaining > 0 && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-8 text-center">
                <div className="space-y-2">
                  <Clock className="h-10 w-10 text-primary mx-auto animate-pulse" />
                  <p className="font-black text-xl uppercase italic">Cooldown Active</p>
                  <p className="text-xs text-muted-foreground">Ready in {formatCooldown(cooldownRemaining)}</p>
                </div>
              </div>
            )}
          </Card>
        ) : <ModuleDisabledCard label="Video Wall" />}

        {/* Offer Wall */}
        {showOfferWall ? (
          <Card className="bg-[#1a1a1a] border-secondary/30 border-2 rounded-[2.5rem] overflow-hidden relative group hover:shadow-[0_0_30px_rgba(103,232,249,0.2)] transition-all">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <ClipboardList className="h-40 w-40 text-secondary" />
            </div>
            <CardHeader className="p-8">
              <Badge className="bg-secondary/20 text-secondary border-secondary/20 w-fit mb-4">OFFER WALL</Badge>
              <CardTitle className="text-3xl font-black uppercase tracking-tight">Arena Tasks</CardTitle>
              <CardDescription className="text-base font-bold text-secondary italic">Earn 10-100 Coins</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">Complete game downloads, level achievements, and registration tasks for massive rewards.</p>
              <Button variant="outline" className="w-full h-16 border-secondary/40 text-secondary hover:bg-secondary/10 rounded-2xl font-black uppercase tracking-widest text-lg">
                OPEN TASKS <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : <ModuleDisabledCard label="Offer Wall" />}

        {/* CPA Lead */}
        {showCpaLead ? (
          <Card className="bg-[#1a1a1a] border-white/10 border-2 rounded-[2.5rem] overflow-hidden relative group hover:border-white/30 transition-all">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
               <MousePointerClick className="h-40 w-40 text-white" />
            </div>
            <CardHeader className="p-8">
              <Badge className="bg-white/5 text-white border-white/10 w-fit mb-4">SURVEYS</Badge>
              <CardTitle className="text-3xl font-black uppercase tracking-tight">CPA Insights</CardTitle>
              <CardDescription className="text-base font-bold text-muted-foreground italic">Earn 5-50 Coins</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">Share your opinion on major brands and current trends to stack coins effortlessly.</p>
              <Button variant="secondary" className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl">
                START SURVEY <Sparkles className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : <ModuleDisabledCard label="CPA Lead" />}
      </div>

      {/* Bonus Section */}
      <section className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-[3rem] p-12 border border-white/5 relative overflow-hidden group">
         <div className="absolute -bottom-12 -right-12 h-64 w-64 bg-primary/20 blur-[100px] group-hover:bg-primary/30 transition-all" />
         <div className="relative z-10 grid md:grid-cols-2 items-center gap-12">
            <div className="space-y-6">
               <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl">
                 <TrendingUp className="h-8 w-8 text-secondary" />
               </div>
               <h2 className="text-4xl font-black uppercase tracking-tight leading-none">VIP <br /><span className="text-secondary italic">MULTIPLIER</span></h2>
               <p className="text-muted-foreground font-medium leading-relaxed">Upgrade to VIP status to unlock up to 2x earnings on all hub activities and faster withdrawal processing.</p>
               <Button asChild className="bg-white text-black hover:bg-white/90 font-black px-10 h-14 rounded-2xl uppercase tracking-widest shadow-2xl">
                 <Link href="/vip">UPGRADE NOW</Link>
               </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <StatBox label="Total Distributed" value="1.2M 🪙" />
               <StatBox label="Active Earners" value="45K+" />
               <StatBox label="Daily Avg" value="150 🪙" />
               <StatBox label="Success Rate" value="99.9%" />
            </div>
         </div>
      </section>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-6 rounded-3xl bg-black/40 border border-white/5 backdrop-blur-md">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ModuleDisabledCard({ label }: { label: string }) {
  return (
    <Card className="bg-[#1a1a1a] border-dashed border-white/5 border-2 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center opacity-40">
       <Ban className="h-10 w-10 text-muted-foreground mb-4" />
       <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">{label} Maintenance</p>
       <p className="text-[10px] font-medium text-muted-foreground/60 mt-2">Currently being upgraded by Arena Admins.</p>
    </Card>
  )
}
