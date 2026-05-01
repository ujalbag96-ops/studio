import { Match } from '@/app/lib/types';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Users } from 'lucide-react';
import Link from 'next/link';

export default function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live';
  
  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="flex flex-col p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Badge variant={isLive ? 'destructive' : 'outline'} className={isLive ? 'animate-pulse' : ''}>
            {isLive ? 'LIVE' : 'SCHEDULED'}
          </Badge>
          <span className="text-xs text-muted-foreground">{match.description}</span>
        </div>

        <div className="grid grid-cols-3 items-center gap-4 text-center">
          <div className="space-y-2">
            <div className="mx-auto h-16 w-16 rounded-xl bg-muted/50 p-2 border border-border">
              <img src={match.teamA.logo} alt={match.teamA.name} className="h-full w-full object-contain" />
            </div>
            <p className="text-sm font-bold truncate">{match.teamA.name}</p>
          </div>

          <div className="space-y-1">
            <div className="text-3xl font-black tracking-tighter">
              {match.scoreA} : {match.scoreB}
            </div>
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">VS</div>
          </div>

          <div className="space-y-2">
            <div className="mx-auto h-16 w-16 rounded-xl bg-muted/50 p-2 border border-border">
              <img src={match.teamB.logo} alt={match.teamB.name} className="h-full w-full object-contain" />
            </div>
            <p className="text-sm font-bold truncate">{match.teamB.name}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex -space-x-2">
             <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{match.votesA + match.votesB} Voters</span>
             </div>
          </div>
          <Button asChild variant="secondary" size="sm" className="font-bold">
            <Link href={`/matches/${match.id}`}>Details</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}
