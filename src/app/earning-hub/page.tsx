
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Zap, 
  PlayCircle, 
  ShieldCheck, 
  Video, 
  TrendingUp, 
  Coins, 
  Tv, 
  MonitorPlay, 
  X,
  Target,
  Trophy,
  ArrowRight,
  Gift,
  CheckCircle2,
  Smartphone,
  ShieldAlert,
  EyeOff,
  ShieldCheckIcon,
  CircleDollarSign,
  GraduationCap,
  Gamepad2,
  Users,
  LayoutDashboard,
  BrainCircuit,
  Flame,
  Globe
} from 'lucide-react';
import { UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import OfferWall from '@/components/OfferWall';
import { formatCurrency } from '@/lib/currency';

type IncomeSector = 'tasks' | 'education' | 'arcade' | 'network';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeSector, setActiveSector] = useState<IncomeSector>('tasks');
  const [isProcessing, setIsProcessing] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  const isIndia = profile?.country === 'India';
  const weeklyTarget = 50;
  const weeklyProgress = Math.min(((profile?.weeklyPointsEarned || 0) / weeklyTarget) * 100, 100);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <div className="flex items-center justify-center md:justify-start gap-3">
                 <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Multi-Node Income Hub</Badge>
                 <Badge className="bg-green-500/10 text-green-500 border-none uppercase font-black text-[9px] px-3 py-1 flex items-center gap-1.5 shadow-lg">
                    <CircleDollarSign className="h-3 w-3" /> ZERO INVESTMENT PROTOCOL
                 </Badge>
              </div>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.8] italic text-white">
                Revenue <br /> <span className="text-primary">Terminal</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-2xl leading-relaxed uppercase tracking-tight opacity-60">
                Four industrial nodes designed to maximize your local currency yield through skill and engagement.
              </p>
           </div>

           <Card className="w-full md:w-80 bg-gradient-to-br from-[#1a1a24] to-black border-primary/20 border-2 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                 <Trophy className="h-20 w-20 text-primary" />
              </div>
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-white italic">Current Streak: {profile?.dailyStreak || 0} Days</span>
                 </div>
                 <h4 className="text-xl font-black italic text-white">Weekly Bonus: {isIndia ? '₹50' : '$0.50'}</h4>
                 <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground tracking-widest">
                       <span>Yield Progress</span>
                       <span className="text-primary">{profile?.weeklyPointsEarned || 0} / 50 🪙</span>
                    </div>
                    <Progress value={weeklyProgress} className="h-1.5 bg-white/5" />
                 </div>
              </div>
           </Card>
        </div>
      </header>

      {/* Industrial Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-6">
        <SectorTab active={activeSector === 'tasks'} label="Global Tasks" icon={<Smartphone />} onClick={() => setActiveSector('tasks')} />
        <SectorTab active={activeSector === 'education'} label="Education" icon={<GraduationCap />} onClick={() => setActiveSector('education')} />
        <SectorTab active={activeSector === 'arcade'} label="Arcade" icon={<Gamepad2 />} onClick={() => setActiveSector('arcade')} />
        <SectorTab active={activeSector === 'network'} label="Network" icon={<Users />} onClick={() => setActiveSector('network')} />
      </div>

      <main className="animate-in fade-in slide-in-from-bottom-4 duration-500">
         {activeSector === 'tasks' && (
           <div className="space-y-10">
              <div className="p-10 bg-primary/5 border border-primary/20 rounded-[3rem] space-y-4">
                 <h3 className="text-3xl font-black uppercase italic text-white">CPA Task <span className="text-primary">Node</span></h3>
                 <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">High-value app installs, surveys, and sign-ups. Rewards are geo-calibrated to {profile?.country}.</p>
              </div>
              <OfferWall />
           </div>
         )}

         {activeSector === 'education' && (
           <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                 <EarningModuleCard 
                    title="AI Knowledge Quizzes" 
                    desc="Solve book-based MCQs using the 3-Heart Life System. Master difficult levels to earn 5-10 Coins per session." 
                    icon={<BrainCircuit className="text-primary" />}
                    reward="5-10 🪙"
                    link={isIndia ? "/campus" : "/about"}
                    btnText={isIndia ? "ENTER LOCKER" : "INDIA ONLY"}
                    disabled={!isIndia}
                 />
                 <EarningModuleCard 
                    title="Content Sharing" 
                    desc="Earn 2 Coins for every unique material session you share on social media. Limit: 5 rewards per day." 
                    icon={<Globe className="text-green-500" />}
                    reward="2 🪙"
                    link={isIndia ? "/campus" : "/refer"}
                    btnText="START SHARING"
                 />
              </div>
              <Card className="bg-[#0a0a0f] border-dashed border-2 border-white/5 p-10 rounded-[3rem] text-center space-y-6">
                 <ShieldCheck className="h-12 w-12 text-primary mx-auto opacity-40" />
                 <h4 className="text-xl font-black uppercase italic">Ad-Gated Answer Protocol</h4>
                 <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed max-w-xl mx-auto">
                    Unlock difficult quiz answers and premium hints by watching 1 rewarded sponsor signal. This supports our free educational mission.
                 </p>
              </Card>
           </div>
         )}

         {activeSector === 'arcade' && (
           <div className="space-y-10">
              <div className="grid md:grid-cols-3 gap-8">
                 <EarningModuleCard 
                    title="50-Level Arcade" 
                    desc="Progress through Puzzle, Physics, and Runner stages. Mystery boxes at level 5, 10, 15..." 
                    icon={<Gamepad2 className="text-orange-500" />}
                    reward="UP TO 150 🪙"
                    link="/games"
                    btnText="PLAY ARCADE"
                 />
                 <EarningModuleCard 
                    title="Movie Yield" 
                    desc="Watch 10 minutes of cinematic content for a guaranteed 300 coin payout. Verified by S2S signal." 
                    icon={<Video className="text-primary" />}
                    reward="300 🪙"
                    link="/watch-earn"
                    btnText="START WATCHING"
                 />
                 <EarningModuleCard 
                    title="7-Day Streak" 
                    desc="Login continuously for 7 days to claim the 'Mega Box' containing up to 50 Coins and status badges." 
                    icon={<Flame className="text-amber-500" />}
                    reward="VARIES"
                    link="/dashboard"
                    btnText="SYNC SIGNAL"
                 />
              </div>
           </div>
         )}

         {activeSector === 'network' && (
           <div className="space-y-10">
              <div className="grid md:grid-cols-2 gap-8">
                 <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Users className="h-40 w-40" /></div>
                    <div className="space-y-4 relative z-10">
                       <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase">DUAL-LEVEL MLM</Badge>
                       <h3 className="text-4xl font-black uppercase italic text-white leading-tight">Lifetime <br /> <span className="text-primary">Commission</span></h3>
                       <div className="grid grid-cols-2 gap-6 pt-4">
                          <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-center">
                             <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Direct (L1)</p>
                             <p className="text-3xl font-black text-white italic">5%</p>
                          </div>
                          <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-center">
                             <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Indirect (L2)</p>
                             <p className="text-3xl font-black text-white italic">2%</p>
                          </div>
                       </div>
                    </div>
                    <Button asChild className="w-full h-16 bg-primary font-black uppercase italic rounded-2xl shadow-xl relative z-10">
                       <Link href="/refer">ENTER NETWORK HUB</Link>
                    </Button>
                 </Card>

                 <Card className="bg-gradient-to-br from-[#1a1a24] to-black border-amber-500/30 border-2 rounded-[3rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-1000"><Trophy className="h-64 w-64 text-amber-500" /></div>
                    <div className="space-y-4 relative z-10">
                       <Badge className="bg-amber-500/20 text-amber-500 border-none text-[8px] font-black uppercase">ELITE UPGRADE</Badge>
                       <h3 className="text-4xl font-black uppercase italic text-white leading-tight">Elite 35% <br /> <span className="text-amber-500">Pipeline</span></h3>
                       <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                          Reach 1,000 active referrals to instantly unlock ₹1,000 Cash and a permanent 35% revenue share.
                       </p>
                       <div className="pt-4">
                          <div className="flex justify-between text-[8px] font-black uppercase text-amber-500 tracking-widest mb-1.5">
                             <span>Road to Elite</span>
                             <span>{profile?.totalNetworkReferrals || 0} / 1000</span>
                          </div>
                          <Progress value={Math.min(((profile?.totalNetworkReferrals || 0) / 1000) * 100, 100)} className="h-1.5 bg-white/5" />
                       </div>
                    </div>
                    <Button asChild className="w-full h-16 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic rounded-2xl shadow-xl relative z-10">
                       <Link href="/refer">CLAIM MILESTONE</Link>
                    </Button>
                 </Card>
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
          "px-8 py-4 rounded-2xl flex items-center gap-3 transition-all duration-300",
          active ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105" : "text-muted-foreground hover:bg-white/5 hover:text-white"
        )}
      >
         <span className={cn("h-4 w-4", active ? "text-white" : "text-muted-foreground")}>{icon}</span>
         <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </button>
   );
}

function EarningModuleCard({ title, desc, icon, reward, link, btnText, disabled }: any) {
   return (
      <Card className={cn(
        "bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:border-primary/20 transition-all shadow-2xl relative overflow-hidden",
        disabled && "opacity-40 grayscale pointer-events-none"
      )}>
         <div className="space-y-6">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
               {icon}
            </div>
            <div>
               <h4 className="text-xl font-black uppercase italic text-white">{title}</h4>
               <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight leading-relaxed mt-2">{desc}</p>
            </div>
         </div>

         <div className="pt-10 space-y-6">
            <div className="flex justify-between items-end border-t border-white/5 pt-4">
               <div>
                  <p className="text-[8px] font-black uppercase text-muted-foreground italic mb-1">Potential Yield</p>
                  <p className="text-2xl font-black text-primary italic tracking-tighter">{reward}</p>
               </div>
               <Button asChild className="h-12 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-primary text-white font-black text-[9px] uppercase tracking-widest transition-all">
                  <Link href={link}>{btnText} <ArrowRight className="ml-2 h-3 w-3" /></Link>
               </Button>
            </div>
         </div>
      </Card>
   );
}
