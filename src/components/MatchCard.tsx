import { Match } from '@/app/lib/types';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Activity, Sparkles, Target, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live';
  
  return (
    <Card className="group relative bg-[#1E1B4B]/20 border-white/5 overflow-hidden transition-all duration-500 hover:border-primary/40 rounded-[2rem] shadow-xl">
      {isLive && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive via-primary to-destructive animate-pulse" />}
      
      <div className="flex flex-col p-6 space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <Badge variant={isLive ? 'destructive' : 'secondary'} className="px-3 font-black uppercase text-[8px] tracking-[0.2em] rounded-lg">
            {isLive ? 'LIVE NOW' : 'SCHEDULED'}
          </Badge>
          <div className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
             <Zap className="h-3 w-3" /> {match.description.split('-')[0]}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-white/5 p-3 border border-white/10 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <img src={match.teamA.logo} alt={match.teamA.name} className="h-full w-full object-contain" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-tighter text-center truncate w-full text-white">{match.teamA.name}</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-1">
            {isLive ? (
              <div className="text-3xl font-black text-white flex items-center gap-2">
                {match.scoreA}<span className="text-primary italic">:</span>{match.scoreB}
              </div>
            ) : (
              <div className="bg-white/10 px-4 py-1.5 rounded-xl text-[10px] font-black text-muted-foreground uppercase tracking-widest border border-white/5">
                VS
              </div>
            )}
            <p className="text-[7px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-40">ARENA PRO</p>
          </div>

          <div className="flex-1 flex flex-col items-center gap-3">
            <div className="h-16 w-16 rounded-2xl bg-white/5 p-3 border border-white/10 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
              <img src={match.teamB.logo} alt={match.teamB.name} className="h-full w-full object-contain" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-tighter text-center truncate w-full text-white">{match.teamB.name}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
          <div className="flex items-center gap-2">
             <div className="flex -space-x-2">
                {[1, 2].map(i => <div key={i} className="h-5 w-5 rounded-full bg-muted/40 border-2 border-[#0f172a]" />)}
             </div>
             <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">+{ ( (match.votesA || 0) + (match.votesB || 0) ).toLocaleString() }</span>
          </div>
          <Button asChild size="sm" className="bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 font-black rounded-xl text-[8px] tracking-widest h-9 px-6 transition-all">
            <Link href={`/matches/${match.id}`}>PREDICT & WIN</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}