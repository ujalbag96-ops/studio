'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import TournamentCard from '@/components/TournamentCard';
import MatchCard from '@/components/MatchCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Trophy, TrendingUp, Sparkles, Loader2, Globe, Gamepad2, Gift, Crown } from 'lucide-react';
import Link from 'next/link';
import { Match, Tournament } from './lib/types';
import Image from 'next/image';

export default function Home() {
  const firestore = useFirestore();

  const tournamentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'tournaments') : null, [firestore]);
  const matchesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'matches') : null, [firestore]);

  const { data: tournaments, isLoading: tourisLoading } = useCollection<Tournament>(tournamentsQuery);
  const { data: matches, isLoading: matchisLoading } = useCollection<Match>(matchesQuery);

  const activeTournaments = tournaments?.filter(t => t.status === 'active') || [];
  
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-24 md:pb-12 bg-background">
      {/* Tactical Arena Hero */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-[#121216] to-[#0a0a0f] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-40 -mt-40 animate-pulse" />
        
        <div className="relative z-10 grid lg:grid-cols-2 items-center gap-12 p-8 md:p-20">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
              <Zap className="h-4 w-4 text-primary animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Elite Competitive Arena</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-white uppercase italic">
              CONQUER <br />
              <span className="text-primary">THE ARENA</span>
            </h1>
            
            <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto lg:mx-0 leading-relaxed">
              Join thousands of warriors in high-stakes tournaments. Dominate BGMI, Free Fire & Ludo to claim your rewards.
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-6">
              <Button asChild size="lg" className="h-16 bg-primary hover:bg-primary/90 text-white font-black px-12 rounded-2xl shadow-2xl shadow-primary/20 text-xl tracking-widest uppercase italic transition-all hover:scale-105">
                <Link href="/login">DEPLOY NOW</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-16 border-white/10 hover:bg-white/5 text-white font-black px-10 rounded-2xl text-lg uppercase tracking-widest transition-all hover:border-primary/40">
                <Link href="/earning-hub">EARN COINS</Link>
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

      {/* Game Sectors Selector */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <CategoryCard icon={<Gamepad2 />} label="BGMI" color="from-[#FF7B00]/20 to-transparent border-[#FF7B00]/30" />
         <CategoryCard icon={<Zap />} label="FREE FIRE" color="from-blue-500/20 to-transparent border-blue-500/30" />
         <CategoryCard icon={<Trophy />} label="LUDO KING" color="from-green-500/20 to-transparent border-green-500/30" />
         <CategoryCard icon={<Gift />} label="BONUS" color="from-purple-500/20 to-transparent border-purple-500/30" />
      </section>

      {/* Live Battles - Tactical View */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-xl">
                <div className="h-4 w-4 rounded-full bg-destructive animate-ping" />
             </div>
             <h2 className="text-3xl font-black uppercase tracking-tighter italic">Live <span className="text-destructive">Operations</span></h2>
          </div>
          <Link href="/dashboard" className="text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-[0.2em] flex items-center gap-2 italic">
            All Intel <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        
        {matchisLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {matches?.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* High-Stakes Campaigns */}
      <section className="space-y-10">
        <div className="flex items-center gap-6 px-2">
          <Crown className="h-10 w-10 text-primary drop-shadow-[0_0_15px_rgba(255,123,0,0.5)]" />
          <h2 className="text-4xl font-black uppercase italic tracking-tighter">Elite Campaigns</h2>
        </div>
        
        {tourisLoading ? (
          <div className="flex justify-center py-24"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {activeTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </section>

      {/* Referral Protocol Banner */}
      <section className="relative overflow-hidden rounded-[3rem] bg-gradient-to-r from-primary/90 to-orange-600 p-12 flex flex-col md:flex-row items-center justify-between gap-10 group cursor-pointer shadow-2xl transition-all hover:scale-[1.01]">
         <div className="space-y-6 text-center md:text-left max-w-lg">
            <h2 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">Referral Protocol <br /> <span className="text-white/80">Earn ₹100</span></h2>
            <p className="text-white/90 font-bold text-lg leading-relaxed">Invite your tactical squad to the arena. Get instant withdrawable credit for every successful enlistment.</p>
            <Button className="bg-white text-primary hover:bg-white/95 font-black rounded-2xl px-12 h-16 text-lg uppercase tracking-widest shadow-2xl">INITIATE INVITE</Button>
         </div>
         <div className="h-40 w-40 md:h-56 md:w-56 bg-white/10 rounded-full flex items-center justify-center transition-all group-hover:rotate-12 group-hover:scale-110">
            <TrendingUp className="h-24 w-24 md:h-32 md:w-32 text-white opacity-30" />
         </div>
      </section>
    </div>
  );
}

function CategoryCard({ icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <div className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${color} flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl border backdrop-blur-3xl group`}>
       <div className="h-14 w-14 bg-white/5 rounded-2xl flex items-center justify-center text-white border border-white/10 shadow-xl transition-transform group-hover:rotate-6">
          {icon}
       </div>
       <span className="font-black text-white uppercase text-[10px] tracking-[0.3em] italic">{label}</span>
    </div>
  );
}
