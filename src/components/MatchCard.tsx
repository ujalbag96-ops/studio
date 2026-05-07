import { Match } from '@/app/lib/types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, Sparkles, Target, Users } from 'lucide-react';
import Link from 'next/link';

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live';
  
  return (
    <Card className="group relative bg-[#0f0f15] border-white/5 overflow-hidden transition-all duration-700 hover:border-primary/50 hover:shadow-[0_50px_100px_rgba(0,0,0,0.8)] rounded-[3rem]">
      {/* Intense Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
      
      <div className="flex flex-col p-10 space-y-12 relative z-10">
        <div className="flex items-center justify-between">
          {isLive ? (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              <span className="text-[11px] font-black tracking-[0.4em] text-destructive uppercase">LIVE BATTLE</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2 rounded-full glass-morphism">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-[11px] font-black tracking-[0.4em] text-muted-foreground uppercase">Scheduled</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-primary font-black">
             <Target className="h-4 w-4" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">{match.description}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6 px-4">
          {/* Team A - Elite Pro Style */}
          <div className="flex-1 flex flex-col items-center gap-6">
            <div className="relative h-28 w-28 group-hover:scale-125 transition-transform duration-700">
              <div className="absolute inset-0 bg-primary/40 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full w-full rounded-[2.5rem] bg-black/60 p-6 border-2 border-white/10 backdrop-blur-3xl flex items-center justify-center shadow-2xl">
                <img src={match.teamA.logo} alt={match.teamA.name} className="h-full w-full object-contain filter drop-shadow-lg" />
              </div>
            </div>
            <p className="text-base font-black uppercase tracking-tighter text-center truncate max-w-[120px] italic text-white">{match.teamA.name}</p>
          </div>

          {/* Score System */}
          <div className="flex flex-col items-center justify-center min-w-[120px] space-y-3">
            {isLive ? (
              <div className="text-6xl font-black tracking-tighter tabular-nums text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                {match.scoreA}<span className="text-primary italic mx-2">:</span>{match.scoreB}
              </div>
            ) : (
              <div className="px-8 py-3 rounded-3xl glass-morphism text-sm font-black text-muted-foreground uppercase tracking-[0.5em] shadow-2xl border-white/20">
                VS
              </div>
            )}
            <div className="flex items-center gap-2 text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.5em]">
               <Sparkles className="h-3 w-3" /> ARENA PRO
            </div>
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-6">
            <div className="relative h-28 w-28 group-hover:scale-125 transition-transform duration-700">
              <div className="absolute inset-0 bg-secondary/40 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full w-full rounded-[2.5rem] bg-black/60 p-6 border-2 border-white/10 backdrop-blur-3xl flex items-center justify-center shadow-2xl">
                <img src={match.teamB.logo} alt={match.teamB.name} className="h-full w-full object-contain filter drop-shadow-lg" />
              </div>
            </div>
            <p className="text-base font-black uppercase tracking-tighter text-center truncate max-w-[120px] italic text-white">{match.teamB.name}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-10 border-t border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-8 rounded-full border-4 border-[#0f0f15] bg-muted/20" />
              ))}
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
              <Users className="h-4 w-4" /> { ( (match.votesA || 0) + (match.votesB || 0) ).toLocaleString() } FANS
            </span>
          </div>
          <Button asChild className="bg-white/5 hover:bg-primary text-white border border-white/10 hover:border-primary font-black rounded-2xl text-[11px] tracking-[0.3em] uppercase px-10 h-12 transition-all duration-500 shadow-xl">
            <Link href={`/matches/${match.id}`}>VIEW INTEL</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}