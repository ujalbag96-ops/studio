
'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Flame, CheckCircle2, Gift, Loader2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function DailyStreak({ profile }: { profile: UserProfile | null }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(10);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let timer: any;
    if (showAd && adCountdown > 0) {
      timer = setInterval(() => setAdCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showAd, adCountdown]);

  if (!profile) return <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" /></Card>;

  const hasCheckedInToday = profile.lastCheckInDate === today;
  const currentStreak = profile.dailyStreak || 0;

  const handleCheckInFinalize = async () => {
    if (!user || !firestore || hasCheckedInToday || isClaiming || adCountdown > 0) return;
    setIsClaiming(true);
    try {
      let newStreak = currentStreak + 1;
      const reward = newStreak === 7 ? 50 : 2;

      await updateDoc(doc(firestore, 'users', user.uid), {
        dailyStreak: newStreak,
        lastCheckInDate: today,
        coins: increment(reward),
        bonusBalance: increment(reward)
      });

      if (settings?.globalRewardSoundUrl) {
        const audio = new Audio(settings.globalRewardSoundUrl);
        audio.play().catch(() => {});
      }
      
      toast({ title: "DAY SIGNAL SYNCED" });
      setShowAd(false);
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC ERROR" });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
             <h3 className="text-3xl font-black uppercase italic tracking-tighter">7-Day <span className="text-primary">Streak</span></h3>
          </div>
          <Button onClick={() => setShowAd(true)} disabled={hasCheckedInToday || isClaiming} className={cn("h-16 px-10 rounded-2xl font-black uppercase italic", hasCheckedInToday ? "bg-green-600/20 text-green-500" : "bg-primary")}>
            {hasCheckedInToday ? "SYNCED" : "CLAIM DAILY"}
          </Button>
        </div>
      </Card>
      {showAd && (
        <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-500">
           <div className="max-w-md w-full text-center space-y-10">
              <p className="text-6xl font-black text-white italic tabular-nums">{adCountdown}s</p>
              <Button disabled={adCountdown > 0 || isClaiming} onClick={handleCheckInFinalize} className="w-full h-20 rounded-2xl font-black text-xl uppercase italic bg-primary shadow-xl">
                 {isClaiming ? <Loader2 className="animate-spin" /> : adCountdown === 0 ? "CLAIM" : "WATCHING..."}
              </Button>
           </div>
        </div>
      )}
    </>
  );
}
