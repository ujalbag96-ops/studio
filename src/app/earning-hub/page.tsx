
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  PlayCircle, 
  ClipboardList, 
  Sparkles, 
  Loader2, 
  Zap, 
  Clock, 
  MousePointerClick,
  Ban
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
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }
    if (cooldownRemaining > 0) return;

    setIsVideoLoading(true);
    setTimeout(async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const ledgerRef = collection(firestore, 'users', user.uid, 'ledger');

        // VIDEO REWARDS GO TO WITHDRAWABLE BALANCE
        await updateDoc(userRef, { 
          coins: increment(5),
          withdrawableCoins: increment(5)
        });
        
        await addDoc(ledgerRef, {
          type: 'income',
          amount: 5,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: 'Earned from Video Ad (Winning Amount)'
        });

        localStorage.setItem('last_video_watch_time', Date.now().toString());
        setCooldownRemaining(300);
        toast({ title: "Winning Reward Claimed!" });
      } catch (error: any) {
        toast({ variant: "destructive", title: "Sync Failed" });
      } finally {
        setIsVideoLoading(false);
      }
    }, 3000);
  };

  if (settingsLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="space-y-4 pt-8 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-3 text-secondary font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">
          <Zap className="h-4 w-4" />
          Earning Protocol Active
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none italic">
          Earning <span className="text-primary">Hub</span>
        </h1>
        <p className="text-muted-foreground font-medium text-lg max-w-xl mx-auto md:mx-0">
          Complete tasks to fill your <span className="text-white font-bold">Winning Balance</span> for instant withdrawals to ₹.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Card className="bg-[#1a1a1a] border-primary/30 border-2 rounded-[2.5rem] overflow-hidden relative group hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] transition-all">
          <CardHeader className="p-8">
            <Badge className="bg-primary/20 text-primary border-primary/20 w-fit mb-4 uppercase font-black">WINNING DROP</Badge>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">Watch & Win</CardTitle>
            <CardDescription className="text-base font-bold text-primary italic">5 Coins -> Winning Amount</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed">Watch a tactical brief (ad) to directly increase your withdrawable Rupee balance.</p>
            <Button 
              onClick={handleWatchVideo}
              disabled={isVideoLoading || cooldownRemaining > 0}
              className="w-full h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase tracking-widest text-lg"
            >
              {isVideoLoading ? <Loader2 className="animate-spin h-6 w-6" /> : 
               cooldownRemaining > 0 ? formatCooldown(cooldownRemaining) : "WATCH VIDEO"}
            </Button>
          </CardContent>
          {cooldownRemaining > 0 && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-8 text-center">
              <div className="space-y-2">
                <Clock className="h-10 w-10 text-primary mx-auto" />
                <p className="font-black text-xl uppercase italic">Ready in {formatCooldown(cooldownRemaining)}</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2 bg-[#1a1a1a] border-secondary/30 border-2 rounded-[2.5rem] overflow-hidden relative group">
          <CardHeader className="p-8">
            <Badge className="bg-secondary/20 text-secondary border-secondary/20 w-fit mb-4 uppercase font-black">OFFER WALL</Badge>
            <CardTitle className="text-3xl font-black uppercase tracking-tight">CPA Missions</CardTitle>
            <CardDescription className="text-base font-bold text-secondary italic">High Yield Winning Coins</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
             <OfferWall />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
