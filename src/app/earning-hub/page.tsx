
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Zap, 
  Clock,
  PlayCircle,
  Smartphone,
  Trophy,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Gift,
  Coins,
  FileBarChart,
  ShieldAlert
} from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import OfferWall from '@/components/OfferWall';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import Link from 'next/link';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Standardized Path for Global Configurations
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
        const cooldownMs = 3 * 60 * 1000; // 3 minute industrial cooldown
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
    if (!user || !firestore || !userRef || !profile) {
      toast({ variant: "destructive", title: "Authentication Required" });
      return;
    }

    if (profile?.isVpnActive) {
      toast({ variant: "destructive", title: "Compliance Violation", description: "VPN signals detected. Tasks restricted." });
      return;
    }
    
    if (cooldownRemaining > 0 || isVideoLoading) return;

    setIsVideoLoading(true);
    
    try {
      // Professional Ad Playback Simulation (Wait 6s)
      await new Promise(resolve => setTimeout(resolve, 6000));

      const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

      const currentTasks = (profile.tasksCompletedCount || 0) + 1;
      const activationGoal = 10;
      const isActivated = currentTasks >= activationGoal || (profile.depositBalance || 0) > 0;

      const updateData: any = { 
        taskBalance: increment(5),
        coins: increment(5),
        tasksCompletedCount: increment(1),
        isAccountActivated: isActivated
      };

      const ledgerData = {
        userId: user.uid,
        type: 'income' as const,
        amount: 5,
        date: new Date().toISOString().split('T')[0],
        status: 'completed' as const,
        description: 'Premium Sponsored Interaction (Credit to Incentive Balance)'
      };

      updateDoc(userRef, updateData).catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updateData,
        }));
      });
      
      addDoc(ledgerRef, ledgerData).catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: ledgerRef.path,
          operation: 'create',
          requestResourceData: ledgerData,
        }));
      });

      localStorage.setItem('last_video_watch_time', Date.now().toString());
      setCooldownRemaining(180); // 3 minutes
      
      toast({ 
        title: "Incentive Credited", 
        description: isActivated && !profile.isAccountActivated ? "ACCOUNT ACTIVATED! All features unlocked." : "5 Supplemental Coins synchronized."
      });
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.play().catch(() => {});

    } catch (error: any) {
      toast({ variant: "destructive", title: "Synchronization Failure" });
    } finally {
      setIsVideoLoading(false);
    }
  };

  if (settingsLoading || profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Synchronizing Operational Data...</p>
      </div>
    );
  }

  // Fallback if settings don't exist yet
  const offerWallEnabled = settings?.offerWallEnabled !== false; 
  const videoWallEnabled = settings?.videoWallEnabled !== false;
  const isRestricted = !offerWallEnabled || profile?.isVpnActive;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-4">
           <Badge className="bg-amber-500/20 text-amber-500 border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Supplemental Capital Hub</Badge>
           <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-primary" /> Verified Payout Protocols
           </div>
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none italic text-white">
          Activity <span className="text-primary">Incentive</span> Hub
        </h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed">
          The centralized portal for supplemental capital accumulation. Fulfill sponsored tasks to scale your <span className="text-amber-500 font-bold">Incentive Balance</span> and unlock your account.
        </p>
      </div>

      {profile?.isVpnActive && (
        <Card className="bg-red-500/10 border-red-500/20 border-2 rounded-[2rem] p-6 flex items-center gap-4 animate-in fade-in zoom-in-95">
           <ShieldAlert className="h-8 w-8 text-red-500 animate-pulse" />
           <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-red-500">Security Warning: VPN Active</h4>
              <p className="text-[10px] text-muted-foreground font-bold uppercase">Analytical missions are restricted while using proxy signals.</p>
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
                 <h3 className="text-xl font-black uppercase italic text-white">Accrued Incentives</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Pending Exchange Transfer</p>
              </div>
              <h2 className="text-6xl font-black text-white italic tracking-tighter">
                {profile?.taskBalance?.toFixed(1) || '0.0'} <span className="text-2xl align-top opacity-40">🪙</span>
              </h2>
           </div>
           <Button asChild variant="outline" className="w-full h-16 rounded-2xl border-amber-500/20 hover:bg-amber-500/10 text-amber-500 font-black uppercase tracking-widest mt-8">
              <Link href="/dashboard">MANAGE CAPITAL</Link>
           </Button>
        </Card>

        <Card className="lg:col-span-2 bg-[#1a1a1a] border-primary/20 border-2 rounded-[3rem] overflow-hidden relative group">
          <CardHeader className="p-10 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-3xl font-black uppercase tracking-tight italic text-white">Corporate Interaction</CardTitle>
               <CardDescription className="text-primary font-bold uppercase text-xs">+5 Incentive Coins per engagement</CardDescription>
            </div>
            <PlayCircle className="h-12 w-12 text-primary opacity-40" />
          </CardHeader>
          <CardContent className="p-10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
               <div className="space-y-6">
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                     Engage with standardized corporate content. Each verified interaction adds immediate liquidity to your Incentive Balance.
                  </p>
                  <div className="flex items-center gap-3">
                     <Clock className="h-4 w-4 text-muted-foreground" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ad Protocol Cooldown Active</span>
                  </div>
               </div>
               <Button 
                onClick={handleWatchVideo}
                disabled={isVideoLoading || cooldownRemaining > 0 || !videoWallEnabled || !!profile?.isVpnActive}
                className="w-full h-24 bg-primary hover:bg-primary/90 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xl shadow-2xl shadow-primary/20 transition-all hover:scale-105"
               >
                {isVideoLoading ? <Loader2 className="animate-spin h-8 w-8" /> : 
                 profile?.isVpnActive ? "SECURE LOCK" :
                 !videoWallEnabled ? "HUB OFFLINE" :
                 cooldownRemaining > 0 ? `LOCKED ${formatCooldown(cooldownRemaining)}` : "EXECUTE TASK"}
               </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-8">
        <div className="flex items-center justify-between px-4">
           <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Analytical <span className="text-amber-500">Missions</span></h2>
           <Badge variant="outline" className="border-white/10 px-4 py-2 opacity-60 text-[10px] font-black uppercase">Audited Disbursements Only</Badge>
        </div>
        
        <Card className="bg-[#1a1a1a] border-white/5 border rounded-[3rem] overflow-hidden">
          <CardContent className="p-10 space-y-8">
             <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase leading-relaxed">
                  Notice: Asset synchronization occurs after 3rd-party verification (Standard duration: 5-15 minutes).
                </p>
             </div>
             {isRestricted ? (
               <div className="py-24 text-center space-y-4">
                  <Zap className="h-20 w-20 text-muted-foreground opacity-10 mx-auto" />
                  <p className="text-muted-foreground italic font-black uppercase tracking-[0.4em]">Incentive Gateway Restricted</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">
                    {profile?.isVpnActive ? "Reason: VPN Detection active." : "Reason: Admin switch is currently OFF."}
                  </p>
               </div>
             ) : (
               <OfferWall />
             )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
