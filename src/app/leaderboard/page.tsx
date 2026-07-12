
'use client';

import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Crown, Star, Loader2, ArrowUp, Medal } from 'lucide-react';
import { UserProfile } from '../lib/types';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  const firestore = useFirestore();
  const lbQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'users'), orderBy('coins', 'desc'), limit(20)) : null, 
    [firestore]
  );
  const { data: users, isLoading } = useCollection<UserProfile>(lbQuery);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="text-center space-y-4 pt-10">
        <div className="mx-auto h-20 w-20 rounded-[2rem] bg-accent/10 flex items-center justify-center border border-accent/20 shadow-2xl">
          <Trophy className="h-10 w-10 text-accent animate-pulse" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">Weekly <span className="text-primary">Hall of Fame</span></h1>
        <p className="text-muted-foreground font-medium uppercase tracking-[0.3em] text-[10px]">Top Warriors of this Sector</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Podium (Visual) */}
          <div className="grid grid-cols-3 gap-4 items-end pb-10">
             {users?.[1] && <PodiumUser user={users[1]} rank={2} color="text-slate-400" />}
             {users?.[0] && <PodiumUser user={users[0]} rank={1} color="text-accent" large />}
             {users?.[2] && <PodiumUser user={users[2]} rank={3} color="text-amber-700" />}
          </div>

          {/* List View */}
          <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
             <div className="divide-y divide-white/5">
                {users?.slice(3).map((u, i) => (
                  <div key={u.id} className="p-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                     <div className="flex items-center gap-6">
                        <span className="font-black text-xl italic text-muted-foreground w-8">#{i + 4}</span>
                        <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 font-black uppercase">
                           {u.email?.[0] || 'U'}
                        </div>
                        <div>
                           <p className="font-black uppercase italic text-sm">{u.email?.split('@')[0] || 'Warrior'}</p>
                           <p className="text-[10px] font-bold text-muted-foreground uppercase">{u.rank} Tier</p>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xl font-black text-white italic">{u.coins.toLocaleString()} <span className="text-xs opacity-40">🪙</span></p>
                        <p className="text-[9px] font-bold text-green-500 uppercase flex items-center justify-end gap-1"><ArrowUp className="h-2 w-2" /> Rising</p>
                     </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function PodiumUser({ user, rank, color, large }: any) {
  return (
    <div className={cn("flex flex-col items-center gap-4 text-center", large ? "order-2" : rank === 2 ? "order-1" : "order-3")}>
       <div className={cn("relative", large ? "h-28 w-28" : "h-20 w-20")}>
          <div className={cn("absolute inset-0 rounded-3xl border-2 rotate-6 opacity-20", rank === 1 ? "border-accent" : "border-white")} />
          <div className="h-full w-full rounded-3xl bg-[#121216] border border-white/10 flex items-center justify-center shadow-2xl relative z-10 overflow-hidden">
             <span className="text-3xl font-black uppercase text-white/20">{user.email?.[0] || 'U'}</span>
             <div className={cn("absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black to-transparent")} />
          </div>
          <div className={cn("absolute -top-4 -right-4 h-10 w-10 rounded-full bg-[#0a0a0f] border-2 border-white/10 flex items-center justify-center shadow-xl z-20", color)}>
             {rank === 1 ? <Crown className="h-5 w-5" /> : <Medal className="h-5 w-5" />}
          </div>
       </div>
       <div className="space-y-1">
          <p className={cn("font-black uppercase italic truncate max-w-[100px]", large ? "text-lg" : "text-xs")}>{user.email?.split('@')[0]}</p>
          <Badge className={cn("bg-white/10 border-none font-black text-[8px]", color)}>{user.coins.toLocaleString()} 🪙</Badge>
       </div>
    </div>
  );
}
