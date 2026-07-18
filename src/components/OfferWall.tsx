
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, Globe, ShieldAlert, CheckCircle2, Lock, Star, ClipboardList, Video, Landmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useMemoFirebase, useUser, useCollection, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { UserProfile } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

type MissionType = 'All' | 'App' | 'Survey' | 'Video' | 'Financial';

export default function OfferWall() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [filter, setFilter] = useState<MissionType>('All');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const missionsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'cpa_missions') : null, [firestore]);
  const { data: missions, isLoading } = useCollection<any>(missionsQuery);

  const currentVip = profile?.vipLevel || 0;
  const isGlobal = profile?.country !== 'India';

  const filteredMissions = missions?.filter((m: any) => {
    if (filter === 'All') return true;
    return m.type === filter;
  }) || [];

  const getIcon = (type: string) => {
    switch(type) {
      case 'Survey': return <ClipboardList className="text-amber-500" />;
      case 'Video': return <Video className="text-red-500" />;
      case 'Financial': return <Landmark className="text-green-500" />;
      default: return <Smartphone className="text-primary" />;
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center py-32 gap-6">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
      <p className="text-[10px] font-black uppercase text-muted-foreground italic tracking-[0.4em]">Synchronizing Global Missions...</p>
    </div>
  );

  return (
    <div className="space-y-10">
      {/* Category Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterBtn label="All" active={filter === 'All'} onClick={() => setFilter('All')} />
        <FilterBtn label="App Installs" active={filter === 'App'} onClick={() => setFilter('App')} />
        <FilterBtn label="Surveys" active={filter === 'Survey'} onClick={() => setFilter('Survey')} />
        <FilterBtn label="Video Tasks" active={filter === 'Video'} onClick={() => setFilter('Video')} />
        {isGlobal && <FilterBtn label="High-Pay Leads" active={filter === 'Financial'} onClick={() => setFilter('Financial')} />}
      </div>

      <div className="space-y-6">
        {filteredMissions.length > 0 ? (
          filteredMissions.map((task: any) => {
            const isHighValue = task.reward >= 1500;
            const isLocked = isHighValue && currentVip === 0;

            return (
              <Card key={task.id} className={cn(
                "bg-white/5 border-white/5 hover:border-primary/40 transition-all rounded-[2rem] overflow-hidden group shadow-2xl relative",
                isLocked && "opacity-60 grayscale-[50%]"
              )}>
                {isLocked && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] space-y-3">
                     <Lock className="h-6 w-6 text-amber-500" />
                     <p className="text-[10px] font-black uppercase text-amber-500 italic">VIP 1 REQUIRED</p>
                  </div>
                )}

                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-6 min-w-0">
                    <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 group-hover:scale-105 transition-transform shadow-xl">
                      {getIcon(task.type)}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                         <h4 className="text-2xl font-black uppercase italic truncate text-white">{task.appName}</h4>
                         {task.isPremium && <Badge className="bg-amber-500 text-black text-[7px] font-black">PREMIUM</Badge>}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">{task.type}</Badge>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <Globe className="h-3 w-3" /> {task.geo || 'Global'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-6 md:pt-0">
                    <div className="text-right">
                       <p className="text-[9px] font-black uppercase text-muted-foreground mb-1 italic">Mission Dividend</p>
                       <p className={cn("text-4xl font-black italic", isHighValue ? "text-amber-500" : "text-white")}>
                         {task.reward} <span className="text-lg text-primary opacity-40">🪙</span>
                       </p>
                    </div>
                    <Button 
                      disabled={isLocked}
                      onClick={() => window.open(`${task.link}&uid=${user?.uid}`, '_blank')} 
                      className="h-16 rounded-2xl bg-primary hover:bg-primary/90 px-10 font-black uppercase italic text-sm shadow-xl"
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
             <p className="text-muted-foreground italic font-black uppercase text-[12px] tracking-[0.4em]">Zero Active Deployments in Sector {filter}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
        active ? "bg-primary text-white shadow-lg" : "bg-white/5 text-muted-foreground hover:bg-white/10"
      )}
    >
      {label}
    </button>
  );
}
