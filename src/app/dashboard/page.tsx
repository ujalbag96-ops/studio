
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
  RefreshCcw
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

  // Celebration state
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

  const handleKycFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onloadend = () => setKycDoc(reader.result as string);
       reader.readAsDataURL(file);
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
  if (!user) return <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508]"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const currentVip = profile?.vipLevel || 0;
  const combinedCashBalance = formatCurrency((profile?.winningBalance || 0) + (profile?.taskBalance || 0));

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
               <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground">Upload Aadhar or PAN signal for industrial audit.</DialogDescription>
            </DialogHeader>

            <div className="py-8 space-y-6">
               <div className="relative group">
                  <input type="file" accept="image/*" onChange={handleKycFile} className="hidden" id="kyc-upload" />
                  <label htmlFor="kyc-upload" className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-white/10 rounded-3xl bg-black/40 cursor-pointer group-hover:border-primary/40 transition-all">
                     {kycDoc ? (
                        <img src={kycDoc} className="h-40 w-full object-contain rounded-xl" alt="KYC Preview" />
                     ) : (
                        <>
                           <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                           <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Identification Signal</span>
                        </>
                     )}
                  </label>
               </div>
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

        <nav className="flex-1 p-8 space-y-2 overflow-y-auto no-scrollbar">
          <SidebarItem active={activeNav === 'overview'} icon={<LayoutDashboard />} label="Portfolio" onClick={() => setActiveNav('overview')} />
          <SidebarItem active={activeNav === 'mlm'} icon={<Network />} label="MLM Network" onClick={() => setActiveNav('mlm')} />
          <SidebarItem active={false} icon={<Fingerprint />} label="Verify Identity" onClick={() => setShowKycModal(true)} />
          <div className="pt-8 px-4">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 italic">Operational Links</p>
             <Link href="/earning-hub" className="flex items-center gap-3 p-3 text-[10px] font-bold text-white hover:bg-white/5 rounded-xl transition-all uppercase"><Zap className="h-4 w-4 text-primary" /> Income Hub</Link>
             <Link href="/games" className="flex items-center gap-3 p-3 text-[10px] font-bold text-white hover:bg-white/5 rounded-xl transition-all uppercase"><Gamepad2 className="h-4 w-4 text-primary" /> Games Arena</Link>
             <Link href="/movies" className="flex items-center gap-3 p-3 text-[10px] font-bold text-white hover:bg-white/5 rounded-xl transition-all uppercase"><Video className="h-4 w-4 text-primary" /> Cinema Hub</Link>
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
               <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px]">Industrial Portfolio</Badge>
               <Badge className="bg-amber-500/20 text-amber-500 border-none uppercase font-black px-4 py-1 text-[10px] flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-500" /> VIP LEVEL {currentVip}
               </Badge>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">Total <span className="text-primary">{combinedCashBalance}</span></h1>
          </div>
          <div className="bg-black/40 border border-white/5 px-8 py-4 rounded-3xl backdrop-blur-xl">
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Skill Proficiency</p>
             <div className="flex items-center gap-4">
                <Progress value={((profile?.puzzleLevel || 1) / 50) * 100} className="h-2 w-32 bg-white/5" />
                <span className="text-sm font-black text-primary italic">Lvl {(profile?.puzzleLevel || 1)}</span>
             </div>
          </div>
        </header>

        {profile && profile.vipLevel === 0 && (
           <VipQuestDashboard profile={profile} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <WalletCard label="Winning Cash" value={profile?.winningBalance || 0} icon={<Trophy />} color="green" />
          <WalletCard label="Task Earnings" value={profile?.taskBalance || 0} icon={<CreditCard />} color="blue" />
          <WalletCard label="Total Assets" value={profile?.coins || 0} icon={<Coins />} color="amber" />
          <WalletCard label="Bonus Signal" value={profile?.bonusBalance || 0} icon={<Zap />} color="primary" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-12">
            
            <section className="space-y-6">
               <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><BookOpen className="h-6 w-6 text-primary" /> Study & Earn Sector</h3>
               <Card className="bg-primary/5 border-primary/20 border-2 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-8 opacity-5">
                     <BrainCircuit className="h-40 w-48 text-primary" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                     <div className="space-y-4 flex-1">
                        <Badge className="bg-green-500/20 text-green-500 border-none uppercase font-black text-[8px] px-3">ACTIVE CHALLENGE</Badge>
                        <h4 className="text-3xl font-black uppercase italic leading-none">Weekly <span className="text-primary">Scholarship</span></h4>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                           Read for 15 minutes to trigger an AI Quiz. Score 5/5 to earn extra coin dividends.
                        </p>
                        <div className="pt-4 space-y-2">
                           <div className="flex justify-between text-[8px] font-black uppercase text-muted-foreground">
                              <span>Weekly Progress</span>
                              <span className="text-primary">{profile?.totalPagesShared || 0} / 10 Reads</span>
                           </div>
                           <Progress value={Math.min(((profile?.totalPagesShared || 0)/10)*100, 100)} className="h-2 bg-white/5" />
                        </div>
                     </div>
                     <Button asChild className="h-16 px-10 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black uppercase italic shadow-xl">
                        <Link href="/campus">GO TO LIBRARY <ArrowRight className="ml-2 h-4 w-4" /></Link>
                     </Button>
                  </div>
               </Card>
            </section>

            <section className="space-y-6">
               <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><Zap className="h-6 w-6 text-primary" /> Active Income Signals</h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <IncomeSourceCard title="CPA Missions" value="₹5 - ₹50" icon={<Smartphone />} link="/earning-hub" />
                  <IncomeSourceCard title="Arcade Levels" value="Up to 50 🪙" icon={<Gamepad2 />} link="/games" />
                  <IncomeSourceCard title="Cinema Watch" value="300 🪙" icon={<Video />} link="/watch-earn" />
                  <IncomeSourceCard title="Team Royalties" value="5% + 2%" icon={<Users />} link="/refer" />
               </div>
            </section>

            <div className="space-y-8">
              <h3 className="text-2xl font-black uppercase flex items-center gap-4 italic"><History className="h-6 w-6 text-primary" /> Recent Logic</h3>
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                {isActivityLoading ? (
                  <div className="p-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="p-8 flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-sm font-bold uppercase text-white">{activity.description || activity.type}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase">{activity.date}</p>
                         </div>
                         <p className={cn("text-xl font-black", activity.amount < 0 ? "text-red-400" : "text-green-400")}>
                           {activity.amount > 0 ? '+' : ''}{activity.amount} 🪙
                         </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-32 text-center text-muted-foreground uppercase font-black text-xs">No activity archived.</div>
                )}
              </Card>
            </div>
          </div>
          
          <div className="space-y-8">
             <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-8 space-y-6">
                <h4 className="text-sm font-black uppercase italic flex items-center gap-2"><ShieldCheck className="text-primary" /> Security Hub</h4>
                <ul className="space-y-4">
                   <SecurityLink active={profile?.kycStatus === 'approved'} text="Identity Verification" />
                   <SecurityLink active={profile?.riskNoticeAccepted || false} text="Risk Disclosure" />
                   <SecurityLink active={currentVip > 0} text="VIP Payout Unlock" />
                </ul>
                <Button asChild className="w-full h-12 bg-primary rounded-xl font-black uppercase italic text-[10px] shadow-lg">
                   <Link href="/withdraw">REQUEST WITHDRAWAL <ArrowUpRight className="h-4 w-4 ml-2" /></Link>
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

function WalletCard({ label, value, icon, color }: any) {
  const currencyStr = formatCurrency(value);
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
                  <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Yield: {value}</p>
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

function BrainCircuit(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .52 8.105 4 4 0 0 0 5.327 2.09c1.168-.344 2.13-1.127 2.676-2.09"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.52 8.105 4 4 0 0 1-5.327 2.09c-1.168-.344-2.13-1.127-2.676-2.09"/><path d="M9 13a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z"/></svg>
  )
}
