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
      {/* Dynamic WinZO Style Hero */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1E1B4B] to-[#0F172A] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] -mr-40 -mt-40 animate-pulse" />
        
        <div className="relative z-10 grid lg:grid-cols-2 items-center gap-8 p-8 md:p-16">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">India's #1 Gaming Arena</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-white">
              PLAY GAMES <br />
              <span className="text-primary">WIN CASH</span>
            </h1>
            
            <p className="text-lg text-muted-foreground font-medium max-w-md mx-auto lg:mx-0">
              Join 10Cr+ players. Play BGMI, Free Fire & Ludo King to win withdrawable rewards.
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4">
              <Button asChild size="lg" className="h-14 bg-primary hover:bg-primary/90 text-white font-black px-10 rounded-2xl winzo-button-glow text-lg">
                <Link href="/login">GET ₹500 BONUS</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 border-white/10 hover:bg-white/5 text-white font-black px-8 rounded-2xl text-base">
                <Link href="/earning-hub">EARN FREE COINS</Link>
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:flex justify-center relative">
             <div className="relative w-80 h-80 animate-float">
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-3xl" />
                <Trophy className="w-full h-full text-accent drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
             </div>
          </div>
        </div>
      </section>

      {/* Game Categories Selector */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <CategoryCard icon={<Gamepad2 />} label="BGMI" color="from-orange-500 to-red-600" />
         <CategoryCard icon={<Zap />} label="FREE FIRE" color="from-blue-500 to-indigo-600" />
         <CategoryCard icon={<Trophy />} label="LUDO KING" color="from-green-500 to-teal-600" />
         <CategoryCard icon={<Gift />} label="CASINO" color="from-purple-500 to-pink-600" />
      </section>

      {/* Live Battles - High Urgency */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center border border-destructive/20">
                <div className="h-3 w-3 rounded-full bg-destructive animate-ping" />
             </div>
             <h2 className="text-2xl font-black uppercase tracking-tight italic">Live <span className="text-destructive">Arena</span></h2>
          </div>
          <Link href="/dashboard" className="text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-2">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        
        {matchisLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches?.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </section>

      {/* Major Tournaments - WinZO Card Style */}
      <section className="space-y-8">
        <div className="flex items-center gap-4 px-2">
          <Crown className="h-8 w-8 text-accent" />
          <h2 className="text-3xl font-black uppercase italic tracking-tight">Pro Tournaments</h2>
        </div>
        
        {tourisLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {activeTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </section>

      {/* Refer & Earn Banner */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-primary to-orange-600 p-10 flex flex-col md:flex-row items-center justify-between gap-8 group cursor-pointer shadow-xl">
         <div className="space-y-4 text-center md:text-left">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Refer & Earn ₹100</h2>
            <p className="text-white/80 font-bold">Invite your squad and get instant withdrawable cash for every joining.</p>
            <Button className="bg-white text-primary hover:bg-white/90 font-black rounded-xl px-10 h-12">INVITE NOW</Button>
         </div>
         <div className="h-32 w-32 md:h-40 md:w-40 bg-white/10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
            <TrendingUp className="h-20 w-20 text-white opacity-40" />
         </div>
      </section>
    </div>
  );
}

function CategoryCard({ icon, label, color }: { icon: any, label: string, color: string }) {
  return (
    <div className={`p-6 rounded-3xl bg-gradient-to-br ${color} flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:scale-105 hover:shadow-2xl border border-white/10`}>
       <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
          {icon}
       </div>
       <span className="font-black text-white uppercase text-xs tracking-widest">{label}</span>
    </div>
  );
}