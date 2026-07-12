
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth, useDoc } from '@/firebase';
import { collection, doc, updateDoc, addDoc, increment, query, orderBy, where, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  Search,
  LogOut,
  ShieldCheck,
  Wallet,
  Zap,
  Save,
  Smartphone,
  Trash2,
  CheckCircle2,
  XCircle,
  Monitor,
  Layout,
  Link as LinkIcon
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserProfile, WithdrawalRequest, AppSettings } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

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
  
  const [activeTab, setActiveTab] = useState<'users' | 'withdrawals' | 'tasks' | 'settings'>('withdrawals');
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Dynamic Settings State
  const [localSettings, setLocalSettings] = useState<Partial<AppSettings>>({});

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Queries
  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const withdrawalsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'withdrawals'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const tasksQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_tasks') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useCollection<WithdrawalRequest>(withdrawalsQuery);
  const { data: tasksData } = useCollection<CPATask>(tasksQuery);
  const { data: globalSettings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    if (globalSettings) {
      setLocalSettings(globalSettings);
    }
  }, [globalSettings]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const handleSaveAllSettings = async () => {
    if (!settingsRef) return;
    setIsProcessing('settings');
    try {
      await setDoc(settingsRef, localSettings, { merge: true });
      toast({ title: "SYSTEM SYNCED", description: "Global operational parameters locked." });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC ERROR" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleWithdrawalAction = async (withdrawal: WithdrawalRequest, action: 'approved' | 'rejected') => {
    if (!firestore) return;
    setIsProcessing(withdrawal.id);
    try {
      const withdrawalRef = doc(firestore, 'withdrawals', withdrawal.id);
      
      if (action === 'rejected') {
        // Atomic Refund Protocol
        const userRef = doc(firestore, 'users', withdrawal.userId);
        const batch = writeBatch(firestore);
        
        batch.update(withdrawalRef, { status: 'rejected', processedAt: new Date().toISOString() });
        batch.update(userRef, {
          winningBalance: increment(withdrawal.amount * 10), // Refunding coins (assuming 10 coins per unit in withdrawal)
          coins: increment(withdrawal.amount * 10)
        });
        
        await batch.commit();
        toast({ title: "REQUEST REJECTED", description: "Funds returned to user wallet." });
      } else {
        await updateDoc(withdrawalRef, { status: 'approved', processedAt: new Date().toISOString() });
        toast({ title: "PAYOUT APPROVED", description: "Transaction marked as successful." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "PROTOCOL FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const addTask = async (e: any) => {
    e.preventDefault();
    if (!firestore) return;
    const form = e.target;
    setIsProcessing('task-add');
    try {
      await addDoc(collection(firestore, 'cpa_tasks'), {
        appName: form.appName.value,
        link: form.link.value,
        reward: parseInt(form.reward.value),
        timestamp: new Date().toISOString()
      });
      toast({ title: "TASK DEPLOYED" });
      form.reset();
    } catch (e) {
      toast({ variant: "destructive", title: "DEPLOYMENT FAILED" });
    } finally {
      setIsProcessing(null);
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
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black uppercase">ERROR 403: AUTHORIZED PERSONNEL ONLY</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50 shadow-2xl">
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-xl italic uppercase">ADMIN <span className="text-primary">HUB</span></span>
        </div>
        <nav className="flex-1 px-4 space-y-2 pt-4">
          <SidebarLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Ledger" onClick={() => setActiveTab('withdrawals')} />
          <SidebarLink active={activeTab === 'users'} icon={<UsersIcon />} label="User Manager" onClick={() => setActiveTab('users')} />
          <SidebarLink active={activeTab === 'tasks'} icon={<Smartphone />} label="CPA Missions" onClick={() => setActiveTab('tasks')} />
          <SidebarLink active={activeTab === 'settings'} icon={<Settings />} label="Media & Ops" onClick={() => setActiveTab('settings')} />
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black uppercase text-xs">
            <LogOut className="h-4 w-4" /> Terminate Session
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-10 pb-32">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Operational <span className="text-primary">Control</span></h1>
           <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 text-xs uppercase tracking-widest">Master Admin: {user?.email}</Badge>
        </header>

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
             <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><Wallet className="text-primary" /> Payout Queue</h2>
             <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-[2rem] shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] font-black uppercase px-8">Warrior ID / Timestamp</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-center">Protocol / Destination</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-center">Volume</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-right px-8">Decision</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {withdrawalsLoading ? (
                        <TableRow><TableCell colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                      ) : withdrawalsData?.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="py-20 text-center text-muted-foreground uppercase font-black text-xs italic tracking-widest">Queue is currently clear.</TableCell></TableRow>
                      ) : withdrawalsData?.map(w => (
                        <TableRow key={w.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="px-8 py-6">
                              <p className="text-xs font-black text-white">{w.userId}</p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">{new Date(w.timestamp).toLocaleString()}</p>
                           </TableCell>
                           <TableCell className="text-center">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black px-2 uppercase mb-1">{w.method}</Badge>
                              <p className="text-[10px] font-mono text-white">{w.destination}</p>
                           </TableCell>
                           <TableCell className="text-center font-black text-green-500 tabular-nums">
                              ₹{w.amount.toFixed(2)}
                           </TableCell>
                           <TableCell className="text-right px-8">
                              {w.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                   <Button 
                                     size="sm" 
                                     onClick={() => handleWithdrawalAction(w, 'approved')} 
                                     disabled={!!isProcessing}
                                     className="h-9 px-4 bg-green-600 hover:bg-green-500 font-black uppercase text-[9px] rounded-lg"
                                   >
                                      {isProcessing === w.id ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="h-3 w-3 mr-1.5" /> Approve</>}
                                   </Button>
                                   <Button 
                                     size="sm" 
                                     variant="destructive"
                                     onClick={() => handleWithdrawalAction(w, 'rejected')} 
                                     disabled={!!isProcessing}
                                     className="h-9 px-4 font-black uppercase text-[9px] rounded-lg"
                                   >
                                      {isProcessing === w.id ? <Loader2 className="animate-spin" /> : <><XCircle className="h-3 w-3 mr-1.5" /> Reject</>}
                                   </Button>
                                </div>
                              ) : (
                                <Badge className={cn(
                                  "font-black text-[9px] uppercase px-4 py-1.5 rounded-lg",
                                  w.status === 'approved' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                                )}>
                                  {w.status}
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

        {activeTab === 'tasks' && (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><Smartphone className="text-primary" /> Task Hub</h2>
              <Card className="bg-[#0a0a0f] border-white/5 p-8 space-y-6 shadow-2xl rounded-[2.5rem]">
                <form onSubmit={addTask} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">App Name</Label>
                    <Input name="appName" required className="h-12 bg-black border-white/5 rounded-xl font-bold" placeholder="e.g. Trading App Pro" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Tracking Link</Label>
                    <Input name="link" required className="h-12 bg-black border-white/5 rounded-xl font-bold" placeholder="https://tracking.link/..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Reward Coins</Label>
                    <Input name="reward" type="number" required className="h-12 bg-black border-white/5 rounded-xl font-bold" placeholder="100" />
                  </div>
                  <Button type="submit" disabled={!!isProcessing} className="w-full h-14 bg-primary font-black uppercase italic rounded-xl shadow-xl">
                    {isProcessing === 'task-add' ? <Loader2 className="animate-spin" /> : "DEPLOY MISSION"}
                  </Button>
                </form>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-black uppercase italic">Active Missions</h2>
              <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-[2rem] shadow-2xl">
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
                               <Button size="icon" variant="ghost" onClick={() => deleteTask(t.id)} className="h-8 w-8 text-red-500 hover:bg-red-500/10 rounded-lg">
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
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Global <span className="text-primary">Configuration</span></h2>
                <Button 
                  onClick={handleSaveAllSettings} 
                  disabled={!!isProcessing}
                  className="h-14 px-8 bg-green-600 hover:bg-green-500 rounded-2xl font-black uppercase italic shadow-xl shadow-green-600/20"
                >
                  {isProcessing === 'settings' ? <Loader2 className="animate-spin h-6 w-6" /> : <><Save className="h-5 w-5 mr-2" /> SAVE ALL CHANGES</>}
                </Button>
             </div>

             <div className="grid md:grid-cols-2 gap-8">
                {/* Media & Ads Card */}
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
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Banner ID</Label>
                            <Input 
                              value={localSettings.adMobBannerId || ''} 
                              onChange={e => setLocalSettings({...localSettings, adMobBannerId: e.target.value})}
                              className="h-12 bg-black border-white/5 rounded-xl font-mono text-xs" 
                            />
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Interstitial ID</Label>
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
                   </div>
                </Card>

                {/* CPA Mission Logic */}
                <Card className="bg-[#0a0a0f] border-white/5 p-10 space-y-8 rounded-[2.5rem] shadow-2xl">
                   <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                      <Zap className="text-amber-500 h-6 w-6" />
                      <h3 className="text-xl font-black uppercase italic">CPA & Fee Engine</h3>
                   </div>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">CPALead URL</Label>
                         <Input 
                           value={localSettings.cpaLeadUrl || ''} 
                           onChange={e => setLocalSettings({...localSettings, cpaLeadUrl: e.target.value})}
                           className="h-12 bg-black border-white/5 rounded-xl font-mono text-[9px]" 
                         />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Withdrawal Fee (%)</Label>
                           <Input 
                             type="number"
                             value={localSettings.withdrawalFeePercent || ''} 
                             onChange={e => setLocalSettings({...localSettings, withdrawalFeePercent: parseInt(e.target.value)})}
                             className="h-12 bg-black border-white/5 rounded-xl font-bold" 
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Profit Cut (%)</Label>
                           <Input 
                             type="number"
                             value={localSettings.adminProfitPercentage || ''} 
                             onChange={e => setLocalSettings({...localSettings, adminProfitPercentage: parseInt(e.target.value)})}
                             className="h-12 bg-black border-white/5 rounded-xl font-bold" 
                           />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Hero Banner URL</Label>
                        <Input 
                          value={localSettings.heroBannerUrl || ''} 
                          onChange={e => setLocalSettings({...localSettings, heroBannerUrl: e.target.value})}
                          className="h-12 bg-black border-white/5 rounded-xl font-mono text-xs" 
                        />
                      </div>
                   </div>
                </Card>
             </div>
          </div>
        )}
      </main>
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
