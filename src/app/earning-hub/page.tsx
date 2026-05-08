
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
  ArrowRight
} from 'lucide-react';
import { AppSettings } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import OfferWall from '@/components/OfferWall';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    const checkCooldown = () => {
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
    if (!user || !firestore) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }
    if (cooldownRemaining > 0) return;

    setIsVideoLoading(true);
    try {
      // Simulate video ad duration
      await new Promise(resolve => setTimeout(resolve, 5000));

      const userRef = doc(firestore, 'users', user.uid);
      const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

      await updateDoc(userRef, { 
        coins: increment(5),
        withdrawableCoins: increment(5)
      });
      
      await addDoc(ledgerRef, {
        userId: user.uid,
        type: 'income',
        amount: 5,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Earned from Video Ad (Global Network)'
      });

      localStorage.setItem('last_video_watch_time', Date.now().toString());
      setCooldownRemaining(300);
      toast({ title: "Reward Claimed!", description: "5 Coins added to your Winning Balance." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Failed" });
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
        <div className="flex items-center justify-center md:justify-start gap-3 text-secondary font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
          <Zap className="h-4 w-4" />
          Monetization Protocol Active
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none italic">
          Global <span className="text-primary">Earning</span> Hub
        </h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto md:mx-0">
          Complete high-yield missions to fill your <span className="text-white font-bold">Winning Amount</span> vault. Instant withdrawals to ₹/$/£ gateways.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Video Ad Section */}
        <Card className="bg-[#1a1a1a] border-primary/40 border-2 rounded-[3rem] overflow-hidden relative group hover:shadow-[0_0_50px_rgba(147,69,255,0.2)] transition-all">
          <CardHeader className="p-10">
            <Badge className="bg-primary/20 text-primary border-primary/20 w-fit mb-4 uppercase font-black px-4">VIDEO REWARD</Badge>
            <CardTitle className="text-4xl font-black uppercase tracking-tight">Watch & Win</CardTitle>
            <CardDescription className="text-base font-bold text-primary italic">Get 5 Withdrawable Coins</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10 space-y-8">
            <div className="flex items-center gap-4 p-5 bg-black/40 rounded-[1.5rem] border border-white/5">
               <PlayCircle className="h-10 w-10 text-primary animate-pulse" />
               <p className="text-xs text-muted-foreground font-medium leading-relaxed">Watch a tactical brief to directly increase your vault value.</p>
            </div>
            <Button 
              onClick={handleWatchVideo}
              disabled={isVideoLoading || cooldownRemaining > 0 || !settings?.videoWallEnabled}
              className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[1.5rem] font-black uppercase tracking-widest text-xl shadow-2xl shadow-primary/20"
            >
              {isVideoLoading ? <Loader2 className="animate-spin h-7 w-7" /> : 
               !settings?.videoWallEnabled ? "DISABLED" :
               cooldownRemaining > 0 ? formatCooldown(cooldownRemaining) : "WATCH VIDEO"}
            </Button>
          </CardContent>
          {cooldownRemaining > 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[4px] flex items-center justify-center p-8 text-center">
              <div className="space-y-3">
                <Clock className="h-14 w-14 text-primary mx-auto" />
                <p className="font-black text-2xl uppercase italic tracking-tighter">Ready in {formatCooldown(cooldownRemaining)}</p>
              </div>
            </div>
          )}
        </Card>

        {/* CPA Offer Section */}
        <Card className="lg:col-span-2 bg-[#1a1a1a] border-secondary/40 border-2 rounded-[3rem] overflow-hidden relative group">
          <CardHeader className="p-10">
            <div className="flex items-center justify-between">
              <Badge className="bg-secondary/20 text-secondary border-secondary/20 w-fit mb-4 uppercase font-black px-4">INTEL MISSIONS</Badge>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">CPA LEAD NETWORK</span>
            </div>
            <CardTitle className="text-4xl font-black uppercase tracking-tight">CPA Elite Wall</CardTitle>
            <CardDescription className="text-base font-bold text-secondary italic">High Payout Global Missions</CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-10">
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
