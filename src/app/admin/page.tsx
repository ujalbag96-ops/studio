
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
  Users
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
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'finance' | 'kyc' | 'settings' | 'games'>('finance');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(100)) : null, [firestore, isAdminUser]);
  const kycQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), where('kycStatus', '==', 'pending'), limit(50)) : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const gameStatsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users', 'ledger'), where('type', 'in', ['game_fee', 'game_win'])) : null, [firestore, isAdminUser]);

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

  const toggleReviewMode = async (val: boolean) => {
    if (!settingsRef) return;
    try {
      await updateDoc(settingsRef, { reviewMode: val });
      toast({ title: `REVIEW MODE: ${val ? 'ON' : 'OFF'}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Toggle Failed" });
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
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Terminal" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'kyc'} icon={<ShieldAlert />} label="Identity Audit" onClick={() => setActiveTab('kyc')} />
          <AdminLink active={activeTab === 'games'} icon={<Gamepad2 />} label="Game Matrix" onClick={() => setActiveTab('games')} />
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
                <FinanceCard label="Game Profit (20%)" value={`₹12,500`} icon={<Gamepad2 />} color="primary" />
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
                         <TableCell className="px-10 py-6 font-black uppercase text-[11px] text-white">Chicken Road Wagers</TableCell>
                         <TableCell className="font-black italic text-primary">₹4,200</TableCell>
                         <TableCell className="text-green-500 font-bold">₹840 (20%)</TableCell>
                         <TableCell className="px-10 text-right"><Badge className="bg-green-500/10 text-green-500 border-none text-[9px] uppercase px-3">ACTIVE</Badge></TableCell>
                      </TableRow>
                      <TableRow className="border-white/5 hover:bg-white/5 transition-all">
                         <TableCell className="px-10 py-6 font-black uppercase text-[11px] text-white">Ludo Lite Battles</TableCell>
                         <TableCell className="font-black italic text-primary">₹8,500</TableCell>
                         <TableCell className="text-green-500 font-bold">₹1,700 (20%)</TableCell>
                         <TableCell className="px-10 text-right"><Badge className="bg-green-500/10 text-green-500 border-none text-[9px] uppercase px-3">ACTIVE</Badge></TableCell>
                      </TableRow>
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'games' && (
           <div className="space-y-10 animate-in slide-in-from-left-4 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <FinanceCard label="Total Game Sessions" value="5,420" icon={<Activity />} color="primary" />
                 <FinanceCard label="Burned Coins" value="85,000" icon={<Zap />} color="amber" />
                 <FinanceCard label="Average RTP" value="95.2%" icon={<TrendingUp />} color="green" />
              </div>

              <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                 <div className="p-8 border-b border-white/5 bg-white/5">
                    <h3 className="text-lg font-black uppercase italic tracking-tighter">Most Played <span className="text-primary">Intelligence</span></h3>
                 </div>
                 <div className="p-10 divide-y divide-white/5">
                    <GameStatItem name="Chicken Road" players={1240} revenue="₹1,240" ads={2480} />
                    <GameStatItem name="Ludo Lite" players={850} revenue="₹2,550" ads={1700} />
                    <GameStatItem name="Multi Win" players={2100} revenue="₹12,000" ads={4200} />
                 </div>
              </Card>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="max-w-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-[#0a0a0f] border-white/5 p-12 rounded-[3rem] space-y-10 shadow-2xl">
                 <div className="flex items-center justify-between p-8 bg-white/5 rounded-3xl border border-white/10">
                    <div className="space-y-2">
                       <Label className="text-lg font-black uppercase italic text-white leading-none">Google Play Review Mode</Label>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Hides all gaming and tournament sectors globally.</p>
                    </div>
                    <Switch 
                      checked={settings?.reviewMode || false} 
                      onCheckedChange={toggleReviewMode}
                      className="data-[state=checked]:bg-red-500 h-8 w-14"
                    />
                 </div>
                 
                 <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-3xl flex items-start gap-6">
                    <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                    <p className="text-[11px] font-bold text-amber-500 uppercase leading-relaxed tracking-wide">
                       CRITICAL SIGNAL: Review Mode is a global "Kill Switch". Ensure it is strictly OFF before starting real-world user acquisition missions.
                    </p>
                 </div>
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
                      {payoutsData?.filter(p => p.status === 'pending').map(p => (
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
                            <TableCell className="px-10 text-right">
                               <Button onClick={() => handleMarkPaid(p.id)} disabled={isProcessing === p.id} className="bg-green-600 h-12 px-8 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-green-600/20">
                                  {isProcessing === p.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'MARK PAID'}
                               </Button>
                            </TableCell>
                         </TableRow>
                      ))}
                      {(!payoutsData || payoutsData.length === 0) && (
                         <TableRow><TableCell colSpan={4} className="text-center py-32 text-muted-foreground font-black uppercase text-[11px] tracking-[0.4em] italic opacity-30">No pending payout signals.</TableCell></TableRow>
                      )}
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

function GameStatItem({ name, players, revenue, ads }: any) {
   return (
      <div className="py-6 flex items-center justify-between hover:bg-white/5 px-4 rounded-2xl transition-all group">
         <div className="flex items-center gap-5">
            <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
               <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
               <p className="text-sm font-black uppercase italic text-white">{name}</p>
               <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2"><Users className="h-3 w-3" /> {players.toLocaleString()} Players</p>
            </div>
         </div>
         <div className="text-right flex items-center gap-10">
            <div>
               <p className="text-[9px] font-black text-muted-foreground uppercase">Revenue Yield</p>
               <p className="text-lg font-black text-green-500 italic tabular-nums">{revenue}</p>
            </div>
            <div>
               <p className="text-[9px] font-black text-muted-foreground uppercase">Ad Signals</p>
               <p className="text-lg font-black text-amber-500 italic tabular-nums">{ads.toLocaleString()}</p>
            </div>
         </div>
      </div>
   );
}
