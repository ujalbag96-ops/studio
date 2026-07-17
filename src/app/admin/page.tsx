
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, deleteDoc, limit, where, getDocs } from 'firebase/firestore';
import { 
  ShieldCheck, 
  Loader2, 
  Wallet, 
  FileText, 
  Plus, 
  TrendingUp, 
  Users as UsersIcon,
  Crown,
  Activity,
  Zap,
  Network,
  BarChart3,
  Flame,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
  Coins,
  DollarSign,
  History
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PayoutRequest, StudyMaterial, UserProfile, UserLedgerEntry } from '../lib/types';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'finance' | 'growth' | 'network' | 'inventory'>('finance');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Financial Stats State
  const [financeStats, setFinanceStats] = useState({
    tourneyComm: 0,
    cpaRevenue: 15000, // Mocked from AdMob/CPA report
    totalPaidOut: 0,
    pendingVolume: 0
  });

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(100)) : null, [firestore, isAdminUser]);
  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), orderBy('tasksCompletedCount', 'desc'), limit(500)) : null, [firestore, isAdminUser]);
  const globalLedgerQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'global_ledger'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore, isAdminUser]);

  const { data: payoutsData } = useCollection<PayoutRequest>(payoutsQuery);
  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: globalLedger } = useCollection<any>(globalLedgerQuery);

  // 📈 Calculate Real-time Finance
  useEffect(() => {
    if (!payoutsData) return;
    const paid = payoutsData.filter(p => p.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0);
    const pending = payoutsData.filter(p => p.status === 'pending').reduce((acc, curr) => acc + curr.amount, 0);
    
    // Simulate Tournament Profit (15% of all entry fees)
    // In production, we'd query the 'registrations' collection
    const tourneyProfit = 4500; // Mocked for demonstration

    setFinanceStats(prev => ({
      ...prev,
      totalPaidOut: paid,
      pendingVolume: pending,
      tourneyComm: tourneyProfit
    }));
  }, [payoutsData]);

  const handleMarkPaid = async (payoutId: string) => {
    if (!firestore) return;
    setIsProcessing(payoutId);
    try {
      await updateDoc(doc(firestore, 'payouts', payoutId), {
        status: 'completed',
        processedAt: new Date().toISOString()
      });
      toast({ title: "PAYOUT VERIFIED" });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const openQuickPay = (payout: PayoutRequest) => {
     const upiUrl = `upi://pay?pa=${payout.destination}&am=${payout.netAmount}&tn=ArenaWithdrawal_${payout.id}`;
     window.open(upiUrl, '_blank');
  };

  const netProfit = (financeStats.tourneyComm + financeStats.cpaRevenue) - financeStats.totalPaidOut;
  const profitMargin = netProfit > 0 ? (netProfit / (financeStats.tourneyComm + financeStats.cpaRevenue)) * 100 : 0;

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black p-10 uppercase italic">Access Denied: Master Authorization Required</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 flex items-center gap-4 border-b border-white/5 bg-primary/5">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-black text-xl italic uppercase tracking-tighter">ARENA <span className="text-primary">MASTER</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          <AdminLink active={activeTab === 'finance'} icon={<BarChart3 />} label="Financial Hub" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Terminal" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'growth'} icon={<TrendingUp />} label="Growth Matrix" onClick={() => setActiveTab('growth')} />
          <AdminLink active={activeTab === 'network'} icon={<Network />} label="Network Intel" onClick={() => setActiveTab('network')} />
          <AdminLink active={activeTab === 'inventory'} icon={<FileText />} label="Resource Hub" onClick={() => setActiveTab('inventory')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
           <div className="flex items-center gap-4">
              <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                 <p className="text-[8px] font-black uppercase text-muted-foreground">Server Pulse</p>
                 <p className="text-xs font-black text-green-500 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> OPERATIONAL
                 </p>
              </div>
           </div>
        </header>

        {activeTab === 'finance' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FinanceCard label="Tourney Profit (15%)" value={`₹${financeStats.tourneyComm}`} icon={<Trophy />} color="primary" />
                <FinanceCard label="Ad/CPA Revenue" value={`₹${financeStats.cpaRevenue}`} icon={<Zap />} color="amber" />
                <FinanceCard label="Total Paid Out" value={`₹${financeStats.totalPaidOut}`} icon={<ArrowUpRight />} color="red" />
                <FinanceCard label="Net Profit" value={`₹${netProfit}`} icon={<DollarSign />} color="green" highlight />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6">
                   <h3 className="text-sm font-black uppercase italic">Profit Margin Analysis</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                         <span>Net Yield</span>
                         <span className={cn(profitMargin < 20 ? "text-red-500" : "text-green-500")}>{profitMargin.toFixed(1)}%</span>
                      </div>
                      <Progress value={profitMargin} className="h-2 bg-white/5" />
                      <p className="text-[9px] text-muted-foreground font-bold uppercase italic">Goal: Maintain > 25% margin for sustainability.</p>
                   </div>
                </Card>

                <div className="space-y-4">
                   {profitMargin < 20 && (
                     <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 rounded-3xl p-6">
                        <AlertTriangle className="h-5 w-5" />
                        <AlertTitle className="font-black uppercase text-xs italic">Critical: Margin Low</AlertTitle>
                        <AlertDescription className="text-[10px] uppercase font-bold">
                           Net profit has dropped below 20%. Consider reducing payout multipliers or adding more CPA missions.
                        </AlertDescription>
                     </Alert>
                   )}
                   {financeStats.pendingVolume > 5000 && (
                     <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-500 rounded-3xl p-6">
                        <ShieldAlert className="h-5 w-5" />
                        <AlertTitle className="font-black uppercase text-xs italic">Audit Warning: Payout Queue</AlertTitle>
                        <AlertDescription className="text-[10px] uppercase font-bold">
                           Pending withdrawals exceed ₹5,000. Process payments to maintain industrial user trust.
                        </AlertDescription>
                     </Alert>
                   )}
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                   <History className="text-primary h-6 w-6" /> Transaction <span className="text-primary">Ledger</span>
                </h3>
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden">
                   <Table>
                      <TableHeader className="bg-white/5">
                         <TableRow className="border-white/5">
                            <TableHead className="text-[9px] font-black uppercase">User ID</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Activity</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Amount</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Commission (Profit)</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right">Status</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {payoutsData?.slice(0, 10).map(p => (
                            <TableRow key={p.id} className="border-white/5">
                               <TableCell className="font-mono text-[10px] text-muted-foreground">{p.userId.substring(0, 8)}...</TableCell>
                               <TableCell className="font-black uppercase text-[10px]">{p.method}</TableCell>
                               <TableCell className="font-black italic">₹{p.amount}</TableCell>
                               <TableCell className="text-green-500 font-bold">₹{p.fee.toFixed(2)}</TableCell>
                               <TableCell className="text-right">
                                  <Badge className={cn("text-[8px] uppercase", p.status === 'completed' ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500")}>
                                     {p.status}
                                  </Badge>
                               </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </Card>
             </div>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <h3 className="text-xl font-black uppercase italic">Pending <span className="text-primary">Payouts</span></h3>
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                         <TableHead className="text-[9px] font-black uppercase">User / VIP</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Amount / Fee</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Method / Destination</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-right">Action</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {payoutsData?.filter(p => p.status === 'pending').map(p => (
                         <TableRow key={p.id} className="border-white/5 hover:bg-white/5">
                            <TableCell>
                               <div className="space-y-1">
                                  <p className="font-bold text-xs">{p.userEmail}</p>
                                  <Badge className="bg-amber-500 text-black text-[8px] font-black px-2">VIP {p.vipLevel || 0}</Badge>
                               </div>
                            </TableCell>
                            <TableCell>
                               <p className="font-black text-white italic">₹{p.netAmount.toFixed(2)}</p>
                               <p className="text-[8px] text-muted-foreground uppercase">Fee: ₹{p.fee?.toFixed(2)}</p>
                            </TableCell>
                            <TableCell>
                               <Badge variant="outline" className="text-[10px] border-primary/20 text-primary mb-1 uppercase">{p.method}</Badge>
                               <p className="text-[10px] font-mono text-muted-foreground">{p.destination}</p>
                            </TableCell>
                            <TableCell className="text-right">
                               <div className="flex justify-end gap-2">
                                  <Button onClick={() => openQuickPay(p)} className="bg-primary hover:bg-primary/90 h-10 px-4 rounded-xl font-black uppercase text-[9px]">
                                     QUICK PAY
                                  </Button>
                                  <Button onClick={() => handleMarkPaid(p.id)} disabled={isProcessing === p.id} className="bg-green-600 hover:bg-green-500 h-10 px-4 rounded-xl font-black uppercase text-[9px]">
                                     {isProcessing === p.id ? <Loader2 className="animate-spin" /> : 'MARK PAID'}
                                  </Button>
                               </div>
                            </TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-[#0a0a0f] border-primary/20 p-8 rounded-[2.5rem] space-y-4">
                   <UsersIcon className="h-10 w-10 text-primary" />
                   <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total Warriors</p>
                      <h4 className="text-4xl font-black italic">{usersData?.length || 0}</h4>
                   </div>
                </Card>
                <Card className="bg-[#0a0a0f] border-amber-500/20 p-8 rounded-[2.5rem] space-y-4">
                   <Crown className="h-10 w-10 text-amber-500" />
                   <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Conversion (VIP 1+)</p>
                      <h4 className="text-4xl font-black italic text-amber-500">
                         {Math.round(((usersData?.filter(u => (u.vipLevel || 0) >= 1).length || 0) / (usersData?.length || 1)) * 100)}%
                      </h4>
                   </div>
                </Card>
                <Card className="bg-[#0a0a0f] border-green-500/20 p-8 rounded-[2.5rem] space-y-4">
                   <Activity className="h-10 w-10 text-green-500" />
                   <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Master Tier (VIP 4+)</p>
                      <h4 className="text-4xl font-black uppercase italic text-green-500">{usersData?.filter(u => (u.vipLevel || 0) >= 4).length || 0}</h4>
                   </div>
                </Card>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all text-[12px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-2xl italic border border-white/10" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      {icon} <span>{label}</span>
    </button>
  );
}

function FinanceCard({ label, value, icon, color, highlight }: any) {
   const colors = {
      primary: "bg-primary/5 border-primary/20 text-primary",
      amber: "bg-amber-500/5 border-amber-500/20 text-amber-500",
      red: "bg-red-500/5 border-red-500/20 text-red-500",
      green: "bg-green-500/5 border-green-500/20 text-green-500"
   };

   return (
      <Card className={cn(
         "p-6 rounded-[2rem] border-2 relative overflow-hidden transition-all hover:scale-105 shadow-xl",
         colors[color as keyof typeof colors],
         highlight && "ring-4 ring-green-500/20 border-green-500"
      )}>
         <div className="absolute top-0 right-0 p-4 opacity-5">{icon}</div>
         <div className="space-y-4 relative z-10">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border", colors[color as keyof typeof colors])}>{icon}</div>
            <div>
               <p className="text-[8px] font-black uppercase opacity-60 tracking-widest mb-1">{label}</p>
               <h4 className="text-2xl font-black italic tracking-tighter text-white">{value}</h4>
            </div>
         </div>
      </Card>
   );
}
