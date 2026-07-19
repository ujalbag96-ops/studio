
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
  Target,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Settings,
  ShieldX,
  Cpu,
  Shield
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
import { Input } from '@/components/ui/input';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'finance' | 'kyc' | 'settings' | 'audit' | 'status'>('finance');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(100)) : null, [firestore, isAdminUser]);
  const fraudQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), where('isSuspended', '==', true), limit(50)) : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);

  const { data: payoutsData } = useCollection<PayoutRequest>(payoutsQuery);
  const { data: fraudData } = useCollection<UserProfile>(fraudQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const handleMarkPaid = async (payoutId: string) => {
    if (!firestore) return;
    setIsProcessing(payoutId);
    try {
      await updateDoc(doc(firestore, 'payouts', payoutId), { 
        status: 'completed',
        processedBy: 'manual'
      });
      toast({ title: "PAYOUT VERIFIED", description: "Signal synced to ledger." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReinstate = async (userId: string) => {
    if (!firestore) return;
    setIsProcessing(userId);
    try {
      await updateDoc(doc(firestore, 'users', userId), { isSuspended: false });
      toast({ title: "ACCOUNT REINSTATED", description: "Security lock removed." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleConfig = async (key: keyof AppSettings, val: any) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'app_settings', 'global_config'), { [key]: val });
      toast({ title: "CONFIG UPDATED", description: `${key} set to ${val}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Config Error" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black p-10 uppercase italic text-center space-y-4"><div><ShieldAlert className="h-20 w-20 mx-auto mb-4" />MASTER AUTHORIZATION REQUIRED</div></div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      {/* MASTER SIDEBAR */}
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50 shadow-2xl">
        <div className="p-8 flex items-center gap-4 border-b border-white/5 bg-primary/5">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-black text-xl italic uppercase tracking-tighter text-white">ARENA <span className="text-primary">MASTER</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          <AdminLink active={activeTab === 'status'} icon={<ClipboardCheck />} label="Feature Report" onClick={() => setActiveTab('status')} />
          <AdminLink active={activeTab === 'finance'} icon={<BarChart3 />} label="Financial Hub" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Terminal" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'audit'} icon={<ShieldX />} label="Security Signals" onClick={() => setActiveTab('audit')} />
          <AdminLink active={activeTab === 'settings'} icon={<Settings />} label="System Config" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Command <span className="text-primary">Center</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">Industrial Master Access</p>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 px-5 py-2.5 rounded-2xl">
                 <Lock className={cn("h-4 w-4", settings?.reviewMode ? "text-red-500" : "text-muted-foreground opacity-20")} />
                 <span className="text-[10px] font-black uppercase text-white tracking-widest">Review Mode: {settings?.reviewMode ? 'ON' : 'OFF'}</span>
              </div>
           </div>
        </header>

        {/* SETTINGS TAB WITH AUTO-WITHDRAWAL TOGGLE */}
        {activeTab === 'settings' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-10">
                 <div className="flex items-center gap-4">
                    <Settings className="h-8 w-8 text-primary" />
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">System <span className="text-primary">Config</span></h2>
                 </div>

                 <div className="grid gap-10">
                    {/* AUTO WITHDRAWAL TOGGLE */}
                    <div className="flex items-center justify-between p-8 bg-primary/5 rounded-3xl border border-primary/20 group hover:border-primary/40 transition-all">
                       <div className="flex items-center gap-6">
                          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                             <Cpu className={cn("h-8 w-8", settings?.autoWithdrawalEnabled ? "text-primary animate-pulse" : "text-muted-foreground")} />
                          </div>
                          <div className="space-y-1">
                             <h4 className="text-xl font-black uppercase italic">Auto-Withdrawal Mode</h4>
                             <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Toggle instant automated payouts via Gateway API.</p>
                          </div>
                       </div>
                       <Switch 
                        checked={settings?.autoWithdrawalEnabled} 
                        onCheckedChange={(val) => toggleConfig('autoWithdrawalEnabled', val)} 
                       />
                    </div>

                    <div className="p-8 bg-white/5 rounded-3xl border border-white/10 grid md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Auto-Payout Safety Cap (₹)</Label>
                          <Input 
                            type="number" 
                            defaultValue={settings?.autoWithdrawalMaxAmount || 2000} 
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-xl text-primary"
                            onBlur={(e) => toggleConfig('autoWithdrawalMaxAmount', parseFloat(e.target.value))}
                          />
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Requests above this limit trigger manual audit.</p>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Master UPI ID</Label>
                          <Input 
                            defaultValue={settings?.adminUpiId} 
                            className="h-14 bg-black border-white/10 rounded-xl font-mono text-xs"
                            onBlur={(e) => toggleConfig('adminUpiId', e.target.value)}
                          />
                       </div>
                    </div>

                    <div className="flex items-center justify-between p-8 bg-white/5 rounded-3xl border border-white/10">
                       <div className="space-y-1">
                          <h4 className="text-lg font-black uppercase italic">Review Mode</h4>
                          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Hide high-performance features for store verification.</p>
                       </div>
                       <Switch checked={settings?.reviewMode} onCheckedChange={(val) => toggleConfig('reviewMode', val)} />
                    </div>
                 </div>
              </Card>
           </div>
        )}

        {/* FINANCE TAB */}
        {activeTab === 'finance' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <FinanceCard label="Total Revenue (Est)" value={`₹48,500`} icon={<TrendingUp />} color="primary" />
                <FinanceCard label="Admin Margin (70%)" value={`₹33,950`} icon={<Zap />} color="amber" highlight />
                <FinanceCard label="User Rewards (30%)" value={`₹14,550`} icon={<Users />} color="green" />
                <FinanceCard label="Total Paid Out" value={`₹${payoutsData?.filter(p => p.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString() || 0}`} icon={<ArrowUpRight />} color="red" />
             </div>
             
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                         <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Activity Sector</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Volume (INR)</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Admin Profit (70%)</TableHead>
                         <TableHead className="px-10 text-[10px] font-black uppercase tracking-widest text-right">Status</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      <TableRow className="border-white/5 hover:bg-white/5 transition-all">
                         <TableCell className="px-10 py-6 font-black uppercase text-[11px] text-white">Verified CPA Missions</TableCell>
                         <TableCell className="font-black italic text-primary">₹25,400</TableCell>
                         <TableCell className="text-green-500 font-bold">₹17,780</TableCell>
                         <TableCell className="px-10 text-right"><Badge className="bg-green-500/10 text-green-500 border-none text-[9px] uppercase px-3">ACTIVE</Badge></TableCell>
                      </TableRow>
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {/* WITHDRAWALS TAB */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Pending <span className="text-primary">Payouts</span></h3>
                <div className="flex gap-4">
                   {settings?.autoWithdrawalEnabled && <Badge className="bg-green-500/20 text-green-500 border-none text-[10px] font-black px-4 py-1.5 uppercase flex items-center gap-2"><Cpu className="h-3 w-3" /> Auto-Engine Active</Badge>}
                   <Badge className="bg-primary/20 text-primary border-none text-[10px] font-black px-4 py-1.5 uppercase">Audit Gate: Active</Badge>
                </div>
             </div>
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                         <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">User / Region</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Amount / Ratio</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Destination</TableHead>
                         <TableHead className="px-10 text-[10px] font-black uppercase tracking-widest text-right">Action</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {payoutsData?.filter(p => p.status === 'pending').map(p => {
                         const upiUrl = p.method === 'UPI' ? `upi://pay?pa=${p.destination}&pn=${p.userEmail}&am=${(p.amount / 100).toFixed(2)}&cu=INR` : null;
                         return (
                            <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-all">
                               <TableCell className="px-10 py-6">
                                  <p className="font-bold text-xs text-white truncate max-w-[150px]">{p.userEmail}</p>
                                  <Badge className="bg-white/5 text-muted-foreground text-[8px] font-black px-2 mt-1.5 uppercase">{p.geo || 'India'}</Badge>
                               </TableCell>
                               <TableCell>
                                  <p className="font-black text-white text-lg tabular-nums">₹{(p.amount / 100).toFixed(2)}</p>
                                  <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">30% Share Applied</p>
                               </TableCell>
                               <TableCell>
                                  <p className="text-[11px] font-mono text-primary font-black uppercase">{p.method}: {p.destination}</p>
                               </TableCell>
                               <TableCell className="px-10 text-right space-x-3">
                                  {upiUrl && (
                                     <Button asChild className="bg-primary h-12 px-6 rounded-xl font-black text-[10px] uppercase shadow-lg shadow-primary/20">
                                        <a href={upiUrl} target="_blank">QUICK PAY</a>
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
         highlight && "ring-4 ring-amber-500/20 border-amber-500 scale-[1.05]"
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
