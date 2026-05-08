import { Tournament } from '@/app/lib/types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Trophy, Calendar, Target, Zap, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <Card className="group overflow-hidden bg-[#1E1B4B]/30 border-white/5 hover:border-primary/50 transition-all duration-500 rounded-[2rem] shadow-xl relative">
      <div className="relative h-48 w-full">
        <Image 
          src={tournament.banner} 
          alt={tournament.name} 
          fill 
          className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
          data-ai-hint="gaming tournament"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        <div className="absolute top-4 left-4">
           <Badge className="bg-primary text-white font-black px-3 py-1 rounded-lg shadow-xl uppercase text-[9px] tracking-widest">
             {tournament.gameType}
           </Badge>
        </div>
      </div>
      
      <div className="p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-xl font-black uppercase tracking-tight text-white leading-tight">{tournament.name}</h3>
          <p className="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-widest">
            <Clock className="h-3 w-3" /> Starting: {tournament.startDate}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Prize Pool</p>
            <p className="text-lg font-black text-accent tracking-tight">{tournament.prizePool}</p>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-1">
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Entry Fee</p>
            <p className="text-lg font-black text-secondary tracking-tight">{tournament.entryFee} 🪙</p>
          </div>
        </div>

        <Button asChild className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest rounded-xl winzo-button-glow shadow-xl">
          <Link href={`/tournaments/${tournament.id}`}>JOIN NOW</Link>
        </Button>
      </div>
    </Card>
  );
}