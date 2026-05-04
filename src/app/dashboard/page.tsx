
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, limit, orderBy } from 'firebase/firestore';
import { 
  Wallet, 
  Trophy, 
  Gift, 
  ArrowUpRight, 
  TrendingUp, 
  Users, 
  Clock, 
  ChevronRight,
  Activity,
  Zap,
  Shield,
  Loader2,
  Target,
  Sword
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserProfile, UserLedgerEntry } from '@/app/lib/types';
import { cn } from '@/lib/utils';

export default function ArenaHQ() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  
  const ledgerQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'ledger'),
      orderBy('date', 'desc'),
      limit(5)
    );
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const { data: recentActivity, isLoading: isActivityLoading } = useCollection<UserLedgerEntry>(ledgerQuery);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center gap-6">
        <div className="h-20 w-20 bg-muted rounded-[2.5rem] flex items-center justify-center border border-white/5">
          <Shield className="h-10 w-10 text-muted-foreground opacity-20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Identity Required</h2>
          <p className="text-muted-foreground font-medium">Access to the Arena HQ requires authentication.</p>
        </div>
        <Button asChild size="lg" className="rounded-2xl font-black px-12 h-14 bg-primary shadow-xl shadow-primary/20">
          <Link href="/login">IDENTIFY MYSELF</Link>
        </Button>
      </div>
    );
  }

  // Earnings are stored in coins in the ledger, so we convert to ₹ (10 coins = ₹1)
  const totalCoinEarnings = recentActivity?.filter(l => l.type === 'income' || l.type === 'deposit').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalRupeeEarnings = totalCoinEarnings / 10;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-card to-background border border-white/5 p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Shield className="h-64 w-64 text-primary" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/20 uppercase font-black tracking-widest px-4 py-1">COMMAND CENTER</Badge>
              <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                LIVE
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none italic">
              Arena <span className="text-primary">HQ</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg max-w-md">
              Operational status: Optimal. Welcome back, <span className="text-white font-black">{user.email?.split('@')[0]}</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Card className="bg-black/40 border-white/5 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Arena Tier</p>
                <p className="text-sm font-black text-white">BRONZE I</p>
              </div>
            </Card>
            <Button asChild className="bg-primary hover:bg-primary/90 rounded-2xl h-14 font-black px-10 shadow-xl shadow-primary/20 transition-all hover:scale-105">
              <Link href="/withdraw">VAULT WITHDRAW <ArrowUpRight className="h-5 w-5 ml-2" /></Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <HQStatsCard 
          title="Current Balance" 
          value={isProfileLoading ? "---" : (profile?.coins?.toLocaleString() || 0)} 
          suffix="🪙"
          icon={<Wallet />} 
          color="primary"
        />
        <HQStatsCard 
          title="Battle Earnings" 
          value={`₹${totalRupeeEarnings.toFixed(2)}`} 
          icon={<TrendingUp />} 
          color="secondary"
        />
        <HQStatsCard 
          title="Rank Score" 
          value="120" 
          suffix="XP"
          icon={<Sword />} 
          color="white"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3 italic">
               <Activity className="h-5 w-5 text-primary" />
               Battle Log
             </h3>
             <Button variant="link" asChild className="text-muted-foreground hover:text-primary font-bold uppercase text-[10px] tracking-widest">
                <Link href="/ledger">Full History <ChevronRight className="h-4 w-4" /></Link>
             </Button>
          </div>
          
          <Card className="bg-card/20 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
             <CardContent className="p-0">
                {isActivityLoading ? (
                  <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-5">
                           <div className={cn(
                             "h-14 w-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:rotate-12",
                             activity.type === 'income' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                             activity.type === 'withdrawal' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                           )}>
                             {activity.type === 'income' ? <TrendingUp className="h-6 w-6" /> : 
                              activity.type === 'withdrawal' ? <ArrowUpRight className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
                           </div>
                           <div className="space-y-1">
                             <p className="text-base font-black uppercase tracking-tight">{activity.description || activity.type}</p>
                             <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{activity.date}</p>
                             </div>
                           </div>
                        </div>
                        <div className="text-right space-y-2">
                          <p className={cn(
                            "text-2xl font-black tracking-tighter",
                            activity.type === 'withdrawal' ? "text-red-400" : "text-green-400"
                          )}>
                            {activity.type === 'withdrawal' ? '-' : '+'}₹{activity.type === 'withdrawal' ? activity.amount : (activity.amount / 10)}
                          </p>
                          <Badge variant="outline" className={cn(
                             "text-[9px] font-black uppercase px-3 py-0.5 border-2",
                             activity.status === 'completed' ? "border-green-500/20 text-green-500" : "border-yellow-500/20 text-yellow-500"
                          )}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-24 text-center space-y-6">
                     <Sword className="h-16 w-16 text-muted-foreground opacity-5 mx-auto" />
                     <p className="text-sm text-muted-foreground italic font-black uppercase tracking-[0.2em]">No operational data logged.</p>
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-[#1a1a24] to-card border-white/5 rounded-[2.5rem] p-8 text-center space-y-8">
             <div className="mx-auto h-20 w-20 rounded-3xl bg-secondary/10 flex items-center justify-center shadow-inner border border-secondary/20">
                <Zap className="h-10 w-10 text-secondary animate-pulse" />
             </div>
             <div className="space-y-3">
                <h3 className="text-2xl font-black uppercase tracking-tighter italic">Tactical Boost</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">Double your coin generation speed by completing elite daily missions in the Earning Hub.</p>
             </div>
             <Button asChild className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-16 rounded-2xl font-black uppercase tracking-widest text-base shadow-xl shadow-secondary/10">
                <Link href="/earning-hub">DEPLOY TO HUB</Link>
             </Button>
          </Card>

          <Card className="bg-[#0f0f15] border-white/5 rounded-[2.5rem] p-8 space-y-8">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
                  <Trophy className="h-6 w-6 text-amber-500" />
               </div>
               <div>
                  <h3 className="text-sm font-black uppercase tracking-widest italic">Hall of Fame</h3>
                  <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em]">Tier Progression</p>
               </div>
             </div>
             
             <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                   <p className="text-xs font-bold text-muted-foreground uppercase">Next Reward</p>
                   <p className="text-xl font-black">50 🪙</p>
                </div>
                <Button variant="outline" asChild className="w-full border-primary/30 text-primary hover:bg-primary/10 h-14 rounded-2xl font-black uppercase tracking-widest">
                   <Link href="/levels">CLAIM PROGRESS</Link>
                </Button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function HQStatsCard({ title, value, suffix, icon, color }: any) {
  const colorMap = {
    primary: "from-primary/20 to-transparent border-primary/20 text-primary",
    secondary: "from-secondary/20 to-transparent border-secondary/20 text-secondary",
    white: "from-white/10 to-transparent border-white/10 text-white"
  };

  return (
    <Card className={cn(
      "bg-card/40 border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group transition-all hover:scale-[1.02]",
      "shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
    )}>
      <div className={cn("absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 group-hover:opacity-10 transition-all", color === 'primary' ? 'text-primary' : color === 'secondary' ? 'text-secondary' : 'text-white')}>
         {icon && <div className="h-32 w-32">{icon}</div>}
      </div>
      <div className="relative z-10 space-y-6">
        <div className={cn("h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center border", colorMap[color as keyof typeof colorMap])}>
           {icon && <div className="h-7 w-7">{icon}</div>}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-1">{title}</p>
          <h4 className="text-4xl md:text-5xl font-black tracking-tighter text-white tabular-nums">
            {value} {suffix && <span className="text-xl align-top opacity-40">{suffix}</span>}
          </h4>
        </div>
      </div>
    </Card>
  );
}
