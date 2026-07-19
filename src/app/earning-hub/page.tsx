
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
  ArrowRight,
  Video,
  PlayCircle,
  Share2,
  Gift,
  Search
} from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import OfferWall from '@/components/OfferWall';
import Link from 'next/link';

type IncomeSector = 'tasks' | 'education' | 'arcade' | 'network';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [activeSector, setActiveSector] = useState<IncomeSector>('tasks');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-[#050508]"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>;

  const isIndia = profile?.country === 'India';
  const weeklyTarget = 50;
  const weeklyProgress = Math.min(((profile?.weeklyPointsEarned || 0) / weeklyTarget) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 pb-32">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-12 pt-8">
        <div className="space-y-6 flex-1">
           <div className="flex flex-wrap gap-4">
              <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-5 py-1.5 text-[10px]">Industrial Revenue Hub v5.0</Badge>
              <Badge className="bg-green-500/10 text-green-500 border-none uppercase font-black text-[10px] px-5 py-1.5 flex items-center gap-1.5">
                 <CircleDollarSign className="h-3.5 w-3.5" /> 100% Free Share Node
              </Badge>
           </div>
           <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85] text-white">
             Yield <br /> <span className="text-primary italic">Terminal</span>
           </h1>
           <p className="text-muted-foreground font-medium text-lg max-w-2xl uppercase tracking-tight opacity-80 leading-relaxed italic">
             Participate in sponsored missions across 4 industrial sectors to generate local currency yield.
           </p>
        </div>

        <Card className="w-full xl:w-96 bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Trophy className="h-32 w-32 text-primary" />
           </div>
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <Flame className="h-5 w-5 text-orange-500 fill-orange-500 animate-pulse" />
                 <span className="text-[11px] font-black uppercase text-white tracking-widest italic">Daily Streak: {profile?.dailyStreak || 0} Days</span>
              </div>
              <h4 className="text-2xl font-black italic text-white uppercase">Bonus Pulse: {isIndia ? '₹10.00' : '$0.10'}</h4>
              <div className="space-y-2 pt-2">
                 <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                    <span>Weekly Dividend Progress</span>
                    <span className="text-primary">{profile?.weeklyPointsEarned || 0} / 50 🪙</span>
                 </div>
                 <Progress value={weeklyProgress} className="h-1.5 bg-white/5" />
              </div>
           </div>
        </Card>
      </header>

      {/* Primary Sector Navigation */}
      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-8">
        <SectorTab active={activeSector === 'tasks'} label="Global Task Node" icon={<Smartphone />} onClick={() => setActiveSector('tasks')} />
        <SectorTab active={activeSector === 'education'} label="Academic Rewards" icon={<GraduationCap />} onClick={() => setActiveSector('education')} />
        <SectorTab active={activeSector === 'arcade'} label="Entertainment Zone" icon={<Gamepad2 />} onClick={() => setActiveSector('arcade')} />
        <SectorTab active={activeSector === 'network'} label="Network Hub" icon={<Users />} onClick={() => setActiveSector('network')} />
      </div>

      <main className="animate-in fade-in duration-700">
         {activeSector === 'tasks' && (
           <div className="space-y-12">
              <div className="p-12 bg-primary/5 border border-primary/20 rounded-[3rem] space-y-4">
                 <h3 className="text-4xl font-black uppercase italic text-white leading-none">CPA Mediation <span className="text-primary">Waterfall</span></h3>
                 <p className="text-sm text-muted-foreground font-black uppercase tracking-widest opacity-80 italic">High-yield app installs and lead generation. Optimized for {profile?.country || 'Global Node'}.</p>
              </div>
              <OfferWall />
           </div>
         )}

         {activeSector === 'education' && (
           <div className="space-y-12">
              <div className="p-12 bg-green-500/5 border border-green-500/20 rounded-[3rem] space-y-4">
                 <h3 className="text-4xl font-black uppercase italic text-white leading-none">Academic <span className="text-green-500">Dividends</span></h3>
                 <p className="text-sm text-muted-foreground font-black uppercase tracking-widest opacity-80 italic">Earn by mastering industrial knowledge and verified reading sessions.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <ModuleCard 
                   icon={<GraduationCap className="text-green-500" />}
                   title="NCERT/Global Library"
                   desc="Complete 30 min reading sessions to trigger the Scholar Dividend signal."
                   reward="10 Pts / Session"
                   link="/campus"
                 />
                 <ModuleCard 
                   icon={<Zap className="text-amber-500" />}
                   title="AI Quiz Mastery"
                   desc="Solve book-based MCQs. Use Rewarded Ads to unlock difficult answer keys."
                   reward="Up to 15 Coins"
                   link="/campus"
                 />
                 <ModuleCard 
                   icon={<Share2 className="text-primary" />}
                   title="Material Sharing"
                   desc="Broadcast book sessions to your network to earn viral dividends."
                   reward="2-5 Coins / Share"
                   link="/campus"
                 />
              </div>
           </div>
         )}

         {activeSector === 'arcade' && (
           <div className="space-y-12">
              <div className="p-12 bg-amber-500/5 border border-amber-500/20 rounded-[3rem] space-y-4">
                 <h3 className="text-4xl font-black uppercase italic text-white leading-none">Yield <span className="text-amber-500">Cinema & Arcade</span></h3>
                 <p className="text-sm text-muted-foreground font-black uppercase tracking-widest opacity-80 italic">Convert entertainment time into supplemental wallet assets.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <ModuleCard 
                   icon={<Video className="text-red-500" />}
                   title="Movie Analysis Yield"
                   desc="Watch 10-minute cinematic sessions verified by S2S signals for high-yield credit."
                   reward="300 Coins (₹3.00)"
                   link="/watch-earn"
                 />
                 <ModuleCard 
                   icon={<Gamepad2 className="text-primary" />}
                   title="50-Level Arcade"
                   desc="Progress through puzzle, physics, and runner stages for level-up loot boxes."
                   reward="Varies by Level"
                   link="/games"
                 />
                 <ModuleCard 
                   icon={<Gift className="text-amber-500" />}
                   title="7-Day Flame Streak"
                   desc="Maintain consistent daily login signals to unlock the Weekly Mega Box."
                   reward="50-100 Coins Bonus"
                   link="/rewards"
                 />
              </div>
           </div>
         )}

         {activeSector === 'network' && (
           <div className="space-y-12">
              <div className="p-12 bg-purple-500/5 border border-purple-500/20 rounded-[3rem] space-y-4">
                 <h3 className="text-4xl font-black uppercase italic text-white leading-none">Network <span className="text-purple-500">Architecture</span></h3>
                 <p className="text-sm text-muted-foreground font-black uppercase tracking-widest opacity-80 italic">Build an industrial-scale student network for lifetime dividends.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <ModuleCard 
                   icon={<Users className="text-purple-500" />}
                   title="Dual-Level MLM"
                   desc="Earn 5% from L1 and 2% from L2 student activity lifetime."
                   reward="Lifetime %"
                   link="/refer"
                 />
                 <ModuleCard 
                   icon={<Trophy className="text-amber-500" />}
                   title="Elite 35% Upgrade"
                   desc="Reach 1,000 network members to unlock 35% revenue share and cash prizes."
                   reward="₹1,000 + 35% Share"
                   link="/refer"
                 />
              </div>
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
          "px-8 py-5 rounded-2xl flex items-center gap-4 transition-all duration-500 font-black uppercase text-[11px] tracking-widest shadow-xl border-2",
          active ? "bg-primary text-white border-primary shadow-primary/20 scale-105 italic" : "bg-[#0a0a0f] text-muted-foreground border-white/5 hover:border-primary/40 hover:text-white"
        )}
      >
         <span className={cn("transition-transform duration-500", active ? "scale-110" : "")}>{icon}</span>
         <span>{label}</span>
      </button>
   );
}

function ModuleCard({ icon, title, desc, reward, link }: any) {
  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-6 hover:border-primary/40 transition-all group shadow-2xl relative overflow-hidden">
       <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-700">
          {icon}
       </div>
       <div className="flex items-start justify-between relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-xl group-hover:bg-white/10 transition-colors">
             {icon}
          </div>
          <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] px-3 uppercase italic">{reward}</Badge>
       </div>
       <div className="space-y-2 relative z-10">
          <h4 className="text-2xl font-black uppercase italic text-white tracking-tight">{title}</h4>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-tight opacity-60">{desc}</p>
       </div>
       <Button asChild className="w-full h-14 bg-white/5 hover:bg-primary text-white font-black uppercase italic rounded-xl border border-white/10 transition-all relative z-10 group-hover:shadow-xl group-hover:shadow-primary/10">
          <Link href={link}>DEPLOY SIGNAL <ArrowRight className="ml-2 h-4 w-4" /></Link>
       </Button>
    </Card>
  );
}
