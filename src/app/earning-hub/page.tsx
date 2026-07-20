
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Zap, 
  Smartphone, 
  GraduationCap, 
  Gamepad2, 
  Users, 
  Globe, 
  ArrowRight,
  Video,
  Share2,
  Gift,
  ShieldCheck,
  ClipboardList,
  Activity,
  LayoutGrid,
  Library,
  Target,
  BrainCircuit,
  Coins
} from 'lucide-react';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

type IncomeSector = 'academic' | 'global' | 'universal';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [activeSector, setActiveSector] = useState<IncomeSector>('academic');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-[#050508]"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  const isIndia = profile?.country === 'India';
  const currencySymbol = isIndia ? '₹' : '$';
  const weeklyTarget = 50;
  const weeklyProgress = Math.min(((profile?.weeklyPointsEarned || 0) / weeklyTarget) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 pb-32">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 pt-8">
        <div className="space-y-6 flex-1">
           <div className="flex flex-wrap gap-4">
              <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-5 py-1.5 text-[10px]">
                Yield Terminal v10.0
              </Badge>
              <Badge className="bg-green-500/10 text-green-500 border-none uppercase font-black text-[10px] px-5 py-1.5 flex items-center gap-1.5">
                 <ShieldCheck className="h-3.5 w-3.5" /> 10-Node Architecture Active
              </Badge>
           </div>
           <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] text-white">
             Income <br /> <span className="text-primary italic">Nodes</span>
           </h1>
           <p className="text-muted-foreground font-medium text-lg max-w-2xl uppercase tracking-tight opacity-80 leading-relaxed italic">
             {isIndia ? 'Complete academic missions for localized dividends.' : 'Global high-pay CPA & survey signals enabled.'}
           </p>
        </div>

        <Card className="w-full xl:w-96 bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <LayoutGrid className="h-32 w-32 text-primary" />
           </div>
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <Globe className="h-5 w-5 text-primary animate-pulse" />
                 <span className="text-[11px] font-black uppercase text-white tracking-widest italic">Node: {profile?.country || 'Global'}</span>
              </div>
              <h4 className="text-2xl font-black italic text-white uppercase">Rate: {isIndia ? '100:1 INR' : '1000:1 USD'}</h4>
              <div className="space-y-2 pt-2">
                 <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                    <span>Target Achievement</span>
                    <span className="text-primary">{profile?.weeklyPointsEarned || 0} / 50 🪙</span>
                 </div>
                 <Progress value={weeklyProgress} className="h-1.5 bg-white/5" />
              </div>
           </div>
        </Card>
      </header>

      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-8">
        <SectorTab active={activeSector === 'academic'} label="Academic Terminal" icon={<Library className="h-4 w-4" />} onClick={() => setActiveSector('academic')} />
        <SectorTab active={activeSector === 'global'} label="Global Missions" icon={<Globe className="h-4 w-4" />} onClick={() => setActiveSector('global')} />
        <SectorTab active={activeSector === 'universal'} label="Universal Yield" icon={<Activity className="h-4 w-4" />} onClick={() => setActiveSector('universal')} />
      </div>

      <main className="animate-in fade-in duration-700">
         {activeSector === 'academic' && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <NodeModuleCard 
                 title="Scholar Dividend" 
                 desc="Node 1: 30-min study timer in Smart Library." 
                 reward="10 Points" 
                 active={settings?.node_scholar_dividend} 
                 link="/campus" 
              />
              <NodeModuleCard 
                 title="Quiz Arena" 
                 desc="Node 2: KBC-style AI academic quizzes." 
                 reward="50 Coins" 
                 active={settings?.node_quiz_arena} 
                 link="/quiz-arena" 
              />
           </div>
         )}

         {activeSector === 'global' && (
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <NodeModuleCard 
                 title="Global CPA Hub" 
                 desc="Node 3: High-value app installs (US/UK/EU)." 
                 reward="Max Yield" 
                 active={settings?.node_global_cpa} 
                 link="#" 
              />
              <NodeModuleCard 
                 title="Micro-Task Hub" 
                 desc="Node 4: Data labeling & digital signals." 
                 reward="5-50 Coins" 
                 active={settings?.node_micro_tasks} 
                 link="#" 
              />
              <NodeModuleCard 
                 title="Surveys Node" 
                 desc="Node 5: Strategic analytical surveys." 
                 reward="Premium" 
                 active={settings?.node_surveys} 
                 link="#" 
              />
           </div>
         )}

         {activeSector === 'universal' && (
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              <NodeModuleCard 
                 title="Ad Stream" 
                 desc="Node 6: Rewarded Video." 
                 reward="2 Coins" 
                 active={settings?.node_ad_stream} 
                 link="#" 
              />
              <NodeModuleCard 
                 title="Movie Analysis" 
                 desc="Node 7: 10-min cinematic yield." 
                 reward="300 Coins" 
                 active={settings?.node_content_analysis} 
                 link="/watch-earn" 
              />
              <NodeModuleCard 
                 title="Referral Engine" 
                 desc="Node 8: L1/L2 Passive Flow." 
                 reward="5% Passive" 
                 active={settings?.node_referral_engine} 
                 link="/refer" 
              />
              <NodeModuleCard 
                 title="Arcade Rewards" 
                 desc="Node 9: Skill level milestones." 
                 reward="Loot Boxes" 
                 active={settings?.node_arcade_rewards} 
                 link="/games" 
              />
              <NodeModuleCard 
                 title="Check-in" 
                 desc="Node 10: 7D Login Streak." 
                 reward="Daily Gift" 
                 active={settings?.node_daily_checkin} 
                 link="/dashboard" 
              />
           </div>
         )}
      </main>
    </div>
  );
}

function SectorTab({ active, label, icon, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className={cn(
          "px-6 py-4 rounded-2xl flex items-center gap-3 transition-all duration-500 font-black uppercase text-[10px] tracking-widest shadow-xl border-2",
          active ? "bg-primary text-white border-primary shadow-primary/20 scale-105 italic" : "bg-[#0a0a0f] text-muted-foreground border-white/5 hover:border-primary/40"
        )}
      >
         {icon}
         <span>{label}</span>
      </button>
   );
}

function NodeModuleCard({ title, desc, reward, active, link }: any) {
  return (
    <Card className={cn(
       "bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 transition-all relative overflow-hidden group shadow-xl h-full flex flex-col justify-between",
       active ? "hover:border-primary/40" : "opacity-40 grayscale pointer-events-none"
    )}>
       {!active && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Badge variant="outline" className="border-red-500/40 text-red-500 font-black uppercase text-[8px] italic">NODE OFFLINE</Badge>
         </div>
       )}
       <div className="space-y-6">
          <div className="flex items-start justify-between">
             <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
                <Zap className="h-5 w-5" />
             </div>
             <Badge className="bg-primary/20 text-primary border-none font-black text-[8px] px-3 uppercase italic">{reward}</Badge>
          </div>
          <div className="space-y-1">
             <h4 className="text-lg font-black uppercase italic text-white tracking-tight">{title}</h4>
             <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tight leading-relaxed">{desc}</p>
          </div>
       </div>
       <Button asChild className="w-full h-11 bg-white/5 hover:bg-primary text-white font-black uppercase italic rounded-xl border border-white/10 transition-all text-[9px] mt-6">
          <Link href={link}>DEPLOY SIGNAL <ArrowRight className="ml-2 h-3 w-3" /></Link>
       </Button>
    </Card>
  );
}
