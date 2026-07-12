
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function OfferWall() {
  const { user } = useUser();
  const firestore = useFirestore();

  const missionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'cpa_missions') : null, [firestore]);
  const { data: missions, isLoading } = useCollection<any>(missionsQuery);

  if (isLoading) return (
    <div className="flex flex-col items-center py-32 gap-6">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
      <p className="text-[10px] font-black uppercase text-muted-foreground italic tracking-[0.4em]">Synchronizing Active Missions...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {missions && missions.length > 0 ? (
        missions.map((task) => (
          <Card key={task.id} className="bg-white/5 border-white/5 hover:border-primary/40 transition-all rounded-[2rem] overflow-hidden group shadow-2xl">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6 min-w-0">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20 group-hover:scale-105 transition-transform">
                  <Smartphone className="text-primary h-8 w-8" />
                </div>
                <div className="truncate">
                  <h4 className="text-2xl font-black uppercase italic truncate text-white tracking-tighter">{task.appName}</h4>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge className="bg-secondary/20 text-secondary border-none text-[9px] font-black px-4 py-1 uppercase italic">Verified Mission</Badge>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest"><Globe className="h-3 w-3 inline mr-1" /> Multi-Platform</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-10 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
                <div className="text-right">
                   <p className="text-[9px] font-black uppercase text-muted-foreground mb-1 italic">Mission Dividend</p>
                   <p className="text-4xl font-black italic text-white tabular-nums">{task.reward} <span className="text-lg text-primary opacity-40">🪙</span></p>
                </div>
                <Button 
                  onClick={() => window.open(`${task.link}&uid=${user?.uid}`, '_blank')} 
                  className="h-16 rounded-2xl bg-primary hover:bg-primary/90 px-10 font-black uppercase italic text-sm shadow-xl shadow-primary/20 transition-all active:scale-95"
                >
                  START MISSION
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="py-40 text-center space-y-6 border-2 border-dashed border-white/10 rounded-[3rem]">
           <ShieldAlert className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-muted-foreground italic font-black uppercase text-[12px] tracking-[0.4em]">Zero Active Deployments Detected</p>
        </div>
      )}

      <div className="p-8 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] flex items-start gap-6 animate-in slide-in-from-bottom-4 duration-1000">
         <CheckCircle2 className="h-7 w-7 text-blue-400 shrink-0 mt-1" />
         <div>
            <p className="text-xs font-black uppercase text-blue-400 italic tracking-widest">Audit Protocol</p>
            <p className="text-sm text-muted-foreground font-medium mt-2 leading-relaxed opacity-60 uppercase text-[10px]">
               Missions undergo automated 3rd party verification. Rewards reflect in wallet after data synchronization (5-15 Minutes). Industrial VPN detection active.
            </p>
         </div>
      </div>
    </div>
  );
}
