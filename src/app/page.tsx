'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import TournamentCard from '@/components/TournamentCard';
import MatchCard from '@/components/MatchCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Trophy, TrendingUp, Sparkles, Loader2, Globe, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Match, Tournament } from './lib/types';

export default function Home() {
  const firestore = useFirestore();

  const tournamentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'tournaments') : null, [firestore]);
  const matchesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'matches') : null, [firestore]);

  const { data: tournaments, isLoading: tourisLoading } = useCollection<Tournament>(tournamentsQuery);
  const { data: matches, isLoading: matchisLoading } = useCollection<Match>(matchesQuery);

  const activeTournaments = tournaments?.filter(t => t.status === 'active') || [];
  
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-20 pb-24 md:pb-12">
      {/* Hero Section - Elite Global Design */}
      <section className="relative overflow-hidden rounded-[4rem] bg-[#0a0a0f] border border-white/5 shadow-2xl">
        <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[160px] animate-pulse delay-700" />
        
        <div className="relative z-10 grid lg:grid-cols-2 items-center gap-16 p-10 md:p-24">
          <div className="space-y-10 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full glass-morphism mx-auto lg:mx-0">
              <Globe className="h-5 w-5 text-secondary animate-spin-slow" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary">Global Pro Arena Active</span>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.8] text-gradient">
              THE <br />
              <span className="text-primary italic">ELITE</span> <br />
              LEAGUE.
            </h1>
            
            <p className="text-xl text-muted-foreground font-medium max-w-lg leading-relaxed mx-auto lg:mx-0">
              The premier destination for professional gaming in the <span className="text-white font-bold">UK, US & India</span>. Predict, Play, and Dominate.
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-6">
              <Button asChild size="lg" className="h-20 bg-primary hover:bg-primary/90 text-white font-black px-14 rounded-3xl shadow-2xl shadow-primary/40 text-xl tracking-widest transition-all hover:scale-105 active:scale-95">
                <Link href="/login">JOIN THE ARENA</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-20 glass-morphism text-white font-black px-12 rounded-3xl hover:bg-white/5 text-lg">
                <Link href="/dashboard">COMMAND HQ</Link>
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:flex relative items-center justify-center">
             <div className="absolute inset-0 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
             <Trophy className="w-[450px] h-[450px] text-primary/40 drop-shadow-[0_0_80px_rgba(147,69,255,0.4)]" />
             <div className="absolute bottom-10 right-10 glass-morphism p-8 rounded-[2.5rem] animate-bounce shadow-2xl border-white/20">
                <ShieldCheck className="h-14 w-14 text-secondary" />
                <p className="text-[9px] font-black uppercase tracking-widest mt-3 text-center text-white">Verified Sector</p>
             </div>
          </div>
        </div>
      </section>

      {/* Real-time Battle Tracker */}
      <section className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-destructive font-black uppercase tracking-[0.4em] text-[11px] animate-pulse">
              <Zap className="h-5 w-5" />
              Live Deployment
            </div>
            <h2 className="text-5xl font-black uppercase tracking-tighter italic">Tactical <span className="text-primary">Ops</span></h2>
          </div>
          <Button variant="ghost" asChild className="hover:text-primary font-black uppercase tracking-[0.2em] group text-xs glass-morphism h-12 rounded-2xl px-8">
            <Link href="/dashboard" className="flex items-center gap-3">
              Full Intel Intel <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
            </Link>
          </Button>
        </div>
        
        {matchisLoading ? (
          <div className="flex justify-center py-32"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {matches?.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
            {(!matches || matches.length === 0) && !matchisLoading && (
              <div className="md:col-span-3 py-32 glass-morphism rounded-[4rem] text-center space-y-6">
                 <Loader2 className="h-16 w-16 text-muted-foreground/10 mx-auto" />
                 <p className="text-base text-muted-foreground italic font-black uppercase tracking-[0.4em]">Battle Sector Idle.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Global Major Hubs */}
      <section className="space-y-12">
        <div className="flex items-center gap-5 px-4">
          <div className="h-16 w-16 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Trophy className="h-9 w-9 text-primary" />
          </div>
          <div>
            <h2 className="text-5xl font-black uppercase tracking-tighter italic">Major Hubs</h2>
            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.4em]">UK • US • INDIA PRIZE SECTORS</p>
          </div>
        </div>
        
        {tourisLoading ? (
          <div className="flex justify-center py-32"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {activeTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
            {activeTournaments.length === 0 && !tourisLoading && (
              <div className="md:col-span-2 py-32 glass-morphism rounded-[4rem] text-center">
                 <p className="text-muted-foreground italic font-black uppercase tracking-[0.4em]">No major campaigns active.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Elite Recruitment Section */}
      <section className="relative overflow-hidden rounded-[5rem] border border-white/5 p-20 text-center bg-[#0a0a0f] group shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-secondary/20 opacity-40 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="max-w-3xl mx-auto space-y-10 relative z-10">
          <div className="h-24 w-24 glass-morphism rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl transition-transform group-hover:rotate-12 group-hover:scale-110 duration-500">
            <TrendingUp className="h-12 w-12 text-secondary" />
          </div>
          <h2 className="text-6xl font-black tracking-tight uppercase italic">GLOBAL SQUAD <span className="text-secondary">BONUS</span></h2>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed">
            Expand the global elite network. Recruit international warriors and earn <span className="text-white font-black">100 🪙 Winnings</span> instantly.
          </p>
          <Button variant="outline" className="h-20 border-secondary/40 text-secondary hover:bg-secondary/10 font-black px-16 rounded-3xl transition-all hover:scale-110 shadow-2xl shadow-secondary/20 text-lg uppercase tracking-widest">
            RECRUIT SQUAD
          </Button>
        </div>
      </section>
    </div>
  );
}