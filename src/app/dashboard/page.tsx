
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, limit, orderBy } from 'firebase/firestore';
import { 
  LayoutDashboard,
  Wallet, 
  Trophy, 
  Zap, 
  History, 
  Settings, 
  ChevronRight,
  Activity,
  Shield,
  Loader2,
  Target,
  Sword,
  TrendingUp,
  ArrowUpRight,
  LogOut,
  User as UserIcon,
  Crown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserProfile, UserLedgerEntry } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState('hq');

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  
  const ledgerQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'ledger'),
      orderBy('date', 'desc'),
      limit(6)
    );
  }, [firestore, user]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);
  const { data: recentActivity, isLoading: isActivityLoading } = useCollection<UserLedgerEntry>(ledgerQuery);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050508]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-6 bg-[#050508]">
        <Shield className="h-20 w-20 text-muted-foreground opacity-20" />
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Identity Required</h2>
        <Button asChild size="lg" className="rounded-2xl font-black px-12 h-14 bg-primary shadow-xl">
          <Link href="/login">IDENTIFY MYSELF</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary selection:text-white">
      {/* Tactical Sidebar (Desktop Only) */}
      <aside className="w-80 border-r border-white/5 bg-[#0a0a0f] hidden lg:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-10 border-b border-white/5">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 transition-transform group-hover:rotate-0">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="font-black uppercase tracking-tighter text-2xl italic">ARENA<span className="text-primary">HQ</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-8 space-y-2">
          <div className="pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-4 px-4">Tactical Sectors</p>
            <SidebarItem active={activeNav === 'hq'} icon={<LayoutDashboard />} label="COMMAND HQ" onClick={() => setActiveNav('hq')} />
            <SidebarItem active={activeNav === 'earning'} icon={<Zap />} label="EARNING HUB" href="/earning-hub" />
            <SidebarItem active={activeNav === 'ledger'} icon={<History />} label="OPERATIONAL LOG" href="/ledger" />
            <SidebarItem active={activeNav === 'vault'} icon={<Wallet />} label="TACTICAL VAULT" href="/withdraw" />
          </div>
          
          <div className="pt-8 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-4 px-4">Warrior Rank</p>
            <SidebarItem active={false} icon={<Crown className="text-amber-500" />} label="BRONZE TIER I" href="/levels" />
          </div>
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-black uppercase text-[10px] tracking-widest">
            <LogOut className="h-5 w-5" /> TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* Main Operational Sector */}
      <main className="flex-1 lg:ml-80 p-6 md:p-12 lg:p-16 space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
               <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Active Warrior</Badge>
               <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live Status
               </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">Operational <span className="text-primary">Brief</span></h1>
            <p className="text-muted-foreground font-medium text-lg">Welcome back, <span className="text-white font-black">{user.email?.split('@')[0]}</span>. System stabilized.</p>
          </div>

          <div className="flex items-center gap-4">
            <Card className="bg-white/5 border-white/10 p-4 rounded-2xl flex items-center gap-4 backdrop-blur-3xl">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Arena Rank</p>
                <p className="text-sm font-black text-white uppercase italic">Elite Bronze</p>
              </div>
            </Card>
          </div>
        </header>

        {/* Intelligence Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <HQStatsCard 
            title="Total Assets" 
            value={isProfileLoading ? "---" : (profile?.coins?.toLocaleString() || 0)} 
            suffix="🪙"
            icon={<Wallet />} 
            description="Combined credit value"
            color="white"
          />
          <HQStatsCard 
            title="Withdrawable Winnings" 
            value={isProfileLoading ? "---" : (profile?.withdrawableCoins?.toLocaleString() || 0)} 
            suffix="🪙"
            icon={<Trophy />} 
            description="Verified battle earnings"
            color="primary"
          />
          <HQStatsCard 
            title="Conversion Value" 
            value={`₹${((profile?.withdrawableCoins || 0) / 10).toFixed(2)}`} 
            icon={<TrendingUp />} 
            description="Estimated local currency"
            color="secondary"
          />
        </div>

        {/* Mission & Battle Log Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 italic">
                 <Activity className="h-6 w-6 text-primary" />
                 Operational Log
               </h3>
               <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl border border-white/5">
                  <Link href="/ledger">Full Intel <ChevronRight className="h-4 w-4 ml-2" /></Link>
               </Button>
            </div>
            
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
              <CardContent className="p-0">
                {isActivityLoading ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="p-10 flex items-center justify-between hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                             "h-16 w-16 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 group-hover:rotate-12 shadow-2xl",
                             activity.type === 'income' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                             activity.type === 'withdrawal' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                           )}>
                             {activity.type === 'income' ? <TrendingUp className="h-7 w-7" /> : 
                              activity.type === 'withdrawal' ? <ArrowUpRight className="h-7 w-7" /> : <Sword className="h-7 w-7" />}
                           </div>
                           <div className="space-y-1">
                             <p className="text-lg font-black uppercase tracking-tight group-hover:text-primary transition-colors">{activity.description || activity.type}</p>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{activity.date}</p>
                           </div>
                        </div>
                        <div className="text-right space-y-3">
                          <p className={cn(
                            "text-3xl font-black tracking-tighter",
                            activity.type === 'withdrawal' || activity.type === 'entry_fee' ? "text-red-400" : "text-green-400"
                          )}>
                            {activity.type === 'withdrawal' || activity.type === 'entry_fee' ? '-' : '+'}
                            {activity.type === 'withdrawal' ? `₹${activity.amount.toFixed(2)}` : `${activity.amount} 🪙`}
                          </p>
                          <Badge variant="outline" className={cn(
                             "text-[9px] font-black uppercase px-4 py-1 border-2",
                             activity.status === 'completed' ? "border-green-500/40 text-green-500" : "border-yellow-500/40 text-yellow-500"
                          )}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-32 text-center space-y-6">
                     <History className="h-20 w-20 text-muted-foreground opacity-10 mx-auto" />
                     <p className="text-sm text-muted-foreground italic font-black uppercase tracking-[0.4em]">No operational data logged.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-10">
            <Card className="bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f] border-primary/20 border-2 rounded-[3rem] p-10 text-center space-y-10 shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
                  <Zap className="h-32 w-32 text-primary" />
               </div>
               <div className="mx-auto h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl">
                  <Zap className="h-12 w-12 text-primary animate-pulse" />
               </div>
               <div className="space-y-4 relative z-10">
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic">Tactical Boost</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">Earn credit directly into your <span className="text-white font-bold">Tactical Vault</span> by completing high-stakes missions.</p>
               </div>
               <Button asChild className="w-full bg-primary hover:bg-primary/90 h-18 rounded-[1.5rem] font-black uppercase tracking-widest text-lg shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  <Link href="/earning-hub">DEPLOY TO HUB</Link>
               </Button>
            </aside>

            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl border-l-4 border-l-secondary">
               <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                  <Shield className="h-5 w-5 text-secondary" />
                  HQ Policy
               </h3>
               <div className="space-y-4 text-xs font-medium text-muted-foreground leading-relaxed">
                  <p>• Only <span className="text-white">Winning Balance</span> can be converted to local currency.</p>
                  <p>• Minimum payout starts at <span className="text-white">₹110</span>.</p>
                  <p>• Tactical processing fee of <span className="text-white">8%</span> applies to all vault transfers.</p>
               </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation (Native App Style) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-24 bg-[#0a0a0f]/80 backdrop-blur-3xl border-t border-white/10 flex items-center justify-around px-4">
        <MobileNavItem active={activeNav === 'hq'} icon={<LayoutDashboard />} label="HQ" href="/dashboard" />
        <MobileNavItem active={activeNav === 'earning'} icon={<Zap />} label="EARN" href="/earning-hub" />
        <MobileNavItem active={activeNav === 'ledger'} icon={<History />} label="LOG" href="/ledger" />
        <MobileNavItem active={activeNav === 'vault'} icon={<Wallet />} label="VAULT" href="/withdraw" />
      </nav>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick, href }: any) {
  const content = (
    <>
      <span className={cn("h-6 w-6 transition-all", active ? "scale-125 rotate-6 text-white" : "text-muted-foreground")}>{icon}</span>
      <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">{label}</span>
      {active && <div className="absolute left-3 h-6 w-1 bg-primary rounded-full shadow-[0_0_15px_#9345FF]" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("w-full flex items-center gap-6 px-8 py-5 rounded-[1.5rem] transition-all duration-300 relative group", active ? "bg-primary text-white shadow-2xl shadow-primary/40" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-6 px-8 py-5 rounded-[1.5rem] transition-all duration-300 relative group", active ? "bg-primary text-white shadow-2xl shadow-primary/40" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      {content}
    </button>
  );
}

function MobileNavItem({ active, icon, label, href }: any) {
  return (
    <Link href={href} className={cn("flex flex-col items-center gap-1.5 px-6 py-2 rounded-2xl transition-all", active ? "text-primary scale-110" : "text-muted-foreground")}>
      <span className={cn("h-6 w-6", active && "animate-pulse")}>{icon}</span>
      <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      {active && <div className="absolute -bottom-1 h-1 w-4 bg-primary rounded-full shadow-[0_0_10px_#9345FF]" />}
    </Link>
  );
}

function HQStatsCard({ title, value, suffix, icon, description, color }: any) {
  const colorMap = {
    primary: "border-primary/20 text-primary bg-primary/5",
    secondary: "border-secondary/20 text-secondary bg-secondary/5",
    white: "border-white/10 text-white bg-white/5"
  };

  return (
    <Card className={cn(
      "relative overflow-hidden p-10 rounded-[3rem] border-2 transition-all hover:scale-[1.05] duration-500 shadow-2xl group",
      colorMap[color as keyof typeof colorMap]
    )}>
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-1000">
         {icon}
      </div>
      <div className="relative z-10 space-y-6">
        <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center border-2 shadow-2xl", colorMap[color as keyof typeof colorMap])}>
           {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 mb-2">{title}</p>
          <h4 className="text-5xl font-black text-white italic tracking-tighter tabular-nums">
            {value} <span className="text-2xl align-top opacity-40">{suffix}</span>
          </h4>
          <p className="text-[9px] font-bold text-muted-foreground mt-4 uppercase tracking-widest italic">{description}</p>
        </div>
      </div>
    </Card>
  );
}
