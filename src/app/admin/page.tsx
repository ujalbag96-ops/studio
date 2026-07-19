
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
  Users,
  Settings,
  ShieldX,
  Cpu,
  Shield,
  CircleDollarSign,
  UserCheck
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
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'finance' | 'audit' | 'settings'>('finance');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(100)) : null, [firestore, isAdminUser]);
  const fraudQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), where('isSuspended', '==', true), limit(50)) : null, [firestore, isAdminUser]);
  const vipUsersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), where('vipLevel', '>=', 1), limit(100)) : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);

  const { data: payoutsData } = useCollection<PayoutRequest>(payoutsQuery);
  const { data: fraudData } = useCollection<UserProfile>(fraudQuery);
  const { data: vipUsers } = useCollection<UserProfile>(vipUsersQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black p-10 uppercase italic text-center space-y-4"><div><ShieldAlert className="h-20 w-20 mx-auto mb-4" />MASTER AUTHORIZATION REQUIRED</div></div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50 shadow-2xl">
        <div className="p-8 flex items-center gap-4 border-b border-white/5 bg-primary/5">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-black text-xl italic uppercase tracking-tighter text-white">ARENA <span className="text-primary">MASTER</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <AdminLink active={activeTab === 'finance'} icon={<BarChart3 />} label="Revenue Control" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Terminal" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'audit'} icon={<ShieldX />} label="Fraud Shield" onClick={() => setActiveTab('audit')} />
          <AdminLink active={activeTab === 'settings'} icon={<Settings />} label="System Config" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Command <span className="text-primary">Center</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">Enterprise Grade Management</p>
           </div>
        </header>

        {activeTab === 'finance' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <FinanceCard label="Daily Revenue (Est)" value={`$142.50`} icon={<TrendingUp />} color="primary" />
                <FinanceCard label="70% Profit Locked" value={`$99.75`} icon={<Zap />} color="amber" highlight />
                <FinanceCard label="Verified Users" value={vipUsers?.length || 0} icon={<UserCheck />} color="green" />
                <FinanceCard label="Active Fraud Alerts" value={fraudData?.length || 0} icon={<ShieldAlert />} color="red" />
             </div>
             
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                         <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Revenue Sector</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Gross (USD)</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest">Admin Profit (70%)</TableHead>
                         <TableHead className="px-10 text-[10px] font-black uppercase tracking-widest text-right">Status</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      <TableRow className="border-white/5 hover:bg-white/5">
                         <TableCell className="px-10 py-6 font-black uppercase text-[11px] text-white">CPA Mediation (CPALead)</TableCell>
                         <TableCell className="font-black italic text-primary">$84.20</TableCell>
                         <TableCell className="text-green-500 font-bold">$58.94</TableCell>
                         <TableCell className="px-10 text-right"><Badge className="bg-green-500/10 text-green-500 border-none text-[9px] uppercase px-3">ACTIVE</Badge></TableCell>
                      </TableRow>
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'audit' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex items-center gap-4">
                 <ShieldX className="h-8 w-8 text-red-500" />
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter">Fraud <span className="text-red-500">Shield Log</span></h2>
              </div>
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden">
                 <Table>
                    <TableHeader className="bg-white/5">
                       <TableRow className="border-white/5">
                          <TableHead className="px-10 py-6 text-[10px] font-black uppercase tracking-widest">Blocked Identity</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Detected Reason</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Last Known IP</TableHead>
                          <TableHead className="px-10 text-right text-[10px] font-black uppercase tracking-widest">Action</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {fraudData?.map(u => (
                          <TableRow key={u.id} className="border-white/5">
                             <TableCell className="px-10 py-6 font-bold text-xs">{u.email}</TableCell>
                             <TableCell><Badge className="bg-red-500/10 text-red-500 border-none text-[8px] uppercase px-2 font-black italic">VPN / PROXY DETECTED</Badge></TableCell>
                             <TableCell className="font-mono text-[10px] text-muted-foreground">{u.lastIp || '203.11.0.1'}</TableCell>
                             <TableCell className="px-10 text-right"><Button size="sm" variant="outline" className="h-8 rounded-lg text-[9px] font-black uppercase">Review Session</Button></TableCell>
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
      "w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-xl italic border border-white/10" : "text-muted-foreground hover:bg-white/5 hover:text-white"
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
