
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
  Flag,
  ClipboardList,
  Target,
  Activity,
  Search,
  LayoutGrid
} from 'lucide-react';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import OfferWall from '@/components/OfferWall';
import Link from 'next/link';

type IncomeSector = 'academic' | 'global' | 'universal' | 'network';

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
                 <ShieldCheck className="h-3.5 w-3.5" /> 10-Node Multi-Revenue Active
              </Badge>
           </div>
           <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] text-white">
             Income <br /> <span className="text-primary italic">Sectors</span>
           </h1>
           <p className="text-muted-foreground font-medium text-lg max-w-2xl uppercase tracking-tight opacity-80 leading-relaxed italic">
             {isIndia ? 'Maximize local dividends via Academic and Universal nodes.' : 'Access global high-pay CPA and micro-task signals (USD Scale).'}
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
                    <span>Weekly Signal Progress</span>
                    <span className="text-primary">{profile?.weeklyPointsEarned || 0} / 50 🪙</span>
                 </div>
                 <Progress value={weeklyProgress} className="h-1.5 bg-white/5" />
              </div>
           </div>
        </Card>
      </header>

      {/* 10-Node Segment Navigation */}
      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-8">
        <SectorTab active={activeSector === 'academic'} label="Academic Node" icon={<Library className="h-4 w-4" />} onClick={() => setActiveSector('academic')} />
        <SectorTab active={activeSector === 'global'} label="Global Node" icon={<Globe className="h-4 w-4" />} onClick={() => setActiveSector('global')} />
        <SectorTab active={activeSector === 'universal'} label="Universal Node" icon={<Activity className="h-4 w-4" />} onClick={() => setActiveSector('universal')} />
        <SectorTab active={activeSector === 'network'} label="Network Hub" icon={<Users className="h-4 w-4" />} onClick={() => setActiveSector('network')} />
      </div>

      <main className="animate-in fade-in duration-700">
         {activeSector === 'academic' && (
           <div className="space-y-12">
              <SectorHeader title="Academic Dividends" color="text-blue-400" desc="Nodes 1-2: Education-based retention rewards." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <NodeModuleCard 
                    title="Scholar Dividend" 
                    desc="30-min reading sessions in NCERT/OSEPA Locker." 
                    reward="10 Pts" 
                    active={settings?.node_scholar_dividend} 
                    link="/campus" 
                 />
                 <NodeModuleCard 
                    title="Quiz Arena" 
                    desc="High-performance MCQs with 3-heart system." 
                    reward="15 Coins" 
                    active={settings?.node_quiz_arena} 
                    link="/campus" 
                 />
              </div>
           </div>
         )}

         {activeSector === 'global' && (
           <div className="space-y-12">
              <SectorHeader title="Global High-Pay Node" color="text-amber-500" desc="Nodes 3-5: Strategic Global traffic (USD Scale)." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <NodeModuleCard 
                    title="Global CPA Hub" 
                    desc="Highest paying app installs for US/UK/EU." 
                    reward="Max Yield" 
                    active={settings?.node_global_cpa} 
                    link="#" 
                 />
                 <NodeModuleCard 
                    title="Micro Tasks" 
                    desc="Small clicks, big results. Global signals." 
                    reward="Varied" 
                    active={settings?.node_micro_tasks} 
                    link="#" 
                 />
                 <NodeModuleCard 
                    title="Premium Surveys" 
                    desc="Strategic analytics for global brands." 
                    reward="High Pay" 
                    active={settings?.node_surveys} 
                    link="#" 
                 />
              </div>
           </div>
         )}

         {activeSector === 'universal' && (
           <div className="space-y-12">
              <SectorHeader title="Universal Yield Node" color="text-green-500" desc="Nodes 6-10: Globally open tasks with local scaling." />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <NodeModuleCard 
                    title="Ad Stream" 
                    desc="Verified Rewarded Video signals (15/Day)." 
                    reward="2 Coins" 
                    active={settings?.node_ad_stream} 
                    link="#" 
                 />
                 <NodeModuleCard 
                    title="Content Analysis" 
                    desc="10-min movie analysis yield." 
                    reward="300 Coins" 
                    active={settings?.node_content_analysis} 
                    link="/watch-earn" 
                 />
                 <NodeModuleCard 
                    title="Arcade Rewards" 
                    desc="50-level skill-based arcade boxes." 
                    reward="Loot Drop" 
                    active={settings?.node_arcade_rewards} 
                    link="/games" 
                 />
                 <NodeModuleCard 
                    title="Daily Check-in" 
                    desc="7-day flame streak logic." 
                    reward="Weekly Box" 
                    active={settings?.node_daily_checkin} 
                    link="/dashboard" 
                 />
                 <NodeModuleCard 
                    title="Referral Engine" 
                    desc="L1/L2 commission pulse." 
                    reward="Lifetime" 
                    active={settings?.node_referral_engine} 
                    link="/refer" 
                 />
              </div>
           </div>
         )}

         {activeSector === 'network' && (
           <div className="space-y-12">
              <SectorHeader title="Network Architecture" color="text-purple-500" desc="Elite 35% revenue share upgrade logic." />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <NodeModuleCard 
                   title="MLM Network" 
                   desc="Earn 5% (L1) & 2% (L2) from downline activity." 
                   reward="Recur Profit" 
                   active={true} 
                   link="/refer" 
                 />
                 <NodeModuleCard 
                   title="Elite Affiliate" 
                   desc="1,000 members = ₹1,000 extra + 35% share." 
                   reward="Master Node" 
                   active={true} 
                   link="/refer" 
                 />
              </div>
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

function SectorHeader({ title, color, desc }: any) {
   return (
      <div className="p-10 bg-white/5 border border-white/10 rounded-[3rem] space-y-2">
         <h3 className={cn("text-3xl font-black uppercase italic leading-none", color)}>{title}</h3>
         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic opacity-80">{desc}</p>
      </div>
   );
}

function NodeModuleCard({ title, desc, reward, active, link }: any) {
  return (
    <Card className={cn(
       "bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 transition-all relative overflow-hidden group shadow-xl",
       active ? "hover:border-primary/40" : "opacity-40 grayscale pointer-events-none"
    )}>
       {!active && (
         <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Badge variant="outline" className="border-red-500/40 text-red-500 font-black uppercase text-[8px] italic">NODE OFFLINE</Badge>
         </div>
       )}
       <div className="flex items-start justify-between">
          <div className="h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
             <Zap className="h-6 w-6" />
          </div>
          <Badge className="bg-primary/20 text-primary border-none font-black text-[8px] px-3 uppercase italic">{reward}</Badge>
       </div>
       <div className="space-y-1">
          <h4 className="text-xl font-black uppercase italic text-white tracking-tight">{title}</h4>
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight leading-relaxed">{desc}</p>
       </div>
       <Button asChild className="w-full h-12 bg-white/5 hover:bg-primary text-white font-black uppercase italic rounded-xl border border-white/10 transition-all text-[10px]">
          <Link href={link}>DEPLOY SIGNAL <ArrowRight className="ml-2 h-3 w-3" /></Link>
       </Button>
    </Card>
  );
}

function Library(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/><path d="M4 20h16"/>
    </svg>
  );
}
