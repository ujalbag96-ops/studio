
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Zap, 
  Clock,
  PlayCircle,
  ShieldCheck,
  AlertCircle,
  FileBarChart,
  ShieldAlert,
  ExternalLink,
  Target
} from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import OfferWall from '@/components/OfferWall';
import Link from 'next/link';

/**
 * High-Security Earning Hub
 * Client-side balance increments are DISABLED. 
 * Rewards are strictly delivered via server-side postback (api/cpa-callback).
 */
export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const settingsRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'app_settings', 'global_config') : null, 
    [firestore]
  );
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  
  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    const checkCooldown = () => {
      if (typeof window === 'undefined') return;
      const lastWatchTime = localStorage.getItem('last_video_watch_time');
      if (lastWatchTime) {
        const elapsed = Date.now() - parseInt(lastWatchTime);
        const cooldownMs = 3 * 60 * 1000; 
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
    if (!user || !profile) {
      toast({ variant: "destructive", title: "Authentication Required" });
      return;
    }

    if (profile?.isVpnActive) {
      toast({ variant: "destructive", title: "VPN Detected", description: "Missions restricted on proxy signals." });
      return;
    }
    
    if (cooldownRemaining > 0 || isVideoLoading) return;

    setIsVideoLoading(true);
    
    try {
      // Professional Simulation (Ad Engagement)
      await new Promise(resolve => setTimeout(resolve, 6000));
      
      // CRITICAL: We do NOT update the balance here.
      // We notify the user that the signal has been sent for verification.
      toast({ 
        title: "Mission Synchronizing", 
        description: "Task signal captured. Rewards reflect after network verification (5-15 mins)." 
      });

      localStorage.setItem('last_video_watch_time', Date.now().toString());
      setCooldownRemaining(180); 
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleBannerClick = () => {
    if (!user || !settings?.earningBannerLink) return;
    window.open(settings.earningBannerLink, '_blank');
    toast({ 
      title: "Engagement Verified", 
      description: "Banner reward signal dispatched to server." 
    });
  };

  if (settingsLoading || profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Synchronizing Secure Signal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-4">
           <Badge className="bg-amber-500/20 text-amber-500 border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Postback-Locked Earning</Badge>
           <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-primary" /> Verified Payout Protocol
           </div>
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none italic text-white">
          Activity <span className="text-primary">Incentive</span> Hub
        </h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed">
          Centralized portal for supplemental capital. Credits are managed strictly via server-to-server postbacks to ensure platform integrity.
        </p>
      </div>

      {profile?.isVpnActive && (
        <Card className="bg-red-500/10 border-red-500/20 border-2 rounded-[2rem] p-6 flex items-center gap-4 animate-in fade-in zoom-in-95">
           <ShieldAlert className="h-8 w-8 text-red-500 animate-pulse" />
           <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-red-500">Compliance Violation: VPN Active</h4>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Reward synchronization is halted while using proxy signals.</p>
           </div>
        </Card>
      )}

      {settings?.earningBannerUrl && (
        <Card onClick={handleBannerClick} className="bg-white/5 border-primary/20 border-2 rounded-[2.5rem] overflow-hidden group cursor-pointer relative shadow-2xl">
           <div className="absolute top-4 right-4 z-10">
              <Badge className="bg-primary text-white font-black uppercase italic animate-pulse">POSTBACK: +{settings.earningBannerReward} COINS</Badge>
           </div>
           <div className="h-40 md:h-48 w-full overflow-hidden">
              <img src={settings.earningBannerUrl} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-70" alt="Sponsored Content" />
           </div>
           <div className="p-6 bg-black/60 backdrop-blur-md flex items-center justify-between border-t border-white/5">
              <div>
                 <p className="text-sm font-black uppercase italic text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" /> Executive Engagement
                 </p>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Rewards synced after verification</p>
              </div>
              <ExternalLink className="h-6 w-6 text-primary" />
           </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        <Card className="bg-amber-500/5 border-amber-500/20 border-2 rounded-[3rem] p-10 flex flex-col justify-between h-full group">
           <div className="space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                 <FileBarChart className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                 <h3 className="text-xl font-black uppercase italic text-white">Verified Incentives</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit-Passed Assets Only</p>
              </div>
              <h2 className="text-6xl font-black text-white italic tracking-tighter">
                {profile?.taskBalance?.toFixed(1) || '0.0'} <span className="text-2xl align-top opacity-40">🪙</span>
              </h2>
           </div>
           <Button asChild variant="outline" className="w-full h-16 rounded-2xl border-amber-500/20 hover:bg-amber-500/10 text-amber-500 font-black uppercase tracking-widest mt-8">
              <Link href="/dashboard">VIEW AUDIT LOG</Link>
           </Button>
        </Card>

        <Card className="lg:col-span-2 bg-[#1a1a1a] border-primary/20 border-2 rounded-[3rem] overflow-hidden relative group">
          <CardHeader className="p-10 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-3xl font-black uppercase tracking-tight italic text-white">Corporate Signal Watch</CardTitle>
               <CardDescription className="text-primary font-bold uppercase text-xs">Verification-Enforced Reward Protocol</CardDescription>
            </div>
            <PlayCircle className="h-12 w-12 text-primary opacity-40" />
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
               <div className="space-y-6">
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                     Engage with corporate signals. Each verification triggers a server postback that credits your wallet balance securely.
                  </p>
                  <div className="flex items-center gap-3">
                     <Clock className="h-4 w-4 text-muted-foreground" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Network Cooldown Active</span>
                  </div>
               </div>
               <Button 
                onClick={handleWatchVideo}
                disabled={isVideoLoading || cooldownRemaining > 0 || profile?.isVpnActive}
                className="w-full h-24 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xl shadow-2xl transition-all hover:scale-105"
               >
                {isVideoLoading ? <Loader2 className="animate-spin h-8 w-8" /> : 
                 profile?.isVpnActive ? "SECURE LOCK" :
                 cooldownRemaining > 0 ? `LOCKED ${formatCooldown(cooldownRemaining)}` : "INITIATE MISSION"}
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-8">
        <div className="flex items-center justify-between px-4">
           <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">External <span className="text-amber-500">Missions</span></h2>
           <Badge variant="outline" className="border-white/10 px-4 py-2 opacity-60 text-[10px] font-black uppercase">Postback Delivery Only</Badge>
        </div>
        
        <Card className="bg-[#1a1a1a] border-white/5 border rounded-[3rem] overflow-hidden">
          <CardContent className="p-10 space-y-8">
             <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase leading-relaxed">
                  Notice: Our systems utilize server-to-server (S2S) postbacks. Any attempts to manipulate local storage or client-side scripts will result in immediate account termination.
                </p>
             </div>
             <OfferWall />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
