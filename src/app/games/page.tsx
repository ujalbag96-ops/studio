
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Gamepad2, 
  Trophy, 
  Zap, 
  Target, 
  Lock, 
  Coins, 
  ArrowRight,
  Loader2,
  Star,
  Activity,
  ChevronRight,
  Puzzle,
  Bird,
  Package,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/app/lib/types';
import { Progress } from '@/components/ui/progress';

const ARCADE_CATEGORIES = [
  { 
    id: 'puzzle', 
    name: 'Logic Puzzle', 
    desc: 'Match-3 strategy with 50 stages.', 
    icon: <Puzzle />, 
    color: 'from-blue-600/20', 
    path: '/games/puzzle',
    maxLevel: 50
  },
  { 
    id: 'physics', 
    name: 'Physics Arcade', 
    desc: 'Skill-based physics trajectory targets.', 
    icon: <Bird />, 
    color: 'from-orange-600/20', 
    path: '/games/physics',
    maxLevel: 50
  },
  { 
    id: 'runner', 
    name: 'Endless Runner', 
    desc: 'Automatic velocity scaling runner.', 
    icon: <Zap />, 
    color: 'from-emerald-600/20', 
    path: '/games/runner',
    maxLevel: 50
  },
];

export default function GameHub() {
  const { user } = useUser();
  const firestore = useFirestore();

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading } = useDoc<UserProfile>(userRef);

  const getLevel = (cat: string) => {
    if (!profile) return 1;
    if (cat === 'puzzle') return profile.puzzleLevel || 1;
    if (cat === 'physics') return profile.physicsLevel || 1;
    if (cat === 'runner') return profile.runnerLevel || 1;
    return 1;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">50-Level Arcade Sector</Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic leading-none text-white">
                Arcade <span className="text-primary">Arena</span>
              </h1>
              <p className="text-muted-foreground font-medium text-lg max-w-xl">Reach level milestones to unlock Mega Mystery Boxes.</p>
           </div>
           
           <Card className="w-full md:w-80 bg-gradient-to-br from-[#1a1a24] to-black border-primary/20 border-2 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5"><Activity className="h-20 w-20 text-primary" /></div>
              <div className="relative z-10 space-y-4">
                 <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase text-white italic">Arena Mastery</span>
                 </div>
                 <h4 className="text-xl font-black text-white uppercase italic">Level {( (profile?.puzzleLevel || 1) + (profile?.physicsLevel || 1) + (profile?.runnerLevel || 1) )} Total</h4>
                 <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black uppercase text-muted-foreground">Skill Tier</p>
                    <p className="text-xl font-black text-primary italic">{profile?.rank || 'BRONZE'}</p>
                 </div>
              </div>
           </Card>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {ARCADE_CATEGORIES.map((cat) => {
          const currentLevel = getLevel(cat.id);
          const progress = (currentLevel / cat.maxLevel) * 100;
          const nextMilestone = Math.ceil(currentLevel / 5) * 5;

          return (
            <Link key={cat.id} href={cat.path}>
              <Card className={cn(
                "p-10 rounded-[3rem] bg-gradient-to-br border-white/5 hover:border-primary/40 transition-all hover:scale-[1.02] shadow-2xl group relative overflow-hidden h-full flex flex-col justify-between",
                cat.color, "to-transparent"
              )}>
                <div className="relative z-10 space-y-6">
                  <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-xl">
                    {cat.icon}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">{cat.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{cat.desc}</p>
                  </div>
                </div>

                <div className="relative z-10 mt-10 space-y-4">
                   <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[8px] font-black uppercase text-muted-foreground">Current Level</p>
                         <p className="text-2xl font-black text-white italic">#{currentLevel}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[7px] font-black uppercase text-amber-500 mb-1 flex items-center gap-1"><Package className="h-2 w-2" /> Milestone at #{nextMilestone}</p>
                         <Badge className="bg-white/5 text-primary border-none font-black text-[9px] px-3">MAX 50</Badge>
                      </div>
                   </div>
                   <Progress value={progress} className="h-1.5 bg-black/40" />
                   <Button className="w-full h-14 bg-white/5 border border-white/10 hover:bg-primary text-white font-black uppercase italic rounded-xl shadow-xl transition-all mt-4">
                      ENTER STAGE <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <section className="pt-10">
         <Card className="bg-[#0a0a0f] border-dashed border-2 border-white/5 p-12 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-10 shadow-[0_0_100px_rgba(99,102,241,0.05)]">
            <div className="space-y-4 text-center md:text-left">
               <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Star className="h-3 w-3 text-amber-500 animate-pulse" />
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Skill Mastery verified</span>
               </div>
               <h3 className="text-3xl font-black uppercase italic text-white leading-none">Milestone <span className="text-primary">Boxes</span></h3>
               <p className="text-muted-foreground text-sm font-medium max-w-xl">
                  Every 5 levels completed in any category triggers a **Mega Mystery Box** containting up to 100 coins and exclusive rank badges.
               </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center relative group">
                  <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Weekly Prize</p>
                  <p className="text-2xl font-black text-white italic">₹100</p>
               </div>
               <div className="p-6 bg-white/5 rounded-2xl border border-white/10 text-center relative group">
                  <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                  <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Top Slot</p>
                  <p className="text-2xl font-black text-amber-500 italic">RANK 1</p>
               </div>
            </div>
         </Card>
      </section>
    </div>
  );
}
