
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth, useDoc } from '@/firebase';
import { collection, doc, updateDoc, addDoc, increment, query, orderBy, where, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  Search,
  Gamepad2,
  LogOut,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Wallet,
  Target,
  Trophy,
  Flag,
  Radio,
  Zap,
  ArrowUpRight,
  AlertCircle,
  Video,
  Globe,
  Monitor,
  Trash2,
  Edit,
  Eye,
  Ban,
  Star,
  Image as ImageIcon,
  Smartphone,
  ShieldAlert,
  Save,
  Link as LinkIcon,
  Layout
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserProfile, WithdrawalRequest, Tournament, AppSettings } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

interface CPATask {
  id: string;
  appName: string;
  link: string;
  reward: number;
}

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'tournaments' | 'tasks' | 'settings'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceAdjustment, setBalanceAdjustment] = useState<{ user: UserProfile, mode: 'add' | 'deduct' } | null>(null);
  const [adjAmount, setAdjAmount] = useState('100');
  const [isProcessing, setIsProcessing] = useState(false);

  // Dynamic Settings State
  const [localSettings, setLocalSettings] = useState<Partial<AppSettings>>({});

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Queries
  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const withdrawalsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'withdrawals'), where('status', '==', 'pending'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const tasksQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_tasks') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useCollection<WithdrawalRequest>(withdrawalsQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: tasksData } = useCollection<CPATask>(tasksQuery);
  const { data: globalSettings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    if (globalSettings) {
      setLocalSettings(globalSettings);
    }
  }, [globalSettings]);

  // Fraud Detection Logic: Flag duplicate IPs
  const ipCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    usersData?.forEach(u => {
      if (u.lastIp) {
        counts[u.lastIp] = (counts[u.lastIp] || 0) + 1;
      }
    });
    return counts;
  }, [usersData]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const updateGlobalSetting = async (field: string, value: any) => {
    if (!settingsRef) return;
    try {
      await setDoc(settingsRef, { [field]: value }, { merge: true });
      toast({ title: "SYSTEM SYNCED", description: `${field} updated live.` });
    } catch (e) {
      toast({ variant: "destructive", title: "UPDATE FAILED" });
    }
  };

  const handleSaveAllSettings = async () => {
    if (!settingsRef) return;
    setIsProcessing(true);
    try {
      await setDoc(settingsRef, localSettings, { merge: true });
      toast({ title: "GLOBAL CONFIG SAVED", description: "Operational parameters synchronized." });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC ERROR" });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleUserField = async (uid: string, field: keyof UserProfile, currentVal: any) => {
    if (!firestore) return;
    try {
      const userRef = doc(firestore, 'users', uid);
      await updateDoc(userRef, { [field]: !currentVal });
      toast({ title: "USER MODIFIED", description: `${field} status changed.` });
    } catch (e) {
      toast({ variant: "destructive", title: "ACTION REJECTED" });
    }
  };

  const executeAdjustment = async (uid: string, amount: number, mode: 'add' | 'deduct') => {
    if (!firestore) return;
    setIsProcessing(true);
    try {
      const finalAmount = mode === 'add' ? amount : -amount;
      const userRef = doc(firestore, 'users', uid);
      
      await updateDoc(userRef, {
        coins: increment(finalAmount),
        depositBalance: increment(finalAmount)
      });

      await addDoc(collection(firestore, 'users', uid, 'ledger'), {
        type: mode === 'add' ? 'deposit' : 'withdrawal',
        amount: Math.abs(finalAmount),
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Admin Manual Adjustment: ${mode.toUpperCase()}`
      });

      toast({ title: `CREDITED: ${mode.toUpperCase()} ${amount} COINS` });
      setBalanceAdjustment(null);
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC ERROR" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawalAction = async (id: string, status: 'approved' | 'rejected', userId: string, amount: number) => {
    if (!firestore) return;
    setIsProcessing(true);
    try {
      const withdrawalRef = doc(firestore, 'withdrawals', id);
      await updateDoc(withdrawalRef, { status, processedAt: new Date().toISOString() });
      toast({ title: `PAYOUT ${status.toUpperCase()}` });
    } catch (e) {
      toast({ variant: "destructive", title: "PROTOCOL FAILED" });
    } finally {
      setIsProcessing(false);
    }
  };

  const addTask = async (e: any) => {
    e.preventDefault();
    if (!firestore) return;
    const form = e.target;
    const taskData = {
      appName: form.appName.value,
      link: form.link.value,
      reward: parseInt(form.reward.value),
      timestamp: new Date().toISOString()
    };
    try {
      await addDoc(collection(firestore, 'cpa_tasks'), taskData);
      toast({ title: "TASK DEPLOYED" });
      form.reset();
    } catch (e) {
      toast({ variant: "destructive", title: "DEPLOYMENT FAILED" });
    }
  };

  const deleteTask = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'cpa_tasks', id));
      toast({ title: "TASK TERMINATED" });
    } catch (e) {
      toast({ variant: "destructive", title: "ERROR" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black">ACCESS DENIED: ADMIN PROTOCOL ONLY</div>;

  const filteredUsers = usersData?.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-xl italic uppercase">ADMIN <span className="text-primary">HUB</span></span>
        </div>
        <nav className="flex-1 px-4 space-y-2 pt-4">
          <SidebarLink active={activeTab === 'users'} icon={<UsersIcon />} label="User Manager" onClick={() => setActiveTab('users')} />
          <SidebarLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Ledger" onClick={() => setActiveTab('withdrawals')} />
          <SidebarLink active={activeTab === 'tasks'} icon={<Smartphone />} label="CPA Task Manager" onClick={() => setActiveTab('tasks')} />
          <SidebarLink active={activeTab === 'settings'} icon={<Settings />} label="Media & Ads" onClick={() => setActiveTab('settings')} />
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black uppercase text-xs">
            <LogOut className="h-4 w-4" /> Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-10 pb-32">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Command <span className="text-primary">Center</span></h1>
           <div className="flex items-center gap-4">
              {globalSettings?.maintenanceMode && (
                <Badge className="bg-red-600 text-white animate-pulse border-none px-4 py-1.5 font-black uppercase">MAINTENANCE ACTIVE</Badge>
              )}
              <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 text-xs uppercase">Authorized: {user?.email}</Badge>
           </div>
        </header>

        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 h-14">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by UID or Email..." className="bg-transparent border-none outline-none flex-1 text-sm font-bold text-white" />
             </div>
             <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] font-black uppercase px-8">Identity & Security</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-center">Status (VIP / BAN)</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-center">Balances</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-right px-8">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                      ) : filteredUsers.map(u => {
                        const isDuplicateIp = u.lastIp && (ipCounts[u.lastIp] || 0) > 1;
                        return (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="px-8 py-6">
                              <p className="text-sm font-black text-white">{u.email || 'Warrior'}</p>
                              <code className="text-[9px] font-mono text-primary/60">UID: {u.id}</code>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className={cn("text-[8px] font-black px-2 py-0.5", isDuplicateIp ? "border-red-500 text-red-500 bg-red-500/10" : "border-white/10 text-muted-foreground")}>
                                  IP: {u.lastIp || 'N/A'} {isDuplicateIp && <ShieldAlert className="h-2 w-2 ml-1 inline" />}
                                </Badge>
                                {isDuplicateIp && <span className="text-[7px] text-red-500 font-black uppercase italic animate-pulse">Duplicate IP Alert</span>}
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-4">
                                 <button onClick={() => toggleUserField(u.id, 'isAdmin', u.isAdmin)} className={cn("flex flex-col items-center gap-1", u.isAdmin ? "text-amber-500" : "text-muted-foreground/30")}>
                                    <Star className="h-4 w-4" />
                                    <span className="text-[7px] font-black uppercase">VIP1</span>
                                 </button>
                                 <button onClick={() => toggleUserField(u.id, 'isBanned', u.isBanned)} className={cn("flex flex-col items-center gap-1", u.isBanned ? "text-red-500" : "text-muted-foreground/30")}>
                                    <Ban className="h-4 w-4" />
                                    <span className="text-[7px] font-black uppercase">BAN</span>
                                 </button>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex flex-col">
                                 <span className="text-blue-400 font-black tabular-nums text-sm">{u.depositBalance?.toFixed(0)} DEP</span>
                                 <span className="text-green-500 font-black tabular-nums text-[10px]">{u.winningBalance?.toFixed(0)} WIN</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-right px-8 space-x-2">
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u, mode: 'add' })} className="h-8 text-[9px] font-black bg-green-600 rounded-lg uppercase">Add</Button>
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u, mode: 'deduct' })} className="h-8 text-[9px] font-black bg-red-600 rounded-lg uppercase">Deduct</Button>
                           </TableCell>
                        </TableRow>
                      )})}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><Smartphone className="text-primary" /> Task Deployer</h2>
              <Card className="bg-[#0a0a0f] border-white/5 p-8 space-y-6 shadow-2xl">
                <form onSubmit={addTask} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Campaign Name</Label>
                    <Input name="appName" required className="h-12 bg-black border-white/5 rounded-xl font-bold" placeholder="e.g. Finance App Install" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Tracking Link</Label>
                    <Input name="link" required className="h-12 bg-black border-white/5 rounded-xl font-bold" placeholder="https://tracking.link/..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Reward Coins</Label>
                    <Input name="reward" type="number" required className="h-12 bg-black border-white/5 rounded-xl font-bold" placeholder="50" />
                  </div>
                  <Button type="submit" className="w-full h-14 bg-primary font-black uppercase italic rounded-xl">DEPLOY MISSION</Button>
                </form>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black uppercase italic">Active Missions</h2>
              <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-2xl">
                 <Table>
                    <TableHeader className="bg-white/5">
                       <TableRow className="border-white/5">
                          <TableHead className="text-[10px] font-black uppercase px-8">Campaign Details</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-center">Reward</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-right px-8">Actions</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {tasksData?.map(t => (
                         <TableRow key={t.id} className="border-white/5">
                            <TableCell className="px-8 py-4">
                               <p className="text-sm font-black text-white">{t.appName}</p>
                               <p className="text-[9px] text-muted-foreground truncate max-w-xs">{t.link}</p>
                            </TableCell>
                            <TableCell className="text-center font-black text-amber-500 tabular-nums">{t.reward} 🪙</TableCell>
                            <TableCell className="text-right px-8">
                               <Button size="icon" variant="ghost" onClick={() => deleteTask(t.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-10">
             <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">System <span className="text-primary">Configuration</span></h2>
                <Button 
                  onClick={handleSaveAllSettings} 
                  disabled={isProcessing}
                  className="h-14 px-8 bg-green-600 hover:bg-green-500 rounded-2xl font-black uppercase italic shadow-xl shadow-green-600/20"
                >
                  {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : <><Save className="h-5 w-5 mr-2" /> SAVE ALL CHANGES</>}
                </Button>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                {/* AdMob & SDK Settings */}
                <Card className="bg-[#0a0a0f] border-white/5 p-10 space-y-8 rounded-[2.5rem] shadow-2xl">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <Monitor className="text-primary h-6 w-6" />
                      <h3 className="text-xl font-black uppercase italic">Media & Ads Protocol</h3>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">AdMob App ID</Label>
                         <Input 
                           value={localSettings.adMobAppId || ''} 
                           onChange={e => setLocalSettings({...localSettings, adMobAppId: e.target.value})}
                           className="h-12 bg-black border-white/5 rounded-xl font-mono text-xs" 
                           placeholder="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Banner Unit ID</Label>
                            <Input 
                              value={localSettings.adMobBannerId || ''} 
                              onChange={e => setLocalSettings({...localSettings, adMobBannerId: e.target.value})}
                              className="h-12 bg-black border-white/5 rounded-xl font-mono text-xs" 
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Interstitial Unit ID</Label>
                            <Input 
                              value={localSettings.adMobInterstitialId || ''} 
                              onChange={e => setLocalSettings({...localSettings, adMobInterstitialId: e.target.value})}
                              className="h-12 bg-black border-white/5 rounded-xl font-mono text-xs" 
                            />
                         </div>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">AppLovin SDK Key</Label>
                         <Input 
                           value={localSettings.appLovinSdkKey || ''} 
                           onChange={e => setLocalSettings({...localSettings, appLovinSdkKey: e.target.value})}
                           className="h-12 bg-black border-white/5 rounded-xl font-mono text-xs" 
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Reward Zone ID</Label>
                         <Input 
                           value={localSettings.appLovinZoneId || ''} 
                           onChange={e => setLocalSettings({...localSettings, appLovinZoneId: e.target.value})}
                           className="h-12 bg-black border-white/5 rounded-xl font-mono text-xs" 
                         />
                      </div>
                   </div>
                </Card>

                {/* CPA Offerwall Settings */}
                <Card className="bg-[#0a0a0f] border-white/5 p-10 space-y-8 rounded-[2.5rem] shadow-2xl">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <Zap className="text-amber-500 h-6 w-6" />
                      <h3 className="text-xl font-black uppercase italic">CPA Mission Logic</h3>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">CPALead API/URL</Label>
                         <div className="flex gap-2">
                            <Input 
                              value={localSettings.cpaLeadUrl || ''} 
                              onChange={e => setLocalSettings({...localSettings, cpaLeadUrl: e.target.value})}
                              className="h-12 bg-black border-white/5 rounded-xl font-mono text-[9px] flex-1" 
                            />
                            <Button variant="ghost" size="icon" className="h-12 w-12 bg-white/5 rounded-xl">
                               <LinkIcon className="h-4 w-4" />
                            </Button>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Coins Per $1.00</Label>
                           <Input 
                             type="number"
                             value={localSettings.coinValuePerDollar || ''} 
                             onChange={e => setLocalSettings({...localSettings, coinValuePerDollar: parseInt(e.target.value)})}
                             className="h-12 bg-black border-white/5 rounded-xl font-bold" 
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Admin Profit (%)</Label>
                           <Input 
                             type="number"
                             value={localSettings.adminProfitPercentage || ''} 
                             onChange={e => setLocalSettings({...localSettings, adminProfitPercentage: parseInt(e.target.value)})}
                             className="h-12 bg-black border-white/5 rounded-xl font-bold" 
                           />
                        </div>
                      </div>
                      <div className="h-px bg-white/5" />
                      <div className="space-y-4">
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <div className="space-y-1">
                               <p className="text-xs font-bold uppercase italic">CPA Offerwall</p>
                               <p className="text-[8px] text-muted-foreground uppercase">Enable external mission signal</p>
                            </div>
                            <Switch 
                              checked={localSettings.offerWallEnabled} 
                              onCheckedChange={v => setLocalSettings({...localSettings, offerWallEnabled: v})} 
                            />
                         </div>
                         <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <div className="space-y-1">
                               <p className="text-xs font-bold uppercase italic">Maintenance Mode</p>
                               <p className="text-[8px] text-red-500 uppercase font-black">Block all user access</p>
                            </div>
                            <Switch 
                              checked={localSettings.maintenanceMode} 
                              onCheckedChange={v => setLocalSettings({...localSettings, maintenanceMode: v})} 
                            />
                         </div>
                      </div>
                   </div>
                </Card>

                {/* Promotional Media */}
                <Card className="bg-[#0a0a0f] border-white/5 p-10 space-y-8 rounded-[2.5rem] shadow-2xl md:col-span-2">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <Layout className="text-blue-500 h-6 w-6" />
                      <h3 className="text-xl font-black uppercase italic">Dashboard Promotional Assets</h3>
                   </div>
                   <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Hero Promotion Banner URL</Label>
                            <Input 
                              value={localSettings.heroBannerUrl || ''} 
                              onChange={e => setLocalSettings({...localSettings, heroBannerUrl: e.target.value})}
                              className="h-12 bg-black border-white/5 rounded-xl font-mono text-xs" 
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Official Telegram Link</Label>
                            <Input 
                              value={localSettings.telegramUrl || ''} 
                              onChange={e => setLocalSettings({...localSettings, telegramUrl: e.target.value})}
                              className="h-12 bg-black border-white/5 rounded-xl font-mono text-xs" 
                            />
                         </div>
                      </div>
                      <div className="aspect-video rounded-3xl bg-black/40 border border-white/5 flex items-center justify-center relative overflow-hidden">
                         {localSettings.heroBannerUrl ? (
                           <img src={localSettings.heroBannerUrl} className="w-full h-full object-cover" alt="Preview" />
                         ) : (
                           <div className="text-center space-y-2 opacity-20">
                              <ImageIcon className="h-10 w-10 mx-auto" />
                              <p className="text-[10px] font-black uppercase">Banner Preview</p>
                           </div>
                         )}
                         <div className="absolute top-4 right-4">
                            <Badge className="bg-blue-600 text-white font-black text-[8px] uppercase">Live View</Badge>
                         </div>
                      </div>
                   </div>
                </Card>
             </div>
          </div>
        )}
      </main>

      {/* Adjust Capital Dialog */}
      <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic">Adjust Capital: {balanceAdjustment?.user.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Volume Amount</Label>
              <Input type="number" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} className="bg-black border-white/10 h-14 text-xl font-black" />
            </div>
            <Button 
              onClick={() => balanceAdjustment && executeAdjustment(balanceAdjustment.user.id, parseFloat(adjAmount), balanceAdjustment.mode)}
              disabled={isProcessing}
              className={cn("w-full h-14 font-black uppercase text-lg italic", balanceAdjustment?.mode === 'add' ? "bg-green-600" : "bg-red-600")}
            >
              {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : `CONFIRM ${balanceAdjustment?.mode.toUpperCase()}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-lg italic" : "text-muted-foreground hover:bg-white/5"
    )}>
      {icon} <span>{label}</span>
    </button>
  );
}
