
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, Globe, ShieldAlert, Lock, ClipboardList, Video, Landmark, Zap, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useMemoFirebase, useUser, useCollection, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { UserProfile } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type MissionType = 'All' | 'High-Value' | 'Apps' | 'Surveys' | 'Financial';

export default function OfferWall() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [filter, setFilter] = useState<MissionType>('All');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  // Simulation of Mediation API results
  const missionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'cpa_missions') : null, [firestore]);
  const { data: missions, isLoading } = useCollection<any>(missionsQuery);

  const isGlobal = profile?.country !== 'India';
  const isVipLocked = (profile?.vipLevel || 0) < 1;

  const filteredMissions = missions?.filter((m: any) => {
    if (filter === 'All') return true;
    if (filter === 'High-Value') return m.reward >= 2000;
    return m.type === filter;
  }) || [];

  if (isLoading) return (
    <div className="flex flex-col items-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary h-10 w-10" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Fetching Mediation Waterfall...</p>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Mediation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#0a0a0f] p-6 rounded-[2rem] border border-white/5">
         <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
               <Zap className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <div>
               <h3 className="text-xl font-black uppercase italic">Waterfall <span className="text-primary">Mediation</span></h3>
               <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">CPALead • AdGate • IronSource Active</p>
            </div>
         </div>
         <div className="flex flex-wrap gap-2">
            <FilterBtn label="All" active={filter === 'All'} onClick={() => setFilter('All')} />
            <FilterBtn label="High-Pay" active={filter === 'High-Value'} onClick={() => setFilter('High-Value')} />
            <FilterBtn label="Financial" active={filter === 'Financial'} onClick={() => setFilter('Financial')} />
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMissions.map((task: any) => {
          const isHighValue = task.reward >= 2000;
          return (
            <Card key={task.id} className="bg-[#0f0f15] border-white/5 hover:border-primary/30 transition-all rounded-[2.5rem] overflow-hidden group shadow-2xl relative">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {task.type === 'Survey' ? <ClipboardList className="text-amber-500" /> : <Smartphone className="text-primary" />}
                    </div>
                    <div>
                      <h4 className="text-lg font-black uppercase italic text-white leading-tight">{task.appName}</h4>
                      <Badge className="bg-white/5 text-muted-foreground border-none text-[7px] font-black uppercase mt-1 tracking-widest">{task.type}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-primary italic tabular-nums">{task.reward} 🪙</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-6">
                  <div className="flex items-center gap-2">
                     <Globe className="h-3 w-3 text-muted-foreground" />
                     <span className="text-[8px] font-black uppercase text-muted-foreground">{task.geo || 'Global'}</span>
                  </div>
                  <Button 
                    onClick={() => window.open(`${task.link}&uid=${user?.uid}`, '_blank')} 
                    className="h-12 px-8 rounded-xl bg-primary hover:bg-primary/90 font-black uppercase italic text-[10px] shadow-lg shadow-primary/20"
                  >
                    DEPLOY MISSION
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
        active ? "bg-primary text-white shadow-xl" : "bg-white/5 text-muted-foreground hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );
}
