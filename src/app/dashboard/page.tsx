'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, limit, orderBy } from 'firebase/firestore';
import { 
  LayoutDashboard,
  Wallet, 
  Trophy, 
  Zap, 
  History, 
  ChevronRight,
  Activity,
  Shield,
  Loader2,
  TrendingUp,
  ArrowUpRight,
  LogOut,
  CreditCard,
  Crown,
  Briefcase,
  ShieldCheck,
  Wifi,
  Copy,
  Coins
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
import WalletModal from '@/components/WalletModal';
import ConnectWalletModal from '@/components/ConnectWalletModal';
import { useToast } from '@/hooks/use-toast';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState('overview');
  const [isConnectOpen, setIsConnectOpen] = useState(false);

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
      toast({ title: "Logged Out Successfully" });
      router.push('/login');
    }
  };

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      toast({ title: "User ID Copied!", description: "Share this ID with Admin to add coins." });
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Opening Your Account...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-6 bg-[#050508]">
        <Shield className="h-20 w-20 text-muted-foreground opacity-20" />
        <h2 className="text-3xl font-black uppercase text-white">Login Required</h2>
        <Button asChild size="lg" className="rounded-xl font-black px-12 h-14 bg-primary shadow-xl">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary selection:text-white">
      <ConnectWalletModal isOpen={isConnectOpen} onOpenChange={setIsConnectOpen} />
      
      <aside className="w-80 border-r border-white/5 bg-[#0a0a0f] hidden lg:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-10 border-b border-white/5">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="font-black uppercase tracking-tighter text-2xl italic">My <span className="text-primary">Profile</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-8 space-y-2">
          <div className="pb-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-4 px-4">Main Menu</p>
            <SidebarItem active={activeNav === 'overview'} icon={<LayoutDashboard />} label="Dashboard" onClick={() => setActiveNav('overview')} />
            <SidebarItem active={activeNav === 'activity'} icon={<Zap />} label="Earn Free Coins" href="/earning-hub" />
            <SidebarItem active={activeNav === 'ledger'} icon={<History />} label="Transactions" href="/ledger" />
            <SidebarItem active={activeNav === 'finance'} icon={<Wallet />} label="Withdraw Cash" href="/withdraw" />
          </div>
          
          <div className="pt-8 border-t border-white/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-4 px-4">Level Status</p>
            <SidebarItem active={false} icon={<Crown className="text-amber-500" />} label={`${profile?.rank?.toUpperCase() || 'STANDARD'} Level`} href="/levels" />
          </div>
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-black uppercase text-xs">
            <LogOut className="h-5 w-5" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-80 p-6 md:p-12 lg:p-16 space-y-10 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px]">Verified Player</Badge>
               <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold uppercase">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> Live Connected
               </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">My <span className="text-primary">Dashboard</span></h1>
            
            {/* User ID Section - Highly Visible */}
            <Card className="bg-white/5 border-white/10 p-4 rounded-xl flex items-center justify-between gap-4 max-w-sm">
               <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">My User ID (Share with Admin)</p>
                  <p className="text-sm font-mono font-black text-primary truncate mt-1">{user.uid}</p>
               </div>
               <Button onClick={copyUid} variant="ghost" size="icon" className="h-10 w-10 bg-white/5 hover:bg-primary/20 hover:text-primary">
                  <Copy className="h-4 w-4" />
               </Button>
            </Card>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={() => setIsConnectOpen(true)} className="bg-white/5 border border-white/10 hover:bg-white/10 h-16 px-8 rounded-xl text-lg font-black uppercase">
              Add Money <ArrowUpRight className="ml-2 h-5 w-5 text-primary" />
            </Button>
            <WalletModal>
              <Button variant="outline" className="border-primary/20 hover:bg-primary/10 h-16 px-8 rounded-xl text-lg font-black uppercase text-primary">
                My Wallet
              </Button>
            </WalletModal>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <WalletCard 
            label="Total Balance" 
            value={profile?.coins || 0} 
            icon={<Coins />} 
            description="All coins combined"
            color="primary"
          />
          <WalletCard 
            label="Winning Cash" 
            value={profile?.winningBalance || 0} 
            icon={<Trophy />} 
            description="Ready to withdraw"
            color="green"
          />
          <WalletCard 
            label="Deposit Cash" 
            value={profile?.depositBalance || 0} 
            icon={<CreditCard />} 
            description="Added via Payments"
            color="blue"
          />
          <WalletCard 
            label="Bonus Coins" 
            value={profile?.taskBalance || 0} 
            icon={<Zap />} 
            description="Earned from tasks"
            color="amber"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 italic">
                 <History className="h-6 w-6 text-primary" />
                 Recent Activity
               </h3>
               <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary font-bold uppercase text-xs h-10 px-6 rounded-xl border border-white/5">
                  <Link href="/ledger">Full History <ChevronRight className="h-4 w-4 ml-2" /></Link>
               </Button>
            </div>
            
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl min-h-[300px]">
              <CardContent className="p-0">
                {isActivityLoading ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                             "h-12 w-12 rounded-xl flex items-center justify-center border transition-all group-hover:scale-110 shadow-lg",
                             activity.type === 'income' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                             activity.type === 'withdrawal' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                           )}>
                             {activity.type === 'income' ? <TrendingUp className="h-5 w-5" /> : 
                              activity.type === 'withdrawal' ? <ArrowUpRight className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                           </div>
                           <div className="space-y-1">
                             <p className="text-sm font-bold uppercase text-white group-hover:text-primary transition-colors">{activity.description || activity.type}</p>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase">{activity.date}</p>
                           </div>
                        </div>
                        <div className="text-right space-y-2">
                          <p className={cn(
                            "text-xl font-black tracking-tighter",
                            activity.type === 'withdrawal' || activity.type === 'entry_fee' ? "text-red-400" : "text-green-400"
                          )}>
                            {activity.type === 'withdrawal' || activity.type === 'entry_fee' ? '-' : '+'}
                            {activity.type === 'withdrawal' ? `₹${activity.amount.toFixed(2)}` : `${activity.amount.toFixed(1)} 🪙`}
                          </p>
                          <Badge variant="outline" className={cn(
                             "text-[8px] font-black uppercase border-none",
                             activity.status === 'completed' ? "text-green-500" : "text-yellow-500"
                          )}>
                            {activity.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-32 text-center space-y-4">
                     <History className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
                     <p className="text-sm text-muted-foreground italic font-bold uppercase">No records found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-10">
            <Card className="bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f] border-primary/20 border-2 rounded-[2rem] p-10 text-center space-y-10 shadow-2xl relative overflow-hidden group">
               <div className="mx-auto h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Zap className="h-10 w-10 text-primary animate-pulse" />
               </div>
               <div className="space-y-4 relative z-10">
                  <h3 className="text-3xl font-black uppercase italic">Free Coins</h3>
                  <p className="text-sm text-muted-foreground font-medium">Watch videos and complete tasks to earn coins for free.</p>
               </div>
               <Button asChild className="w-full bg-primary hover:bg-primary/90 h-16 rounded-xl font-black uppercase tracking-widest text-lg transition-all hover:scale-105">
                  <Link href="/earning-hub">Earn Now</Link>
               </Button>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick, href }: any) {
  const content = (
    <>
      <span className={cn("h-5 w-5 transition-all", active ? "scale-110 text-white" : "text-muted-foreground")}>{icon}</span>
      <span className="text-xs font-bold uppercase italic">{label}</span>
      {active && <div className="absolute left-0 h-6 w-1 bg-primary rounded-full" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("w-full flex items-center gap-6 px-8 py-4 rounded-xl transition-all relative", active ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-6 px-8 py-4 rounded-xl transition-all relative", active ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      {content}
    </button>
  );
}

function WalletCard({ label, value, icon, description, color }: any) {
  const colorMap = {
    primary: "border-primary/20 text-primary bg-primary/5",
    blue: "border-blue-500/20 text-blue-400 bg-blue-500/5",
    amber: "border-amber-500/20 text-amber-500 bg-amber-500/5",
    green: "border-green-500/20 text-green-500 bg-green-500/5"
  };

  return (
    <Card className={cn(
      "relative overflow-hidden p-6 rounded-[2rem] border-2 transition-all hover:scale-105 shadow-xl group",
      colorMap[color as keyof typeof colorMap]
    )}>
      <div className="relative z-10 space-y-4">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border shadow-md", colorMap[color as keyof typeof colorMap])}>
           {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-1">{label}</p>
          <h4 className="text-3xl font-black text-white italic tracking-tighter tabular-nums flex items-baseline gap-2">
            {(value || 0).toLocaleString()} <span className="text-sm opacity-40 font-bold">🪙</span>
          </h4>
          <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase italic">{description}</p>
        </div>
      </div>
    </Card>
  );
}
