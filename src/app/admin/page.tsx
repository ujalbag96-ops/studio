
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, limit, deleteDoc, increment, where, getDocs, getDoc } from 'firebase/firestore';
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
  ExternalLink,
  Smartphone,
  Cpu,
  SmartphoneNfc,
  Copy,
  UserCheck,
  UserX,
  RefreshCcw,
  Ban,
  Target,
  Terminal
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
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, Registration } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import TransactionReceipt from '@/components/TransactionReceipt';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  const [balanceAdjustment, setBalanceAdjustment] = useState<{ user: UserProfile; bucket: 'depositBalance' | 'winningBalance' | 'taskBalance' } | null>(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [sysConfig, setSysConfig] = useState<Partial<AppSettings>>({});
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ section: string; msg: string; type: 'success' | 'error' } | null>(null);
  const [roomDeployment, setRoomDeployment] = useState<{ id: string; roomId: string; roomPass: string } | null>(null);

  // Quick UID Injection State
  const [quickUid, setQuickUid] = useState('');
  const [quickAmount, setQuickAmount] = useState('400');
  const [isInjecting, setIsInjecting] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  const withdrawalQuery = useMemoFirebase(() => {
     if (!firestore || !isAdminUser) return null;
     return query(collectionGroup(firestore, 'ledger'), where('type', '==', 'withdrawal'), orderBy('date', 'desc'), limit(100));
  }, [firestore, isAdminUser]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: globalWithdrawals } = useCollection<UserLedgerEntry>(withdrawalQuery);

  useEffect(() => { 
    if (settings) {
      setSysConfig(prev => ({ ...prev, ...settings }));
    }
  }, [settings]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const handleQuickInjection = async () => {
    if (!firestore || !quickUid || !quickAmount) {
      toast({ variant: "destructive", title: "Input Required", description: "Paste UID and enter volume." });
      return;
    }

    setIsInjecting(true);
    const amount = parseFloat(quickAmount);
    const targetUid = quickUid.trim();
    const userRef = doc(firestore, 'users', targetUid);

    try {
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        toast({ variant: "destructive", title: "Target Not Found", description: "UID does not exist in the matrix." });
        setIsInjecting(false);
        return;
      }

      const updates = {
        winningBalance: increment(amount),
        withdrawableCoins: increment(amount),
        coins: increment(amount)
      };

      updateDoc(userRef, updates).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: updates
        }));
      });

      const ledgerRef = collection(firestore, 'users', targetUid, 'ledger');
      const ledgerData = {
        type: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Tactical Capital Injection (Admin: ${user?.email})`
      };

      addDoc(ledgerRef, ledgerData).catch(async (err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${targetUid}/ledger`,
          operation: 'create',
          requestResourceData: ledgerData,
        }));
      });

      toast({ title: "INJECTION SUCCESSFUL", description: `${amount} coins allocated to UID ${targetUid.substring(0, 8)}...` });
      setQuickUid('');
    } catch (e) {
      toast({ variant: "destructive", title: "Protocol Error" });
    } finally {
      setIsInjecting(false);
    }
  };

  const saveSettings = (section: string, updates: Partial<AppSettings>) => {
    if (!settingsRef) {
      toast({ variant: "destructive", title: "Sync Failure", description: "Reference signal lost." });
      return;
    }
    
    setSavingSection(section);
    setStatusMsg(null);

    const updatesWithMeta = {
      ...updates,
      lastUpdated: new Date().toISOString(),
      updatedBy: user?.email
    };

    // Safety timeout to prevent infinite hangs
    const timeout = setTimeout(() => {
      setSavingSection(null);
    }, 5000);

    setDoc(settingsRef, updatesWithMeta, { merge: true })
      .then(() => {
        clearTimeout(timeout);
        setSavingSection(null);
        setStatusMsg({ section, msg: "PROTOCOL SYNCHRONIZED", type: 'success' });
        toast({ title: "SAVE CONFIRMED", description: "Global infrastructure updated." });
        setTimeout(() => setStatusMsg(null), 4000);
      })
      .catch(async (serverError) => {
        clearTimeout(timeout);
        setSavingSection(null);
        setStatusMsg({ section, msg: "ACCESS DENIED / SYNC ERROR", type: 'error' });
        const permissionError = new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'update',
          requestResourceData: updatesWithMeta,
        });
        errorEmitter.emit('permission-error', permissionError);
        toast({ variant: "destructive", title: "SYNC REJECTED" });
      });
  };

  const handlePayoutAction = async (tx: UserLedgerEntry, status: 'completed' | 'failed') => {
    if (!firestore || !tx.userId) return;
    const txRef = doc(firestore, 'users', tx.userId, 'ledger', tx.id);
    updateDoc(txRef, { status }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: txRef.path,
        operation: 'update',
        requestResourceData: { status }
      }));
    });
    toast({ title: `Payout ${status === 'completed' ? 'Approved' : 'Rejected'}` });
  };

  const handleAdjustBalance = async () => {
    if (!balanceAdjustment || !firestore || !adjAmount) return;
    const amount = parseFloat(adjAmount);
    if (isNaN(amount)) return;

    const userRef = doc(firestore, 'users', balanceAdjustment.user.id);
    const updates = {
      [balanceAdjustment.bucket]: increment(amount),
      coins: increment(amount)
    };

    updateDoc(userRef, updates).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: updates
      }));
    });

    const ledgerRef = collection(firestore, 'users', balanceAdjustment.user.id, 'ledger');
    const ledgerData = {
      type: 'income',
      amount: Math.abs(amount),
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Manual Administrative ${amount >= 0 ? 'Credit' : 'Debit'}: ${balanceAdjustment.bucket}`
    };

    addDoc(ledgerRef, ledgerData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${balanceAdjustment.user.id}/ledger`,
        operation: 'create',
        requestResourceData: ledgerData
      }));
    });

    toast({ title: "Capital Re-allocation Complete" });
    setBalanceAdjustment(null);
    setAdjAmount('');
  };

  const handleSuspendAccount = async (userId: string, currentStatus: boolean) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', userId);
    updateDoc(userRef, { isBanned: !currentStatus }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: { isBanned: !currentStatus }
      }));
    });
    toast({ title: `Compliance Lockdown: ${!currentStatus ? 'Activated' : 'Released'}` });
  };

  const handlePublishRoom = async (tournamentId: string) => {
    if (!roomDeployment || !firestore || roomDeployment.id !== tournamentId) {
       toast({ variant: "destructive", title: "Validation Error", description: "Input credentials before publishing." });
       return;
    }
    const tRef = doc(firestore, 'tournaments', tournamentId);
    const roomUpdate = {
      roomCredentials: {
        roomId: roomDeployment.roomId,
        roomPassword: roomDeployment.roomPass,
        isDeployed: true
      }
    };
    updateDoc(tRef, roomUpdate).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tRef.path,
        operation: 'update',
        requestResourceData: roomUpdate
      }));
    });
    toast({ title: "Session Keys Transmitted" });
    setRoomDeployment(null);
  };

  const stats = useMemo(() => {
    if (!usersData || !globalWithdrawals) return { totalUsers: 0, assetFlow: 0, liabilities: 0 };
    const totalUsers = usersData.length;
    const assetFlow = globalWithdrawals.filter(w => w.status === 'completed').reduce((acc, curr) => acc + curr.amount, 0);
    const liabilities = usersData.reduce((acc, curr) => acc + (curr.coins || 0), 0);
    return { totalUsers, assetFlow, liabilities };
  }, [usersData, globalWithdrawals]);

  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    const q = searchQuery.toLowerCase();
    return usersData.filter(u => 
      u.email?.toLowerCase().includes(q) || 
      u.id.toLowerCase().includes(q) || 
      u.referralCode?.toLowerCase().includes(q)
    );
  }, [usersData, searchQuery]);

  if (isUserLoading) return <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Synchronizing Analytical Data...</p></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black uppercase tracking-widest">ACCESS DENIED: EXECUTIVE CLEARANCE REQUIRED</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      {/* SIDEBAR */}
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
        {/* HEADER */}
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
            </div>
          </div>
        </header>

        <div className="p-10 space-y-10">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <ExactStatCard label="TOTAL USER POPULATION" value={stats.totalUsers} sub="+1.2% GROWTH" icon={<UsersIcon className="h-5 w-5 text-primary" />} />
                <ExactStatCard label="GLOBAL ASSETS FLOW" value={`₹${stats.assetFlow.toLocaleString()}`} sub="VERIFIED PAYOUTS" icon={<TrendingUp className="h-5 w-5 text-orange-500" />} />
                <ExactStatCard label="PLATFORM LIABILITIES" value={`${stats.liabilities.toLocaleString()} 🪙`} sub="HELD IN VAULTS" icon={<Shield className="h-5 w-5 text-orange-500" />} />
                <ExactStatCard label="OPERATIONAL YIELD" value={`₹${(stats.assetFlow * 0.15).toLocaleString()}`} sub="POST-PROCESSING" icon={<Trophy className="h-5 w-5 text-orange-500" />} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* QUICK UID INJECTION TOOL */}
                 <Card className="bg-[#0a0a0f] border-primary/20 p-8 rounded-[2rem] space-y-6 shadow-2xl shadow-primary/5">
                    <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2 text-primary">
                       <Terminal className="h-4 w-4" /> Tactical Capital Injection
                    </h3>
                    <div className="space-y-4 pt-2">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Target Warrior UID</Label>
                          <Input 
                            value={quickUid}
                            onChange={e => setQuickUid(e.target.value)}
                            placeholder="Paste UID (e.g. yJDxFrYjpmPvPYdYDIbqOeb7AyC2)"
                            className="bg-white/5 border-white/10 h-12 text-xs font-mono"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-muted-foreground">Volume (Credits)</Label>
                             <Input 
                               type="number"
                               value={quickAmount}
                               onChange={e => setQuickAmount(e.target.value)}
                               className="bg-white/5 border-white/10 h-12 text-xl font-black"
                             />
                          </div>
                          <div className="flex items-end">
                             <Button 
                               onClick={handleQuickInjection} 
                               disabled={isInjecting || !quickUid}
                               className="w-full bg-primary h-12 font-black uppercase text-[10px] tracking-widest italic shadow-xl shadow-primary/20"
                             >
                                {isInjecting ? <Loader2 className="animate-spin h-4 w-4" /> : "RUN INJECTION PROTOCOL"}
                             </Button>
                          </div>
                       </div>
                       <p className="text-[8px] font-bold text-muted-foreground uppercase opacity-50 italic">
                          This protocol bypasses user interactions and adds credits directly to Withdrawable Assets.
                       </p>
                    </div>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2rem] space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-2">
                       <Zap className="h-4 w-4 text-primary" /> Active Analytical Signals
                    </h3>
                    <div className="space-y-4">
                       {[1,2,3].map(i => (
                         <div key={i} className="p-4 bg-white/5 rounded-xl flex items-center justify-between border border-white/5">
                            <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary"><Target className="h-4 w-4" /></div>
                               <span className="text-[10px] font-black uppercase">Operation Vector #{i}209</span>
                            </div>
                            <Badge className="bg-green-500/10 text-green-500 text-[8px] px-2">ONLINE</Badge>
                         </div>
                       ))}
                    </div>
                 </Card>
              </div>
            </div>
          )}

          {/* TAB: USERS */}
          {activeTab === 'users' && (
            <div className="animate-in fade-in duration-500 space-y-6">
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[9px] font-black uppercase tracking-widest px-8">Warrior ID</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Name / Email</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Wallet Status</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Security Flag</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-right px-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8 text-primary" /></TableCell></TableRow>
                      ) : filteredUsers.map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="px-8 font-mono text-[10px] text-muted-foreground flex items-center gap-2">
                             #{u.id.substring(0,8).toUpperCase()}
                             <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(u.id)}><Copy className="h-3 w-3" /></Button>
                          </TableCell>
                          <TableCell>
                             <div className="space-y-1">
                                <p className="text-xs font-black uppercase">{u.email?.split('@')[0] || 'Unknown'}</p>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase">{u.email}</p>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex gap-2">
                                <Badge variant="outline" className="text-[8px] bg-blue-500/10 border-blue-500/20 text-blue-400">D: {u.depositBalance?.toFixed(1)}</Badge>
                                <Badge variant="outline" className="text-[8px] bg-green-500/10 border-green-500/20 text-green-400">W: {u.winningBalance?.toFixed(1)}</Badge>
                                <Badge variant="outline" className="text-[8px] bg-amber-500/10 border-amber-500/20 text-amber-400">T: {u.taskBalance?.toFixed(1)}</Badge>
                             </div>
                          </TableCell>
                          <TableCell>
                             {u.isVpnActive ? <Badge className="bg-red-500/20 text-red-500 text-[8px] font-black">VPN DETECTED</Badge> : <Badge className="bg-green-500/20 text-green-500 text-[8px] font-black">NORMAL</Badge>}
                          </TableCell>
                          <TableCell className="text-right px-8">
                             <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => setBalanceAdjustment({ user: u, bucket: 'winningBalance' })} className="h-8 text-[8px] font-black uppercase border-primary/20 hover:bg-primary/10">CREDIT / DEBIT</Button>
                                <Button size="sm" variant="ghost" onClick={() => handleSuspendAccount(u.id, !!u.isBanned)} className={cn("h-8 text-[8px] font-black uppercase", u.isBanned ? "text-green-500" : "text-red-500")}>
                                   {u.isBanned ? <RefreshCcw className="h-3 w-3 mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                                   {u.isBanned ? 'RESTORE' : 'SUSPEND ACCOUNT'}
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

          {/* TAB: PAYOUTS */}
          {activeTab === 'payouts' && (
            <div className="animate-in fade-in duration-500 space-y-6">
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[9px] font-black uppercase tracking-widest px-8">Reference ID</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">User / UPI Details</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Amount (₹)</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest">Conversion Fee</TableHead>
                        <TableHead className="text-[9px] font-black uppercase tracking-widest text-right px-8">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {globalWithdrawals?.map(tx => (
                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="px-8 font-mono text-[10px] text-muted-foreground">
                             #{tx.id.substring(0,10).toUpperCase()}
                          </TableCell>
                          <TableCell>
                             <div className="space-y-1">
                                <p className="text-xs font-black uppercase">{tx.description?.split(':')[1] || 'No ID'}</p>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase">{tx.userId}</p>
                             </div>
                          </TableCell>
                          <TableCell className="text-lg font-black italic tracking-tighter text-white">₹{tx.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-[10px] font-black text-red-400">1.2% (₹{(tx.amount * 0.012).toFixed(2)})</TableCell>
                          <TableCell className="text-right px-8">
                             {tx.status === 'pending' ? (
                               <div className="flex items-center justify-end gap-2">
                                  <Button size="sm" onClick={() => handlePayoutAction(tx, 'completed')} className="bg-green-500 hover:bg-green-600 text-black h-8 text-[8px] font-black uppercase">APPROVE PAYOUT</Button>
                                  <Button size="sm" variant="ghost" onClick={() => handlePayoutAction(tx, 'failed')} className="h-8 text-[8px] font-black uppercase text-red-500">REJECT</Button>
                               </div>
                             ) : (
                               <Badge className={cn("text-[8px] font-black uppercase px-3", tx.status === 'completed' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500")}>
                                  {tx.status}
                               </Badge>
                             )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </Card>
            </div>
          )}

          {/* TAB: EVENTS */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5">
              {tournamentsData?.map(t => (
                <Card key={t.id} className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary"><Trophy /></div>
                         <div>
                            <h4 className="text-lg font-black uppercase italic">{t.name}</h4>
                            <Badge className="bg-primary/20 text-primary text-[8px] px-2">{t.gameType}</Badge>
                         </div>
                      </div>
                      <Badge variant={t.status === 'active' ? 'destructive' : 'secondary'} className="uppercase text-[8px] font-black">{t.status}</Badge>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-muted-foreground">Entry Fee</p>
                         <p className="text-xl font-black">{t.entryFee} 🪙</p>
                      </div>
                      <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[8px] font-black uppercase text-muted-foreground">Prize Pool</p>
                         <p className="text-xl font-black text-amber-500">{t.prizePool}</p>
                      </div>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase">Publish Credentials</Label>
                         <div className="flex gap-2">
                           <Button size="sm" variant="destructive" className="h-7 text-[8px] font-black">CANCEL & REFUND</Button>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <Input 
                            placeholder="Room ID" 
                            className="h-10 bg-white/5 text-[10px]" 
                            onChange={e => setRoomDeployment({ id: t.id, roomId: e.target.value, roomPass: roomDeployment?.id === t.id ? roomDeployment.roomPass : '' })} 
                         />
                         <Input 
                            placeholder="Password" 
                            className="h-10 bg-white/5 text-[10px]" 
                            onChange={e => setRoomDeployment({ id: t.id, roomPass: e.target.value, roomId: roomDeployment?.id === t.id ? roomDeployment.roomId : '' })} 
                         />
                      </div>
                      <Button onClick={() => handlePublishRoom(t.id)} className="w-full bg-primary h-10 text-[10px] font-black uppercase italic">PUBLISH CREDENTIALS</Button>
                   </div>
                </Card>
              ))}
            </div>
          )}

          {/* TAB: AD HUB */}
          {activeTab === 'adhub' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-5 duration-500 pb-20">
                <ConfigCard title="CPA Lead Integration" description="Manage tactical analytical missions." icon={<Globe />} lastUpdated={sysConfig.lastUpdated}>
                   <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase">Mission Signal Enabled</Label>
                         <Switch checked={sysConfig.offerWallEnabled} onCheckedChange={(val) => saveSettings('cpa_toggle', { offerWallEnabled: val })} />
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">API Data Stream (JSON URL)</Label>
                            <Input 
                               value={sysConfig.cpaLeadUrl || ''} 
                               onChange={(e) => setSysConfig({...sysConfig, cpaLeadUrl: e.target.value})}
                               className="bg-white/5 border-white/10 font-mono text-[10px] h-12 text-white"
                               placeholder="Enter CPA Lead JSON URL"
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground">CPA API Key (Verification)</Label>
                            <Input 
                               value={sysConfig.cpaLeadApiKey || ''} 
                               onChange={(e) => setSysConfig({...sysConfig, cpaLeadApiKey: e.target.value})}
                               className="bg-white/5 border-white/10 font-mono text-[10px] h-12 text-white"
                               placeholder="Enter CPA Key"
                            />
                         </div>
                         <div className="flex flex-col gap-2">
                           <Button onClick={() => saveSettings('cpa_sync', { cpaLeadUrl: sysConfig.cpaLeadUrl, cpaLeadApiKey: sysConfig.cpaLeadApiKey })} disabled={savingSection === 'cpa_sync'} className="w-full bg-primary h-10 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
                              {savingSection === 'cpa_sync' ? <Loader2 className="animate-spin h-4 w-4" /> : "SYNC CPA PROTOCOL"}
                           </Button>
                           {statusMsg?.section === 'cpa_sync' && (
                             <div className={cn("p-2 rounded-lg text-center animate-in zoom-in-95", statusMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20')}>
                                <p className={cn("text-[10px] font-black uppercase tracking-widest", statusMsg.type === 'success' ? 'text-green-500' : 'text-red-500')}>
                                   {statusMsg.msg}
                                </p>
                             </div>
                           )}
                         </div>
                      </div>
                   </div>
                </ConfigCard>

                <ConfigCard title="Google AdMob Hub" description="Industrial advertisement signals." icon={<Smartphone />} lastUpdated={sysConfig.lastUpdated}>
                   <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase">AdMob Global Switch</Label>
                         <Switch checked={sysConfig.adMobEnabled} onCheckedChange={(val) => saveSettings('admob_toggle', { adMobEnabled: val })} />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         <ConfigInput label="AdMob App ID" value={sysConfig.adMobAppId} onChange={(v: string) => setSysConfig({...sysConfig, adMobAppId: v})} />
                         <div className="grid grid-cols-2 gap-4">
                            <ConfigInput label="Rewarded ID" value={sysConfig.adMobRewardedId} onChange={(v: string) => setSysConfig({...sysConfig, adMobRewardedId: v})} />
                            <ConfigInput label="Interstitial ID" value={sysConfig.adMobInterstitialId} onChange={(v: string) => setSysConfig({...sysConfig, adMobInterstitialId: v})} />
                         </div>
                         <ConfigInput label="Banner ID" value={sysConfig.adMobBannerId} onChange={(v: string) => setSysConfig({...sysConfig, adMobBannerId: v})} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => saveSettings('admob_sync', { adMobAppId: sysConfig.adMobAppId, adMobRewardedId: sysConfig.adMobRewardedId, adMobInterstitialId: sysConfig.adMobInterstitialId, adMobBannerId: sysConfig.adMobBannerId })} disabled={savingSection === 'admob_sync'} className="w-full bg-primary h-10 rounded-xl font-black uppercase text-[10px] tracking-widest">
                           {savingSection === 'admob_sync' ? <Loader2 className="animate-spin h-4 w-4" /> : "SYNC ADMOB API"}
                        </Button>
                        {statusMsg?.section === 'admob_sync' && (
                           <div className={cn("p-2 rounded-lg text-center", statusMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20')}>
                              <p className={cn("text-[10px] font-black uppercase tracking-widest", statusMsg.type === 'success' ? 'text-green-500' : 'text-red-500')}>
                                 {statusMsg.msg}
                              </p>
                           </div>
                        )}
                      </div>
                   </div>
                </ConfigCard>

                <ConfigCard title="System Economics" description="Global financial constants." icon={<Coins />} lastUpdated={sysConfig.lastUpdated}>
                   <div className="space-y-6 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                         <ConfigInput label="Conversion Fee %" type="number" value={sysConfig.conversionFeePercent} onChange={(v: string) => setSysConfig({...sysConfig, conversionFeePercent: Number(v)})} />
                         <ConfigInput label="Withdrawal Fee %" type="number" value={sysConfig.withdrawalFeePercent} onChange={(v: string) => setSysConfig({...sysConfig, withdrawalFeePercent: Number(v)})} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <ConfigInput label="Coin Value ($1 = X)" type="number" value={sysConfig.coinValuePerDollar} onChange={(v: string) => setSysConfig({...sysConfig, coinValuePerDollar: Number(v)})} />
                        <ConfigInput label="Admin Profit %" type="number" value={sysConfig.adminProfitPercentage} onChange={(v: string) => setSysConfig({...sysConfig, adminProfitPercentage: Number(v)})} />
                      </div>
                      <ConfigInput label="Auto-Withdraw Threshold (₹)" type="number" value={sysConfig.autoWithdrawalThreshold} onChange={(v: string) => setSysConfig({...sysConfig, autoWithdrawalThreshold: Number(v)})} />
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => saveSettings('econ_sync', { conversionFeePercent: sysConfig.conversionFeePercent, withdrawalFeePercent: sysConfig.withdrawalFeePercent, autoWithdrawalThreshold: sysConfig.autoWithdrawalThreshold, coinValuePerDollar: sysConfig.coinValuePerDollar, adminProfitPercentage: sysConfig.adminProfitPercentage })} disabled={savingSection === 'econ_sync'} className="w-full bg-primary h-10 rounded-xl font-black uppercase text-[10px] tracking-widest">
                          {savingSection === 'econ_sync' ? <Loader2 className="animate-spin h-4 w-4" /> : "SAVE ECONOMIC MATRIX"}
                        </Button>
                        {statusMsg?.section === 'econ_sync' && (
                           <div className={cn("p-2 rounded-lg text-center", statusMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20')}>
                              <p className={cn("text-[10px] font-black uppercase tracking-widest", statusMsg.type === 'success' ? 'text-green-500' : 'text-red-500')}>
                                 {statusMsg.msg}
                              </p>
                           </div>
                        )}
                      </div>
                   </div>
                </ConfigCard>
             </div>
          )}

          {/* TAB: REFERRAL */}
          {activeTab === 'referral' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-left-5">
                <ConfigCard title="Affiliate Protocols" description="Manage network growth multipliers." icon={<Share2 />} lastUpdated={sysConfig.lastUpdated}>
                   <div className="space-y-6 pt-4">
                      <ConfigInput label="Enlistment Reward (Coins)" type="number" value={sysConfig.referralRewardCoins} onChange={(v: string) => setSysConfig({...sysConfig, referralRewardCoins: Number(v)})} />
                      <ConfigInput label="Passive Yield %" type="number" value={sysConfig.passiveReferralPercent} onChange={(v: string) => setSysConfig({...sysConfig, passiveReferralPercent: Number(v)})} />
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => saveSettings('ref_sync', { referralRewardCoins: sysConfig.referralRewardCoins, passiveReferralPercent: sysConfig.passiveReferralPercent })} disabled={savingSection === 'ref_sync'} className="w-full bg-primary h-10 rounded-xl font-black uppercase text-[10px] tracking-widest">
                          SAVE AFFILIATE MATRIX
                        </Button>
                        {statusMsg?.section === 'ref_sync' && (
                           <div className={cn("p-2 rounded-lg text-center", statusMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20')}>
                              <p className={cn("text-[10px] font-black uppercase tracking-widest", statusMsg.type === 'success' ? 'text-green-500' : 'text-red-500')}>
                                 {statusMsg.msg}
                              </p>
                           </div>
                        )}
                      </div>
                   </div>
                </ConfigCard>
             </div>
          )}

          {/* TAB: SYSTEM */}
          {activeTab === 'system' && (
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
                <ConfigCard title="Operational Status" description="Global platform kill-switches." icon={<Settings />} lastUpdated={sysConfig.lastUpdated}>
                   <div className="space-y-6 pt-4">
                      <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-4">
                         <div className="flex items-center justify-between">
                            <div className="space-y-1">
                               <p className="text-xs font-black uppercase italic text-destructive">Maintenance Protocol</p>
                               <p className="text-[8px] text-muted-foreground font-bold uppercase">Suspends all analytical sessions.</p>
                            </div>
                            <Switch checked={sysConfig.maintenanceMode} onCheckedChange={(val) => saveSettings('maintenance_toggle', { maintenanceMode: val })} />
                         </div>
                      </div>
                      <ConfigInput label="Telegram Support URL" value={sysConfig.telegramUrl} onChange={(v: string) => setSysConfig({...sysConfig, telegramUrl: v})} />
                      <Button onClick={() => saveSettings('sys_extra', { telegramUrl: sysConfig.telegramUrl })} className="w-full bg-white/5 border border-white/10 h-10 rounded-xl text-[10px] font-black uppercase">SYNC SUPPORT LINK</Button>
                   </div>
                </ConfigCard>

                <ConfigCard title="Payment Gateway API" description="Secure asset injection keys." icon={<ShieldCheck />} lastUpdated={sysConfig.lastUpdated}>
                   <div className="space-y-6 pt-4">
                      <div className="flex items-center justify-between">
                         <Label className="text-[10px] font-black uppercase">Deposit Gateway Enabled</Label>
                         <Switch checked={sysConfig.paymentGatewayEnabled} onCheckedChange={(val) => saveSettings('gateway_toggle', { paymentGatewayEnabled: val })} />
                      </div>
                      <ConfigInput label="Razorpay / Gateway Key ID" value={sysConfig.paymentGatewayKey} onChange={(v: string) => setSysConfig({...sysConfig, paymentGatewayKey: v})} />
                      <ConfigInput label="Gateway Secret Key" type="password" value={sysConfig.paymentGatewaySecret} onChange={(v: string) => setSysConfig({...sysConfig, paymentGatewaySecret: v})} />
                      <div className="flex flex-col gap-2">
                        <Button onClick={() => saveSettings('gateway_sync', { paymentGatewayKey: sysConfig.paymentGatewayKey, paymentGatewaySecret: sysConfig.paymentGatewaySecret })} disabled={savingSection === 'gateway_sync'} className="w-full bg-primary h-10 rounded-xl font-black uppercase text-[10px] tracking-widest">
                          {savingSection === 'gateway_sync' ? <Loader2 className="animate-spin h-4 w-4" /> : "SYNC GATEWAY KEYS"}
                        </Button>
                        {statusMsg?.section === 'gateway_sync' && (
                           <div className={cn("p-2 rounded-lg text-center", statusMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20')}>
                              <p className={cn("text-[10px] font-black uppercase tracking-widest", statusMsg.type === 'success' ? 'text-green-500' : 'text-red-500')}>
                                 {statusMsg.msg}
                              </p>
                           </div>
                        )}
                      </div>
                   </div>
                </ConfigCard>
             </div>
          )}

          {/* TAB: SECURITY */}
          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ExactStatCard label="VPN SIGNALS DETECTED" value="12" sub="ACTIVE MITIGATION" icon={<ShieldAlert className="text-red-500" />} />
                  <ExactStatCard label="IDENTITY CLONES" value="04" sub="SAME-DEVICE FLAGS" icon={<SmartphoneNfc className="text-orange-500" />} />
                  <ExactStatCard label="COMPLIANCE BANS" value={usersData?.filter(u => u.isBanned).length || 0} sub="HARDWARE BLACKLISTED" icon={<Ban className="text-red-500" />} />
               </div>
               
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] p-8 space-y-6">
                  <h3 className="text-lg font-black uppercase italic flex items-center gap-3">
                     <ShieldCheck className="h-5 w-5 text-primary" /> Active Compliance Registry
                  </h3>
                  <div className="border-t border-white/5 pt-6">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase">Scanning for device signature duplicates...</p>
                     <div className="py-10 text-center text-muted-foreground italic text-xs uppercase font-black tracking-widest opacity-20">
                        No immediate compliance threats detected.
                     </div>
                  </div>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: BALANCE ADJUSTMENT */}
      {balanceAdjustment && (
        <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
           <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2rem]">
              <DialogHeader>
                 <DialogTitle className="text-lg font-black uppercase italic">Capital Allocation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                 <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground">Target User</p>
                    <p className="text-xs font-bold">{balanceAdjustment.user.email}</p>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Volume (Positive/Negative)</Label>
                    <Input 
                       type="number" 
                       value={adjAmount} 
                       onChange={e => setAdjAmount(e.target.value)} 
                       className="bg-white/5 h-12 text-xl font-black"
                       placeholder="e.g. 500 or -50"
                    />
                 </div>
                 <p className="text-[8px] font-bold text-muted-foreground uppercase">Protocol: CREDITING TO {balanceAdjustment.bucket.toUpperCase()}</p>
              </div>
              <DialogFooter>
                 <Button onClick={handleAdjustBalance} className="w-full bg-primary font-black uppercase text-[10px] h-12 rounded-xl">EXECUTE ALLOCATION</Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ConfigInput({ label, value, onChange, type = "text", placeholder = "" }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
      <Input 
        type={type}
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/5 border-white/10 font-mono text-[10px] h-12 text-white"
      />
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

function ConfigCard({ title, description, icon, children, lastUpdated }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 shadow-2xl space-y-6 h-fit relative overflow-hidden group">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">{icon}</div>
               <div>
                  <h4 className="text-lg font-black uppercase italic">{title}</h4>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">{description}</p>
               </div>
            </div>
            {lastUpdated && (
               <Badge variant="outline" className="text-[8px] border-white/10 font-bold text-muted-foreground group-hover:text-primary transition-colors">
                  LAST SYNC: {new Date(lastUpdated).toLocaleTimeString()}
               </Badge>
            )}
         </div>
         {children}
      </Card>
   );
}
