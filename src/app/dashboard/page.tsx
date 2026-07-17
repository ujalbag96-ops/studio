
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
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { UserProfile, UserLedgerEntry } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConnectWalletModal from '@/components/ConnectWalletModal';
import { useToast } from '@/hooks/use-toast';
import ViralLeaderboard from '@/components/ViralLeaderboard';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function UserDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState<'overview' | 'offers' | 'video' | 'mlm'>('overview');
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [showLegal, setShowLegal] = useState(false);
  
  // KYC State
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycDoc, setKycDoc] = useState<string | null>(null);
  const [isKycProcessing, setIsKycProcessing] = useState(false);

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

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary relative">
      <ConnectWalletModal isOpen={isConnectOpen} onOpenChange={setIsConnectOpen} />
      <RiskDisclosureModal isOpen={showLegal} onOpenChange={setShowLegal} />
      
      {/* KYC MODAL */}
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
               <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-start gap-4">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed">
                     Your data is encrypted via AES-256 and stored on secure industrial nodes. It is used only for withdrawal verification.
                  </p>
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

        <nav className="flex-1 p-8 space-y-2">
          <SidebarItem active={activeNav === 'overview'} icon={<LayoutDashboard />} label="Portfolio" onClick={() => setActiveNav('overview')} />
          <SidebarItem active={activeNav === 'mlm'} icon={<Network />} label="MLM Network" onClick={() => setActiveNav('mlm')} />
          <SidebarItem active={false} icon={<Scale />} label="Legal & Security" onClick={() => setShowLegal(true)} />
          <SidebarItem active={false} icon={<Fingerprint />} label="Verify Identity" onClick={() => setShowKycModal(true)} />
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
               <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[10px]">Verified Student Warrior</Badge>
               <Badge className="bg-amber-500/20 text-amber-500 border-none uppercase font-black px-4 py-1 text-[10px] flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-500" /> VIP LEVEL {currentVip}
               </Badge>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">Student <span className="text-primary">Vault</span></h1>
          </div>

          <div className="flex flex-col items-end gap-3">
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", profile?.kycStatus === 'approved' ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500")}>
                   {profile?.kycStatus === 'approved' ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                </div>
                <div>
                   <p className="text-[8px] font-black uppercase text-muted-foreground">ID Status</p>
                   <p className="text-xs font-black uppercase italic text-white">{profile?.kycStatus || 'Not Verified'}</p>
                </div>
                {profile?.kycStatus !== 'approved' && profile?.kycStatus !== 'pending' && (
                  <Button onClick={() => setShowKycModal(true)} size="sm" className="h-9 px-4 bg-primary rounded-xl font-black uppercase text-[9px]">VERIFY NOW</Button>
                )}
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <WalletCard label="Winning Cash" value={profile?.winningBalance || 0} icon={<Trophy />} color="green" />
          <WalletCard label="Deposit Cash" value={profile?.depositBalance || 0} icon={<CreditCard />} color="blue" />
          <WalletCard label="Total Coins" value={profile?.coins || 0} icon={<Coins />} color="amber" />
          <WalletCard label="Bonus Assets" value={profile?.bonusBalance || 0} icon={<Zap />} color="primary" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-8">
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
          <h4 className="text-2xl font-black text-white italic tabular-nums">{value.toLocaleString()} 🪙</h4>
        </div>
      </div>
    </Card>
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
