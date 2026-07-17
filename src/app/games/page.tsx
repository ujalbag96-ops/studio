
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Gamepad2, 
  Trophy, 
  Zap, 
  BrainCircuit, 
  Dices, 
  Ghost, 
  Target, 
  Lock, 
  Coins, 
  ArrowRight,
  Loader2,
  Star,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/app/lib/types';

const GAMES = [
  { id: 'chicken-road', name: 'Chicken Road', category: 'Action', icon: <Zap />, fee: 10, color: 'from-orange-500/20', status: 'live', path: '/games/chicken-road' },
  { id: 'ludo-lite', name: 'Ludo Lite', category: 'Casual', icon: <Dices />, fee: 20, color: 'from-blue-500/20', status: 'live', path: '/games/ludo-lite' },
  { id: 'multiplier', name: 'Multi Win', category: 'Strategy', icon: <Target />, fee: 100, color: 'from-green-500/20', status: 'live', path: '/games/multiplier' },
  { id: 'sudoku', name: 'Zen Sudoku', category: 'Brain', icon: <BrainCircuit />, fee: 15, color: 'from-purple-500/20', status: 'locked', level: 5 },
  { id: 'archery', name: 'Pro Archery', category: 'Skill', icon: <Target />, fee: 25, color: 'from-red-500/20', status: 'locked', level: 10 },
  { id: 'snake', name: 'Classic Snake', category: 'Casual', icon: <Ghost />, fee: 5, color: 'from-emerald-500/20', status: 'locked', level: 3 },
];

export default function GameHub() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Campus Skill Arena</Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none text-white">
                Game <span className="text-primary">Hub</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-xl">Play 10+ industrial mini-games, earn coins, and climb the skill ladder.</p>
           </div>
           
           <Card className="w-full md:w-80 bg-gradient-to-br from-[#1a1a24] to-black border-primary/20 border-2 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Activity className="h-20 w-20 text-primary" /></div>
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase text-white italic">Current Rank</span>
                 </div>
                 <h4 className="text-3xl font-black text-white italic uppercase">{profile?.rank || 'BRONZE'}</h4>
                 <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black uppercase text-muted-foreground">My Assets</p>
                    <p className="text-xl font-black text-primary italic">{(profile?.coins || 0).toLocaleString()} 🪙</p>
                 </div>
              </div>
           </Card>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} userLevel={profile?.tasksCompletedCount || 0} />
        ))}
      </div>

      <section className="pt-10">
         <Card className="bg-[#0a0a0f] border-dashed border-2 border-white/5 p-12 rounded-[3rem] text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
               <Star className="h-3 w-3 text-amber-500 animate-pulse" />
               <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Weekly Scholarship Active</span>
            </div>
            <h3 className="text-2xl font-black uppercase italic text-white/60">Top 10 High-Scorers win ₹100 Bonus on Saturday!</h3>
            <Button asChild variant="outline" className="h-12 px-8 border-white/10 text-white font-black uppercase italic">
               <Link href="/leaderboard">VIEW LEADERBOARD</Link>
            </Button>
         </Card>
      </section>
    </div>
  );
}

function GameCard({ game, userLevel }: any) {
  const isLocked = game.status === 'locked' && userLevel < (game.level || 0);

  return (
    <Card className={cn(
      "p-8 rounded-[2.5rem] bg-gradient-to-br border-white/5 hover:border-primary/40 transition-all hover:scale-[1.02] shadow-2xl group relative overflow-hidden",
      game.color, "to-transparent",
      isLocked && "grayscale opacity-60"
    )}>
      <div className="relative z-10 space-y-8">
        <div className="flex justify-between items-start">
           <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
              {game.icon}
           </div>
           <Badge variant="outline" className="border-white/10 uppercase text-[8px] font-black px-3 py-1 bg-black/40">
              {game.category}
           </Badge>
        </div>

        <div className="space-y-1">
           <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{game.name}</h3>
           <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest italic">Entry Fee: {game.fee} 🪙</p>
        </div>

        {isLocked ? (
          <div className="p-4 bg-black/40 border border-white/10 rounded-xl flex items-center gap-3">
             <Lock className="h-4 w-4 text-amber-500" />
             <span className="text-[9px] font-black uppercase text-white">Unlocks at {game.level} Tasks</span>
          </div>
        ) : (
          <Button asChild className="w-full h-14 bg-white/5 border border-white/10 hover:bg-primary text-white font-black uppercase italic rounded-xl shadow-xl transition-all">
             <Link href={game.path}>START SESSION <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        )}
      </div>

      <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
         {game.icon}
      </div>
    </Card>
  );
}
