
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
  AlertCircle
} from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import OfferWall from '@/components/OfferWall';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  
  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);
  const { data: profile } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    const checkCooldown = () => {
      if (typeof window === 'undefined') return;
      const lastWatchTime = localStorage.getItem('last_video_watch_time');
      if (lastWatchTime) {
        const elapsed = Date.now() - parseInt(lastWatchTime);
        const cooldownMs = 5 * 60 * 1000; // 5 minute cooldown
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
    if (!user || !firestore || !userRef) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }
    
    if (cooldownRemaining > 0 || isVideoLoading) return;

    setIsVideoLoading(true);
    
    try {
      // SCAM PREVENTION: Simulate verified video playback
      await new Promise(resolve => setTimeout(resolve, 6000));

      const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

      // Rewards now go to taskBalance per new multi-wallet strategy
      const updateData = { 
        taskBalance: increment(5),
        coins: increment(5) // Total coins for display
      };

      const ledgerData = {
        userId: user.uid,
        type: 'income',
        amount: 5,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Verified Video Reward (Added to Task Balance)'
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
      setCooldownRemaining(300);
      
      toast({ 
        title: "Reward Verified!", 
        description: "5 Coins added to your Task Balance. Convert to winnings in your wallet." 
      });
      
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.play().catch(() => {});

    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Protocol Failed" });
    } finally {
      setIsVideoLoading(false);
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050508]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="space-y-4 pt-12 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 text-amber-500 font-black uppercase tracking-[0.3em] text-[10px]">
          <ShieldCheck className="h-4 w-4" />
          Multi-Wallet Security: Active
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none italic">
          Tactical <span className="text-primary">Earning</span> Hub
        </h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed">
          Complete missions to earn <span className="text-amber-500 font-bold">Task Income</span>. Convert your earnings into withdrawable <span className="text-green-500 font-bold">Winning Balance</span> anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Video Ad Section */}
        <Card className="bg-[#1a1a1a] border-primary/40 border-2 rounded-[3rem] overflow-hidden relative group">
          <CardHeader className="p-10">
            <Badge className="bg-primary/20 text-primary border-primary/20 w-fit mb-4 uppercase font-black px-4">TASK INCOME</Badge>
            <CardTitle className="text-4xl font-black uppercase tracking-tight">Watch Video</CardTitle>
            <CardDescription className="text-base font-bold text-primary italic">+5 Task Coins</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10 space-y-8">
            <div className="flex items-center gap-4 p-5 bg-black/40 rounded-[1.5rem] border border-white/5">
               <PlayCircle className="h-10 w-10 text-primary" />
               <p className="text-xs text-muted-foreground font-medium leading-relaxed">Rewards added to Task Balance. Must convert for withdrawal.</p>
            </div>
            <Button 
              onClick={handleWatchVideo}
              disabled={isVideoLoading || cooldownRemaining > 0 || !settings?.videoWallEnabled}
              className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[1.5rem] font-black uppercase tracking-widest text-xl shadow-2xl shadow-primary/20"
            >
              {isVideoLoading ? <Loader2 className="animate-spin h-7 w-7" /> : 
               !settings?.videoWallEnabled ? "OFFLINE" :
               cooldownRemaining > 0 ? `LOCKED ${formatCooldown(cooldownRemaining)}` : "EXECUTE MISSION"}
            </Button>
          </CardContent>
        </Card>

        {/* CPA Offer Section */}
        <Card className="lg:col-span-2 bg-[#1a1a1a] border-amber-500/40 border-2 rounded-[3rem] overflow-hidden relative group">
          <CardHeader className="p-10">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/20 w-fit mb-4 uppercase font-black px-4">EXTRA INCOME</Badge>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">CPA Lead API</span>
            </div>
            <CardTitle className="text-4xl font-black uppercase tracking-tight">CPA Missions</CardTitle>
            <CardDescription className="text-base font-bold text-amber-500 italic">High-Yield Global Offer Wall</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10 space-y-6">
             <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                  Notice: All CPA earnings are credited to your **Task Wallet**. You can convert them to real Winning Balance with a small 1.2% processing fee.
                </p>
             </div>
             {!settings?.offerWallEnabled ? (
               <div className="py-20 text-center space-y-4">
                  <Zap className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
                  <p className="text-muted-foreground italic font-black uppercase tracking-[0.3em]">CPA Network Offline</p>
               </div>
             ) : (
               <OfferWall />
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
