
'use client';

import React, { useState } from 'react';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Zap, 
  Smartphone, 
  Globe, 
  Target,
  Signal,
  Filter,
  Info,
  Award,
  Trophy,
  ClipboardList,
  Video,
  Coins
} from 'lucide-react';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { MONETIZATION_REGISTRY, MonCategory } from '../lib/monetization-registry';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeSector, setActiveSector] = useState<MonCategory>('CPA');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  const tasksGoal = 10;
  const currentTasks = profile?.cpaTasksCount || 0;
  const progress = Math.min((currentTasks / tasksGoal) * 100, 100);

  // Filter modules based on Admin visibility toggles
  const activeModules = MONETIZATION_REGISTRY.filter(m => (settings as any)?.[m.visibilityKey] && m.category === activeSector);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 pb-40">
      <header className="space-y-6 pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
           <div className="space-y-4 text-center md:text-left">
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                 <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-5 py-1.5 text-[10px] tracking-widest">
                    Global Income Terminal v60.0
                 </Badge>
                 <Badge variant="outline" className="border-white/10 text-muted-foreground text-[8px] font-black uppercase px-3 italic">70/30 Profit Lock Active</Badge>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] text-white">
                Income <br /><span className="text-primary">Hub</span>
              </h1>
           </div>
           
           <Card className="bg-white/[0.02] border-white/10 rounded-3xl p-8 flex items-center gap-8 shadow-2xl backdrop-blur-xl">
              <div className="space-y-1">
                 <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest italic">User Dividend Rate</p>
                 <p className="text-3xl font-black text-primary italic">30% <span className="text-xs opacity-40">SHARE</span></p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <Zap className="h-6 w-6 animate-pulse" />
              </div>
           </Card>
        </div>
      </header>

      {/* MILESTONE TRACKER */}
      <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl group">
         <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Trophy className="h-40 w-48 text-primary" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="space-y-4 flex-1 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-3">
                  <Award className="h-6 w-6 text-amber-500" />
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">VIP 1 Withdrawal Goal</h3>
               </div>
               <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight max-w-xl">Complete {tasksGoal} high-yield missions to unlock industrial withdrawal nodes.</p>
               <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-[10px] font-black uppercase italic text-muted-foreground">
                     <span>Signal Alignment Progress</span>
                     <span className="text-white">{currentTasks} / {tasksGoal} Missions</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-white/5" />
               </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center min-w-[140px]">
               <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Status</p>
               <Badge className={cn("px-4 py-1 font-black", progress === 100 ? "bg-green-600" : "bg-red-600/20 text-red-500")}>
                  {progress === 100 ? 'QUALIFIED' : 'LOCKED'}
               </Badge>
            </div>
         </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-8 overflow-x-auto no-scrollbar">
         <SectorTab active={activeSector === 'CPA'} label="Offer Walls" icon={<Smartphone />} onClick={() => setActiveSector('CPA')} />
         <SectorTab active={activeSector === 'Ads'} label="Video Yield" icon={<Video />} onClick={() => setActiveSector('Ads')} />
         <SectorTab active={activeSector === 'Surveys'} label="Research" icon={<ClipboardList />} onClick={() => setActiveSector('Surveys')} />
         <SectorTab active={activeSector === 'MicroTasks'} label="Micro Tasks" icon={<Target />} onClick={() => setActiveSector('MicroTasks')} />
         <SectorTab active={activeSector === 'Fintech'} label="Passive / Fintech" icon={<Coins />} onClick={() => setActiveSector('Fintech')} />
      </div>

      <main className="animate-in fade-in duration-700">
         <div className="grid gap-px bg-white/10 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            {activeModules.length > 0 ? activeModules.map((mon) => (
               <div key={mon.id} className="group bg-background hover:bg-white/[0.03] transition-all">
                  <div className="p-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                     <div className="flex items-center gap-8">
                        <div className="h-16 w-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500 text-primary">
                           <mon.icon size={24} />
                        </div>
                        <div className="space-y-1">
                           <div className="flex items-center gap-3">
                              <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white group-hover:text-primary transition-colors">{mon.label}</h4>
                              {mon.eCPMTier === 'High' && <Badge className="bg-amber-500 text-black text-[7px] font-black uppercase px-2 border-none">TOP ECPM</Badge>}
                           </div>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">{mon.provider} Network</p>
                        </div>
                     </div>

                     <div className="flex-1 flex flex-wrap gap-4 items-center xl:justify-center">
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-xl">
                           <div className="text-center">
                              <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">Average Yield</p>
                              <p className="text-lg font-black text-primary italic">100 - 5K 🪙</p>
                           </div>
                           <div className="w-px h-8 bg-white/10" />
                           <div className="text-center">
                              <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">Fill Rate</p>
                              <p className="text-lg font-black text-green-500 italic">99.9%</p>
                           </div>
                        </div>
                     </div>

                     <div className="xl:border-l xl:border-white/5 xl:pl-10">
                        <Button className="h-14 px-12 bg-white/5 hover:bg-primary border border-white/10 rounded-2xl font-black uppercase italic text-xs transition-all group-hover:shadow-xl group-hover:text-white">
                           INITIALIZE SIGNAL
                        </Button>
                     </div>
                  </div>
               </div>
            )) : (
               <div className="p-20 text-center space-y-4">
                  <Signal className="h-12 w-12 text-muted-foreground mx-auto opacity-10" />
                  <p className="text-sm font-black uppercase text-muted-foreground tracking-widest italic">Awaiting Global Node Activation...</p>
               </div>
            )}
         </div>
      </main>

      <div className="flex items-center justify-center gap-8 opacity-20 pt-10">
         <Badge variant="outline" className="border-white/10 text-[8px] font-bold uppercase tracking-[0.4em]">AES-256 S2S ENCRYPTION</Badge>
         <Badge variant="outline" className="border-white/10 text-[8px] font-bold uppercase tracking-[0.4em]">GLOBAL COMPLIANCE v4.2</Badge>
      </div>
    </div>
  );
}

function SectorTab({ active, label, icon, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className={cn(
          "px-8 py-4 rounded-xl flex items-center gap-3 transition-all duration-500 font-black uppercase text-[10px] tracking-widest border-2 whitespace-nowrap",
          active ? "bg-primary/10 border-primary text-primary shadow-xl italic" : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10"
        )}
      >
         {React.cloneElement(icon, { size: 14 })}
         <span>{label}</span>
      </button>
   );
}
