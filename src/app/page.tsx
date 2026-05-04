
import { MOCK_TOURNAMENTS, MOCK_MATCHES } from './lib/mock-data';
import TournamentCard from '@/components/TournamentCard';
import MatchCard from '@/components/MatchCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Trophy, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const liveMatches = MOCK_MATCHES.filter(m => m.status === 'live');
  const activeTournaments = MOCK_TOURNAMENTS.filter(t => t.status === 'active');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-purple-900 p-8 md:p-12 text-primary-foreground shadow-2xl">
        <div className="relative z-10 space-y-6 max-w-2xl">
          <Badge className="bg-secondary text-secondary-foreground font-black px-4 py-1">NEW SEASON</Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none">
            OWN THE <span className="text-secondary">BRACKET</span>, CLAIM THE GLORY.
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 font-medium">
            Join thousands of players in real-time tournaments. Predict winners, earn virtual currency, and rise to the top of the leaderboard.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold px-8">
              <Link href="/login">Start Playing</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-white/10 hover:bg-white/20 font-bold backdrop-blur-sm">
              <Link href="/login">Register Now</Link>
            </Button>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none hidden lg:block">
           <Trophy className="w-full h-full p-20" />
        </div>
      </section>

      {/* Live Matches */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-secondary" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Live Battles</h2>
          </div>
          <Button variant="ghost" asChild className="hover:text-primary">
            <Link href="/tournaments" className="flex items-center gap-2">
              All Matches <ArrowRight className="h-4 w-4" />
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
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-black uppercase tracking-tight">Active Tournaments</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {activeTournaments.map(tournament => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>

      {/* Referral Teaser */}
      <section className="rounded-3xl border-2 border-dashed border-border p-8 text-center bg-card/30">
        <div className="max-w-md mx-auto space-y-4">
          <TrendingUp className="h-10 w-10 text-primary mx-auto" />
          <h2 className="text-2xl font-bold">Refer & Win 100 🪙</h2>
          <p className="text-muted-foreground text-sm">
            Invite your friends to Bracket Battles. When they join their first paid tournament, you both get 100 coins!
          </p>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
            Invite Friends
          </Button>
        </div>
      </section>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}
