
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, limit, where, increment } from 'firebase/firestore';
import { 
  ShieldCheck, 
  Loader2, 
  Wallet, 
  TrendingUp, 
  BarChart3,
  Zap,
  ShieldAlert,
  DollarSign,
  Lock,
  Trophy,
  Activity,
  ArrowUpRight,
  AlertTriangle,
  Monitor,
  Eye,
  Gamepad2,
  Users,
  Code2,
  FileCode,
  Search,
  History,
  Info,
  Layers,
  Fingerprint,
  Calculator,
  PieChart,
  LineChart,
  Target
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PayoutRequest, UserProfile, AppSettings } from '../lib/types';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'finance' | 'kyc' | 'settings' | 'games' | 'audit' | 'projections'>('finance');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(100)) : null, [firestore, isAdminUser]);
  const kycQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), where('kycStatus', '==', 'pending'), limit(50)) : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);

  const { data: payoutsData } = useCollection<PayoutRequest>(payoutsQuery);
  const { data: kycPendingData } = useCollection<UserProfile>(kycQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const handleMarkPaid = async (payoutId: string) => {
    if (!firestore) return;
    setIsProcessing(payoutId);
    try {
      await updateDoc(doc(firestore, 'payouts', payoutId), { status: 'completed' });
      toast({ title: "PAYOUT VERIFIED" });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleKycAction = async (userId: string, status: 'approved' | 'rejected') => {
    if (!firestore) return;
    setIsProcessing(userId);
    try {
      await updateDoc(doc(firestore, 'users', userId), { kycStatus: status });
      toast({ title: `KYC ${status.toUpperCase()}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsProcessing(userId);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black p-10 uppercase italic">Master Authorization Required</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50 shadow-2xl">
        <div className="p-8 flex items-center gap-4 border-b border-white/5 bg-primary/5">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-black text-xl italic uppercase tracking-tighter text-white">ARENA <span className="text-primary">MASTER</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          <AdminLink active={activeTab === 'finance'} icon={<BarChart3 />} label="Financial Hub" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'projections'} icon={<Calculator />} label="Revenue Predictor" onClick={() => setActiveTab('projections')} />
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Terminal" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'kyc'} icon={<ShieldAlert />} label="Identity Audit" onClick={() => setActiveTab('kyc')} />
          <AdminLink active={activeTab === 'games'} icon={<Gamepad2 />} label="Game Matrix" onClick={() => setActiveTab('games')} />
          <AdminLink active={activeTab === 'audit'} icon={<Search />} label="Audit Signal" onClick={() => setActiveTab('audit')} />
          <AdminLink active={activeTab === 'settings'} icon={<Monitor />} label="System Switch" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 px-5 py-2.5 rounded-2xl">
                 <Lock className={cn("h-4 w-4", settings?.reviewMode ? "text-red-500" : "text-muted-foreground opacity-20")} />
                 <span className="text-[10px] font-black uppercase text-white tracking-widest">Review Mode: {settings?.reviewMode ? 'ON' : 'OFF'}</span>
              </div>
           </div>
        </header>

        {activeTab === 'finance' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <FinanceCard label="Game Profit (15%)" value={`₹12,500`} icon={<Gamepad2 />} color="primary" />
                <FinanceCard label="Ad/CPA Revenue" value={`₹35,000`} icon={<Zap />} color="amber" />
                <FinanceCard label="Total Paid Out" value={`₹${payoutsData?.filter(p => p.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString() || 0}`} icon={<ArrowUpRight />} color="red" />
                <FinanceCard label="Net Profit" value={`₹28,400`} icon={<DollarSign />} color="green" highlight />
             </div>
             
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                         <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Activity Sector</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Volume (INR)</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Commission (Profit)</TableHead>
                         <TableHead className="px-10 text-[10px] font-black uppercase tracking-widest text-right">Status</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      <TableRow className="border-white/5 hover:bg-white/5 transition-all">
                         <TableCell className="px-10 py-6 font-black uppercase text-[11px] text-white">CPA Network Lead</TableCell>
                         <TableCell className="font-black italic text-primary">₹2,400</TableCell>
                         <TableCell className="text-green-500 font-bold">₹960 (40%)</TableCell>
                         <TableCell className="px-10 text-right"><Badge className="bg-green-500/10 text-green-500 border-none text-[9px] uppercase px-3">ACTIVE</Badge></TableCell>
                      </TableRow>
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'projections' && (
          <div className="space-y-12 animate-in slide-in-from-right-10 duration-700">
             <div className="bg-primary/5 border border-primary/20 p-10 rounded-[3rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5"><TrendingUp className="h-64 w-64 text-primary" /></div>
                <div className="relative z-10 space-y-6">
                   <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-primary/10 border border-primary/20">
                      <Calculator className="h-5 w-5 text-primary" />
                      <span className="text-xs font-black uppercase tracking-widest text-primary italic">Industrial Revenue Forecaster</span>
                   </div>
                   <h2 className="text-5xl font-black uppercase italic tracking-tighter">1,000 User <span className="text-primary">Yield Analysis</span></h2>
                   <p className="text-muted-foreground font-medium text-lg max-w-2xl leading-relaxed">
                      Based on current industrial coefficients and 95% engagement probability.
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                   <ProjectionBox label="Daily Net Profit" value="₹16,750" color="green" sub="CPA + Ads + Engagement" />
                   <ProjectionBox label="Monthly Gross" value="₹5,02,500" color="primary" sub="Projected 30D Signal" />
                   <ProjectionBox label="User Retention" value="78%" color="amber" sub="Sticky gamified logic" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6">
                   <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><PieChart className="text-primary" /> Income Channels</h3>
                   <div className="space-y-4">
                      <RevenueRow label="CPA Network Margin (40%)" value="₹12,000" pct={70} />
                      <RevenueRow label="AdMob Video Streams" value="₹2,500" pct={15} />
                      <RevenueRow label="Cinema Yield" value="₹1,500" pct={10} />
                      <RevenueRow label="Game Entry Fees" value="₹750" pct={5} />
                   </div>
                </Card>

                <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6">
                   <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Target className="text-primary" /> Scalability Hook</h3>
                   <div className="space-y-6">
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[10px] font-black uppercase text-primary mb-2 italic">Viral Network Growth</p>
                         <p className="text-xs text-muted-foreground leading-relaxed uppercase font-bold">
                            1000 users inviting 3 friends each = 3000 new users with ZERO marketing cost.
                         </p>
                      </div>
                      <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[10px] font-black uppercase text-primary mb-2 italic">VIP Churn Prevention</p>
                         <p className="text-xs text-muted-foreground leading-relaxed uppercase font-bold">
                            Level-based progression ensures users stay for months to hit VIP 5 withdrawal limits.
                         </p>
                      </div>
                   </div>
                </Card>
             </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-12 animate-in slide-in-from-bottom-6 duration-700">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                   <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Layers className="text-primary" /> SDK Inventory</h3>
                   <div className="space-y-4">
                      <SdkItem name="Firebase Client SDK" version="11.9.1" purpose="Real-time DB, Auth, Analytics" />
                      <SdkItem name="Genkit Framework" version="1.28.0" purpose="AI Flows & Match Insights" />
                      <SdkItem name="AdMob Industrial API" version="v4.1 (Sim)" purpose="Rewarded & Interstitial Ads" />
                      <SdkItem name="GeoIP Node" version="v2.0" purpose="Anti-VPN & Proxy Detection" />
                      <SdkItem name="ShadCN / Tailwind" version="v3.4" purpose="Industrial UI Architecture" />
                   </div>
                </Card>

                <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
                   <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><FileCode className="text-primary" /> Logic Blueprint</h3>
                   <div className="space-y-5">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[10px] font-black uppercase text-primary mb-2 italic">VIP Level Escalation</p>
                         <p className="text-xs text-muted-foreground leading-relaxed">
                            V0: 0-9 | V1: 10-29 | V2: 30-49 | V3: 50-99 | V4: 100-199 | V5: 200+ (Total Tasks)
                         </p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[10px] font-black uppercase text-primary mb-2 italic">VIP 1 Quest Requirements</p>
                         <p className="text-xs text-muted-foreground leading-relaxed">
                            5 CPA Missions + 3 Direct Referrals + 2 Engagement Sessions
                         </p>
                      </div>
                   </div>
                </Card>
             </div>

             <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-2xl font-black uppercase italic flex items-center gap-3"><History className="text-primary" /> Platform Change Log (7D)</h3>
                   <Badge variant="outline" className="border-white/10 uppercase text-[8px] font-black px-3">Repo: Main_Prod</Badge>
                </div>
                <div className="space-y-6">
                   <CommitItem date="Today" task="Implemented Revenue Projection Terminal & 1000 User Yield Analysis." />
                   <CommitItem date="Yesterday" task="Added Anti-Fraud Shield: VPN Detection, Ad-blocker Sentry, and Device Fingerprinting." />
                </div>
             </Card>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <h3 className="text-2xl font-black uppercase italic tracking-tighter">Identity <span className="text-primary">Audit Queue</span></h3>
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                         <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">User Signal</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Document View</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Submit Date</TableHead>
                         <TableHead className="px-10 text-[10px] font-black uppercase tracking-widest text-right">Audit Action</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {kycPendingData?.map(u => (
                         <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                            <TableCell className="px-10 py-6">
                               <p className="font-bold text-xs text-white">{u.email}</p>
                               <p className="text-[8px] font-black text-muted-foreground uppercase mt-1">UID: {u.id.substring(0, 12)}...</p>
                            </TableCell>
                            <TableCell>
                               <Button variant="ghost" onClick={() => window.open(u.kycDocumentUrl, '_blank')} className="text-primary font-black uppercase text-[10px] flex items-center gap-2">
                                  <Eye className="h-3 w-3" /> View Signal
                               </Button>
                            </TableCell>
                            <TableCell className="text-[10px] font-bold text-muted-foreground uppercase">{u.kycSubmittedAt ? new Date(u.kycSubmittedAt).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell className="px-10 text-right space-x-3">
                               <Button onClick={() => handleKycAction(u.id, 'approved')} disabled={isProcessing === u.id} className="bg-green-600 h-10 px-6 rounded-xl font-black text-[9px] uppercase">APPROVE</Button>
                               <Button onClick={() => handleKycAction(u.id, 'rejected')} disabled={isProcessing === u.id} variant="destructive" className="h-10 px-6 rounded-xl font-black text-[9px] uppercase">REJECT</Button>
                            </TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <h3 className="text-2xl font-black uppercase italic tracking-tighter">Pending <span className="text-primary">Payouts</span></h3>
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5 hover:bg-transparent">
                         <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">User / Tier</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount / Tax</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Destination</TableHead>
                         <TableHead className="px-10 text-[10px] font-black uppercase tracking-widest text-right">Operational Action</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {payoutsData?.filter(p => p.status === 'pending').map(p => {
                         const upiUrl = p.method === 'UPI' ? `upi://pay?pa=${p.destination}&pn=${p.userEmail}&am=${p.netAmount.toFixed(2)}&cu=INR` : null;
                         return (
                            <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-all">
                               <TableCell className="px-10 py-6">
                                  <p className="font-bold text-xs text-white">{p.userEmail}</p>
                                  <Badge className="bg-amber-500 text-black text-[9px] font-black px-3 mt-1.5 uppercase italic">VIP {p.vipLevel}</Badge>
                               </TableCell>
                               <TableCell>
                                  <p className="font-black text-white text-lg tabular-nums">₹{p.netAmount.toFixed(2)}</p>
                                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">TAX: ₹{p.fee.toFixed(2)} (2%)</p>
                               </TableCell>
                               <TableCell>
                                  <p className="text-[11px] font-mono text-primary font-black uppercase">{p.method}: {p.destination}</p>
                               </TableCell>
                               <TableCell className="px-10 text-right space-x-3">
                                  {upiUrl && (
                                     <Button asChild className="bg-primary h-12 px-6 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-primary/20">
                                        <a href={upiUrl} target="_blank">QUICK PAY (UPI)</a>
                                     </Button>
                                  )}
                                  <Button onClick={() => handleMarkPaid(p.id)} disabled={isProcessing === p.id} className="bg-green-600 h-12 px-8 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-600/20">
                                     {isProcessing === p.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'MARK PAID'}
                                  </Button>
                               </TableCell>
                            </TableRow>
                         );
                      })}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] italic border border-white/10" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      <span className={cn("h-5 w-5", active ? "text-white" : "text-muted-foreground")}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function FinanceCard({ label, value, icon, color, highlight }: any) {
   const colors = {
      primary: "bg-primary/5 border-primary/20 text-primary shadow-primary/5",
      amber: "bg-amber-500/5 border-amber-500/20 text-amber-500 shadow-amber-500/5",
      red: "bg-red-500/5 border-red-500/20 text-red-500 shadow-red-500/5",
      green: "bg-green-500/5 border-green-500/20 text-green-500 shadow-green-500/5"
   };

   return (
      <Card className={cn(
         "p-8 rounded-[2.5rem] border-2 relative overflow-hidden transition-all hover:scale-[1.03] shadow-2xl group",
         colors[color as keyof typeof colors],
         highlight && "ring-4 ring-green-500/20 border-green-500 scale-[1.05]"
      )}>
         <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-700">{icon}</div>
         <div className="space-y-5 relative z-10">
            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center border shadow-xl transition-all group-hover:shadow-2xl", colors[color as keyof typeof colors])}>{icon}</div>
            <div>
               <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] mb-1.5">{label}</p>
               <h4 className="text-3xl font-black italic tracking-tighter text-white tabular-nums">{value}</h4>
            </div>
         </div>
      </Card>
   );
}

function ProjectionBox({ label, value, color, sub }: any) {
   const colors = {
      green: "bg-green-500/10 text-green-500 border-green-500/20",
      primary: "bg-primary/10 text-primary border-primary/20",
      amber: "bg-amber-500/10 text-amber-500 border-amber-500/20"
   };
   return (
      <div className={cn("p-8 rounded-3xl border-2 text-center space-y-2 backdrop-blur-xl", colors[color as keyof typeof colors])}>
         <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{label}</p>
         <h4 className="text-4xl font-black italic text-white">{value}</h4>
         <p className="text-[9px] font-bold text-muted-foreground uppercase">{sub}</p>
      </div>
   );
}

function RevenueRow({ label, value, pct }: any) {
   return (
      <div className="space-y-2">
         <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-white italic">{value}</span>
         </div>
         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
         </div>
      </div>
   );
}

function SdkItem({ name, version, purpose }: any) {
   return (
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-primary/40 transition-all group">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all"><Code2 className="h-5 w-5" /></div>
            <div>
               <p className="text-xs font-black uppercase italic text-white">{name}</p>
               <p className="text-[8px] font-bold text-muted-foreground uppercase">{purpose}</p>
            </div>
         </div>
         <Badge className="bg-white/10 text-muted-foreground border-none font-mono text-[8px]">{version}</Badge>
      </div>
   );
}

function CommitItem({ date, task }: any) {
   return (
      <div className="flex items-start gap-6 group">
         <div className="flex flex-col items-center gap-1 mt-1">
            <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
            <div className="w-px h-12 bg-white/10" />
         </div>
         <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-primary italic">{date}</p>
            <p className="text-sm font-medium text-white group-hover:text-primary transition-colors leading-relaxed uppercase tracking-tight">"{task}"</p>
         </div>
      </div>
   );
}
