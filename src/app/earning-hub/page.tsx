
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
  Filter
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
                    Global Yield Terminal v17.0
                 </Badge>
                 <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest italic">
                    <Globe className="h-3 w-3" /> Regional Node: {profile?.country || 'Global'}
                 </div>
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.8] text-white">
                Income <br /><span className="text-primary">Terminal</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-xl uppercase tracking-tight opacity-70">
                 {isIndia ? 'Complete localized missions with 100:1 INR scaling.' : 'Access premium US/Global CPA signals with 1000:1 USD scaling.'}
              </p>
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
                 <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Exchange Rate</p>
                 <p className="text-lg font-black text-primary italic">{isIndia ? '₹1 = 100 🪙' : '$1 = 1000 🪙'}</p>
              </div>
           </Card>
        </div>
      </header>

      {/* Industrial Mission Filter */}
      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-8">
         <SectorTab active={activeSector === 'missions'} label="Global CPA" icon={<Smartphone />} onClick={() => setActiveSector('missions')} />
         <SectorTab active={activeSector === 'surveys'} label="Premium Surveys" icon={<Filter />} onClick={() => setActiveSector('surveys')} />
         <SectorTab active={activeSector === 'video'} label="Video Yield" icon={<Zap />} onClick={() => setActiveSector('video')} />
      </div>

      <main className="animate-in fade-in duration-700">
         <OfferWall filterType={activeSector} />
      </main>

      {/* Yield Policy Transparency */}
      <section className="pt-20">
         <div className="p-12 rounded-[3rem] bg-gradient-to-r from-primary/5 to-transparent border border-white/5 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl">
            <div className="space-y-4 max-w-2xl">
               <h3 className="text-3xl font-black uppercase italic text-white leading-tight">Skill Dividend <span className="text-primary">Protocol</span></h3>
               <p className="text-muted-foreground text-sm font-medium leading-relaxed uppercase tracking-tight opacity-80">
                  Every mission completion generates industrial marketing value. We utilize a **70/30 Margin Lock**: 70% sustains platform infrastructure, and 30% is shared directly with you as a verified student reward.
               </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
               <div className="p-6 bg-white/5 rounded-2xl border border-white/5 text-center">
                  <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Admin Margin</p>
                  <p className="text-2xl font-black text-white italic opacity-40">70%</p>
               </div>
               <div className="p-6 bg-white/10 rounded-2xl border border-primary/20 text-center shadow-lg">
                  <p className="text-[8px] font-black uppercase text-primary mb-1">User Share</p>
                  <p className="text-2xl font-black text-primary italic">30%</p>
               </div>
            </div>
         </div>
      </section>
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
