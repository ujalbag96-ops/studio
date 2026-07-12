
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { AppSettings } from '@/app/lib/types';

export default function OfferWall() {
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const tasksQuery = useMemoFirebase(() => firestore ? collection(firestore, 'cpa_tasks') : null, [firestore]);

  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: tasks, isLoading: tasksLoading } = useCollection<any>(tasksQuery);

  if (tasksLoading) return (
    <div className="flex flex-col items-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary h-10 w-10" />
      <p className="text-[10px] font-black uppercase text-muted-foreground italic">Fetching Mission Intelligence...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {tasks && tasks.length > 0 ? (
        tasks.map((task) => (
          <Card key={task.id} className="bg-white/5 border-white/5 hover:border-primary/40 transition-all rounded-2xl overflow-hidden group">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5 min-w-0">
                <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
                  <Smartphone className="text-primary h-6 w-6" />
                </div>
                <div className="truncate">
                  <h4 className="text-lg font-black uppercase italic truncate text-white">{task.appName}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className="bg-secondary/20 text-secondary border-none text-[8px] font-black px-2 py-0.5 uppercase italic">Verified</Badge>
                    <span className="text-[9px] font-black text-muted-foreground uppercase"><Globe className="h-2 w-2 inline mr-1" /> Mobile Install</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                   <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">Reward</p>
                   <p className="text-2xl font-black italic text-white">{task.reward} 🪙</p>
                </div>
                <Button 
                  onClick={() => window.open(`${task.link}&subid=${user?.uid}`, '_blank')} 
                  className="h-12 rounded-xl bg-primary hover:bg-primary/90 px-8 font-black uppercase italic shadow-xl transition-all"
                >
                  START MISSION
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="py-24 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[3rem]">
           <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-muted-foreground italic font-black uppercase text-[10px] tracking-widest">No Active Missions Found</p>
        </div>
      )}

      <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-2xl flex items-start gap-4">
         <CheckCircle2 className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
         <div>
            <p className="text-[10px] font-black uppercase text-blue-400 italic">Analytical Process</p>
            <p className="text-xs text-muted-foreground font-medium mt-1 leading-relaxed">
               Missions take 5-15 minutes to reflect in your wallet after completion. VPN usage will result in immediate disqualification.
            </p>
         </div>
      </div>
    </div>
  );
}
