
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, limit, where, increment, writeBatch } from 'firebase/firestore';
import { 
  ShieldCheck, 
  Loader2, 
  Wallet, 
  FileText, 
  TrendingUp, 
  Users as UsersIcon,
  BarChart3,
  Zap,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldAlert,
  DollarSign,
  History,
  Lock,
  Trophy,
  Activity,
  ArrowUpRight,
  AlertTriangle,
  Monitor
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PayoutRequest, UserProfile, AppSettings } from '../lib/types';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'finance' | 'kyc' | 'settings'>('finance');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Queries
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

  const toggleReviewMode = async (val: boolean) => {
    if (!settingsRef) return;
    try {
      await updateDoc(settingsRef, { reviewMode: val });
      toast({ title: `REVIEW MODE: ${val ? 'ON' : 'OFF'}`, description: val ? "Gaming modules are now hidden." : "Gaming modules are now visible." });
    } catch (e) {
      toast({ variant: "destructive", title: "Toggle Failed" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black p-10 uppercase italic">Master Authorization Required</div>;

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
          <AdminLink active={activeTab === 'kyc'} icon={<ShieldAlert />} label="Identity Audit" onClick={() => setActiveTab('kyc')} />
          <AdminLink active={activeTab === 'settings'} icon={<Monitor />} label="System Switch" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 px-4 py-2 rounded-xl">
                 <Lock className={cn("h-4 w-4", settings?.reviewMode ? "text-red-500" : "text-muted-foreground opacity-20")} />
                 <span className="text-[9px] font-black uppercase text-white">Review Mode: {settings?.reviewMode ? 'ON' : 'OFF'}</span>
              </div>
           </div>
        </header>

        {activeTab === 'finance' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <FinanceCard label="Tourney Profit (15%)" value={`₹4,500`} icon={<Trophy />} color="primary" />
                <FinanceCard label="Ad/CPA Revenue" value={`₹15,000`} icon={<Zap />} color="amber" />
                <FinanceCard label="Total Paid Out" value={`₹${payoutsData?.filter(p => p.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0) || 0}`} icon={<ArrowUpRight />} color="red" />
                <FinanceCard label="Net Profit" value={`₹12,400`} icon={<DollarSign />} color="green" highlight />
             </div>
             
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                         <TableHead className="text-[9px] font-black uppercase">Activity Type</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Volume</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Commission (Profit)</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-right">Status</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {payoutsData?.slice(0, 10).map(p => (
                         <TableRow key={p.id} className="border-white/5">
                            <TableCell className="font-black uppercase text-[10px]">{p.method}</TableCell>
                            <TableCell className="font-black italic text-white">₹{p.amount}</TableCell>
                            <TableCell className="text-green-500 font-bold">₹{(p.amount * 0.15).toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                               <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] uppercase">{p.status}</Badge>
                            </TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div className="space-y-6 animate-in fade-in duration-500">
             <h3 className="text-xl font-black uppercase italic">Pending <span className="text-primary">Verifications</span></h3>
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                         <TableHead className="text-[9px] font-black uppercase">User Identity</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Document Signal</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-right">Audit Action</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {kycPendingData?.map(u => (
                         <TableRow key={u.id} className="border-white/5">
                            <TableCell>
                               <p className="font-bold text-xs text-white">{u.email}</p>
                               <p className="text-[8px] text-muted-foreground uppercase">{u.id}</p>
                            </TableCell>
                            <TableCell>
                               <Button variant="outline" size="sm" className="h-8 border-white/10 text-[9px] font-black uppercase" onClick={() => window.open(u.kycDocumentUrl, '_blank')}>
                                  <Eye className="h-3 w-3 mr-2" /> VIEW DOC
                               </Button>
                            </TableCell>
                            <TableCell className="text-right">
                               <div className="flex justify-end gap-2">
                                  <Button onClick={() => handleKycAction(u.id, 'approved')} className="bg-green-600 h-9 px-4 rounded-xl font-black text-[9px] uppercase">APPROVE</Button>
                                  <Button onClick={() => handleKycAction(u.id, 'rejected')} variant="destructive" className="h-9 px-4 rounded-xl font-black text-[9px] uppercase">REJECT</Button>
                               </div>
                            </TableCell>
                         </TableRow>
                      ))}
                      {(!kycPendingData || kycPendingData.length === 0) && (
                         <TableRow><TableCell colSpan={3} className="text-center py-20 text-muted-foreground font-black uppercase text-[10px]">No pending identity audits.</TableCell></TableRow>
                      )}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="max-w-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8">
                 <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10">
                    <div className="space-y-1">
                       <Label className="text-sm font-black uppercase italic">Google Play Review Mode</Label>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase">Hides all gaming and tournament sectors globally.</p>
                    </div>
                    <Switch 
                      checked={settings?.reviewMode || false} 
                      onCheckedChange={toggleReviewMode}
                      className="data-[state=checked]:bg-red-500"
                    />
                 </div>
                 
                 <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-1" />
                    <p className="text-[10px] font-bold text-amber-500 uppercase leading-relaxed">
                       Warning: Review Mode is a global "Kill Switch". Ensure it is OFF before marketing to real students.
                    </p>
                 </div>
              </Card>
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
                         <TableHead className="text-[9px] font-black uppercase">Destination</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-right">Action</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {payoutsData?.filter(p => p.status === 'pending').map(p => (
                         <TableRow key={p.id} className="border-white/5">
                            <TableCell>
                               <p className="font-bold text-xs">{p.userEmail}</p>
                               <Badge className="bg-amber-500 text-black text-[8px] font-black px-2 mt-1">VIP {p.vipLevel}</Badge>
                            </TableCell>
                            <TableCell>
                               <p className="font-black text-white">₹{p.netAmount.toFixed(2)}</p>
                               <p className="text-[8px] text-muted-foreground uppercase">FEE: ₹{p.fee.toFixed(2)}</p>
                            </TableCell>
                            <TableCell>
                               <p className="text-[10px] font-mono text-primary uppercase">{p.method}: {p.destination}</p>
                            </TableCell>
                            <TableCell className="text-right">
                               <Button onClick={() => handleMarkPaid(p.id)} disabled={isProcessing === p.id} className="bg-green-600 h-10 px-6 rounded-xl font-black text-[9px] uppercase">
                                  {isProcessing === p.id ? <Loader2 className="animate-spin" /> : 'MARK PAID'}
                               </Button>
                            </TableCell>
                         </TableRow>
                      ))}
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
