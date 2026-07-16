
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, Globe, ShieldAlert, CheckCircle2, Lock, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useMemoFirebase, useUser, useCollection, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { UserProfile } from '@/app/lib/types';
import { cn } from '@/lib/utils';

export default function OfferWall() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const missionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'cpa_missions') : null, [firestore]);
  const { data: missions, isLoading } = useCollection<any>(missionsQuery);

  const currentVip = profile?.vipLevel || 0;

  if (isLoading) return (
    <div className="flex flex-col items-center py-32 gap-6">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
      <p className="text-[10px] font-black uppercase text-muted-foreground italic tracking-[0.4em]">Synchronizing Active Missions...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {missions && missions.length > 0 ? (
        missions.map((task: any) => {
          // Gating logic: Rewards >= 1500 coins (approx ₹15) require VIP 1
          const isHighValue = task.reward >= 1500;
          const isLocked = isHighValue && currentVip === 0;

          return (
            <Card key={task.id} className={cn(
              "bg-white/5 border-white/5 hover:border-primary/40 transition-all rounded-[2rem] overflow-hidden group shadow-2xl relative",
              isLocked && "opacity-60 grayscale-[50%]"
            )}>
              {isLocked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] space-y-3">
                   <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/40">
                      <Lock className="h-5 w-5 text-amber-500" />
                   </div>
                   <p className="text-[10px] font-black uppercase text-amber-500 italic tracking-widest">Unlock at VIP Level 1</p>
                </div>
              )}

              <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6 min-w-0">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                    <Smartphone className="text-primary h-8 w-8" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                       <h4 className="text-2xl font-black uppercase italic truncate text-white tracking-tighter">{task.appName}</h4>
                       {isHighValue && <Star className="h-4 w-4 text-amber-500 fill-amber-500 animate-pulse" />}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className="bg-secondary/20 text-secondary border-none text-[9px] font-black px-4 py-1 uppercase italic">Verified Mission</Badge>
                      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest"><Globe className="h-3 w-3 inline mr-1" /> Multi-Platform</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
                  <div className="text-right">
                     <p className="text-[9px] font-black uppercase text-muted-foreground mb-1 italic">Mission Dividend</p>
                     <p className={cn("text-4xl font-black italic tabular-nums", isHighValue ? "text-amber-500" : "text-white")}>
                       {task.reward} <span className="text-lg text-primary opacity-40">🪙</span>
                     </p>
                  </div>
                  <Button 
                    disabled={isLocked}
                    onClick={() => window.open(`${task.link}&uid=${user?.uid}`, '_blank')} 
                    className="h-16 rounded-2xl bg-primary hover:bg-primary/90 px-10 font-black uppercase italic text-sm shadow-xl shadow-primary/20 transition-all active:scale-95"
                  >
                    {isLocked ? 'LOCKED' : 'START MISSION'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : (
        <div className="py-40 text-center space-y-6 border-2 border-dashed border-white/10 rounded-[3rem]">
           <ShieldAlert className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-muted-foreground italic font-black uppercase text-[12px] tracking-[0.4em]">Zero Active Deployments Detected</p>
        </div>
      )}

      <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] flex items-start gap-6 animate-in slide-in-from-bottom-4 duration-1000">
         <CheckCircle2 className="h-7 w-7 text-blue-400 shrink-0 mt-1" />
         <div>
            <p className="text-xs font-black uppercase text-blue-400 italic tracking-widest">High-Reward Gating Protocol</p>
            <p className="text-sm text-muted-foreground font-medium mt-2 leading-relaxed opacity-60 uppercase text-[10px]">
               Tasks rewarded at ₹15+ (1500 Coins) are exclusively reserved for VIP 1 and above. Complete basic tasks to upgrade your identity level.
            </p>
         </div>
      </div>
    </div>
  );
}
