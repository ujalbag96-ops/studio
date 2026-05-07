import { Tournament } from '@/app/lib/types';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Trophy, Calendar, Target, Globe, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';

export default function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <Card className="group overflow-hidden bg-[#0f0f15] border-white/5 hover:border-primary/50 transition-all duration-700 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative">
      <div className="relative h-64 w-full">
        <Image 
          src={tournament.banner} 
          alt={tournament.name} 
          fill 
          className="object-cover opacity-70 transition-transform duration-1000 group-hover:scale-110"
          data-ai-hint="esports banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-[#0f0f15]/30 to-transparent" />
        <div className="absolute top-8 right-8 flex gap-3">
          <Badge variant={tournament.status === 'active' ? 'default' : 'secondary'} className="capitalize font-black px-6 py-2.5 rounded-full shadow-[0_0_30px_rgba(0,0,0,0.5)] border-none text-[11px] tracking-widest">
            {tournament.status === 'active' && <span className="mr-2 h-2 w-2 rounded-full bg-white animate-pulse" />}
            {tournament.status}
          </Badge>
        </div>
        <div className="absolute bottom-8 left-8 flex items-center gap-3 px-5 py-2 rounded-full glass-morphism text-[11px] font-black uppercase tracking-[0.4em] text-secondary shadow-2xl border-white/20">
           <Zap className="h-4 w-4" /> {tournament.gameType} Elite
        </div>
      </div>
      
      <CardHeader className="space-y-4 p-10 pt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none text-white group-hover:text-primary transition-colors">{tournament.name}</h3>
        </div>
        <div className="flex items-center gap-3 text-primary font-black text-xs uppercase tracking-[0.3em]">
           <Target className="h-4 w-4" /> {tournament.game} Professional
        </div>
      </CardHeader>
      
      <CardContent className="px-10 pb-6 grid grid-cols-2 gap-8">
        <div className="space-y-2">
           <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em]">Prize Vault</p>
           <p className="text-2xl font-black text-secondary tracking-tighter tabular-nums">{tournament.prizePool}</p>
        </div>
        <div className="space-y-2 text-right">
           <p className="text-[11px] font-black uppercase text-muted-foreground tracking-[0.4em]">Kick-Off</p>
           <p className="text-base font-black text-white tracking-tight">{tournament.startDate}</p>
        </div>
      </CardContent>
      
      <CardFooter className="px-10 pb-10 pt-6">
        <Button asChild className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-primary/30 transition-all group-hover:scale-[1.03] text-base">
          <Link href={`/tournaments/${tournament.id}`}>DEPLOY MISSION</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}