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
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-16 pb-24 md:pb-8">
      {/* Hero Section - Global Pro Design */}
      <section className="relative overflow-hidden rounded-[3rem] bg-[#1a1a24] border border-white/5 shadow-2xl">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-96 h-96 bg-secondary/20 rounded-full blur-[140px] animate-pulse delay-700" />
        
        <div className="relative z-10 grid lg:grid-cols-2 items-center gap-12 p-8 md:p-20">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism mx-auto lg:mx-0">
              <Globe className="h-4 w-4 text-secondary animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-secondary">Global Arena Active</span>
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] text-gradient">
              THE ELITE <br />
              <span className="text-primary italic">BRACKET</span> <br />
              EXPERIENCE.
            </h1>
            
            <p className="text-xl text-muted-foreground font-medium max-w-lg leading-relaxed mx-auto lg:mx-0">
              Join professional tournaments across <span className="text-white font-bold">UK, US & India</span>. Predict results, dominate leaderboards, and win real rewards.
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
              <Button asChild size="lg" className="h-16 bg-primary hover:bg-primary/90 text-white font-black px-12 rounded-2xl shadow-2xl shadow-primary/40 text-lg tracking-widest transition-transform hover:scale-105 active:scale-95">
                <Link href="/login">ENTER THE ARENA</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-16 glass-morphism text-white font-black px-10 rounded-2xl hover:bg-white/5">
                <Link href="/dashboard">VIEW HQ</Link>
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:flex relative items-center justify-center">
             <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl animate-pulse" />
             <Trophy className="w-80 h-80 text-primary opacity-60 drop-shadow-[0_0_50px_rgba(147,69,255,0.4)]" />
             <div className="absolute -bottom-4 -right-4 glass-morphism p-6 rounded-3xl animate-bounce shadow-2xl">
                <ShieldCheck className="h-12 w-12 text-secondary" />
                <p className="text-[8px] font-black uppercase tracking-widest mt-2 text-center">Verified</p>
             </div>
          </div>
        </div>
      </section>

      {/* Real-time Match Stream */}
      <section className="space-y-10">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <Zap className="h-7 w-7 text-destructive animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Live Operations</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em]">Real-time tracking enabled</p>
            </div>
          </div>
          <Button variant="ghost" asChild className="hover:text-primary font-black uppercase tracking-widest group text-xs">
            <Link href="/dashboard" className="flex items-center gap-2">
              Full Intel <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
            </Link>
          </Button>
        </div>
        
        {matchisLoading ? (
          <div className="flex justify-center p-24"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {matches?.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
            {(!matches || matches.length === 0) && !matchisLoading && (
              <div className="md:col-span-3 py-24 glass-morphism rounded-[3rem] text-center space-y-4">
                 <Loader2 className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                 <p className="text-sm text-muted-foreground italic font-black uppercase tracking-[0.3em]">Sector currently quiet.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Major Tournament Hub */}
      <section className="space-y-10">
        <div className="flex items-center gap-4 px-2">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Trophy className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Major Hubs</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em]">UK • US • INDIA PRIZE POOLS</p>
          </div>
        </div>
        {tourisLoading ? (
          <div className="flex justify-center p-24"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {activeTournaments.map(tournament => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
            {activeTournaments.length === 0 && !tourisLoading && (
              <div className="md:col-span-2 py-24 glass-morphism rounded-[3rem] text-center">
                 <p className="text-muted-foreground italic font-black uppercase tracking-[0.3em]">No major events deployed.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Global Referral Rewards */}
      <section className="relative overflow-hidden rounded-[3.5rem] border border-white/5 p-16 text-center bg-card/40 backdrop-blur-3xl group shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="max-w-2xl mx-auto space-y-8 relative z-10">
          <div className="h-20 w-20 glass-morphism rounded-3xl flex items-center justify-center mx-auto shadow-2xl transition-transform group-hover:rotate-12">
            <TrendingUp className="h-10 w-10 text-secondary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic">GLOBAL SQUAD <span className="text-secondary">BONUS</span></h2>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed">
            Expand the arena network. Earn <span className="text-white font-black">100 🪙 (Winning Amount)</span> for every international referal once they join their first pro battle.
          </p>
          <Button variant="outline" className="h-16 border-secondary/40 text-secondary hover:bg-secondary/10 font-black px-14 rounded-2xl transition-all hover:scale-110 shadow-xl shadow-secondary/10">
            INVITE YOUR SQUAD
          </Button>
        </div>
      </section>
    </div>
  );
}