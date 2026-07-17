
'use client';

import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { collection, doc, query, limit, orderBy, updateDoc, increment, addDoc, where } from 'firebase/firestore';
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
  Coins,
  Gift,
  Target,
  PlayCircle,
  Video,
  Lock,
  Network,
  Users,
  CheckCircle2,
  ShieldCheck,
  Star,
  Flame,
  Globe,
  Scale,
  DollarSign
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
import ConnectWalletModal from '@/components/ConnectWalletModal';
import { useToast } from '@/hooks/use-toast';
import ViralLeaderboard from '@/components/ViralLeaderboard';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState<'overview' | 'offers' | 'video' | 'mlm'>('overview');
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

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

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const vipTiers = [
    { tasks: 0, level: 0, name: 'Starter' },
    { tasks: 10, level: 1, name: 'Rookie' },
    { tasks: 30, level: 2, name: 'Warrior' },
    { tasks: 50, level: 3, name: 'Pro' },
    { tasks: 100, level: 4, name: 'Master' },
    { tasks: 200, level: 5, name: 'Elite' }
  ];
  const currentVip = profile?.vipLevel || 0;
  const tasksDone = profile?.tasksCompletedCount || 0;
  const nextTier = vipTiers.find(t => t.level === currentVip + 1) || vipTiers[vipTiers.length - 1];
  const prevTierTasks = vipTiers.find(t => t.level === currentVip)?.tasks || 0;
  
  const vipProgress = currentVip === 5 ? 100 : Math.min(((tasksDone - prevTierTasks) / (nextTier.tasks - prevTierTasks)) * 100, 100);

  const totalEarned = (recentActivity?.filter(a => a.amount > 0).reduce((acc, curr) => acc + curr.amount, 0) || 0);
  const totalWithdrawn = (recentActivity?.filter(a => a.type === 'withdrawal' && a.status === 'completed').reduce((acc, curr) => acc + Math.abs(curr.amount), 0) || 0);

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary relative">
      <ConnectWalletModal isOpen={isConnectOpen} onOpenChange={setIsConnectOpen} />
      <RiskDisclosureModal isOpen={showLegal} onOpenChange={setShowLegal} />
      
      <aside className="w-80 border-r border-white/5 bg-[#0a0a0f] hidden lg:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-10 border-b border-white/5">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="font-black uppercase tracking-tighter text-2xl italic">MY <span className="text-primary">ARENA</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-8 space-y-2">
          <SidebarItem active={activeNav === 'overview'} icon={<LayoutDashboard />} label="Portfolio" onClick={() => setActiveNav('overview')} />
          <SidebarItem active={activeNav === 'mlm'} icon={<Network />} label="MLM Network" onClick={() => setActiveNav('mlm')} />
          <SidebarItem active={false} icon={<Scale />} label="Legal & Security" onClick={() => setShowLegal(true)} />
          <SidebarItem active={activeNav === 'video'} icon={<PlayCircle />} label="Watch & Earn" onClick={() => setActiveNav('video')} />
          <SidebarItem active={activeNav === 'offers'} icon={<Zap />} label="Ad Rewards" onClick={() => setActiveNav('offers')} />
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-black uppercase text-xs italic">
            <LogOut className="h-5 w-5" /> Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-80 p-6 md:p-12 lg:p-16 space-y-10 pb-32">
        {activeNav === 'overview' && (
          <>
            <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                   <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px]">Verified Student Warrior</Badge>
                   <Badge className="bg-amber-500/20 text-amber-500 border-none uppercase font-black px-4 py-1 text-[10px] flex items-center gap-1.5">
                      <Star className="h-3 w-3 fill-amber-500" /> VIP LEVEL {currentVip}
                   </Badge>
                </div>
                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">Student <span className="text-primary">Vault</span></h1>
              </div>

              <Card className="bg-[#121216] border-amber-500/20 border-2 rounded-[2rem] p-6 w-full max-w-sm relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Crown className="h-20 w-20 text-amber-500" />
                 </div>
                 <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black uppercase text-amber-500 italic">Weekly Goal Pulse</p>
                       <span className="text-[9px] font-bold text-muted-foreground">{profile?.weeklyPointsEarned || 0} / 50 🪙</span>
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-lg font-black uppercase italic">₹{50 - (profile?.weeklyPointsEarned || 0)} More to Earn!</h4>
                       <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed">
                          Earn 50 coins total this week to unlock your Saturday payout protocol.
                       </p>
                       <Progress value={((profile?.weeklyPointsEarned || 0) / 50) * 100} className="h-2 bg-white/5" />
                    </div>
                 </div>
              </Card>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <WalletCard label="Winning Cash" value={profile?.winningBalance || 0} icon={<Trophy />} color="green" />
              <WalletCard label="Deposit Cash" value={profile?.depositBalance || 0} icon={<CreditCard />} color="blue" />
              <WalletCard label="Total Earned" value={totalEarned} icon={<TrendingUp />} color="amber" />
              <WalletCard label="Total Withdrawn" value={totalWithdrawn} icon={<CheckCircle2 />} color="primary" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              <div className="xl:col-span-2 space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic">
                     <History className="h-6 w-6 text-primary" /> Earning Summary
                   </h3>
                   <Button asChild variant="link" className="text-primary font-black uppercase text-[10px] tracking-widest">
                      <Link href="/ledger">Full History <ChevronRight className="h-3 w-3 ml-1" /></Link>
                   </Button>
                </div>
                
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  {isActivityLoading ? (
                    <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                  ) : recentActivity && recentActivity.length > 0 ? (
                    <div className="divide-y divide-white/5">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                <DollarSign className="h-5 w-5 text-primary" />
                             </div>
                             <div>
                                <p className="text-sm font-bold uppercase text-white">{activity.description || activity.type}</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase">{activity.date}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={cn("text-xl font-black", activity.amount < 0 ? "text-red-400" : "text-green-400")}>
                               {activity.amount > 0 ? '+' : ''}{activity.amount} 🪙
                             </p>
                             <Badge variant="ghost" className="text-[8px] uppercase opacity-40">{activity.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-32 text-center text-muted-foreground uppercase font-black text-xs">No recent earnings detected.</div>
                  )}
                </Card>
              </div>

              <div className="space-y-8">
                 <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6">
                    <div className="flex items-center gap-3">
                       <ShieldCheck className="h-5 w-5 text-primary animate-pulse" />
                       <h4 className="text-sm font-black uppercase italic">Security Profile</h4>
                    </div>
                    <ul className="space-y-3">
                       <PerkItem active={profile?.riskNoticeAccepted || false} text="Terms of Service Accepted" />
                       <PerkItem active={currentVip >= 1} text="VIP 1: Withdrawal Protocol Active" />
                       <PerkItem active={!profile?.isSuspended} text="Account Integrity Verified" />
                    </ul>
                    <Button asChild variant="outline" className="w-full h-12 border-white/10 text-white font-black uppercase text-[10px] rounded-xl mt-4">
                       <Link href="/withdraw">REQUEST PAYOUT <ArrowUpRight className="h-3 w-3 ml-2" /></Link>
                    </Button>
                 </Card>
                 <ViralLeaderboard />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function PerkItem({ active, text }: { active: boolean, text: string }) {
   return (
      <li className={cn("flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest transition-all", active ? "text-white" : "text-muted-foreground opacity-30")}>
         {active ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3" />}
         {text}
      </li>
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
