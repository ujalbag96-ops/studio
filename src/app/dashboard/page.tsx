
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
  Copy
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
      router.push('/login');
    }
  };

  const copyUid = () => {
    if (user?.uid) {
      navigator.clipboard.writeText(user.uid);
      toast({ title: "System ID Copied", description: "Provide this to admin for capital injection." });
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Establishing Secure Identity...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-6 bg-[#050508]">
        <Shield className="h-20 w-20 text-muted-foreground opacity-20" />
        <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Identity Verification Required</h2>
        <Button asChild size="lg" className="rounded-2xl font-black px-12 h-14 bg-primary shadow-xl">
          <Link href="/login">AUTHENTICATE IDENTITY</Link>
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
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 transition-transform group-hover:rotate-0">
              <Briefcase className="h-6 w-6 text-white" />
            </div>
            <span className="font-black uppercase tracking-tighter text-2xl italic">SYSTEM<span className="text-primary">OVERVIEW</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-8 space-y-2">
          <div className="pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-4 px-4">Portfolio Management</p>
            <SidebarItem active={activeNav === 'overview'} icon={<LayoutDashboard />} label="DASHBOARD OVERVIEW" onClick={() => setActiveNav('overview')} />
            <SidebarItem active={activeNav === 'activity'} icon={<Zap />} label="INCENTIVE HUB" href="/earning-hub" />
            <SidebarItem active={activeNav === 'ledger'} icon={<History />} label="FINANCIAL LEDGER" href="/ledger" />
            <SidebarItem active={activeNav === 'finance'} icon={<Wallet />} label="ASSET EXTRACTION" href="/withdraw" />
          </div>
          
          <div className="pt-8 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 mb-4 px-4">Account Status</p>
            <SidebarItem active={false} icon={<Crown className="text-amber-500" />} label={`${profile?.rank?.toUpperCase() || 'STANDARD'} STATUS`} href="/levels" />
          </div>
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-black uppercase text-[10px] tracking-widest">
            <LogOut className="h-5 w-5" /> TERMINATE SESSION
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-80 p-6 md:p-12 lg:p-16 space-y-12 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Verified Professional</Badge>
               <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> <Wifi className="h-3 w-3" /> Real-time Synchronized
               </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">Analytical <span className="text-primary">Portfolio</span></h1>
            <div className="flex items-center gap-4">
               <p className="text-muted-foreground font-medium text-sm">Warrior ID: <span className="text-white font-mono text-xs">{user.uid}</span></p>
               <Button onClick={copyUid} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/5"><Copy className="h-4 w-4" /></Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button onClick={() => setIsConnectOpen(true)} className="bg-white/5 border border-white/10 hover:bg-white/10 h-16 px-8 rounded-2xl text-lg font-black italic uppercase">
              CONNECT WALLET <ArrowUpRight className="ml-2 h-5 w-5 text-primary" />
            </Button>
            <WalletModal>
              <Button variant="outline" className="border-primary/20 hover:bg-primary/10 h-16 px-8 rounded-2xl text-lg font-black italic uppercase text-primary">
                MANAGE ASSETS
              </Button>
            </WalletModal>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <WalletCard 
            label="Investment Portfolio" 
            value={profile?.depositBalance || 0} 
            icon={<CreditCard />} 
            description="Allocated capital for participation"
            color="blue"
          />
          <WalletCard 
            label="Incentive Accruals" 
            value={profile?.taskBalance || 0} 
            icon={<Zap />} 
            description="Yield from analytical tasks"
            color="amber"
          />
          <WalletCard 
            label="Withdrawable Assets" 
            value={profile?.winningBalance || 0} 
            icon={<Trophy />} 
            description="Verified profit distributions"
            color="green"
            isWithdrawable
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-8">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4 italic">
                 <Activity className="h-6 w-6 text-primary" />
                 Operational History
               </h3>
               <Button variant="ghost" asChild className="text-muted-foreground hover:text-primary font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl border border-white/5">
                  <Link href="/ledger">FULL AUDIT <ChevronRight className="h-4 w-4 ml-2" /></Link>
               </Button>
            </div>
            
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl min-h-[300px]">
              <CardContent className="p-0">
                {isActivityLoading ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="p-10 flex items-center justify-between hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-6">
                           <div className={cn(
                             "h-16 w-16 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110 shadow-2xl",
                             activity.type === 'income' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                             activity.type === 'withdrawal' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                           )}>
                             {activity.type === 'income' ? <TrendingUp className="h-7 w-7" /> : 
                              activity.type === 'withdrawal' ? <ArrowUpRight className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
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
                            {activity.type === 'withdrawal' ? `₹${activity.amount.toFixed(2)}` : `${activity.amount.toFixed(1)} 🪙`}
                          </p>
                          <Badge variant="outline" className={cn(
                             "text-[9px] font-black uppercase px-4 py-1 border-2",
                             activity.status === 'completed' ? "border-green-500/40 text-green-500" : "border-yellow-500/40 text-yellow-500"
                          )}>
                            {activity.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-32 text-center space-y-6">
                     <History className="h-20 w-20 text-muted-foreground opacity-10 mx-auto" />
                     <p className="text-sm text-muted-foreground italic font-black uppercase tracking-[0.4em]">No analytical records found.</p>
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
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic">Incentive Hub</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">Accumulate supplemental credits by fulfilling high-yield analytical tasks.</p>
               </div>
               <Button asChild className="w-full bg-primary hover:bg-primary/90 h-18 rounded-[1.5rem] font-black uppercase tracking-widest text-lg shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  <Link href="/earning-hub">ACCESS MISSIONS</Link>
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
      <span className={cn("h-6 w-6 transition-all", active ? "scale-125 text-white" : "text-muted-foreground")}>{icon}</span>
      <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">{label}</span>
      {active && <div className="absolute left-3 h-6 w-1 bg-primary rounded-full shadow-[0_0_15px_#FF7B00]" />}
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

function WalletCard({ label, value, icon, description, color, isWithdrawable }: any) {
  const colorMap = {
    blue: "border-blue-500/20 text-blue-400 bg-blue-500/5",
    amber: "border-amber-500/20 text-amber-500 bg-amber-500/5",
    green: "border-green-500/20 text-green-500 bg-green-500/5"
  };

  return (
    <Card className={cn(
      "relative overflow-hidden p-8 rounded-[2.5rem] border-2 transition-all hover:scale-[1.05] duration-500 shadow-2xl group",
      colorMap[color as keyof typeof colorMap]
    )}>
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-1000">
         {icon}
      </div>
      <div className="relative z-10 space-y-6">
        <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border-2 shadow-2xl", colorMap[color as keyof typeof colorMap])}>
           {icon}
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/60 mb-2">{label}</p>
          <h4 className="text-4xl font-black text-white italic tracking-tighter tabular-nums flex items-baseline gap-2">
            {(value || 0).toFixed(1)} <span className="text-lg opacity-40 font-bold">🪙</span>
          </h4>
          <p className="text-[9px] font-bold text-muted-foreground mt-4 uppercase tracking-widest italic">{description}</p>
          {isWithdrawable && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <Badge className="bg-green-500 text-black font-black uppercase text-[8px] px-3">Liquidity Confirmed</Badge>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
