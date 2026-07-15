
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, doc, query, limit, orderBy, updateDoc, increment, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
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
  Copy,
  Coins,
  Gift,
  Target,
  Smartphone,
  PlayCircle,
  Video,
  AlertCircle,
  ShoppingBag,
  Flag,
  Lock,
  Mail,
  Network,
  Users,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { UserProfile, UserLedgerEntry } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WalletModal from '@/components/WalletModal';
import ConnectWalletModal from '@/components/ConnectWalletModal';
import { useToast } from '@/hooks/use-toast';
import OfferWall from '@/components/OfferWall';
import LiveCricketWidget from '@/components/LiveCricketWidget';
import ActivationGateway from '@/components/ActivationGateway';
import ViralLeaderboard from '@/components/ViralLeaderboard';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState<'overview' | 'offers' | 'video' | 'mlm'>('overview');
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

  const { data: profile } = useDoc<UserProfile>(userProfileRef);
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
      toast({ title: "User ID Copied!" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const milestoneGoal = 1000;
  const milestoneProgress = Math.min(((profile?.networkTaskCompletions || 0) / milestoneGoal) * 100, 100);
  const isMilestoneHit = (profile?.networkTaskCompletions || 0) >= milestoneGoal;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary relative">
      {/* SECURITY LOCK OVERLAY */}
      {profile?.isSuspended && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
           <div className="max-w-md space-y-8 animate-in zoom-in-95 duration-500">
              <div className="h-32 w-32 bg-red-600/20 rounded-[3rem] border-2 border-red-600 flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(220,38,38,0.3)]">
                 <ShieldAlert className="h-16 w-16 text-red-600 animate-pulse" />
              </div>
              <div className="space-y-4">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Identity <span className="text-red-600">Locked</span></h2>
                 <p className="text-muted-foreground font-medium leading-relaxed">
                    Our anti-fraud engine has detected multiple accounts originating from this hardware signature. Your account has been suspended pending manual audit.
                 </p>
                 <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-xl">
                    <p className="text-[10px] font-black uppercase text-red-400">Violation: Device Collision Pattern</p>
                 </div>
              </div>
              <Button asChild variant="outline" className="h-14 px-10 border-white/10 text-white font-black uppercase">
                 <a href="https://t.me/bracketbattles_support" target="_blank">APPEAL SUSPENSION</a>
              </Button>
           </div>
        </div>
      )}

      <ConnectWalletModal isOpen={isConnectOpen} onOpenChange={setIsConnectOpen} />
      
      <aside className="w-80 border-r border-white/5 bg-[#0a0a0f] hidden lg:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-10 border-b border-white/5">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="font-black uppercase tracking-tighter text-2xl italic">MY <span className="text-primary">WALLET</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-8 space-y-2">
          <SidebarItem active={activeNav === 'overview'} icon={<LayoutDashboard />} label="Portfolio" onClick={() => setActiveNav('overview')} />
          <SidebarItem active={activeNav === 'mlm'} icon={<Network />} label="MLM Network" onClick={() => setActiveNav('mlm')} />
          <SidebarItem active={false} icon={<Mail />} label="My Inbox" href="/inbox" />
          <SidebarItem active={activeNav === 'video'} icon={<PlayCircle />} label="Watch & Earn" onClick={() => setActiveNav('video')} />
          <SidebarItem active={activeNav === 'offers'} icon={<Zap />} label="CPA Missions" onClick={() => setActiveNav('offers')} />
          <SidebarItem active={false} icon={<Flag />} label="Cricket Hub" href="/cricket" />
          <SidebarItem active={false} icon={<ShoppingBag />} label="In-App Shop" href="/shop" />
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-black uppercase text-xs italic">
            <LogOut className="h-5 w-5" /> Logout Account
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-80 p-6 md:p-12 lg:p-16 space-y-10 pb-32">
        {activeNav === 'overview' && (
          <>
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-4">
                <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px]">Verified Warrior</Badge>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">My <span className="text-primary">Portfolio</span></h1>
                <Card className="bg-white/5 border-white/10 p-4 rounded-xl flex items-center justify-between gap-4 max-w-sm">
                   <div className="truncate">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">User ID (UID)</p>
                      <p className="text-sm font-mono font-black text-primary truncate mt-1">{user.uid}</p>
                   </div>
                   <Button onClick={copyUid} variant="ghost" size="icon" className="h-10 w-10 shrink-0">
                      <Copy className="h-4 w-4" />
                   </Button>
                </Card>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => setIsConnectOpen(true)} 
                  className="bg-white/5 border border-white/10 h-16 px-8 rounded-xl text-lg font-black uppercase italic"
                >
                  Add Cash <ArrowUpRight className="ml-2 h-5 w-5 text-primary" />
                </Button>
                <WalletModal>
                  <Button variant="outline" className="border-primary/20 h-16 px-8 rounded-xl text-lg font-black uppercase italic text-primary">
                    View Wallet
                  </Button>
                </WalletModal>
              </div>
            </header>

            {/* MLM Milestone Prize Tracker */}
            <Card className="bg-amber-500/5 border-amber-500/20 border-2 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl animate-in slide-in-from-top-4 duration-700">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Trophy className="h-40 w-48 text-amber-500" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="space-y-6 flex-1 text-center md:text-left">
                     <div className="flex items-center justify-center md:justify-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-500 animate-pulse">
                           <Users />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Elite Network Milestone</h3>
                     </div>
                     <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-lg">
                        Reach <span className="text-white font-bold">1000 Verified Network Tasks</span> to claim your 30% Master Revenue Share. Fraudulent activity detected by IP/Device signatures is excluded.
                     </p>
                     <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                           <span className="text-muted-foreground">Clean Network Progress</span>
                           <span className="text-amber-400">{profile?.networkTaskCompletions || 0} / 1000 Tasks Completed</span>
                        </div>
                        <Progress value={milestoneProgress} className="h-3 bg-white/5" />
                     </div>
                  </div>
                  <div className="w-full md:w-auto flex flex-col gap-3">
                     <div className="p-6 bg-black/40 rounded-2xl border border-white/5 text-center">
                        <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Potential Payout</p>
                        <p className="text-3xl font-black text-amber-500 italic">{( (profile?.totalNetworkRevenue || 0) * 0.3 ).toFixed(1)} 🪙</p>
                     </div>
                     {isMilestoneHit && (
                        <Badge className="bg-green-500 text-black font-black uppercase italic px-4 py-2 mx-auto">Milestone Hit! Payout Active</Badge>
                     )}
                  </div>
               </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <WalletCard label="Winning Cash" value={profile?.winningBalance || 0} icon={<Trophy />} color="green" />
              <WalletCard label="Deposit Cash" value={profile?.depositBalance || 0} icon={<CreditCard />} color="blue" />
              <WalletCard label="Bonus Balance" value={profile?.bonusBalance || 0} icon={<Zap />} color="amber" />
              <WalletCard label="Network Commission" value={profile?.referralCommissionBalance || 0} icon={<Network />} color="primary" />
            </div>

            <LiveCricketWidget />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              <div className="xl:col-span-2 space-y-8">
                <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic">
                  <History className="h-6 w-6 text-primary" /> Recent Activity
                </h3>
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                  {isActivityLoading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                  ) : recentActivity && recentActivity.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <TrendingUp className="h-5 w-5 text-primary" />
                             </div>
                             <div>
                                <p className="text-sm font-bold uppercase text-white">{activity.description || activity.type}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{activity.date}</p>
                             </div>
                          </div>
                          <p className={cn("text-xl font-black", activity.amount < 0 ? "text-red-400" : "text-green-400")}>
                            {activity.amount > 0 ? '+' : ''}{activity.amount} 🪙
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-32 text-center text-muted-foreground uppercase font-black text-xs">No recent signals.</div>
                  )}
                </Card>
              </div>

              <div className="space-y-8">
                 <h3 className="text-2xl font-black uppercase italic flex items-center gap-3">
                   <Zap className="h-6 w-6 text-primary" /> Viral Growth
                 </h3>
                 <ViralLeaderboard />
              </div>
            </div>
          </>
        )}

        {activeNav === 'mlm' && (
           <div className="space-y-12">
              <div className="space-y-4">
                 <h1 className="text-5xl font-black uppercase italic tracking-tighter">Network <span className="text-primary">Intelligence</span></h1>
                 <p className="text-muted-foreground">Monitor your tiered downline and milestone prize pool.</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                 <Card className="bg-white/5 border-white/10 p-8 rounded-[2rem] space-y-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Downline Tasks</p>
                    <h3 className="text-3xl font-black italic">{profile?.networkTaskCompletions || 0} / 1000</h3>
                    <Progress value={milestoneProgress} className="h-2 bg-white/5" />
                 </Card>
                 <Card className="bg-white/5 border-white/10 p-8 rounded-[2rem] space-y-4">
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Total Revenue Share</p>
                    <h3 className="text-3xl font-black italic text-primary">{((profile?.totalNetworkRevenue || 0) * 0.3).toFixed(2)} 🪙</h3>
                 </Card>
                 <Card className="bg-primary/10 border-primary/20 p-8 rounded-[2rem] space-y-4">
                    <p className="text-[10px] font-black uppercase text-primary">Withdrawable Comm</p>
                    <h3 className="text-3xl font-black italic text-white">{profile?.referralCommissionBalance?.toFixed(2) || 0} 🪙</h3>
                 </Card>
              </div>

              <div className="space-y-6">
                 <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Network className="text-primary" /> Milestone Payout Protocol</h3>
                 <div className="grid md:grid-cols-2 gap-8">
                    <MlmRule icon={<Zap />} title="30% Network Prize" desc="When 1000 tasks are completed in your network, you are eligible for 30% of that total revenue as a master prize." />
                    <MlmRule icon={<Users />} title="Tiered Hierarchy" desc="Commission is split between L1 (20%) and L2 (10%) parents in real-time." />
                 </div>
              </div>
           </div>
        )}

        {activeNav === 'offers' && (
           <div className="space-y-10">
              <div className="space-y-4">
                 <h1 className="text-5xl font-black uppercase italic tracking-tighter">CPA <span className="text-primary">Missions</span></h1>
                 <p className="text-muted-foreground max-w-xl">Fulfill strategic goals to earn bonus coins directly in your wallet.</p>
              </div>
              <OfferWall />
           </div>
        )}

        {activeNav === 'video' && (
           <div className="space-y-10">
              <div className="space-y-4">
                 <h1 className="text-5xl font-black uppercase italic tracking-tighter">Watch <span className="text-primary">& Earn</span></h1>
                 <p className="text-muted-foreground max-w-xl">Analyze sponsored video signals to claim instant rewards.</p>
              </div>
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-12 text-center space-y-8">
                 <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                    <Video className="h-12 w-12 text-primary" />
                 </div>
                 <h3 className="text-3xl font-black uppercase italic">Deployment Area</h3>
                 <p className="text-muted-foreground text-sm font-bold uppercase">Earn 2 Bonus Coins per signal watched.</p>
                 <Button asChild className="h-20 px-12 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl">
                    <Link href="/earning-hub">GO TO HUB</Link>
                 </Button>
              </Card>
           </div>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick, href }: any) {
  const content = (
    <>
      <span className={cn("h-5 w-5 transition-all", active ? "scale-110 text-white" : "text-muted-foreground")}>{icon}</span>
      <span className="text-xs font-bold uppercase italic">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("w-full flex items-center gap-6 px-8 py-4 rounded-xl transition-all", active ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-6 px-8 py-4 rounded-xl transition-all", active ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}>
      {content}
    </button>
  );
}

function WalletCard({ label, value, icon, color }: any) {
  const colorMap = {
    blue: "border-blue-500/20 text-blue-400 bg-blue-500/5",
    amber: "border-amber-500/20 text-amber-500 bg-amber-500/5",
    green: "border-green-500/20 text-green-500 bg-green-500/5",
    primary: "border-primary/20 text-primary bg-primary/5"
  };

  return (
    <Card className={cn("p-6 rounded-[2rem] border-2 transition-all hover:scale-105 shadow-xl", colorMap[color as keyof typeof colorMap])}>
      <div className="space-y-4">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", colorMap[color as keyof typeof colorMap])}>{icon}</div>
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-1">{label}</p>
          <h4 className="text-3xl font-black text-white italic tracking-tighter">{value.toLocaleString()} 🪙</h4>
        </div>
      </div>
    </Card>
  );
}

function MlmRule({ icon, title, desc }: any) {
  return (
    <div className="flex items-start gap-4">
       <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 text-primary shrink-0">
          {icon}
       </div>
       <div>
          <h4 className="text-sm font-black uppercase italic text-white">{title}</h4>
          <p className="text-[11px] text-muted-foreground font-bold leading-relaxed">{desc}</p>
       </div>
    </div>
  );
}
