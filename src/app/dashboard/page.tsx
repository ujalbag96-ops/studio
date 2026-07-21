'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
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
  ShoppingBag,
  ArrowUpRight,
  TrendingUp,
  Users,
  Star,
  LineChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserProfile, PlatformRevenue, AppSettings } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import DailyStreak from '@/components/DailyStreak';
import TrendingEarners from '@/components/TrendingEarners';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  
  const { data: profile } = useDoc<UserProfile>(userProfileRef);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return null;

  const platformRevenueUSD = stats?.totalDailyRevenueUSD || 0;
  const userShareUSD = profile?.pendingRevenueShare || 0;

  return (
    <div className="flex min-h-screen bg-background text-white relative overflow-x-hidden">
      <aside className="w-72 border-r border-white/10 bg-white/[0.02] hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 backdrop-blur-3xl">
        <div className="p-8 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold uppercase tracking-tighter text-xl italic">My <span className="text-primary">Arena</span></span>
          </Link>
        </div>

        <nav className="flex-1 p-6 space-y-2">
          <SidebarItem active={true} icon={<LayoutDashboard />} label="Portfolio" onClick={() => {}} />
          <SidebarItem active={false} icon={<Users />} label="PeerConnect" onClick={() => router.push('/peer-connect')} />
          <SidebarItem active={false} icon={<ShoppingBag />} label="Marketplace" onClick={() => router.push('/marketplace')} />
          <SidebarItem active={false} icon={<Trophy />} label="Prize Arena" onClick={() => router.push('/arcade-tournaments')} />
          <SidebarItem active={false} icon={<Globe />} label="MLM Network" onClick={() => router.push('/refer')} />
        </nav>

        <div className="p-6 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-bold uppercase text-[10px] tracking-widest italic">
            <LogOut className="h-4 w-4" /> Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-8 md:p-12 lg:p-16 space-y-12 pb-32">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-[9px] px-4 py-1.5 uppercase tracking-widest flex items-center gap-2 shadow-xl backdrop-blur-md">
                  <ShieldCheck className="h-3 w-3" /> Identity Verified: {profile?.country || 'Global'}
               </Badge>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.85]">
               Wallet <br /> <span className="text-primary">{formatCurrency((profile?.winningBalance || 0) + (profile?.taskBalance || 0), profile?.country)}</span>
            </h1>
          </div>
          <div className="bg-white/[0.03] border border-white/10 px-8 py-5 rounded-3xl backdrop-blur-2xl">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Account Tier</p>
             <div className="flex items-center gap-4">
                <Crown className="h-5 w-5 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                <span className="text-lg font-black text-white italic uppercase tracking-tight">{profile?.rank || 'Bronze I'} Node</span>
             </div>
          </div>
        </header>

        {/* Minimalist Revenue Transparency Hub */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-bold uppercase flex items-center gap-4 italic tracking-tight"><LineChart className="h-5 w-5 text-primary" /> Revenue Integrity</h3>
              <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase px-4 italic animate-pulse">70% Margin Locked</Badge>
           </div>
           
           <div className="glass-panel rounded-[3rem] p-12 grid lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-8">
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.4em]">Daily Platform Gross Yield</p>
                    <h4 className="text-7xl font-black italic text-white tabular-nums tracking-tighter">${platformRevenueUSD.toFixed(2)}</h4>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-4">
                    <div className="space-y-2 border-l border-white/10 pl-6">
                       <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Admin Profit (70%)</p>
                       <p className="text-xl font-bold text-muted-foreground italic tracking-tight">${(platformRevenueUSD * 0.7).toFixed(2)}</p>
                    </div>
                    <div className="space-y-2 border-l border-primary/20 pl-6">
                       <p className="text-[8px] font-black uppercase text-primary tracking-widest">Student Share (30%)</p>
                       <p className="text-xl font-bold text-primary italic tracking-tight">${(platformRevenueUSD * 0.3).toFixed(2)}</p>
                    </div>
                 </div>
              </div>

              <div className="lg:col-span-5 bg-white/[0.05] border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-3xl flex flex-col justify-center text-center space-y-8 relative overflow-hidden group">
                 <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                 <div className="space-y-2 relative z-10">
                    <p className="text-[11px] font-black uppercase text-primary tracking-widest italic">My Personal Dividend</p>
                    <h5 className="text-6xl font-black italic text-green-500 tabular-nums tracking-tighter">${userShareUSD.toFixed(2)}</h5>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase mt-3 tracking-widest">S2S Postback Verified Signal</p>
                 </div>
                 <Button asChild className="w-full h-16 bg-green-600 hover:bg-green-500 text-white font-black uppercase italic rounded-2xl shadow-xl shadow-green-600/20 active:scale-95 transition-all">
                    <Link href="/withdraw">Execute Settlement <ArrowUpRight className="h-5 w-5 ml-2" /></Link>
                 </Button>
              </div>
           </div>
        </section>

        {/* Minimalist Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CompactWalletRow label="Winning Assets" value={profile?.winningBalance || 0} country={profile?.country} icon={<Trophy />} color="green" />
          <CompactWalletRow label="Mission Yield" value={profile?.taskBalance || 0} country={profile?.country} icon={<CreditCard />} color="blue" />
          <CompactWalletRow label="Total Coins" value={profile?.coins || 0} country={profile?.country} icon={<Coins />} color="amber" />
          <CompactWalletRow label="Rank Mastery" value={profile?.scholarPoints || 0} country={profile?.country} icon={<Star />} color="primary" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 pt-8">
          <div className="xl:col-span-2 space-y-12">
            <section className="space-y-6">
               <h3 className="text-xl font-bold uppercase flex items-center gap-4 italic tracking-tight"><Zap className="h-5 w-5 text-amber-500" /> Operational Daily Feed</h3>
               <DailyStreak profile={profile} />
            </section>
          </div>
          
          <div className="space-y-8">
             <TrendingEarners />
             <div className="glass-panel rounded-[2.5rem] p-10 space-y-8">
                <h4 className="text-sm font-bold uppercase italic flex items-center gap-2 tracking-widest"><ShieldCheck className="text-primary h-4 w-4" /> Integrity Gate</h4>
                <ul className="space-y-6">
                   <SecuritySignal active={profile?.riskNoticeAccepted || false} text="Legal Consent" />
                   <SecuritySignal active={( (profile?.cpaTasksCount || 0) >= 5 )} text="VIP 1 Authenticated" />
                   <SecuritySignal active={!profile?.isSuspended} text="Anti-Proxy Secure" />
                </ul>
                <Button asChild className="w-full h-14 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-2xl font-bold uppercase italic text-[10px] tracking-[0.2em] shadow-lg transition-all">
                   <Link href="/withdraw">Request Payout Node</Link>
                </Button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CompactWalletRow({ label, value, country, icon, color }: any) {
  const colors = {
    blue: "border-blue-500/20 text-blue-400 bg-blue-500/5",
    amber: "border-amber-500/20 text-amber-500 bg-amber-500/5",
    green: "border-green-500/20 text-green-500 bg-green-500/5",
    primary: "border-primary/20 text-primary bg-primary/5"
  };
  return (
    <div className={cn("p-8 rounded-[2rem] border transition-all hover:scale-[1.02] group", colors[color as keyof typeof colors])}>
       <div className="space-y-5">
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border group-hover:rotate-6 transition-transform", colors[color as keyof typeof colors])}>
             {icon}
          </div>
          <div>
             <p className="text-[8px] font-bold uppercase opacity-60 tracking-widest mb-1">{label}</p>
             <h4 className="text-2xl font-black text-white italic tabular-nums tracking-tight">{formatCurrency(value, country)}</h4>
             <p className="text-[7px] font-bold opacity-30 uppercase tracking-[0.3em] mt-1">{value.toLocaleString()} Signals</p>
          </div>
       </div>
    </div>
  );
}

function SecuritySignal({ active, text }: any) {
   return (
      <li className={cn("flex items-center justify-between text-[10px] font-bold uppercase tracking-widest", active ? "text-white" : "text-muted-foreground opacity-40")}>
         {text}
         <div className="status-pulse">
            <span className={cn("status-pulse-dot", active ? "bg-green-500" : "bg-red-500/50")} />
            <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", active ? "bg-green-500" : "bg-red-500")} />
         </div>
      </li>
   );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-6 px-8 py-4 rounded-xl transition-all duration-300", active ? "bg-primary text-white shadow-xl italic" : "text-muted-foreground hover:bg-white/[0.05] hover:text-white")}>
      <span className={cn("h-4.5 w-4.5", active ? "text-white" : "text-muted-foreground")}>{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}
