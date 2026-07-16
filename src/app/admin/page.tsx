
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, deleteDoc, limit, where } from 'firebase/firestore';
import { 
  ShieldCheck, 
  Loader2, 
  Wallet, 
  FileText, 
  Plus, 
  Trash2, 
  Download, 
  CloudRain, 
  TrendingUp, 
  Users as UsersIcon,
  Crown,
  Activity,
  Zap,
  Network,
  BarChart3,
  Search,
  Flame,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PayoutRequest, StudyMaterial, UserProfile } from '../lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'inventory' | 'growth' | 'network' | 'milestones'>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const matsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'study_materials'), orderBy('createdAt', 'desc'), limit(100)) : null, [firestore, isAdminUser]);
  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore, isAdminUser]);
  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), orderBy('tasksCompletedCount', 'desc'), limit(500)) : null, [firestore, isAdminUser]);

  const { data: materialsData } = useCollection<StudyMaterial>(matsQuery);
  const { data: payoutsData } = useCollection<PayoutRequest>(payoutsQuery);
  const { data: usersData } = useCollection<UserProfile>(usersQuery);

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
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Terminal" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'growth'} icon={<TrendingUp />} label="Growth Matrix" onClick={() => setActiveTab('growth')} />
          <AdminLink active={activeTab === 'network'} icon={<Network />} label="Network Intel" onClick={() => setActiveTab('network')} />
          <AdminLink active={activeTab === 'milestones'} icon={<Flame />} label="Milestone Audit" onClick={() => setActiveTab('milestones')} />
          <AdminLink active={activeTab === 'inventory'} icon={<FileText />} label="Resource Hub" onClick={() => setActiveTab('inventory')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
        </header>

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

             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6">
                   <h3 className="text-sm font-black uppercase italic">VIP Distribution Analysis</h3>
                   <div className="space-y-6">
                      {[0,1,2,3,4,5].map(lvl => {
                         const count = usersData?.filter(u => (u.vipLevel || 0) === lvl).length || 0;
                         const pct = Math.round((count / (usersData?.length || 1)) * 100);
                         return (
                           <div key={lvl} className="space-y-2">
                              <div className="flex justify-between text-[10px] font-black uppercase">
                                 <span>VIP {lvl}</span>
                                 <span className="text-primary">{count} Warriors ({pct}%)</span>
                              </div>
                              <Progress value={pct} className="h-1.5 bg-white/5" />
                           </div>
                         );
                      })}
                   </div>
                </Card>

                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6">
                   <h3 className="text-sm font-black uppercase italic">Retention & Churn Risk</h3>
                   <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <TrendingDown className="h-5 w-5 text-red-500" />
                            <span className="text-[10px] font-black uppercase">Stuck at VIP 0</span>
                         </div>
                         <span className="text-lg font-black text-red-500">{usersData?.filter(u => (u.vipLevel || 0) === 0).length || 0}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <ArrowUpRight className="h-5 w-5 text-green-500" />
                            <span className="text-[10px] font-black uppercase">Active VIP 1+ Growth</span>
                         </div>
                         <span className="text-lg font-black text-green-500">{usersData?.filter(u => (u.vipLevel || 0) >= 1).length || 0}</span>
                      </div>
                   </div>
                   <p className="text-[9px] font-bold text-muted-foreground uppercase italic leading-relaxed">
                      Conversion Note: If "Stuck at VIP 0" count is high, consider reducing the Task 1 difficulty or increasing the reward to trigger VIP 1 faster.
                   </p>
                </Card>
             </div>

             <div className="space-y-6">
                <h3 className="text-xl font-black uppercase italic">Top <span className="text-primary">Performers</span></h3>
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden">
                   <Table>
                      <TableHeader className="bg-white/5">
                         <TableRow className="border-white/5">
                            <TableHead className="text-[9px] font-black uppercase">Warrior</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">VIP Tier</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Missions Done</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right">Net Assets</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {usersData?.slice(0, 50).map(u => (
                            <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                               <TableCell className="font-bold text-xs">{u.email || u.id}</TableCell>
                               <TableCell><Badge className="bg-primary/20 text-primary uppercase font-black text-[8px]">LEVEL {u.vipLevel || 0}</Badge></TableCell>
                               <TableCell className="font-black italic text-sm">{u.tasksCompletedCount || 0}</TableCell>
                               <TableCell className="text-right font-black text-green-500 italic">{u.coins?.toLocaleString() || 0} 🪙</TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </Card>
             </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] space-y-4">
                   <Network className="h-10 w-10 text-primary" />
                   <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Total Referrals (All)</p>
                      <h4 className="text-4xl font-black italic">{usersData?.reduce((acc, u) => acc + (u.totalReferrals || 0), 0)}</h4>
                   </div>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20 p-8 rounded-[2.5rem] space-y-4">
                   <Zap className="h-10 w-10 text-amber-500" />
                   <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Network Revenue Flow</p>
                      <h4 className="text-4xl font-black italic">{(usersData?.reduce((acc, u) => acc + (u.referralCommissionBalance || 0), 0) || 0).toLocaleString()} 🪙</h4>
                   </div>
                </Card>
                <Card className="bg-green-500/5 border-green-500/20 p-8 rounded-[2.5rem] space-y-4">
                   <BarChart3 className="h-10 w-10 text-green-500" />
                   <div>
                      <p className="text-[10px] font-black uppercase text-muted-foreground">Elite Affiliates</p>
                      <h4 className="text-4xl font-black italic">{usersData?.filter(u => u.isEliteAffiliate).length || 0}</h4>
                   </div>
                </Card>
             </div>

             <div className="space-y-6">
                <h3 className="text-xl font-black uppercase italic">Top <span className="text-primary">Recruiters</span></h3>
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden">
                   <Table>
                      <TableHeader className="bg-white/5">
                         <TableRow className="border-white/5">
                            <TableHead className="text-[9px] font-black uppercase">Recruiter</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">L1 Team</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Network Size</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right">Elite Status</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {usersData?.sort((a,b) => (b.totalNetworkReferrals || 0) - (a.totalNetworkReferrals || 0)).slice(0, 50).map(u => (
                            <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                               <TableCell className="font-bold text-xs">{u.email || u.id}</TableCell>
                               <TableCell><Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[8px]">{u.totalReferrals || 0} L1</Badge></TableCell>
                               <TableCell className="font-black italic text-sm">{u.totalNetworkReferrals || 0}</TableCell>
                               <TableCell className="text-right">
                                  {u.isEliteAffiliate ? (
                                     <Badge className="bg-amber-500 text-black font-black uppercase text-[8px]">ELITE</Badge>
                                  ) : (
                                     <Badge variant="ghost" className="text-muted-foreground opacity-30 text-[8px] uppercase">Standard</Badge>
                                  )}
                               </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
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
