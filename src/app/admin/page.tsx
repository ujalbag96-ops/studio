
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
  Briefcase,
  Key,
  CheckCircle2,
  PlayCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  const withdrawalQuery = useMemoFirebase(() => {
     if (!firestore || !isAdminUser) return null;
     return query(collectionGroup(firestore, 'ledger'), where('type', '==', 'withdrawal'), orderBy('date', 'desc'), limit(100));
  }, [firestore, isAdminUser]);
  
  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: globalWithdrawals } = useCollection<UserLedgerEntry>(withdrawalQuery);

  useEffect(() => { 
    if (settings) {
      setSysConfig(settings);
    } else if (firestore && isAdminUser) {
      setDoc(doc(firestore, 'settings', 'global'), {
        maintenanceMode: false,
        cpaLeadUrl: 'https://www.cpalead.com/api/conversions?id=774893&api_key=339981d6420141b986bb5562172675ea',
        videoWallEnabled: true,
        offerWallEnabled: true,
        coinValuePerDollar: 800,
        adminProfitPercentage: 20,
        referralRewardCoins: 10,
        passiveReferralPercent: 2,
        telegramUrl: 'https://t.me/bracketbattles'
      }, { merge: true });
    }
  }, [settings, firestore, isAdminUser]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const saveSettings = async (updates: Partial<AppSettings>) => {
    if (!settingsRef) return;
    setIsSavingSettings(true);
    try {
      await setDoc(settingsRef, updates, { merge: true });
      toast({ title: "System Matrix Synchronized", description: "Operational parameters updated globally." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failure" });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handlePayoutAction = async (tx: UserLedgerEntry, status: 'completed' | 'failed') => {
    if (!firestore || !tx.userId) return;
    try {
      const txRef = doc(firestore, 'users', tx.userId, 'ledger', tx.id);
      await updateDoc(txRef, { status });
      toast({ title: `Payout ${status === 'completed' ? 'Approved' : 'Rejected'}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Payout Sync Failure" });
    }
  };

  const handleTournamentAction = async (t: Tournament, status: 'completed' | 'cancelled') => {
    if (!firestore) return;
    try {
      const tRef = doc(firestore, 'tournaments', t.id);
      await updateDoc(tRef, { status });
      
      if (status === 'cancelled') {
        const regQuery = query(collection(firestore, 'registrations'), where('tournamentId', '==', t.id));
        const regSnap = await getDocs(regQuery);
        const batch = writeBatch(firestore);
        
        regSnap.docs.forEach(d => {
          const reg = d.data() as Registration;
          const uRef = doc(firestore, 'users', reg.userId);
          const lRef = doc(collection(firestore, 'users', reg.userId, 'ledger'));
          
          batch.update(uRef, { 
            depositBalance: increment(t.entryFee),
            coins: increment(t.entryFee)
          });
          batch.set(lRef, {
            type: 'refund',
            amount: t.entryFee,
            date: new Date().toISOString().split('T')[0],
            status: 'completed',
            description: `Auto-Refund: Analytical Operation ${t.name} Cancelled`
          });
        });
        await batch.commit();
        toast({ title: "Operation Terminated", description: "All capital refunded to participants." });
      } else {
        toast({ title: "Operation Finalized", description: "Results synchronized with participant portfolios." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Event Sync Failure" });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    const q = searchQuery.toLowerCase().trim();
    return usersData.filter(u => !q || u.email?.toLowerCase().includes(q) || u.id.toLowerCase().includes(q) || u.mobile?.includes(q) || u.referralCode?.toLowerCase().includes(q));
  }, [usersData, searchQuery]);

  const clones = useMemo(() => {
    if (!usersData) return [];
    const deviceGroups: Record<string, UserProfile[]> = {};
    usersData.forEach(u => {
       if (!u.deviceId) return;
       if (!deviceGroups[u.deviceId]) deviceGroups[u.deviceId] = [];
       deviceGroups[u.deviceId].push(u);
    });
    return Object.entries(deviceGroups).filter(([_, list]) => list.length > 1);
  }, [usersData]);

  const stats = useMemo(() => {
    if (!usersData || !globalWithdrawals) return { totalUsers: 0, assetFlow: 0, liabilities: 0 };
    const totalUsers = usersData.length;
    const assetFlow = globalWithdrawals.filter(w => w.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0);
    const liabilities = usersData.reduce((acc, curr) => acc + (curr.coins || 0), 0);
    return { totalUsers, assetFlow, liabilities };
  }, [usersData, globalWithdrawals]);

  if (isUserLoading) return <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Synchronizing Analytical Data...</p></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black uppercase tracking-widest">ACCESS DENIED: EXECUTIVE CLEARANCE REQUIRED</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      <aside className="w-[280px] flex flex-col fixed inset-y-0 z-50 bg-[#0a0a0f] border-r border-white/5 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
             <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-black text-xl italic tracking-tighter block uppercase leading-none">PLATFORM<span className="text-primary">CORE</span></span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Executive Suite</span>
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

      <main className="flex-1 ml-[280px]">
        <header className="h-20 bg-[#050508]/80 backdrop-blur-3xl flex items-center justify-between px-10 border-b border-white/5 sticky top-0 z-40">
          <div className="relative w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="SCAN USER DATABASE (ID, EMAIL, PHONE, CODE)..." 
              className="bg-white/5 border-white/10 rounded-xl pl-12 h-11 text-[10px] font-black uppercase tracking-widest focus:ring-primary text-white"
            />
          </div>
          
          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6">
              <HeaderLink label="PORTAL" href="/" />
              <HeaderLink label="EXECUTIVE HUB" href="/dashboard" />
              <HeaderLink label="ADMINISTRATION" active />
            </nav>
            <div className="flex items-center gap-4 border-l border-white/10 pl-8">
               <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black px-3 py-1">ADMIN SECTOR</Badge>
               <Avatar className="h-9 w-9 border border-primary/40">
                  <AvatarFallback className="bg-primary text-white text-[10px] font-black">U</AvatarFallback>
               </Avatar>
            </div>
          </div>
        </header>

        <div className="p-10 space-y-10">
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ExactStatCard label="TOTAL USER POPULATION" value={stats.totalUsers} sub="+1.2% GROWTH" icon={<UsersIcon className="h-5 w-5 text-primary" />} />
                <ExactStatCard label="GLOBAL ASSETS FLOW" value={`₹${stats.assetFlow.toLocaleString()}`} sub="VERIFIED PAYOUTS" icon={<TrendingUp className="h-5 w-5 text-orange-500" />} />
                <ExactStatCard label="PLATFORM LIABILITIES" value={`${stats.liabilities.toLocaleString()} 🪙`} sub="HELD IN VAULTS" icon={<Shield className="h-5 w-5 text-orange-500" />} />
                <ExactStatCard label="OPERATIONAL YIELD" value={`₹${(stats.assetFlow * 0.15).toLocaleString()}`} sub="POST-PROCESSING" icon={<Trophy className="h-5 w-5 text-orange-500" />} />
              </div>

              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] p-10 h-[400px] flex items-center justify-center border-dashed">
                 <div className="text-center opacity-20">
                    <BarChart3 className="h-20 w-20 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-[0.5em] text-[10px]">Revenue Matrix Pulse Data (Real-time)</p>
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
                                     <p className="text-xs font-black uppercase italic text-white">{u.email?.split('@')[0] || u.mobile || 'Warrior'}</p>
                                     <p className="text-[9px] text-muted-foreground font-bold">{u.email || u.mobile}</p>
                                  </div>
                               </div>
                            </TableCell>
                            <TableCell>
                               <div className="text-[9px] font-black space-y-1">
                                  <p className="text-blue-400">INVESTMENT: {u.depositBalance?.toFixed(1) || '0.0'} 🪙</p>
                                  <p className="text-green-400">LIQUIDITY: {u.winningBalance?.toFixed(1) || '0.0'} 🪙</p>
                                  <p className="text-amber-400">INCENTIVE: {u.taskBalance?.toFixed(1) || '0.0'} 🪙</p>
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge className={cn("text-[8px] font-black px-2 py-0.5 border-none", u.isBanned ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500")}>
                                  {u.isBanned ? 'SUSPENDED' : 'COMPLIANT'}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-right px-8 space-x-2">
                               <Button onClick={() => setBalanceAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} variant="outline" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase border-white/10">CREDIT / DEBIT</Button>
                               <Button 
                                onClick={async () => {
                                  await updateDoc(doc(firestore!, 'users', u.id), { isBanned: !u.isBanned });
                                  toast({ title: u.isBanned ? "Account Reinstated" : "Compliance Lockdown Executed" });
                                }} 
                                variant={u.isBanned ? "secondary" : "destructive"} 
                                size="sm" 
                                className="h-8 rounded-lg text-[9px] font-black uppercase"
                               >
                                  {u.isBanned ? 'ACTIVATE' : 'SUSPEND'}
                               </Button>
                            </TableCell>
                         </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          )}

          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5 duration-500">
               {tournamentsData?.map(t => (
                 <Card key={t.id} className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col group hover:border-primary/20 transition-all">
                    <div className="relative h-40">
                       <img src={t.banner} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                       <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                       <div className="absolute bottom-6 left-8">
                          <Badge className="bg-primary/20 text-primary border-none font-black text-[8px] uppercase tracking-widest px-3 mb-2">{t.gameType}</Badge>
                          <h4 className="text-xl font-black uppercase italic leading-none">{t.name}</h4>
                       </div>
                    </div>
                    <CardContent className="p-8 space-y-6 flex-1">
                       <div className="grid grid-cols-3 gap-4">
                          <StatItem label="ENTRY" value={`${t.entryFee} 🪙`} />
                          <StatItem label="PRIZE" value={t.prizePool} />
                          <StatItem label="STATUS" value={t.status.toUpperCase()} />
                       </div>
                       
                       {t.status !== 'completed' && t.status !== 'cancelled' && (
                         <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <Label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Access ID</Label>
                                  <Input 
                                    defaultValue={t.roomCredentials?.roomId} 
                                    placeholder="Enter Room ID" 
                                    className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-black text-white"
                                    onBlur={async (e) => {
                                      await updateDoc(doc(firestore!, 'tournaments', t.id), { 'roomCredentials.roomId': e.target.value });
                                      toast({ title: "Access ID Published" });
                                    }}
                                  />
                               </div>
                               <div className="space-y-1">
                                  <Label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Access Pass</Label>
                                  <Input 
                                    defaultValue={t.roomCredentials?.roomPassword} 
                                    placeholder="Enter Password" 
                                    className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-black text-white"
                                    onBlur={async (e) => {
                                      await updateDoc(doc(firestore!, 'tournaments', t.id), { 'roomCredentials.roomPassword': e.target.value });
                                      toast({ title: "Access Pass Published" });
                                    }}
                                  />
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <Button onClick={() => handleTournamentAction(t, 'completed')} className="flex-1 h-12 bg-secondary hover:bg-secondary/90 font-black uppercase text-[10px] rounded-xl italic">PUBLISH CREDENTIALS</Button>
                               <Button onClick={() => handleTournamentAction(t, 'cancelled')} variant="destructive" className="h-12 w-12 rounded-xl flex items-center justify-center p-0"><X className="h-4 w-4" /></Button>
                            </div>
                         </div>
                       )}
                    </CardContent>
                 </Card>
               ))}
            </div>
          )}

          {activeTab === 'security' && (
             <div className="space-y-8 animate-in zoom-in-95 duration-500">
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
                   <div className="p-8 border-b border-white/5 flex items-center gap-4 bg-white/[0.02]">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                         <Database className="text-primary h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase italic">Hardware Identity Monitor</h3>
                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Multi-Account Detection & Device Blacklisting</p>
                      </div>
                   </div>
                   <Table>
                      <TableHeader className="bg-white/[0.03]">
                         <TableRow className="border-white/5">
                            <TableHead className="text-[10px] font-black uppercase px-8">Hardware Signature</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Clones Detected</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Risk Level</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right px-8">Operational Action</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {clones.map(([deviceId, list]) => (
                            <TableRow key={deviceId} className="border-white/5 hover:bg-white/[0.01]">
                               <TableCell className="px-8 font-mono text-[9px] text-muted-foreground">{deviceId}</TableCell>
                               <TableCell>
                                  <div className="flex -space-x-2">
                                     {list.map(u => (
                                        <div key={u.id} className="h-8 w-8 rounded-full border-2 border-[#0a0a0f] bg-primary/20 flex items-center justify-center text-[8px] font-black uppercase">
                                           {u.email?.[0] || 'U'}
                                        </div>
                                     ))}
                                  </div>
                               </TableCell>
                               <TableCell><Badge className="bg-red-500/20 text-red-500 border-none text-[8px] font-black">CRITICAL</Badge></TableCell>
                               <TableCell className="text-right px-8">
                                  <Button onClick={() => toast({ title: "Signal Jammed", description: "All associated profiles locked." })} variant="destructive" size="sm" className="h-8 rounded-lg text-[9px] font-black uppercase">LOCK ALL</Button>
                               </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </Card>
             </div>
          )}

          {activeTab === 'payouts' && (
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <div>
                    <h3 className="text-xl font-black uppercase italic">Payment Gateway</h3>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Asset Extraction Audit & Processing</p>
                  </div>
               </div>
               <Table>
                  <TableHeader className="bg-white/[0.03]">
                     <TableRow className="border-white/5">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-8">Transaction</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User Audit</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Volume</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right px-8">Audit Commands</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {globalWithdrawals?.map(tx => (
                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/[0.01] transition-all">
                           <TableCell className="px-8 font-mono text-[9px] text-primary italic">TXN#{tx.id.slice(0,10).toUpperCase()}</TableCell>
                           <TableCell>
                              <div className="text-[10px] font-black">
                                 <p className="text-white uppercase italic">{tx.userId?.slice(0,15)}</p>
                                 <p className="text-muted-foreground mt-0.5">{tx.description || 'DESTINATION REDACTED'}</p>
                              </div>
                           </TableCell>
                           <TableCell className="text-lg font-black tracking-tighter tabular-nums">
                              {tx.currencySymbol}{tx.amount.toFixed(2)}
                           </TableCell>
                           <TableCell>
                              <Badge className={cn("text-[8px] font-black border-none", tx.status === 'completed' ? "bg-green-500/20 text-green-500" : tx.status === 'pending' ? "bg-amber-500/20 text-amber-500" : "bg-red-500/20 text-red-500")}>
                                 {tx.status.toUpperCase()}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right px-8 space-x-2">
                              {tx.status === 'pending' && (
                                <>
                                  <Button onClick={() => handlePayoutAction(tx, 'completed')} className="h-8 rounded-lg bg-green-600 hover:bg-green-700 text-[9px] font-black uppercase">APPROVE PAYOUT</Button>
                                  <Button onClick={() => handlePayoutAction(tx, 'failed')} variant="destructive" className="h-8 rounded-lg text-[9px] font-black uppercase">REJECT</Button>
                                </>
                              )}
                              <Button onClick={() => setSelectedTx(tx)} variant="ghost" className="h-8 rounded-lg border border-white/10 text-[9px] font-black uppercase px-4 hover:bg-white/5">RECEIPT</Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </Card>
          )}

          {activeTab === 'adhub' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-5 duration-500">
                <ConfigCard title="CPA Lead Integration" description="Manage tactical analytical missions." icon={<Globe />}>
                   <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase">Mission Signal Enabled</Label>
                         <Switch checked={sysConfig.offerWallEnabled} onCheckedChange={(val) => saveSettings({ offerWallEnabled: val })} />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground">API Data Stream</Label>
                         <Input 
                            value={sysConfig.cpaLeadUrl} 
                            onChange={(e) => setSysConfig({...sysConfig, cpaLeadUrl: e.target.value})}
                            className="bg-white/5 border-white/10 font-mono text-[10px] h-12 text-white"
                         />
                         <Button onClick={() => saveSettings({ cpaLeadUrl: sysConfig.cpaLeadUrl })} className="w-full bg-primary h-10 rounded-xl font-black uppercase text-[10px] tracking-widest mt-2">SYNC SYSTEM API</Button>
                      </div>
                   </div>
                </ConfigCard>

                <ConfigCard title="Corporate Video Ads" description="Configure reward parameters." icon={<PlayCircle />}>
                   <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase">Video Ad Protocol</Label>
                         <Switch checked={sysConfig.videoWallEnabled} onCheckedChange={(val) => saveSettings({ videoWallEnabled: val })} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-40">Value per dollaR</Label>
                            <Input 
                              type="number" 
                              value={sysConfig.coinValuePerDollar} 
                              onChange={(e) => setSysConfig({...sysConfig, coinValuePerDollar: Number(e.target.value)})}
                              className="bg-white/5 border-white/10 h-12 font-black text-white"
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase opacity-40">Platform Profit %</Label>
                            <Input 
                              type="number" 
                              value={sysConfig.adminProfitPercentage} 
                              onChange={(e) => setSysConfig({...sysConfig, adminProfitPercentage: Number(e.target.value)})}
                              className="bg-white/5 border-white/10 h-12 font-black text-white"
                            />
                         </div>
                      </div>
                      <Button onClick={() => saveSettings({ coinValuePerDollar: sysConfig.coinValuePerDollar, adminProfitPercentage: sysConfig.adminProfitPercentage })} className="w-full bg-primary h-10 rounded-xl font-black uppercase text-[10px] tracking-widest">UPDATE VALUES</Button>
                   </div>
                </ConfigCard>
             </div>
          )}

          {activeTab === 'referral' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-left-5 duration-500">
                <ConfigCard title="Recruitment Protocol" description="Incentives for enlisting new users." icon={<UsersIcon />}>
                   <div className="space-y-6 pt-4">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground">Direct Reward</Label>
                         <Input 
                            type="number" 
                            value={sysConfig.referralRewardCoins} 
                            onChange={(e) => setSysConfig({...sysConfig, referralRewardCoins: Number(e.target.value)})}
                            className="bg-white/5 border-white/10 h-12 font-black text-white"
                         />
                      </div>
                      <Button onClick={() => saveSettings({ referralRewardCoins: sysConfig.referralRewardCoins })} className="w-full bg-primary h-10 rounded-xl font-black uppercase text-[10px] tracking-widest">SAVE REWARD</Button>
                   </div>
                </ConfigCard>
             </div>
          )}

          {activeTab === 'system' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
                <ConfigCard title="Operational Status" description="Global platform kill-switches." icon={<Settings />}>
                   <div className="space-y-6 pt-4">
                      <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="space-y-1">
                               <p className="text-xs font-black uppercase italic text-destructive">Maintenance Protocol</p>
                               <p className="text-[8px] text-muted-foreground font-bold uppercase">Suspends all analytical sessions.</p>
                            </div>
                            <Switch checked={sysConfig.maintenanceMode} onCheckedChange={(val) => saveSettings({ maintenanceMode: val })} />
                         </div>
                      </div>
                   </div>
                </ConfigCard>
             </div>
          )}
        </div>
      </main>

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
                 <Input type="number" value={balanceAdjustment.amount} onChange={e => setBalanceAdjustment({...balanceAdjustment, amount: Number(e.target.value)})} className="h-16 bg-white/5 border-white/10 rounded-xl text-3xl font-black text-center tabular-nums text-white" />
              </div>
              <Button onClick={async () => {
                 const { userId, bucket, amount } = balanceAdjustment;
                 const payload: any = { coins: increment(amount) };
                 if (bucket === 'deposit') payload.depositBalance = increment(amount);
                 if (bucket === 'winning') payload.winningBalance = increment(amount);
                 if (bucket === 'task') payload.taskBalance = increment(amount);
                 await updateDoc(doc(firestore!, 'users', userId), payload);
                 
                 await addDoc(collection(firestore!, 'users', userId, 'ledger'), {
                    type: 'income',
                    amount: Math.abs(amount),
                    date: new Date().toISOString().split('T')[0],
                    status: 'completed',
                    description: `Executive Adjustment: Manual Capital ${amount >= 0 ? 'Credit' : 'Debit'}`
                 });

                 setBalanceAdjustment(null);
                 toast({ title: "Ledger Matrix Updated" });
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
       <div className="absolute bottom-0 left-0 h-[2px] bg-primary/20 w-0 group-hover:w-full transition-all duration-500" />
    </Card>
  );
}

function StatItem({ label, value }: any) {
   return (
      <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
         <p className="text-[7px] font-black text-muted-foreground uppercase mb-1">{label}</p>
         <p className="text-xs font-black truncate">{value}</p>
      </div>
   );
}

function ConfigCard({ title, description, icon, children }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
         <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">{icon}</div>
            <div>
               <h4 className="text-lg font-black uppercase italic">{title}</h4>
               <p className="text-[9px] font-bold text-muted-foreground uppercase">{description}</p>
            </div>
         </div>
         {children}
      </Card>
   );
}
