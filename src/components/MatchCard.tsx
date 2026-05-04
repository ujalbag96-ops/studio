
import { Match } from '@/app/lib/types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users, Activity } from 'lucide-react';
import Link from 'next/link';

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live';
  
  return (
    <Card className="group relative bg-[#13131a] border-white/5 overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] rounded-[1.5rem]">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex flex-col p-6 space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLive ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
                <span className="text-[9px] font-black tracking-widest text-destructive uppercase">Live Now</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] font-black tracking-widest text-muted-foreground uppercase">Upcoming</span>
              </div>
            )}
          </div>
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{match.description}</span>
        </div>

        <div className="flex items-center justify-between gap-2 px-2">
          {/* Team A */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="relative h-20 w-20 group-hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full w-full rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xl">
                <img src={match.teamA.logo} alt={match.teamA.name} className="h-full w-full object-contain" />
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-tight text-center truncate max-w-[80px]">{match.teamA.name}</p>
          </div>

          {/* Score/VS */}
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            {isLive ? (
              <div className="text-4xl font-black tracking-tighter tabular-nums text-white">
                {match.scoreA}<span className="text-primary mx-1">:</span>{match.scoreB}
              </div>
            ) : (
              <div className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                VS
              </div>
            )}
            <div className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] mt-1">Battle</div>
          </div>

          {/* Team B */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="relative h-20 w-20 group-hover:scale-105 transition-transform duration-500">
              <div className="absolute inset-0 bg-secondary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative h-full w-full rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xl">
                <img src={match.teamB.logo} alt={match.teamB.name} className="h-full w-full object-contain" />
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-tight text-center truncate max-w-[80px]">{match.teamB.name}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-5 w-5 rounded-full border border-[#13131a] bg-muted/20" />
              ))}
            </div>
            <span className="text-[10px] font-bold text-muted-foreground">
              { (match.votesA + match.votesB).toLocaleString() } predictions
            </span>
          </div>
          <Button asChild variant="secondary" size="sm" className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-black rounded-xl text-[10px] tracking-widest uppercase px-6 transition-all group-hover:bg-primary group-hover:text-white group-hover:border-primary">
            <Link href={`/matches/${match.id}`}>VIEW INFO</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
