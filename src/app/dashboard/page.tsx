
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
  Gift,
  CheckCircle2,
  ShieldCheck,
  Star,
  Globe,
  Fingerprint,
  AlertCircle,
  XCircle,
  Gamepad2,
  ShoppingBag,
  ArrowUpRight,
  Package,
  Sparkles,
  ShieldEllipsis,
  ShieldAlert,
  Users
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { UserProfile } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConnectWalletModal from '@/components/ConnectWalletModal';
import { useToast } from '@/hooks/use-toast';
import ViralLeaderboard from '@/components/ViralLeaderboard';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';
import QuestCelebrationModal from '@/components/QuestCelebrationModal';
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
  
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  const [showScratch, setShowScratch] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const userProfileRef = useMemoFirebase(() => 
    (firestore && user) ? doc(firestore, 'users', user.uid) : null, 
    [firestore, user]
  );
  
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (profile?.questCelebrationPending) {
       setShowCelebration(true);
       if (userProfileRef) {
          updateDoc(userProfileRef, { questCelebrationPending: false });
       }
    }
  }, [profile?.questCelebrationPending, userProfileRef]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return null;

  const isIndia = profile?.country === 'India';
  const currencyData = getCurrencyData(profile?.country);
  const combinedCashBalance = formatCurrency((profile?.winningBalance || 0) + (profile?.taskBalance || 0), profile?.country);
  
  // --- UPDATED VIP 1 VALIDATION HUD ---
  const cpaMet = (profile?.cpaTasksCount || 0) >= 5;
  const adsMet = (profile?.generalTasksCount || 0) >= 5;
  const referralsMet = (profile?.totalReferrals || 0) >= 5;
  const isEarningActive = cpaMet && adsMet && referralsMet;

  const currentWithdrawalVal = (profile?.winningBalance || 0) / currencyData.rateToCoins;
  const neededForWithdrawal = Math.max(0, currencyData.minWithdrawal - currentWithdrawalVal);

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary relative overflow-x-hidden">
      <ConnectWalletModal isOpen={isConnectOpen} onOpenChange={setIsConnectOpen} />
      <RiskDisclosureModal isOpen={showLegal} onOpenChange={setShowLegal} />
      {profile && <QuestCelebrationModal isOpen={showCelebration} onClose={() => setShowCelebration(false)} profile={profile} />}
      {showScratch && <ScratchCard onClose={() => setShowScratch(false)} />}
      
      {/* 🎰 LIVE WINNING MARQUEE */}
      <div className="fixed top-0 left-0 right-0 z-[110] bg-primary/20 backdrop-blur-md border-b border-primary/20 py-2 overflow-hidden h-10 hidden md:block">
         <div className="flex animate-marquee whitespace-nowrap gap-20">
            {Array(5).fill(0).map((_, i) => (
               <div key={i} className="flex gap-20">
                  <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
                        Signal: <span className="text-primary italic">Warrior_X7</span> Earned <span className="text-green-500">₹240</span> Free!
                     </span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-white/80">
                        Signal: <span className="text-primary italic">Bhubaneswar_Pro</span> Unlocked <span className="text-amber-500">VIP 1</span> Challenge!
                     </span>
                  </div>
               </div>
            ))}
         </div>
      </div>

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
          <SidebarItem active={true} icon={<LayoutDashboard />} label="Portfolio" onClick={() => {}} />
          <SidebarItem active={false} icon={<Globe />} label="MLM Network" onClick={() => router.push('/refer')} />
          <SidebarItem active={false} icon={<Fingerprint />} label="Verify KYC" onClick={() => {}} />
          <SidebarItem active={false} icon={<ShieldCheck />} label="Legal & Security" onClick={() => setShowLegal(true)} />
          <div className="pt-8 px-4 space-y-4">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Operational Nodes</p>
             <Link href="/earning-hub" className="flex items-center gap-3 p-3 text-[10px] font-bold text-white hover:bg-white/5 rounded-xl transition-all uppercase"><Zap className="h-4 w-4 text-primary" /> Free Income Hub</Link>
             <Link href="/games" className="flex items-center gap-3 p-3 text-[10px] font-bold text-white hover:bg-white/5 rounded-xl transition-all uppercase"><Gamepad2 className="h-4 w-4 text-green-500" /> Free Arcade Sector</Link>
             <Link href="/shop" className="flex items-center gap-3 p-3 text-[10px] font-bold text-white hover:bg-white/5 rounded-xl transition-all uppercase"><ShoppingBag className="h-4 w-4 text-amber-500" /> Reward Vault</Link>
          </div>
        </nav>

        <div className="p-8 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all font-black uppercase text-xs italic">
            <LogOut className="h-5 w-5" /> Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-80 p-6 md:p-12 lg:p-16 space-y-10 pb-32 mt-10 md:mt-0">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-10">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
               <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px]">
                 {isIndia ? 'Domestic Node' : 'Global Node'}
               </Badge>
               <Badge className={cn(
                 "border-none uppercase font-black px-4 py-1 text-[10px] flex items-center gap-1.5 shadow-xl",
                 isEarningActive ? "bg-green-500/20 text-green-500" : "bg-amber-500/20 text-amber-500"
               )}>
                  <ShieldEllipsis className={cn("h-3 w-3", isEarningActive ? "fill-green-500" : "fill-amber-500")} /> 
                  EARNING STATUS: {isEarningActive ? 'ACTIVE' : 'PENDING VALIDATION'}
               </Badge>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none">Balance <span className="text-primary">{combinedCashBalance}</span></h1>
            {neededForWithdrawal > 0 && (
              <p className="text-sm font-black text-amber-500 uppercase italic tracking-widest animate-pulse">
                Zero Investment. Earn {currencyData.symbol}{neededForWithdrawal.toFixed(2)} more to withdraw!
              </p>
            )}
          </div>
          <div className="flex gap-4">
             <div className="bg-black/40 border border-white/5 px-8 py-4 rounded-3xl backdrop-blur-xl">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Rank Status</p>
                <div className="flex items-center gap-4">
                   <Crown className="h-4 w-4 text-amber-500" />
                   <span className="text-sm font-black text-white italic uppercase">{profile?.rank || 'Bronze I'}</span>
                </div>
             </div>
          </div>
        </header>

        {/* Validation Progress HUD UPGRADED */}
        {!isEarningActive && (
          <Card className="bg-amber-500/5 border-amber-500/20 border-2 rounded-[2.5rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10">
             <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3">
                   <ShieldAlert className="h-6 w-6 text-amber-500" />
                   <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Validation <span className="text-amber-500">Gateway</span></h3>
                </div>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest max-w-md">
                   "Complete 10 Tasks & 5 Invites to unlock Payout Terminal"
                </p>
             </div>
             <div className="grid grid-cols-3 gap-6 w-full md:w-auto">
                <ValidationCircle label="CPA MISSIONS" current={profile?.cpaTasksCount || 0} target={5} color="text-primary" />
                <ValidationCircle label="VIDEO ADS" current={profile?.generalTasksCount || 0} target={5} color="text-amber-500" />
                <ValidationCircle label="INVITES" current={profile?.totalReferrals || 0} target={5} color="text-green-500" />
             </div>
          </Card>
        )}

        {profile && <DailyStreak profile={profile} />}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <WalletCard label="Winnings" value={profile?.winningBalance || 0} country={profile?.country} icon={<Trophy />} color="green" />
          <WalletCard label="Mission Rev." value={profile?.taskBalance || 0} country={profile?.country} icon={<CreditCard />} color="blue" />
          <WalletCard label="Total Coins" value={profile?.coins || 0} country={profile?.country} icon={<Coins />} color="amber" />
          <WalletCard label="Bonus Signal" value={profile?.bonusBalance || 0} country={profile?.country} icon={<Zap />} color="primary" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-12">
            
            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><Gift className="h-6 w-6 text-amber-500" /> Daily Mystery Vault</h3>
               </div>
               <Card className="bg-gradient-to-br from-[#1a1a24] to-black border-amber-500/30 border-2 rounded-[2.5rem] p-10 relative overflow-hidden group shadow-[0_0_50px_rgba(245,158,11,0.1)]">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                     <Package className="h-48 w-48 text-amber-500" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                     <div className="space-y-4 text-center md:text-left">
                        <Badge className="bg-amber-500/10 text-amber-500 border-none uppercase font-black px-3 py-1 text-[8px]">100% FREE REWARD</Badge>
                        <h4 className="text-4xl font-black uppercase italic text-white leading-none">Elite <span className="text-amber-500">Loot Drop</span></h4>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed max-sm">
                           No investment required. Claim your daily surprise coin bounty subsidized by sponsors.
                        </p>
                     </div>
                     <Button 
                        onClick={() => setShowScratch(true)}
                        className="h-16 px-12 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic text-lg rounded-2xl shadow-xl active:scale-95 transition-all"
                     >
                        OPEN VAULT <Sparkles className="ml-2 h-5 w-5" />
                     </Button>
                  </div>
               </Card>
            </section>

            <section className="space-y-6">
               <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><Gamepad2 className="h-6 w-6 text-primary" /> Free Arcade Sector</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <IncomeSourceCard title="Logic Puzzle" value={`Level ${profile?.puzzleLevel || 1}/50`} icon={<LayoutDashboard />} link="/games" />
                  <IncomeSourceCard title="Physics Arcade" value={`Level ${profile?.physicsLevel || 1}/50`} icon={<Target />} link="/games" />
                  <IncomeSourceCard title="Endless Runner" value={`Level ${profile?.runnerLevel || 1}/50`} icon={<Zap />} link="/games" />
                  <IncomeSourceCard title="Special Boss Mode" value="Unlock Level 10" icon={<Crown />} link="/games" />
               </div>
            </section>
          </div>
          
          <div className="space-y-8">
             <TrendingEarners />
             <ViralLeaderboard />
             
             <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                <h4 className="text-sm font-black uppercase italic flex items-center gap-2"><ShieldCheck className="text-primary" /> Security Node</h4>
                <ul className="space-y-4">
                   <SecurityLink active={profile?.kycStatus === 'approved'} text="Identity Verified" />
                   <SecurityLink active={profile?.riskNoticeAccepted || false} text="Legal Consent" />
                   <SecurityLink active={isEarningActive} text="VIP 1 Verified" />
                </ul>
                <Button asChild className="w-full h-12 bg-primary rounded-xl font-black uppercase italic text-[10px] shadow-lg">
                   <Link href={isIndia ? "/withdraw" : "/shop"}>
                     {isIndia ? "EXECUTE FREE WITHDRAWAL" : "ENTER GLOBAL SHOP"} <ArrowUpRight className="h-4 w-4 ml-2" />
                   </Link>
                </Button>
             </Card>
          </div>
        </div>
      </main>

      <style jsx global>{`
          @keyframes marquee {
             0% { transform: translateX(0); }
             100% { transform: translateX(-50%); }
          }
          .animate-marquee {
             animation: marquee 30s linear infinite;
             display: flex;
             width: max-content;
          }
       `}</style>
    </div>
  );
}

function ValidationCircle({ label, current, target, color }: any) {
   const pct = Math.min((current / target) * 100, 100);
   return (
      <div className="text-center space-y-2">
         <div className="h-16 w-16 rounded-full border-4 border-white/5 relative mx-auto flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90 h-full w-full">
               <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" className={cn("opacity-20", color)} />
               <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={176} strokeDashoffset={176 - (176 * pct) / 100} className={cn("transition-all duration-1000", color)} />
            </svg>
            <span className="text-xs font-black text-white">{current}</span>
         </div>
         <p className="text-[8px] font-black uppercase text-muted-foreground">{label}</p>
      </div>
   );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-6 px-8 py-4 rounded-xl transition-all", active ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5")}>
      <span className={cn("h-5 w-5 transition-all", active ? "scale-110 text-white" : "text-muted-foreground")}>{icon}</span>
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
    <Card className={cn("p-6 rounded-[2rem] border-2 transition-all hover:scale-105 shadow-xl", colorMap[color as keyof typeof colorMap])}>
      <div className="space-y-4">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", colorMap[color as keyof typeof colorMap])}>{icon}</div>
        <div>
          <p className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-1">{label}</p>
          <h4 className="text-xl font-black text-white italic tabular-nums">{currencyStr}</h4>
          <p className="text-[9px] font-bold opacity-40 uppercase">{value.toLocaleString()} 🪙</p>
        </div>
      </div>
    </Card>
  );
}

function IncomeSourceCard({ title, value, icon, link }: any) {
   return (
      <Link href={link}>
         <div className="p-5 bg-[#0a0a0f] border border-white/5 rounded-2xl flex items-center justify-between group hover:border-primary/40 transition-all">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  {icon}
               </div>
               <div>
                  <p className="text-xs font-black uppercase text-white">{title}</p>
                  {value && <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{value}</p>}
               </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
         </div>
      </Link>
   );
}

function SecurityLink({ active, text }: any) {
   return (
      <li className={cn("flex items-center justify-between text-[9px] font-black uppercase tracking-widest", active ? "text-white" : "text-muted-foreground opacity-40")}>
         {text}
         {active ? <CheckCircle2 className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3" />}
      </li>
   );
}
