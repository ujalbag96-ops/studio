import { Tournament } from '@/app/lib/types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Trophy, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <Card className="overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300">
      <div className="relative h-40 w-full">
        <Image 
          src={tournament.banner} 
          alt={tournament.name} 
          fill 
          className="object-cover opacity-80"
          data-ai-hint="esports background"
        />
        <div className="absolute top-4 right-4">
          <Badge variant={tournament.status === 'active' ? 'default' : 'secondary'} className="capitalize font-bold">
            {tournament.status}
          </Badge>
        </div>
      </div>
      <CardHeader className="space-y-1 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{tournament.name}</h3>
        </div>
        <p className="text-sm text-muted-foreground">{tournament.game}</p>
      </CardHeader>
      <CardContent className="px-6 pb-4 space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-primary" />
          <span>Prize Pool: <span className="font-semibold text-secondary">{tournament.prizePool}</span></span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          <span>Starts: {tournament.startDate}</span>
        </div>
      </CardContent>
      <CardFooter className="px-6 pb-6 pt-0">
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
          <Link href={`/tournaments/${tournament.id}`}>View Tournament</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
