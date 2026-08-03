'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Gamepad2, 
  Zap, 
  Loader2, 
  Activity,
  Flame,
  TrendingUp
} from 'lucide-react';
import { PlatformRevenue, AppSettings } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function ArcadeTournamentHub() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const platformRevenueUSD = stats?.totalDailyRevenueUSD || 0;
  // Prize Pool Calculation: (Daily Revenue * 0.30) logic
  const dailyPrizePoolUSD = platformRevenueUSD * 0.30;
  const dailyPrizePoolCoins = Math.floor(dailyPrizePoolUSD * 1000);

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
         <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Trophy className="h-4 w-4 text-amber-500 animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 italic">Skill-Based Prize Arena</span>
         </div>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">
            Arcade <br /> <span className="text-primary">Tournaments</span>
         </h1>
         <p className="text-muted-foreground font-medium text-lg max-w-2xl italic">
            Participate in skill-based tournaments funded by 30% of platform ad revenue. High performance leads to elite dividends.
         </p>
      </header>

      <section className="grid lg:grid-cols-3 gap-10">
         <Card className="lg:col-span-2 bg-gradient-to-br from-[#1a1a24] to-black border-amber-500/30 border-2 rounded-[3.5rem] p-10 md:p-16 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
               <Flame className="h-64 w-64 text-amber-500" />
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
               <div className="space-y-6 text-center md:text-left">
                  <div>
                     <p className="text-[10px] font-black uppercase text-amber-500 tracking-[0.4em] mb-2">Current Active Prize Pool</p>
                     <h2 className="text-7xl md:text-9xl font-black italic text-white tracking-tighter tabular-nums drop-shadow-[0_0_50px_rgba(245,158,11,0.4)]">
                        {dailyPrizePoolCoins.toLocaleString()} <span className="text-3xl opacity-40">🪙</span>
                     </h2>
                  </div>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                     <Badge className="bg-white/10 text-white border-none font-black text-[9px] px-4 py-2 uppercase italic tracking-widest flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-green-500" /> Powered by 30% Ad Share
                     </Badge>
                     <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase italic">
                        <Activity className="h-3 w-3 text-amber-500 animate-pulse" /> Settle In: Midnight
                     </div>
                  </div>
               </div>
               
               <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] text-center shadow-inner min-w-[240px]">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Live Tournament</p>
                  <h3 className="text-3xl font-black uppercase italic text-white">Logic Blitz</h3>
                  <div className="h-px bg-white/5 my-6" />
                  <div className="space-y-1">
                     <p className="text-[8px] font-black text-primary uppercase italic">Target Score</p>
                     <p className="text-2xl font-black text-white italic">2,500 PTS</p>
                  </div>
                  <Button asChild className="w-full h-14 bg-primary hover:bg-primary/90 mt-8 rounded-xl font-black uppercase italic text-xs shadow-xl">
                     <Link href="/games">ENTER ARENA</Link>
                  </Button>
               </div>
            </div>
         </Card>

         <div className="space-y-8">
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5"><Zap className="h-32 w-32 text-primary" /></div>
               <h3 className="text-xl font-black uppercase italic relative z-10 flex items-center gap-3">
                  <Gamepad2 className="text-primary" /> Skill Tiers
               </h3>
               <div className="space-y-5 relative z-10">
                  <TournamentTier label="Elite" prize="50% Pool" req="Top 1%" color="text-amber-500" />
                  <TournamentTier label="Pro" prize="30% Pool" req="Top 5%" color="text-primary" />
                  <TournamentTier label="Novice" prize="20% Pool" req="Top 20%" color="text-white" />
               </div>
               <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic border-t border-white/5 pt-6">
                  *All tournament funding is derived strictly from real sponsor activity (Ads & CPA). Zero gambling logic applies.
               </p>
            </Card>

            <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 flex items-center justify-between shadow-2xl">
               <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">My High Score</p>
                  <h4 className="text-2xl font-black italic text-white tabular-nums">0 <span className="text-xs opacity-40">PTS</span></h4>
               </div>
               <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Activity />
               </div>
            </Card>
         </div>
      </section>

      <section className="pt-10">
         <div className="flex items-center justify-between mb-8 px-4">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Hall of <span className="text-primary">Fame</span></h3>
            <Link href="/leaderboard" className="text-[10px] font-black text-primary uppercase hover:underline">View Full Archives</Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="bg-[#0a0a0f] border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all">
                 <div className="flex items-center gap-4">
                    <span className="text-xs font-black text-muted-foreground w-4 italic">#{i}</span>
                    <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-primary">U</div>
                    <p className="text-[10px] font-black uppercase text-white truncate max-w-[80px]">User_{i}x</p>
                 </div>
                 <p className="text-xs font-black text-amber-500 italic tabular-nums">1.2K 🪙</p>
              </Card>
            ))}
         </div>
      </section>
    </div>
  );
}

function TournamentTier({ label, prize, req, color }: any) {
   return (
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
         <div>
            <p className={cn("text-sm font-black uppercase italic", color)}>{label}</p>
            <p className="text-[8px] font-bold text-muted-foreground uppercase">{req}</p>
         </div>
         <span className="text-xs font-black text-white italic">{prize}</span>
      </div>
   );
}
