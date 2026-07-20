
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard,
  Wallet, 
  Trophy, 
  Zap, 
  Activity,
  Loader2,
  LogOut,
  CreditCard,
  Crown,
  Coins,
  ShieldCheck,
  Globe,
  Fingerprint,
  Gamepad2,
  ShoppingBag,
  ArrowUpRight,
  Package,
  Sparkles,
  ShieldEllipsis,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  Users,
  Search,
  BookOpen,
  Gift,
  LayoutGrid,
  Star
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserProfile, PlatformRevenue, AppSettings } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, getCurrencyData } from '@/lib/currency';
import ScratchCard from '@/components/ScratchCard';
import DailyStreak from '@/components/DailyStreak';
import TrendingEarners from '@/components/TrendingEarners';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [showScratch, setShowScratch] = useState(false);

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);

  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return null;

  const currencyData = getCurrencyData(profile?.country);
  const combinedCashBalance = formatCurrency((profile?.winningBalance || 0) + (profile?.taskBalance || 0), profile?.country);
  
  const platformRevenueUSD = stats?.totalDailyRevenueUSD || 0;
  const userShareUSD = profile?.pendingRevenueShare || 0;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary relative overflow-x-hidden">
      <aside className="w-80 border-r border-white/5 bg-[#0a0a0f] hidden lg:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-10 border-b border-white/5">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="font-black uppercase tracking-tighter text-2xl italic">MY <span className="text-primary">ARENA</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-8 space-y-2">
          <SidebarItem active={true} icon={<LayoutDashboard />} label="Portfolio" onClick={() => {}} />
          <SidebarItem active={false} icon={<Users />} label="PeerConnect" onClick={() => router.push('/peer-connect')} />
          <SidebarItem active={false} icon={<ShoppingBag />} label="Marketplace" onClick={() => router.push('/marketplace')} />
          <SidebarItem active={false} icon={<Trophy />} label="Prize Arena" onClick={() => router.push('/arcade-tournaments')} />
          <SidebarItem active={false} icon={<Globe />} label="MLM Network" onClick={() => router.push('/refer')} />
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-black uppercase text-xs italic">
            <LogOut className="h-5 w-5" /> Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-80 p-6 md:p-12 lg:p-16 space-y-10 pb-32">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] px-4 py-1.5 uppercase italic tracking-widest flex items-center gap-2 shadow-xl">
                  <ShieldCheck className="h-3 w-3" /> Identity Verified: {profile?.country}
               </Badge>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">Wallet <span className="text-primary">{combinedCashBalance}</span></h1>
          </div>
          <div className="bg-black/40 border border-white/5 px-8 py-4 rounded-3xl backdrop-blur-xl">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Account Rank</p>
             <div className="flex items-center gap-4">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-black text-white italic uppercase">{profile?.rank || 'Bronze I'} Node</span>
             </div>
          </div>
        </header>

        {/* 70/30 PROFIT TRANSPARENCY HUB */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><BarChart3 className="h-6 w-6 text-primary" /> Revenue Integrity Node</h3>
              <Badge className="bg-green-500/20 text-green-500 border-none text-[8px] font-black uppercase px-4 italic animate-pulse">70% Margin Locked</Badge>
           </div>
           
           <Card className="bg-gradient-to-br from-[#0a0a0f] to-black border-primary/20 border-2 rounded-[3rem] p-10 grid md:grid-cols-2 gap-12 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                 <TrendingUp className="h-64 w-64 text-primary" />
              </div>

              <div className="space-y-8 relative z-10">
                 <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.4em]">Daily Platform Gross Revenue</p>
                    <h4 className="text-6xl font-black italic text-white tabular-nums">${platformRevenueUSD.toFixed(2)}</h4>
                 </div>
                 
                 <div className="space-y-5 bg-white/5 border border-white/10 rounded-3xl p-6">
                    <h5 className="text-[10px] font-black uppercase text-primary italic">Distribution Equation:</h5>
                    <div className="space-y-3">
                       <TransparencyRow label="Platform Admin Lock (70%)" value={`$${(platformRevenueUSD * 0.7).toFixed(2)}`} color="text-muted-foreground" />
                       <TransparencyRow label="Student Reward Share (30%)" value={`$${(platformRevenueUSD * 0.3).toFixed(2)}`} color="text-primary" />
                       <div className="h-px bg-white/10 my-2" />
                       <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed">
                          User share is automatically scaled based on verified task signals and regional S2S confirmation.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="space-y-8 relative z-10 bg-primary/10 border border-primary/20 rounded-[2.5rem] p-10 backdrop-blur-xl flex flex-col justify-center text-center">
                 <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase text-primary tracking-widest italic">My Analytical Dividend</p>
                    <h5 className="text-5xl font-black italic text-green-500 tabular-nums">${userShareUSD.toFixed(2)}</h5>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2">Verified via Multi-Region S2S Postback</p>
                 </div>
                 <Button asChild className="w-full h-16 bg-green-600 hover:bg-green-500 text-white font-black uppercase italic rounded-2xl shadow-xl shadow-green-500/20">
                    <Link href="/withdraw">EXECUTE SETTLEMENT <ArrowUpRight className="h-5 w-5 ml-2" /></Link>
                 </Button>
              </div>
           </Card>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <WalletCard label="Winning" value={profile?.winningBalance || 0} country={profile?.country} icon={<Trophy />} color="green" />
          <WalletCard label="Mission Rev." value={profile?.taskBalance || 0} country={profile?.country} icon={<CreditCard />} color="blue" />
          <WalletCard label="Total Coins" value={profile?.coins || 0} country={profile?.country} icon={<Coins />} color="amber" />
          <WalletCard label="Rank Mastery" value={profile?.scholarPoints || 0} country={profile?.country} icon={<Star />} color="primary" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-12">
            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><Gift className="h-6 w-6 text-amber-500" /> Daily Mystery Vault</h3>
               </div>
               <Card className="bg-[#1a1a24] border-amber-500/30 border-2 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                     <Package className="h-48 w-48 text-amber-500" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                     <div className="space-y-4">
                        <Badge className="bg-amber-500/10 text-amber-500 border-none uppercase font-black px-3 py-1 text-[8px]">FREE REWARD NODE</Badge>
                        <h4 className="text-4xl font-black uppercase italic text-white">Industrial Loot Drop</h4>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest max-w-sm">
                           Zero investment required. Collect your daily surprise asset drop verified via regional signal.
                        </p>
                     </div>
                     <Button onClick={() => setShowScratch(true)} className="h-16 px-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic rounded-2xl shadow-xl">
                        OPEN VAULT <Sparkles className="ml-2 h-5 w-5" />
                     </Button>
                  </div>
               </Card>
            </section>

            {profile && <DailyStreak profile={profile} />}
          </div>
          
          <div className="space-y-8">
             <TrendingEarners />
             <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                <h4 className="text-sm font-black uppercase italic flex items-center gap-2"><ShieldCheck className="text-primary" /> Security Node</h4>
                <ul className="space-y-4">
                   <SecurityLink active={profile?.riskNoticeAccepted || false} text="Legal Consent" />
                   <SecurityLink active={( (profile?.cpaTasksCount || 0) >= 5 )} text="VIP 1 Verified" />
                   <SecurityLink active={!profile?.isSuspended} text="Anti-Proxy Clean" />
                </ul>
                <Button asChild className="w-full h-12 bg-primary rounded-xl font-black uppercase italic text-[10px] shadow-lg">
                   <Link href="/withdraw">EXECUTE SETTLEMENT <ArrowUpRight className="h-4 w-4 ml-2" /></Link>
                </Button>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function TransparencyRow({ label, value, color }: any) {
   return (
      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
         <span className="text-muted-foreground">{label}</span>
         <span className={color}>{value}</span>
      </div>
   );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-6 px-8 py-4 rounded-xl transition-all", active ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}>
      <span className={cn("h-5 w-5", active ? "text-white" : "text-muted-foreground")}>{icon}</span>
      <span className="text-xs font-bold uppercase italic">{label}</span>
    </button>
  );
}

function WalletCard({ label, value, country, icon, color }: any) {
  const currencyStr = formatCurrency(value, country);
  const colorMap = {
    blue: "border-blue-500/20 text-blue-400 bg-blue-500/5",
    amber: "border-amber-500/20 text-amber-500 bg-amber-500/5",
    green: "border-green-500/20 text-green-500 bg-green-500/5",
    primary: "border-primary/20 text-primary bg-primary/5"
  };
  return (
    <Card className={cn("p-6 rounded-[2rem] border-2 shadow-xl", colorMap[color as keyof typeof colorMap])}>
      <div className="space-y-4">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", colorMap[color as keyof typeof colorMap])}>{icon}</div>
        <div>
          <p className="text-[10px] font-bold uppercase opacity-60 mb-1">{label}</p>
          <h4 className="text-xl font-black text-white italic tabular-nums">{currencyStr}</h4>
          <p className="text-[9px] font-bold opacity-40 uppercase">{value.toLocaleString()} 🪙</p>
        </div>
      </div>
    </Card>
  );
}

function SecurityLink({ active, text }: any) {
   return (
      <li className={cn("flex items-center justify-between text-[9px] font-black uppercase tracking-widest", active ? "text-white" : "text-muted-foreground opacity-40")}>
         {text}
         {active ? <ShieldCheck className="h-3 w-3 text-green-500" /> : <ShieldAlert className="h-3 w-3" />}
      </li>
   );
}
