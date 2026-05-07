import { Match } from '@/app/lib/types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, Sparkles, Target } from 'lucide-react';
import Link from 'next/link';

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live';
  
  return (
    <Card className="group relative bg-[#1a1a24] border-white/5 overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-[0_40px_80px_rgba(0,0,0,0.6)] rounded-[2rem]">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex flex-col p-8 space-y-10 relative z-10">
        <div className="flex items-center justify-between">
          {isLive ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
              </span>
              <span className="text-[10px] font-black tracking-widest text-destructive uppercase">Live Battle</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass-morphism">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-black tracking-widest text-muted-foreground uppercase">Scheduled</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-primary">
             <Target className="h-3 w-3" />
             <span className="text-[9px] font-black uppercase tracking-[0.2em]">{match.description}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 px-2">
          {/* Team A - Pro Style */}
          <div className="flex-1 flex flex-col items-center gap-4">
            <div className="relative h-24 w-24 group-hover:scale-110 transition-transform duration-700">
              <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full w-full rounded-3xl bg-black/40 p-5 border border-white/10 backdrop-blur-2xl flex items-center justify-center shadow-2xl">
                <img src={match.teamA.logo} alt={match.teamA.name} className="h-full w-full object-contain" />
              </div>
            </div>
            <p className="text-sm font-black uppercase tracking-tighter text-center truncate max-w-[100px] italic">{match.teamA.name}</p>
          </div>

          {/* Score System */}
          <div className="flex flex-col items-center justify-center min-w-[100px] space-y-2">
            {isLive ? (
              <div className="text-5xl font-black tracking-tighter tabular-nums text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                {match.scoreA}<span className="text-primary italic mx-1">:</span>{match.scoreB}
              </div>
            ) : (
              <div className="px-6 py-2.5 rounded-2xl glass-morphism text-[11px] font-black text-muted-foreground uppercase tracking-[0.4em] shadow-xl">
                VS
              </div>
            )}
            <div className="flex items-center gap-1 text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">
               <Sparkles className="h-2 w-2" /> Sector 7
            </div>
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-4">
            <div className="relative h-24 w-24 group-hover:scale-110 transition-transform duration-700">
              <div className="absolute inset-0 bg-secondary/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full w-full rounded-3xl bg-black/40 p-5 border border-white/10 backdrop-blur-2xl flex items-center justify-center shadow-2xl">
                <img src={match.teamB.logo} alt={match.teamB.name} className="h-full w-full object-contain" />
              </div>
            </div>
            <p className="text-sm font-black uppercase tracking-tighter text-center truncate max-w-[100px] italic">{match.teamB.name}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-6 w-6 rounded-full border-2 border-[#1a1a24] bg-muted/40" />
              ))}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              { (match.votesA + match.votesB).toLocaleString() } FANS
            </span>
          </div>
          <Button asChild className="bg-white/5 hover:bg-primary text-white hover:text-white border border-white/10 hover:border-primary font-black rounded-xl text-[10px] tracking-[0.2em] uppercase px-8 h-10 transition-all duration-300">
            <Link href={`/matches/${match.id}`}>ENTER VIEW</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}