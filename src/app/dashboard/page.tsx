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
  LayoutDashboard,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserProfile, UserLedgerEntry } from '@/app/lib/types';
import { cn } from '@/lib/utils';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Real-time Data
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
        <div className="h-20 w-20 bg-muted rounded-3xl flex items-center justify-center">
          <LayoutDashboard className="h-10 w-10 text-muted-foreground opacity-20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Login Required</h2>
          <p className="text-muted-foreground font-medium">Please sign in to access your personal dashboard.</p>
        </div>
        <Button asChild size="lg" className="rounded-2xl font-black px-12">
          <Link href="/login">GO TO LOGIN</Link>
        </Button>
      </div>
    );
  }

  const totalEarnings = recentActivity?.filter(l => l.type === 'income' || l.type === 'deposit').reduce((acc, curr) => acc + curr.amount, 0) || 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 pb-32">
      {/* Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
            <Activity className="h-3 w-3" />
            Arena Status: Active
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none">
            Welcome, <span className="text-primary italic">{user.email?.split('@')[0] || 'Warrior'}</span>
          </h1>
          <p className="text-muted-foreground font-medium">Track your performance and manage your rewards.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button asChild variant="outline" className="border-white/10 bg-white/5 rounded-2xl h-12 font-bold px-6">
              <Link href="/rewards"><Gift className="h-4 w-4 mr-2 text-secondary" /> REWARDS</Link>
           </Button>
           <Button asChild className="bg-primary hover:bg-primary/90 rounded-2xl h-12 font-black px-8 shadow-xl shadow-primary/20">
              <Link href="/withdraw">WITHDRAW <ArrowUpRight className="h-4 w-4 ml-2" /></Link>
           </Button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/10 border-primary/20 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <Wallet className="h-32 w-32 text-primary" />
          </div>
          <CardHeader className="p-8">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-primary/70">Wallet Balance</CardDescription>
            <CardTitle className="text-5xl font-black tracking-tighter text-white">
              {isProfileLoading ? "..." : (profile?.coins?.toLocaleString() || 0)} <span className="text-2xl align-top">🪙</span>
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-secondary/10 border-secondary/20 rounded-[2.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <TrendingUp className="h-32 w-32 text-secondary" />
          </div>
          <CardHeader className="p-8">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-secondary/70">Recent Earnings</CardDescription>
            <CardTitle className="text-5xl font-black tracking-tighter text-white">
              ₹{totalEarnings.toFixed(0)}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white/5 border-white/5 rounded-[2.5rem] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
             <Trophy className="h-32 w-32 text-white" />
          </div>
          <CardHeader className="p-8">
            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Battles Fought</CardDescription>
            <CardTitle className="text-5xl font-black tracking-tighter text-white">
              0
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
               <Clock className="h-5 w-5 text-primary" />
               Recent Activity
             </h3>
             <Button variant="link" asChild className="text-muted-foreground hover:text-primary font-bold">
                <Link href="/ledger">View Full Ledger <ChevronRight className="h-4 w-4" /></Link>
             </Button>
          </div>
          
          <Card className="bg-card/20 border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden">
             <CardContent className="p-0">
                {isActivityLoading ? (
                  <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className={cn(
                             "h-10 w-10 rounded-xl flex items-center justify-center",
                             activity.type === 'income' ? "bg-green-500/10 text-green-500" : 
                             activity.type === 'withdrawal' ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                           )}>
                             {activity.type === 'income' ? <TrendingUp className="h-5 w-5" /> : 
                              activity.type === 'withdrawal' ? <ArrowUpRight className="h-5 w-5" /> : <Wallet className="h-5 w-5" />}
                           </div>
                           <div>
                             <p className="text-sm font-black uppercase tracking-tight">{activity.type}</p>
                             <p className="text-[10px] text-muted-foreground font-medium">{activity.date}</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-lg font-black",
                            activity.type === 'withdrawal' ? "text-red-400" : "text-green-400"
                          )}>
                            {activity.type === 'withdrawal' ? '-' : '+'}₹{activity.amount}
                          </p>
                          <Badge variant="outline" className={cn(
                             "text-[8px] font-black uppercase py-0",
                             activity.status === 'completed' ? "border-green-500/20 text-green-500" : "border-yellow-500/20 text-yellow-500"
                          )}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-20 text-center space-y-4">
                     <Activity className="h-12 w-12 text-muted-foreground opacity-10 mx-auto" />
                     <p className="text-sm text-muted-foreground italic font-medium">No recent activity detected.</p>
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        {/* Sidebar / Quick Actions */}
        <div className="space-y-8">
          <Card className="bg-gradient-to-br from-primary to-primary/80 border-none rounded-[2rem] p-8 text-primary-foreground relative overflow-hidden">
             <Zap className="absolute -bottom-8 -right-8 h-40 w-40 opacity-20 rotate-12" />
             <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">Earn Faster</h3>
                  <p className="text-sm font-medium opacity-90 leading-relaxed">Watch daily videos and complete elite surveys to double your balance.</p>
                </div>
                <Button asChild className="w-full bg-white text-primary hover:bg-white/90 font-black rounded-xl h-12 shadow-xl">
                   <Link href="/rewards">GO TO REWARDS</Link>
                </Button>
             </div>
          </Card>

          <Card className="bg-card/40 border-white/5 rounded-[2rem] p-8 space-y-6">
             <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-secondary/10 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-secondary" />
               </div>
               <div>
                  <h3 className="text-sm font-black uppercase tracking-tight">Referral Squad</h3>
                  <p className="text-[10px] text-muted-foreground font-medium">Build your team, earn bonus</p>
               </div>
             </div>
             <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                   <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Referrals</p>
                   <p className="text-2xl font-black">0</p>
                </div>
                <Button variant="outline" asChild className="w-full border-secondary/30 text-secondary hover:bg-secondary/10 rounded-xl font-bold">
                   <Link href="/rewards">Get My Link</Link>
                </Button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
