'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { 
  Loader2, 
  Zap, 
  Smartphone, 
  GraduationCap, 
  Gamepad2, 
  Users, 
  CircleDollarSign,
  Trophy,
  Flame,
  Globe,
  ArrowRight
} from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import OfferWall from '@/components/OfferWall';

type IncomeSector = 'tasks' | 'education' | 'arcade' | 'network';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [activeSector, setActiveSector] = useState<IncomeSector>('tasks');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  const isIndia = profile?.country === 'India';
  const weeklyTarget = 50;
  const weeklyProgress = Math.min(((profile?.weeklyPointsEarned || 0) / weeklyTarget) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 pb-32">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 pt-8">
        <div className="space-y-6 flex-1">
           <div className="flex flex-wrap gap-4">
              <Badge className="bg-primary/20 text-primary border-none uppercase font-bold tracking-widest px-5 py-1.5 text-[10px]">Income Sector Hub</Badge>
              <Badge className="bg-green-500/10 text-green-500 border-none uppercase font-bold text-[10px] px-5 py-1.5 flex items-center gap-1.5">
                 <CircleDollarSign className="h-3.5 w-3.5" /> 100% Free Revenue Share
              </Badge>
           </div>
           <h1 className="text-5xl md:text-8xl font-bold tracking-tighter uppercase leading-[0.85] text-white">
             Revenue <br /> <span className="text-primary italic">Terminal</span>
           </h1>
           <p className="text-muted-foreground font-medium text-lg max-w-2xl uppercase tracking-tight opacity-80 leading-relaxed">
             Participate in sponsored missions to generate local currency yield. Zero cost protocol active.
           </p>
        </div>

        <Card className="w-full xl:w-96 bg-card border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Trophy className="h-32 w-32 text-primary" />
           </div>
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-pulse" />
                 <span className="text-[11px] font-bold uppercase text-white tracking-widest">Active Streak: {profile?.dailyStreak || 0} Days</span>
              </div>
              <h4 className="text-2xl font-bold italic text-white uppercase">Bonus Pool: {isIndia ? '₹10.00' : '$0.10'}</h4>
              <div className="space-y-2 pt-2">
                 <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground tracking-widest">
                    <span>Target Progress</span>
                    <span className="text-primary">{profile?.weeklyPointsEarned || 0} / 50 🪙</span>
                 </div>
                 <Progress value={weeklyProgress} className="h-1.5 bg-white/5" />
              </div>
           </div>
        </Card>
      </header>

      {/* Industrial Tab Navigation: Clean & Spaced */}
      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-8">
        <SectorTab active={activeSector === 'tasks'} label="Global Missions" icon={<Smartphone />} onClick={() => setActiveSector('tasks')} />
        <SectorTab active={activeSector === 'education'} label="Study Rewards" icon={<GraduationCap />} onClick={() => setActiveSector('education')} />
        <SectorTab active={activeSector === 'arcade'} label="Arcade Zone" icon={<Gamepad2 />} onClick={() => setActiveSector('arcade')} />
        <SectorTab active={activeSector === 'network'} label="Network Hub" icon={<Users />} onClick={() => setActiveSector('network')} />
      </div>

      <main className="animate-in fade-in duration-700">
         {activeSector === 'tasks' && (
           <div className="space-y-12">
              <div className="p-12 bg-primary/5 border border-primary/20 rounded-[3rem] space-y-4">
                 <h3 className="text-4xl font-bold uppercase italic text-white leading-none">CPA Task <span className="text-primary">Node</span></h3>
                 <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest opacity-80">High-yield app installs and lead generation. Calibrated to {profile?.country || 'Global Node'}.</p>
              </div>
              <OfferWall />
           </div>
         )}

         {activeSector !== 'tasks' && (
           <div className="py-20 text-center space-y-6 bg-card border border-dashed border-white/10 rounded-[3rem]">
              <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
                 <Globe className="h-8 w-8 text-muted-foreground opacity-20" />
              </div>
              <p className="text-sm font-bold uppercase text-muted-foreground tracking-[0.4em] italic">Secondary Node Synchronizing...</p>
           </div>
         )}
      </main>
    </div>
  );
}

function SectorTab({ active, label, icon, onClick }: { active: boolean, label: string, icon: any, onClick: () => void }) {
   return (
      <button 
        onClick={onClick}
        className={cn(
          "px-8 py-5 rounded-2xl flex items-center gap-4 transition-all duration-300 font-bold uppercase text-[11px] tracking-widest shadow-xl",
          active ? "bg-primary text-white scale-105" : "bg-card text-muted-foreground border border-white/5 hover:border-primary/20 hover:text-white"
        )}
      >
         <span className={cn("transition-transform duration-300", active ? "scale-110" : "")}>{icon}</span>
         <span>{label}</span>
      </button>
   );
}