
'use client';

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
  Trophy
} from 'lucide-react';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import OfferWall from '@/components/OfferWall';
import { Progress } from '@/components/ui/progress';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeSector, setActiveSector] = useState<'missions' | 'surveys'>('missions');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  const tasksGoal = 10;
  const currentTasks = profile?.cpaTasksCount || 0;
  const progress = Math.min((currentTasks / tasksGoal) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 pb-40">
      <header className="space-y-6 pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
           <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                 <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-5 py-1.5 text-[10px] tracking-widest">
                    Pocket Money Terminal v11.0
                 </Badge>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] text-white">
                Income <br /><span className="text-primary">Node</span>
              </h1>
           </div>
           
           <Card className="bg-white/[0.02] border-white/10 rounded-3xl p-8 flex items-center gap-8 shadow-2xl backdrop-blur-xl">
              <div className="space-y-1">
                 <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest italic">User Share Rate</p>
                 <p className="text-3xl font-black text-primary italic">30% <span className="text-xs opacity-40">DIVIDEND</span></p>
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
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Withdrawal Goal</h3>
               </div>
               <p className="text-sm text-muted-foreground font-medium uppercase tracking-tight">Complete {tasksGoal} tasks to unlock industrial payout node.</p>
               <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-[10px] font-black uppercase italic text-muted-foreground">
                     <span>Current Progress</span>
                     <span className="text-white">{currentTasks} / {tasksGoal} Tasks</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-white/5" />
               </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
               <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Status</p>
               <Badge className={cn("px-4 py-1 font-black", progress === 100 ? "bg-green-600" : "bg-red-600/20 text-red-500")}>
                  {progress === 100 ? 'QUALIFIED' : 'LOCKED'}
               </Badge>
            </div>
         </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-8">
         <SectorTab active={activeSector === 'missions'} label="Global CPA" icon={<Smartphone />} onClick={() => setActiveSector('missions')} />
         <SectorTab active={activeSector === 'surveys'} label="Premium Surveys" icon={<Filter />} onClick={() => setActiveSector('surveys')} />
      </div>

      <main className="animate-in fade-in duration-700">
         <OfferWall filterType={activeSector} />
      </main>
    </div>
  );
}

function SectorTab({ active, label, icon, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className={cn(
          "px-8 py-3.5 rounded-xl flex items-center gap-3 transition-all duration-500 font-black uppercase text-[10px] tracking-widest border-2",
          active ? "bg-primary/10 border-primary text-primary shadow-xl italic" : "bg-white/5 text-muted-foreground border-transparent hover:bg-white/10"
        )}
      >
         {React.cloneElement(icon, { size: 14 })}
         <span>{label}</span>
      </button>
   );
}
