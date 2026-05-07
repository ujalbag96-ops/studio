import { Tournament } from '@/app/lib/types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Trophy, Calendar, Target, Globe } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <Card className="group overflow-hidden bg-[#1a1a24] border-white/5 hover:border-primary/50 transition-all duration-500 rounded-[2.5rem] shadow-2xl relative">
      <div className="relative h-56 w-full">
        <Image 
          src={tournament.banner} 
          alt={tournament.name} 
          fill 
          className="object-cover opacity-60 transition-transform duration-700 group-hover:scale-110"
          data-ai-hint="esports banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a24] via-[#1a1a24]/20 to-transparent" />
        <div className="absolute top-6 right-6 flex gap-2">
          <Badge variant={tournament.status === 'active' ? 'default' : 'secondary'} className="capitalize font-black px-4 py-1.5 rounded-full shadow-2xl border-none">
            {tournament.status === 'active' && <span className="mr-2 h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
            {tournament.status}
          </Badge>
        </div>
        <div className="absolute bottom-6 left-6 flex items-center gap-2 px-3 py-1 rounded-full glass-morphism text-[10px] font-black uppercase tracking-widest text-secondary">
           <Globe className="h-3 w-3" /> {tournament.gameType} Elite
        </div>
      </div>
      
      <CardHeader className="space-y-2 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{tournament.name}</h3>
        </div>
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
           <Target className="h-3 w-3" /> {tournament.game}
        </div>
      </CardHeader>
      
      <CardContent className="px-8 pb-4 grid grid-cols-2 gap-6">
        <div className="space-y-1">
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Global Pool</p>
           <p className="text-xl font-black text-secondary tracking-tighter">{tournament.prizePool}</p>
        </div>
        <div className="space-y-1 text-right">
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Kick-off</p>
           <p className="text-sm font-black text-white">{tournament.startDate}</p>
        </div>
      </CardContent>
      
      <CardFooter className="px-8 pb-8 pt-4">
        <Button asChild className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 transition-all group-hover:scale-[1.02]">
          <Link href={`/tournaments/${tournament.id}`}>DEPLOY MISSION</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}