
import { MOCK_TOURNAMENTS, MOCK_MATCHES } from './lib/mock-data';
import TournamentCard from '@/components/TournamentCard';
import MatchCard from '@/components/MatchCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Trophy, TrendingUp, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const liveMatches = MOCK_MATCHES.filter(m => m.status === 'live');
  const activeTournaments = MOCK_TOURNAMENTS.filter(t => t.status === 'active');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-[#0f0f1a] border border-white/5 shadow-2xl">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 -left-20 w-80 h-80 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 -right-20 w-80 h-80 bg-secondary/20 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <div className="relative z-10 grid lg:grid-cols-2 items-center gap-12 p-8 md:p-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl">
              <Sparkles className="h-4 w-4 text-secondary animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">New Season Live</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
              OWN THE <span className="text-primary italic">BRACKET</span>, <br />
              CLAIM THE <span className="text-secondary italic">GLORY</span>.
            </h1>
            
            <p className="text-lg text-muted-foreground font-medium max-w-lg leading-relaxed">
              Join the ultimate arena where predictions turn into profits. Real-time updates, competitive odds, and instant payouts.
            </p>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white font-black px-10 rounded-2xl shadow-lg shadow-primary/25 transition-all hover:scale-105">
                <Link href="/login">START PLAYING</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 font-bold px-8 rounded-2xl backdrop-blur-md transition-all hover:scale-105">
                <Link href="/login">JOIN ARENA</Link>
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:block relative">
            <div className="relative z-10 flex items-center justify-center p-12">
               <Trophy className="w-64 h-64 text-primary opacity-50 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
            </div>
            {/* Geometric accents */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/5 rounded-full animate-[spin_20s_linear_infinite]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-primary/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
          </div>
        </div>
      </section>

      {/* Live Matches */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <Zap className="h-6 w-6 text-destructive animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Live Battles</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Real-time stats tracking</p>
            </div>
          </div>
          <Button variant="ghost" asChild className="hover:text-primary font-bold group">
            <Link href="/tournaments" className="flex items-center gap-2">
              All Matches <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_MATCHES.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      </section>

      {/* Active Tournaments */}
      <section className="space-y-8">
        <div className="flex items-center gap-3 px-2">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Major Events</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Compete for high prize pools</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activeTournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>

      {/* Referral Teaser */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/5 p-12 text-center bg-card/20 backdrop-blur-xl group">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 opacity-50 group-hover:opacity-100 transition-opacity" />
        <div className="max-w-md mx-auto space-y-6 relative z-10">
          <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
            <TrendingUp className="h-8 w-8 text-secondary" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">REFER & EARN <span className="text-secondary">100 🪙</span></h2>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed">
            Building a squad has never been more rewarding. Invite your friends and stack your wallet together.
          </p>
          <Button variant="outline" className="border-secondary/40 text-secondary hover:bg-secondary/10 font-black px-10 rounded-xl transition-all hover:scale-105">
            INVITE FRIENDS
          </Button>
        </div>
      </section>
    </div>
  );
}
