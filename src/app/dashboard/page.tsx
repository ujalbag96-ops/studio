'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, Wallet, Trophy, Zap, Activity, Loader2, LogOut, CreditCard, Crown, Coins, 
  ShieldCheck, Globe, ShoppingBag, ArrowUpRight, TrendingUp, Users, Star, LineChart, Target,
  DollarSign, PieChart, BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { UserProfile, PlatformRevenue, AppSettings } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import DailyStreak from '@/components/DailyStreak';
import TrendingEarners from '@/components/TrendingEarners';
import VipQuestDashboard from '@/components/VipQuestDashboard';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);

  const handleLogout = async () => {
    if (auth) { await signOut(auth); router.push('/login'); }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background text-white overflow-x-hidden">
      <aside className="w-72 border-r border-white/10 bg-white/[0.02] hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 backdrop-blur-3xl">
        <div className="p-8 border-b border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
          <span className="font-black uppercase tracking-tighter text-xl italic">My <span className="text-primary">Arena</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <SidebarItem active={true} icon={<LayoutDashboard />} label="Portfolio" onClick={() => {}} />
          <SidebarItem active={false} icon={<Users />} label="PeerConnect" onClick={() => router.push('/peer-connect')} />
          <SidebarItem active={false} icon={<Target />} label="Withdrawal Terminal" onClick={() => router.push('/shop')} />
          <SidebarItem active={false} icon={<Trophy />} label="Scholar Hub" onClick={() => router.push('/campus')} />
          <SidebarItem active={false} icon={<Globe />} label="Referral Network" onClick={() => router.push('/refer')} />
        </nav>
        <div className="p-6 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-black uppercase text-[9px] italic">
            <LogOut className="h-4 w-4" /> Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-72 p-8 md:p-16 space-y-12 pb-32">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <Badge className="bg-primary/10 text-primary border-primary/20 font-black text-[9px] px-4 py-1.5 uppercase tracking-widest flex items-center gap-2 shadow-xl italic">
                  <ShieldCheck className="h-3 w-3" /> Identity Node: {profile?.country || 'Global'}
               </Badge>
               <Badge className="bg-green-500/10 text-green-500 border-none font-black text-[8px] px-3 py-1 uppercase">100% Free Scholarship Mode</Badge>
            </div>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter italic leading-[0.85]">
               Wallet <br /> <span className="text-primary">{formatCurrency((profile?.winningBalance || 0) + (profile?.taskBalance || 0), profile?.country, settings)}</span>
            </h1>
          </div>
          <div className="bg-white/[0.03] border border-white/10 px-8 py-5 rounded-3xl backdrop-blur-2xl shadow-xl">
             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2 italic">Operational Tier</p>
             <div className="flex items-center gap-4">
                <Crown className="h-5 w-5 text-amber-500 animate-pulse" />
                <span className="text-lg font-black text-white italic uppercase tracking-tight">{profile?.rank || 'Bronze'} Warrior</span>
             </div>
          </div>
        </header>

        {/* REVENUE SHARE TRANSPARENCY SECTION */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase flex items-center gap-4 italic tracking-tight">
                 <DollarSign className="h-5 w-5 text-green-500" /> Revenue Sharing Node
              </h3>
              <Badge variant="outline" className="border-green-500/20 text-green-500 text-[8px] font-black uppercase">{settings?.userRevenueSharePercent || 20}% Industrial Split</Badge>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2rem] space-y-4 shadow-xl border-2">
                 <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500"><BarChart className="h-5 w-5" /></div>
                 <div>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1 italic">Total Revenue Created</p>
                    <h4 className="text-3xl font-black text-white italic">${profile?.totalRevenueGenerated?.toFixed(2) || '0.00'}</h4>
                 </div>
              </Card>
              <Card className="bg-[#0a0a0f] border-primary/20 p-8 rounded-[2rem] space-y-4 shadow-xl border-2">
                 <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><PieChart className="h-5 w-5" /></div>
                 <div>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1 italic">Your {settings?.userRevenueSharePercent || 20}% Share (USD)</p>
                    <h4 className="text-3xl font-black text-primary italic">${profile?.pendingRevenueShare?.toFixed(2) || '0.00'}</h4>
                 </div>
              </Card>
              <Card className="bg-primary/5 border-primary/10 p-8 rounded-[2rem] flex flex-col justify-center items-center text-center space-y-2">
                 <TrendingUp className="text-primary h-6 w-6 animate-pulse" />
                 <p className="text-[9px] font-black uppercase text-white tracking-widest italic">Signal Integrity</p>
                 <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed">Your dividends are automatically synced to your coin wallet.</p>
              </Card>
           </div>
        </section>

        <section className="space-y-6">
           <h3 className="text-xl font-black uppercase flex items-center gap-4 italic tracking-tight"><LineChart className="h-5 w-5 text-primary" /> Asset Breakdown</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <CompactWalletRow label="Winning Balance" value={profile?.winningBalance || 0} country={profile?.country} settings={settings} icon={<Trophy />} color="green" />
              <CompactWalletRow label="Mission Yield" value={profile?.taskBalance || 0} country={profile?.country} settings={settings} icon={<CreditCard />} color="blue" />
              <CompactWalletRow label="Scholar Mastery" value={profile?.scholarPoints || 0} country={profile?.country} settings={settings} icon={<Star />} color="primary" />
           </div>
        </section>

        {profile && (profile.cpaTasksCount < 10 || profile.totalReferrals < 5) && (
           <VipQuestDashboard profile={profile} />
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 pt-8">
          <div className="xl:col-span-2 space-y-12">
            <DailyStreak profile={profile || null} />
            <TrendingEarners />
          </div>
          <div className="space-y-8">
             <div className="glass-panel rounded-[2.5rem] p-10 space-y-8 border-2">
                <h4 className="text-sm font-black uppercase italic flex items-center gap-3 tracking-widest text-white"><ShieldCheck className="text-primary h-5 w-5" /> Integrity Gate</h4>
                <ul className="space-y-6">
                   <SecuritySignal active={profile?.riskNoticeAccepted || false} text="Legal Consent" />
                   <SecuritySignal active={(profile?.cpaTasksCount || 0) >= 5} text="VIP 1 Authenticated" />
                   <SecuritySignal active={!profile?.isSuspended} text="Anti-Proxy Secure" />
                </ul>
                <Button asChild className="w-full h-14 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-2xl font-black uppercase italic text-[9px] tracking-[0.2em] shadow-lg transition-all">
                   <Link href="/shop">Request Payout Node</Link>
                </Button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CompactWalletRow({ label, value, country, settings, icon, color }: any) {
  const colors = { 
    blue: "border-blue-500/20 text-blue-400 bg-blue-500/5", 
    amber: "border-amber-500/20 text-amber-500 bg-amber-500/20", 
    green: "border-green-500/20 text-green-500 bg-green-500/5", 
    primary: "border-primary/20 text-primary bg-primary/5" 
  };
  return (
    <Card className={cn("p-8 rounded-[2rem] border-2 transition-all hover:scale-[1.02] group", colors[color as keyof typeof colors])}>
       <div className="space-y-5">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shadow-xl", colors[color as keyof typeof colors])}>{icon}</div>
          <div>
             <p className="text-[8px] font-black uppercase opacity-60 tracking-widest mb-1 italic">{label}</p>
             <h4 className="text-2xl font-black text-white italic tabular-nums tracking-tight">{formatCurrency(value, country, settings)}</h4>
          </div>
       </div>
    </Card>
  );
}

function SecuritySignal({ active, text }: any) {
   return (
      <li className={cn("flex items-center justify-between text-[9px] font-black uppercase tracking-widest italic", active ? "text-white" : "text-muted-foreground opacity-40")}>
         {text}
         <div className="relative flex h-2 w-2">
            <span className={cn("status-pulse-dot", active ? "bg-green-500" : "bg-red-500")} />
            <span className={cn("relative inline-flex rounded-full h-2 w-2", active ? "bg-green-500" : "bg-red-500")} />
         </div>
      </li>
   );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-6 px-8 py-4 rounded-xl transition-all font-black uppercase text-[9px] tracking-widest italic", active ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/[0.05]")}>
      <span className="h-4.5 w-4.5">{icon}</span><span>{label}</span>
    </button>
  );
}
