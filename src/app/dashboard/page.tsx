
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
  DollarSign,
  Fingerprint,
  Upload,
  AlertCircle,
  XCircle,
  ShieldAlert,
  Gamepad2,
  CloudRain,
  BookOpen,
  Smartphone,
  RefreshCcw,
  ShoppingBag,
  ArrowRight
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import VipQuestDashboard from '@/components/VipQuestDashboard';
import QuestCelebrationModal from '@/components/QuestCelebrationModal';
import { formatCurrency } from '@/lib/currency';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState<'overview' | 'offers' | 'video' | 'mlm'>('overview');
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycDoc, setKycDoc] = useState<string | null>(null);
  const [isKycProcessing, setIsKycProcessing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

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

  const submitKyc = async () => {
    if (!kycDoc || !userProfileRef) return;
    setIsKycProcessing(true);
    try {
      await updateDoc(userProfileRef, {
        kycStatus: 'pending',
        kycDocumentUrl: kycDoc,
        kycSubmittedAt: new Date().toISOString()
      });
      toast({ title: "KYC SUBMITTED", description: "Identity signal dispatched for manual audit." });
      setShowKycModal(false);
    } catch (e) {
      toast({ variant: "destructive", title: "Submit Failed" });
    } finally {
      setIsKycProcessing(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user) return null;

  const isIndia = profile?.country === 'India';
  const combinedCashBalance = formatCurrency((profile?.winningBalance || 0) + (profile?.taskBalance || 0), profile?.country);

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary relative">
      <ConnectWalletModal isOpen={isConnectOpen} onOpenChange={setIsConnectOpen} />
      <RiskDisclosureModal isOpen={showLegal} onOpenChange={setShowLegal} />
      {profile && <QuestCelebrationModal isOpen={showCelebration} onClose={() => setShowCelebration(false)} profile={profile} />}
      
      <Dialog open={showKycModal} onOpenChange={setShowKycModal}>
         <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] p-10">
            <DialogHeader className="space-y-4">
               <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Fingerprint className="h-8 w-8 text-primary" />
               </div>
               <DialogTitle className="text-3xl font-black uppercase italic">Identity Verification</DialogTitle>
               <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground">Industrial security protocol audit.</DialogDescription>
            </DialogHeader>

            <div className="py-8">
               <Input type="file" accept="image/*" onChange={(e) => {
                 const file = e.target.files?.[0];
                 if(file) {
                    const r = new FileReader();
                    r.onloadend = () => setKycDoc(r.result as string);
                    r.readAsDataURL(file);
                 }
               }} className="bg-black border-white/10 h-16 rounded-xl pt-4" />
            </div>

            <DialogFooter>
               <Button onClick={submitKyc} disabled={!kycDoc || isKycProcessing} className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl">
                  {isKycProcessing ? <Loader2 className="animate-spin" /> : "DISPATCH SIGNAL"}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
      
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
          <SidebarItem active={false} icon={<Fingerprint />} label="Verify KYC" onClick={() => setShowKycModal(true)} />
          <div className="pt-8 px-4 space-y-4">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Operational Nodes</p>
             <Link href="/earning-hub" className="flex items-center gap-3 p-3 text-[10px] font-bold text-white hover:bg-white/5 rounded-xl transition-all uppercase"><Zap className="h-4 w-4 text-primary" /> Income Hub</Link>
             <Link href="/shop" className="flex items-center gap-3 p-3 text-[10px] font-bold text-white hover:bg-white/5 rounded-xl transition-all uppercase"><ShoppingBag className="h-4 w-4 text-amber-500" /> Gift Card Shop</Link>
          </div>
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
            <div className="flex flex-wrap items-center gap-3">
               <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px]">
                 {isIndia ? 'Domestic Portfolio' : 'International Portfolio'}
               </Badge>
               <Badge className="bg-amber-500/20 text-amber-500 border-none uppercase font-black px-4 py-1 text-[10px] flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-500" /> VIP LEVEL {profile?.vipLevel || 0}
               </Badge>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">Total <span className="text-primary">{combinedCashBalance}</span></h1>
          </div>
          <div className="bg-black/40 border border-white/5 px-8 py-4 rounded-3xl backdrop-blur-xl">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Regional Node</p>
             <div className="flex items-center gap-4">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-sm font-black text-white italic uppercase">{profile?.country || 'Global'}</span>
             </div>
          </div>
        </header>

        {profile && profile.vipLevel === 0 && (
           <VipQuestDashboard profile={profile} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <WalletCard label="Winning Cash" value={profile?.winningBalance || 0} country={profile?.country} icon={<Trophy />} color="green" />
          <WalletCard label="Task Earnings" value={profile?.taskBalance || 0} country={profile?.country} icon={<CreditCard />} color="blue" />
          <WalletCard label="Total Assets" value={profile?.coins || 0} country={profile?.country} icon={<Coins />} color="amber" />
          <WalletCard label="Bonus Signal" value={profile?.bonusBalance || 0} country={profile?.country} icon={<Zap />} color="primary" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-12">
            
            {isIndia && (
              <section className="space-y-6">
                <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><BookOpen className="h-6 w-6 text-primary" /> Domestic Study Hub</h3>
                <Card className="bg-primary/5 border-primary/20 border-2 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <GraduationCap className="h-40 w-48 text-primary" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                      <div className="space-y-4 flex-1">
                          <Badge className="bg-green-500/20 text-green-500 border-none uppercase font-black text-[8px] px-3">INDIA EXCLUSIVE</Badge>
                          <h4 className="text-3xl font-black uppercase italic leading-none">Resource <span className="text-primary">Locker</span></h4>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                            Access curated study materials and take AI quizzes to earn coins. 100% free for Indian students.
                          </p>
                      </div>
                      <Button asChild className="h-16 px-10 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic shadow-xl">
                          <Link href="/campus">OPEN LOCKER <ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                    </div>
                </Card>
              </section>
            )}

            {!isIndia && (
               <section className="space-y-6">
                <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><ShoppingBag className="h-6 w-6 text-amber-500" /> Reward Redemption</h3>
                <Card className="bg-amber-500/5 border-amber-500/20 border-2 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Gift className="h-40 w-48 text-amber-500" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                      <div className="space-y-4 flex-1">
                          <Badge className="bg-amber-500/20 text-amber-500 border-none uppercase font-black text-[8px] px-3">GIFT CARDS ACTIVE</Badge>
                          <h4 className="text-3xl font-black uppercase italic leading-none">Global <span className="text-amber-500">Shop</span></h4>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                            Redeem your 35% revenue share for Google Play, Steam, and Amazon codes.
                          </p>
                      </div>
                      <Button asChild className="h-16 px-10 bg-amber-500 hover:bg-amber-600 text-black font-black uppercase italic shadow-xl">
                          <Link href="/shop">ENTER SHOP <ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                    </div>
                </Card>
              </section>
            )}

            <section className="space-y-6">
               <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><Zap className="h-6 w-6 text-primary" /> Active Yield Signals</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <IncomeSourceCard title="CPA Missions" value={isIndia ? "60% Share" : "35% Share"} icon={<Smartphone />} link="/earning-hub" />
                  <IncomeSourceCard title="Arcade Arena" icon={<Gamepad2 />} link="/games" />
                  <IncomeSourceCard title="Cinema Watch" value="300 🪙" icon={<Video />} link="/watch-earn" />
                  <IncomeSourceCard title="Team Royalties" value="5% + 2%" icon={<Users />} link="/refer" />
               </div>
            </section>
          </div>
          
          <div className="space-y-8">
             <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6">
                <h4 className="text-sm font-black uppercase italic flex items-center gap-2"><ShieldCheck className="text-primary" /> Security Hub</h4>
                <ul className="space-y-4">
                   <SecurityLink active={profile?.kycStatus === 'approved'} text="Identity Verified" />
                   <SecurityLink active={profile?.riskNoticeAccepted || false} text="Legal Consent" />
                   <SecurityLink active={profile?.vipLevel! > 0} text="VIP Unlock" />
                </ul>
                <Button asChild className="w-full h-12 bg-primary rounded-xl font-black uppercase italic text-[10px] shadow-lg">
                   <Link href={isIndia ? "/withdraw" : "/shop"}>
                     {isIndia ? "REQUEST WITHDRAWAL" : "GO TO SHOP"} <ArrowUpRight className="h-4 w-4 ml-2" />
                   </Link>
                </Button>
             </Card>
             <ViralLeaderboard />
          </div>
        </div>
      </main>
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
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-all" />
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
