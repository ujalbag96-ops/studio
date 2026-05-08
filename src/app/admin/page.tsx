
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, limit, deleteDoc, increment, where, getDocs, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Trophy, 
  Settings, 
  ShieldCheck, 
  Plus,
  Loader2,
  TrendingUp,
  Power,
  Coins,
  Shield,
  MessageSquare,
  Search,
  Check,
  X,
  Zap,
  Bell,
  BarChart3,
  Filter,
  FileBarChart,
  ShieldAlert,
  CreditCard,
  ArrowUpRight,
  Database,
  Lock,
  Globe,
  Share2,
  AlertTriangle,
  LayoutGrid,
  Briefcase
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, Registration } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import TransactionReceipt from '@/components/TransactionReceipt';
import Link from 'next/link';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'overview' | 'users' | 'events' | 'payouts' | 'security' | 'adhub' | 'referral' | 'system';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<UserLedgerEntry | null>(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);
  const [sysConfig, setSysConfig] = useState<Partial<AppSettings>>({});

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  
  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => { if (settings) setSysConfig(settings); }, [settings]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    const q = searchQuery.toLowerCase().trim();
    return usersData.filter(u => !q || u.email?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }, [usersData, searchQuery]);

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-[#050508]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black uppercase">ACCESS DENIED</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      {/* Sidebar - Matching Image Style */}
      <aside className="w-[280px] flex flex-col fixed inset-y-0 z-50 bg-[#0a0a0f] border-r border-white/5 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
             <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-black text-xl italic tracking-tighter block uppercase leading-none">PLATFORM<span className="text-primary">CORE</span></span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Operational Core</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 pt-4 overflow-y-auto no-scrollbar">
          <SidebarLink active={activeTab === 'overview'} icon={<LayoutGrid className="h-4 w-4" />} label="SYSTEM DASHBOARD" onClick={() => setActiveTab('overview')} />
          <SidebarLink active={activeTab === 'users'} icon={<UsersIcon className="h-4 w-4" />} label="USER DIRECTORY" onClick={() => setActiveTab('users')} />
          <SidebarLink active={activeTab === 'events'} icon={<Trophy className="h-4 w-4" />} label="ARENA MANAGEMENT" onClick={() => setActiveTab('events')} />
          <SidebarLink active={activeTab === 'payouts'} icon={<TrendingUp className="h-4 w-4" />} label="PAYMENT GATEWAY" onClick={() => setActiveTab('payouts')} />
          <SidebarLink active={activeTab === 'security'} icon={<ShieldCheck className="h-4 w-4" />} label="SECURITY CENTER" onClick={() => setActiveTab('security')} />
          <SidebarLink active={activeTab === 'adhub'} icon={<Zap className="h-4 w-4" />} label="AD & REVENUE HUB" onClick={() => setActiveTab('adhub')} />
          <SidebarLink active={activeTab === 'referral'} icon={<Share2 className="h-4 w-4" />} label="REFERRAL NETWORK" onClick={() => setActiveTab('referral')} />
          <SidebarLink active={activeTab === 'system'} icon={<Settings className="h-4 w-4" />} label="APPLICATION SETTINGS" onClick={() => setActiveTab('system')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-[10px] font-black uppercase tracking-widest">
             <Power className="h-4 w-4" /> TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[280px]">
        {/* Top Navigation - Matching Image Style */}
        <header className="h-20 bg-[#050508]/80 backdrop-blur-3xl flex items-center justify-between px-10 border-b border-white/5 sticky top-0 z-40">
          <div className="relative w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="SCAN USER DATABASE (ID, EMAIL, PHONE)..." 
              className="bg-white/5 border-white/10 rounded-xl pl-12 h-11 text-[10px] font-black uppercase tracking-widest focus:ring-primary"
            />
          </div>
          
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6">
              <HeaderLink label="PORTAL" href="/" />
              <HeaderLink label="EXECUTIVE HUB" href="/dashboard" />
              <HeaderLink label="SYSTEM INBOX" href="/inbox" />
              <HeaderLink label="AFFILIATE" href="/refer" />
              <HeaderLink label="ADMINISTRATION" active />
            </nav>
            <div className="flex items-center gap-4 border-l border-white/10 pl-8">
               <div className="bg-white/5 px-4 py-1.5 rounded-lg flex items-center gap-2 border border-white/5">
                  <Coins className="h-3 w-3 text-primary" />
                  <span className="text-xs font-black">0 🪙</span>
               </div>
               <Avatar className="h-9 w-9 border border-primary/40">
                  <AvatarFallback className="bg-primary text-white text-[10px] font-black">U</AvatarFallback>
               </Avatar>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-10">
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              {/* Stat Cards - Matching Screenshot */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ExactStatCard label="TOTAL USER POPULATION" value="0" sub="+1.2% GROWTH" icon={<UsersIcon className="h-5 w-5 text-primary" />} />
                <ExactStatCard label="GLOBAL ASSETS FLOW" value="₹1,44,210" sub="VERIFIED PAYOUTS" icon={<TrendingUp className="h-5 w-5 text-orange-500" />} />
                <ExactStatCard label="PLATFORM LIABILITIES" value="₹3,24,000" sub="HELD IN VAULTS" icon={<Shield className="h-5 w-5 text-orange-500" />} />
                <ExactStatCard label="OPERATIONAL YIELD" value="₹44,500" sub="POST-PROCESSING" icon={<Trophy className="h-5 w-5 text-orange-500" />} />
              </div>

              {/* Placeholder for Revenue Chart */}
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] p-10 h-[400px] flex items-center justify-center border-dashed">
                 <div className="text-center opacity-20">
                    <BarChart3 className="h-20 w-20 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-[0.5em] text-[10px]">Revenue Matrix Pulse Data</p>
                 </div>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                   <div>
                     <h3 className="text-xl font-black uppercase italic">User Directory</h3>
                     <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Profile Inventory & Compliance Monitoring</p>
                   </div>
                </div>
                <Table>
                   <TableHeader className="bg-white/[0.03]">
                      <TableRow className="border-white/5 hover:bg-transparent">
                         <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-8">System ID</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User Profile</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Portfolio Breakdown</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                         <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right px-8">Commands</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {filteredUsers.map(u => (
                         <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.01]">
                            <TableCell className="px-8 font-mono text-[10px] text-primary">#{u.id.slice(0,8).toUpperCase()}</TableCell>
                            <TableCell>
                               <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8 border border-white/10"><AvatarImage src={`https://picsum.photos/seed/${u.id}/100/100`} /></Avatar>
                                  <div>
                                     <p className="text-xs font-black uppercase italic text-white">{u.email?.split('@')[0]}</p>
                                     <p className="text-[9px] text-muted-foreground font-bold">{u.email}</p>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell>
                               <div className="text-[9px] font-black space-y-1">
                                  <p className="text-blue-400">INVESTMENT: ₹{u.depositBalance?.toFixed(1) || '0.0'}</p>
                                  <p className="text-green-400">LIQUIDITY: ₹{u.winningBalance?.toFixed(1) || '0.0'}</p>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge className={cn("text-[8px] font-black px-2 py-0.5 border-none", u.isBanned ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500")}>
                                  {u.isBanned ? 'SUSPENDED' : 'COMPLIANT'}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-right px-8 space-x-2">
                               <Button onClick={() => setBalanceAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase border-white/10">CREDIT / DEBIT</Button>
                            </TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          )}

          {/* Additional tabs like Arena Management, System settings can follow the same layout */}
        </div>
      </main>

      {/* Balance Adjustment Dialog */}
      {balanceAdjustment && (
        <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
          <DialogContent className="bg-[#0a0a0f] border-white/10 rounded-[2rem] p-8 max-w-md text-white">
            <DialogHeader><DialogTitle className="text-xl font-black uppercase italic text-center">Capital Allocation</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center block">Target Portfolio Sector</Label>
                 <Select value={balanceAdjustment.bucket} onValueChange={(val: any) => setBalanceAdjustment({...balanceAdjustment, bucket: val})}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl font-black uppercase text-[10px]">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121216] border-white/10 text-white">
                        <SelectItem value="deposit" className="text-xs font-bold">INVESTMENT PORTFOLIO</SelectItem>
                        <SelectItem value="winning" className="text-xs font-bold">WITHDRAWABLE ASSETS</SelectItem>
                        <SelectItem value="task" className="text-xs font-bold">INCENTIVE ACCRUALS</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center block">Volume Adjustment (Credits)</Label>
                 <Input type="number" value={balanceAdjustment.amount} onChange={e => setBalanceAdjustment({...balanceAdjustment, amount: Number(e.target.value)})} className="h-16 bg-white/5 border-white/10 rounded-xl text-3xl font-black text-center tabular-nums" />
              </div>
              <Button onClick={async () => {
                 const { userId, bucket, amount } = balanceAdjustment;
                 const payload: any = { coins: increment(amount) };
                 if (bucket === 'deposit') payload.depositBalance = increment(amount);
                 if (bucket === 'winning') payload.winningBalance = increment(amount);
                 if (bucket === 'task') payload.taskBalance = increment(amount);
                 await updateDoc(doc(firestore!, 'users', userId), payload);
                 setBalanceAdjustment(null);
                 toast({ title: "Ledger Updated" });
              }} className="w-full h-14 bg-primary hover:bg-primary/90 rounded-xl font-black uppercase text-xs italic shadow-lg shadow-primary/20">EXECUTE CREDIT / DEBIT</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SidebarLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest relative group",
      active ? "bg-primary text-white shadow-xl shadow-primary/30" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      <span className={cn("transition-all duration-300", active ? "scale-110" : "opacity-40 group-hover:opacity-100")}>{icon}</span>
      <span>{label}</span>
      {active && <div className="absolute left-1.5 h-4 w-0.5 bg-white rounded-full shadow-[0_0_8px_#fff]" />}
    </button>
  );
}

function HeaderLink({ label, href, active }: any) {
  if (!href) return <span className={cn("text-[9px] font-black uppercase tracking-widest", active ? "text-primary italic flex items-center gap-1.5" : "text-white/40")}>{active && <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />} {label}</span>;
  return (
    <Link href={href} className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
      {label}
    </Link>
  );
}

function ExactStatCard({ label, value, sub, icon }: any) {
  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[1.5rem] p-6 flex items-center justify-between shadow-xl hover:border-primary/20 transition-all group relative overflow-hidden">
       <div className="space-y-1.5 relative z-10">
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
          <h4 className="text-2xl font-black text-white italic tracking-tighter tabular-nums">{value}</h4>
          <p className="text-[8px] font-black text-primary uppercase tracking-widest">{sub}</p>
       </div>
       <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/5 text-primary border border-white/10 group-hover:rotate-6 transition-transform relative z-10">
          {icon}
       </div>
       {/* Small line decoration seen in some dashboards */}
       <div className="absolute bottom-0 left-0 h-[2px] bg-primary/20 w-0 group-hover:w-full transition-all duration-500" />
    </Card>
  );
}
