
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
  ArrowRight,
  ShieldCheck,
  Activity,
  LayoutGrid,
  Library,
  Target,
  Coins,
  Signal,
  Filter,
  Info
} from 'lucide-react';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import OfferWall from '@/components/OfferWall';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeSector, setActiveSector] = useState<'missions' | 'surveys' | 'video'>('missions');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  const isIndia = profile?.country === 'India';

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 pb-40">
      <header className="space-y-6 pt-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
           <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                 <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-5 py-1.5 text-[10px] tracking-widest">
                    Global Yield Terminal v31.0
                 </Badge>
                 <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic">
                    <Globe className="h-3 w-3" /> Regional Node: {profile?.country || 'Global'}
                 </div>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] text-white">
                Income <br /><span className="text-primary">Terminal</span>
              </h1>
           </div>
           
           <Card className="bg-white/[0.02] border-white/10 rounded-[2rem] p-8 flex items-center gap-8 shadow-2xl backdrop-blur-xl">
              <div className="space-y-1">
                 <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Signal Integrity</p>
                 <div className="flex items-center gap-2">
                    <div className="status-pulse">
                       <span className="status-pulse-dot bg-green-500" />
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </div>
                    <span className="text-sm font-black text-white italic">S2S VERIFIED</span>
                 </div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                 <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">User Share Rate</p>
                 <p className="text-lg font-black text-primary italic">30% Dividend</p>
              </div>
           </Card>
        </div>
      </header>

      {/* MARGIN TRANSPARENCY BANNER */}
      <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl border-dashed">
         <div className="flex items-start gap-5">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
               <Info />
            </div>
            <div className="space-y-1">
               <h3 className="text-lg font-black uppercase italic text-white tracking-tight">Skill Dividend Protocol</h3>
               <p className="text-[10px] text-muted-foreground font-bold uppercase leading-relaxed">
                  Mission rewards follow a <b>70/30 Margin Split</b>. 70% Admin Retention maintains platform infrastructure, while 30% is credited as your Scholarship Dividend.
               </p>
            </div>
         </div>
         <Badge className="bg-primary text-white border-none font-black px-6 py-2 rounded-xl text-[10px]">VERIFIED MODEL</Badge>
      </Card>

      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-8">
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
          "px-8 py-4 rounded-xl flex items-center gap-3 transition-all duration-500 font-black uppercase text-[10px] tracking-widest border-2",
          active ? "bg-primary/10 border-primary text-primary shadow-xl scale-105 italic" : "bg-white/[0.02] text-muted-foreground border-white/5 hover:border-white/20"
        )}
      >
         {icon}
         <span>{label}</span>
      </button>
   );
}
