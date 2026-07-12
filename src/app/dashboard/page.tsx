
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
  Flag
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserProfile, UserLedgerEntry } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WalletModal from '@/components/WalletModal';
import ConnectWalletModal from '@/components/ConnectWalletModal';
import { useToast } from '@/hooks/use-toast';
import OfferWall from '@/components/OfferWall';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState<'overview' | 'offers' | 'video'>('overview');
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

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary">
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
                <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px]">Verified Account</Badge>
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
                <Button onClick={() => setIsConnectOpen(true)} className="bg-white/5 border border-white/10 h-16 px-8 rounded-xl text-lg font-black uppercase italic">
                  Add Cash <ArrowUpRight className="ml-2 h-5 w-5 text-primary" />
                </Button>
                <WalletModal>
                  <Button variant="outline" className="border-primary/20 h-16 px-8 rounded-xl text-lg font-black uppercase italic text-primary">
                    View Wallet
                  </Button>
                </WalletModal>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <WalletCard label="Winning Cash" value={profile?.winningBalance || 0} icon={<Trophy />} color="green" />
              <WalletCard label="Deposit Cash" value={profile?.depositBalance || 0} icon={<CreditCard />} color="blue" />
              <WalletCard label="Bonus Balance" value={profile?.bonusBalance || 0} icon={<Zap />} color="amber" />
            </div>

            {/* Live Cricket Score Widget Placeholder */}
            <Card className="bg-gradient-to-r from-blue-900/40 to-black border-blue-500/20 rounded-[2.5rem] p-8 md:p-12 overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                  <Flag className="h-48 w-48 text-blue-400" />
               </div>
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="space-y-6">
                     <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">Live Cricket Score Feed</span>
                     </div>
                     <div className="flex items-center gap-10">
                        <div className="text-center space-y-2">
                           <div className="h-16 w-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center font-black text-2xl">IND</div>
                           <p className="text-xs font-black">184/4</p>
                        </div>
                        <div className="font-black text-muted-foreground italic">VS</div>
                        <div className="text-center space-y-2">
                           <div className="h-16 w-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center font-black text-2xl">AUS</div>
                           <p className="text-xs font-black">72/1 (8.2)</p>
                        </div>
                     </div>
                  </div>
                  <div className="w-full md:w-auto">
                     <Button asChild className="w-full md:w-64 h-20 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase italic text-lg shadow-2xl">
                        <Link href="/cricket">BET ON MATCH</Link>
                     </Button>
                  </div>
               </div>
            </Card>

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
            </div>
          </>
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
    green: "border-green-500/20 text-green-500 bg-green-500/5"
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
