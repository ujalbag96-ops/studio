
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import TournamentCard from '@/components/TournamentCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Trophy, TrendingUp, Sparkles, Loader2, Globe, Gamepad2, Gift, Crown, Target, ShieldCheck, Banknote } from 'lucide-react';
import Link from 'next/link';
import { Tournament, GameType } from './lib/types';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import LivePrizePool from '@/components/LivePrizePool';

export default function Home() {
  const firestore = useFirestore();
  const [selectedGame, setSelectedGame] = useState<GameType | 'All'>('All');

  const tournamentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'tournaments') : null, [firestore]);
  const { data: tournaments, isLoading: tourisLoading } = useCollection<Tournament>(tournamentsQuery);

  const filteredTournaments = tournaments?.filter(t => {
    if (selectedGame === 'All') return t.status === 'active';
    return t.status === 'active' && t.gameType === selectedGame;
  }) || [];
  
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-24 md:pb-12 bg-background">
      {/* Bounty Widget Hook */}
      <section className="animate-in slide-in-from-top-10 duration-700">
         <LivePrizePool />
         <div className="flex justify-center -mt-6 relative z-10">
            <Button asChild className="h-14 px-10 bg-primary hover:bg-primary/90 font-black uppercase italic rounded-2xl shadow-2xl">
               <Link href="/lottery">ENTER FREE DRAW <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
         </div>
      </section>

      {/* High-Octane Free Earning Arena */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#121216] to-[#0a0a0f] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse" />
        
        <div className="relative z-10 grid lg:grid-cols-2 items-center gap-12 p-8 md:p-20">
          <div className="space-y-8 text-center lg:text-left">
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
               <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-green-500/10 border border-green-500/20 shadow-xl">
                 <ShieldCheck className="h-4 w-4 text-green-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500">100% Zero Investment</span>
               </div>
               <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
                 <Banknote className="h-4 w-4 text-primary" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Earn Free Rewards</span>
               </div>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white uppercase italic">
              FREE <br />
              <span className="text-primary">INCOME HUB</span>
            </h1>
            
            <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto lg:mx-0 leading-relaxed">
              Complete elite skill challenges and academic quests without spending a single paisa. Earn <span className="text-white font-bold">Real Credits</span> subsidized by global sponsors.
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-6">
              <Button asChild size="lg" className="h-16 bg-primary hover:bg-primary/90 text-white font-black px-12 rounded-2xl shadow-2xl shadow-primary/20 text-xl tracking-widest uppercase italic transition-all hover:scale-105">
                <Link href="/login">START FREE JOURNEY</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-16 border-white/10 hover:bg-white/5 text-white font-black px-10 rounded-2xl text-lg uppercase tracking-widest transition-all hover:border-primary/40">
                <Link href="/earning-hub">VIEW MISSIONS</Link>
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:flex justify-center relative">
             <div className="relative w-96 h-96 animate-float">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-[100px]" />
                <Trophy className="w-full h-full text-primary drop-shadow-[0_0_50px_rgba(255,123,0,0.3)]" />
             </div>
          </div>
        </div>
      </section>

      {/* Sector Selection */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <CategoryCard icon={<Gamepad2 />} label="FREE ARCADE" color="from-orange-500/20 to-transparent border-orange-500/30" active={selectedGame === 'BGMI'} onClick={() => setSelectedGame(selectedGame === 'BGMI' ? 'All' : 'BGMI')} />
         <CategoryCard icon={<Zap />} label="NO-COST MISSIONS" color="from-blue-500/20 to-transparent border-blue-500/30" active={selectedGame === 'Free Fire'} onClick={() => setSelectedGame(selectedGame === 'Free Fire' ? 'All' : 'Free Fire')} />
         <CategoryCard icon={<Trophy />} label="SPONSORED BOUNTY" color="from-green-500/20 to-transparent border-green-500/30" active={selectedGame === 'Ludo King'} onClick={() => setSelectedGame(selectedGame === 'Ludo King' ? 'All' : 'Ludo King')} />
         <CategoryCard icon={<Globe />} label="GLOBAL FREE NODE" color="from-purple-500/20 to-transparent border-purple-500/30" active={selectedGame === 'All'} onClick={() => setSelectedGame('All')} />
      </section>

      {/* Active High-Performance Campaigns */}
      <section className="space-y-10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-6">
            <Crown className="h-10 w-10 text-primary drop-shadow-[0_0_15px_rgba(255,123,0,0.5)]" />
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">
              {selectedGame === 'All' ? 'Sponsored Challenges' : `${selectedGame} Free Sector`}
            </h2>
          </div>
        </div>
        
        {tourisLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : filteredTournaments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {filteredTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
            <Gamepad2 className="h-12 w-12 text-muted-foreground opacity-10 mx-auto mb-4" />
            <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">Zero cost deployments active soon</p>
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryCard({ icon, label, color, active, onClick }: { icon: any, label: string, color: string, active: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-8 rounded-[2.5rem] bg-gradient-to-br flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl border backdrop-blur-3xl group",
        color,
        active ? "ring-4 ring-primary border-primary ring-offset-4 ring-offset-background scale-105" : "opacity-80 grayscale-[50%] hover:grayscale-0"
      )}
    >
       <div className={cn(
         "h-14 w-14 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl transition-transform group-hover:rotate-6",
         active ? "bg-primary text-white" : "bg-white/5 text-white/60"
       )}>
          {icon}
       </div>
       <span className={cn(
         "font-black uppercase text-[10px] tracking-[0.3em] italic transition-colors",
         active ? "text-primary" : "text-white/60"
       )}>{label}</span>
    </div>
  );
}
