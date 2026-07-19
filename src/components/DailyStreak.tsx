
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Flame, CheckCircle2, Gift, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { UserProfile } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function DailyStreak({ profile }: { profile: UserProfile }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = profile.lastCheckInDate === today;
  const currentStreak = profile.dailyStreak || 0;

  const handleCheckIn = async () => {
    if (!user || !firestore || hasCheckedInToday || isClaiming) return;

    setIsClaiming(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      let newStreak = currentStreak + 1;
      
      // Reset streak if last check-in was missed (more than 1 day ago)
      if (profile.lastCheckInDate) {
        const last = new Date(profile.lastCheckInDate);
        const now = new Date(today);
        const diff = (now.getTime() - last.getTime()) / (1000 * 3600 * 24);
        if (diff > 1) newStreak = 1;
      } else {
        newStreak = 1;
      }

      const reward = newStreak === 7 ? 50 : 2; // Big reward on 7th day

      await updateDoc(userRef, {
        dailyStreak: newStreak,
        lastCheckInDate: today,
        coins: increment(reward),
        bonusBalance: increment(reward)
      });

      toast({ 
        title: `DAY ${newStreak} SIGNAL SYNCED`, 
        description: `+${reward} Coins added for your login streak!` 
      });
      
      if (newStreak === 7) {
        new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[2.5rem] p-8 space-y-6 relative overflow-hidden group shadow-2xl">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
        <Flame className="h-40 w-40 text-primary" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 text-center md:text-left">
           <div className="flex items-center justify-center md:justify-start gap-2">
              <Flame className={cn("h-5 w-5", currentStreak > 0 ? "text-orange-500 fill-orange-500 animate-pulse" : "text-muted-foreground")} />
              <span className="text-[10px] font-black uppercase text-white tracking-widest italic">Daily Streak Protocol</span>
           </div>
           <h3 className="text-3xl font-black uppercase italic tracking-tighter">7-Day <span className="text-primary">Engagement</span></h3>
           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Login 7 days continuously for a Mega Mystery Box.</p>
        </div>

        <Button 
          onClick={handleCheckIn}
          disabled={hasCheckedInToday || isClaiming}
          className={cn(
            "h-16 px-10 rounded-2xl font-black uppercase italic transition-all shadow-xl",
            hasCheckedInToday ? "bg-green-600/20 text-green-500 border border-green-500/20" : "bg-primary hover:bg-primary/90 text-white"
          )}
        >
          {isClaiming ? <Loader2 className="animate-spin" /> : hasCheckedInToday ? <><CheckCircle2 className="mr-2" /> SIGNAL SYNCED</> : "SYNC DAILY SIGNAL"}
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4 relative z-10">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
          const isDone = day <= currentStreak;
          const isCurrent = day === currentStreak + 1 && !hasCheckedInToday;
          return (
            <div key={day} className="space-y-2">
               <div className={cn(
                 "aspect-square rounded-xl border-2 flex flex-col items-center justify-center transition-all",
                 isDone ? "bg-primary/20 border-primary text-primary" : 
                 isCurrent ? "bg-white/5 border-primary/40 border-dashed animate-pulse" : "bg-white/5 border-white/10 text-muted-foreground"
               )}>
                  {day === 7 ? <Gift className="h-4 w-4" /> : <span className="text-[10px] font-black">{day}</span>}
                  {isDone && <CheckCircle2 className="h-3 w-3 mt-1" />}
               </div>
               <p className="text-[7px] font-black uppercase text-center text-muted-foreground">Day {day}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
