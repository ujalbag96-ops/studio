
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth, useDoc } from '@/firebase';
import { collection, doc, updateDoc, addDoc, increment, query, orderBy, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  LogOut,
  ShieldCheck,
  Wallet,
  Zap,
  Save,
  Smartphone,
  Trash2,
  CheckCircle2,
  XCircle,
  Trophy,
  Plus
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
import { UserProfile, WithdrawalRequest, AppSettings, Tournament } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'tournaments' | 'tasks' | 'settings'>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Real-time Firestore Queries
  const withdrawalsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'withdrawals'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const tasksQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_tasks') : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  
  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useCollection<WithdrawalRequest>(withdrawalsQuery);
  const { data: tasksData } = useCollection<any>(tasksQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: globalSettings } = useDoc<AppSettings>(settingsRef);

  const handleWithdrawalAction = async (withdrawal: WithdrawalRequest, action: 'approved' | 'rejected') => {
    if (!firestore) return;
    setIsProcessing(withdrawal.id);
    try {
      const withdrawalRef = doc(firestore, 'withdrawals', withdrawal.id);
      const userRef = doc(firestore, 'users', withdrawal.userId);
      const batch = writeBatch(firestore);
      
      if (action === 'rejected') {
        // Automatic Refund Logic (Atomic)
        batch.update(withdrawalRef, { status: 'rejected', processedAt: new Date().toISOString() });
        batch.update(userRef, {
          winningBalance: increment(withdrawal.amount * 10), // Assuming 10 coins per unit
          coins: increment(withdrawal.amount * 10)
        });
        await batch.commit();
        toast({ title: "PAYOUT REJECTED", description: "Funds automatically refunded to warrior wallet." });
      } else {
        batch.update(withdrawalRef, { status: 'approved', processedAt: new Date().toISOString() });
        await batch.commit();
        toast({ title: "PAYOUT APPROVED", description: "Transaction marked as successful." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "PROTOCOL ERROR" });
    } finally {
      setIsProcessing(null);
    }
  };

  const addTournament = async (e: any) => {
    e.preventDefault();
    if (!firestore) return;
    const form = e.target;
    setIsProcessing('tour-add');
    try {
      await addDoc(collection(firestore, 'tournaments'), {
        name: form.name.value,
        gameType: form.gameType.value,
        entryFee: parseInt(form.entryFee.value),
        prizePool: form.prizePool.value,
        startDate: form.startDate.value,
        status: 'active',
        banner: `https://picsum.photos/seed/${Math.random()}/800/400`
      });
      toast({ title: "TOURNAMENT DEPLOYED" });
      form.reset();
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
      toast({ title: "CPA MISSION DEPLOYED" });
      form.reset();
    } finally {
      setIsProcessing(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black uppercase">ERROR 403: AUTHORIZED PERSONNEL ONLY</div>;

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
          <SidebarLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Ledger" onClick={() => setActiveTab('withdrawals')} />
          <SidebarLink active={activeTab === 'tournaments'} icon={<Trophy />} label="Tournament Manager" onClick={() => setActiveTab('tournaments')} />
          <SidebarLink active={activeTab === 'tasks'} icon={<Smartphone />} label="CPA Missions" onClick={() => setActiveTab('tasks')} />
          <SidebarLink active={activeTab === 'settings'} icon={<Settings />} label="System Config" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-10 pb-32">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter">Operational <span className="text-primary">Control</span></h1>
           <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 text-xs">Master: {user?.email}</Badge>
        </header>

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
             <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><Wallet className="text-primary" /> Payout Queue</h2>
             <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-[2rem] shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="font-black uppercase text-[10px]">Warrior ID / Destination</TableHead>
                        <TableHead className="font-black uppercase text-[10px] text-center">Amount</TableHead>
                        <TableHead className="font-black uppercase text-[10px] text-right">Decision</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {withdrawalsLoading ? (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                      ) : withdrawalsData?.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center text-muted-foreground uppercase font-black text-xs italic">No pending signals in the queue.</TableCell></TableRow>
                      ) : withdrawalsData?.map(w => (
                        <TableRow key={w.id} className="border-white/5">
                           <TableCell className="py-6">
                              <p className="text-xs font-black text-white">{w.userId}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{w.method}: {w.destination}</p>
                           </TableCell>
                           <TableCell className="text-center font-black text-green-500 tabular-nums">
                              ₹{w.amount.toFixed(2)}
                           </TableCell>
                           <TableCell className="text-right">
                              {w.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                   <Button size="sm" onClick={() => handleWithdrawalAction(w, 'approved')} disabled={!!isProcessing} className="bg-green-600 font-black uppercase text-[9px] h-9">Approve</Button>
                                   <Button size="sm" variant="destructive" onClick={() => handleWithdrawalAction(w, 'rejected')} disabled={!!isProcessing} className="font-black uppercase text-[9px] h-9">Reject</Button>
                                </div>
                              ) : (
                                <Badge className={cn("uppercase text-[9px]", w.status === 'approved' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{w.status}</Badge>
                              )}
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><Trophy className="text-primary" /> New Bracket</h2>
              <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                <form onSubmit={addTournament} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Match Name</Label>
                    <Input name="name" required className="bg-black border-white/10" placeholder="e.g. BGMI Squad War" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Game Category</Label>
                    <select name="gameType" className="w-full bg-black border border-white/10 h-10 rounded-md px-3 text-sm">
                       <option value="BGMI">BGMI</option>
                       <option value="Free Fire">Free Fire</option>
                       <option value="Ludo King">Ludo King</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Fee (Coins)</Label>
                      <Input name="entryFee" type="number" required className="bg-black border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase">Prize Pool</Label>
                      <Input name="prizePool" required className="bg-black border-white/10" placeholder="₹1,000" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Start Date/Time</Label>
                    <Input name="startDate" type="datetime-local" required className="bg-black border-white/10" />
                  </div>
                  <Button type="submit" disabled={isProcessing === 'tour-add'} className="w-full bg-primary font-black uppercase italic rounded-xl h-14 mt-4">
                    {isProcessing === 'tour-add' ? <Loader2 className="animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> DEPLOY BRACKET</>}
                  </Button>
                </form>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
               <h2 className="text-2xl font-black uppercase italic">Active Brackets</h2>
               <div className="grid sm:grid-cols-2 gap-6">
                  {tournamentsData?.map(t => (
                    <Card key={t.id} className="bg-[#0a0a0f] border-white/5 p-6 rounded-[2rem] flex flex-col justify-between">
                       <div>
                          <div className="flex justify-between items-start mb-4">
                             <Badge className="bg-primary/20 text-primary border-none">{t.gameType}</Badge>
                             <button onClick={() => deleteDoc(doc(firestore!, 'tournaments', t.id))} className="text-red-500 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                          </div>
                          <h3 className="text-xl font-black uppercase italic leading-tight mb-2">{t.name}</h3>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.startDate}</p>
                       </div>
                       <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-end">
                          <div>
                             <p className="text-[8px] font-black uppercase text-muted-foreground">Prize Pool</p>
                             <p className="text-lg font-black text-white">{t.prizePool}</p>
                          </div>
                          <Badge variant="outline" className="text-green-500 border-green-500/20">{t.status}</Badge>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
           <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1 space-y-6">
                 <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><Smartphone className="text-primary" /> Mission Deployer</h2>
                 <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] shadow-2xl">
                    <form onSubmit={addTask} className="space-y-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">App Name</Label>
                          <Input name="appName" required className="bg-black border-white/10" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Tracking Link</Label>
                          <Input name="link" required className="bg-black border-white/10" placeholder="https://..." />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase">Reward Coins</Label>
                          <Input name="reward" type="number" required className="bg-black border-white/10" />
                       </div>
                       <Button type="submit" disabled={isProcessing === 'task-add'} className="w-full bg-primary font-black uppercase h-14 rounded-xl mt-4">
                          {isProcessing === 'task-add' ? <Loader2 className="animate-spin" /> : "DEPLOY MISSION"}
                       </Button>
                    </form>
                 </Card>
              </div>
              <div className="lg:col-span-2 space-y-6">
                 <h2 className="text-2xl font-black uppercase italic">Live Missions</h2>
                 <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-[2rem]">
                    <Table>
                       <TableHeader className="bg-white/5">
                          <TableRow className="border-white/5">
                             <TableHead className="font-black uppercase text-[10px]">Campaign</TableHead>
                             <TableHead className="font-black uppercase text-[10px] text-center">Reward</TableHead>
                             <TableHead className="font-black uppercase text-[10px] text-right">Actions</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {tasksData?.map(task => (
                            <TableRow key={task.id} className="border-white/5">
                               <TableCell className="py-4">
                                  <p className="text-sm font-black text-white">{task.appName}</p>
                                  <p className="text-[9px] text-muted-foreground truncate max-w-xs">{task.link}</p>
                               </TableCell>
                               <TableCell className="text-center font-black text-amber-500">{task.reward} 🪙</TableCell>
                               <TableCell className="text-right">
                                  <Button variant="ghost" onClick={() => deleteDoc(doc(firestore!, 'cpa_tasks', task.id))} className="text-red-500 h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
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
           <div className="max-w-2xl space-y-8">
              <h2 className="text-2xl font-black uppercase italic flex items-center gap-3"><Settings className="text-primary" /> Global Protocol</h2>
              <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8">
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">AdMob Banner ID</Label>
                    <Input value={globalSettings?.adMobBannerId || ''} onChange={e => updateDoc(settingsRef!, { adMobBannerId: e.target.value })} className="bg-black border-white/10 font-mono text-xs h-12" />
                 </div>
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Telegram Support URL</Label>
                    <Input value={globalSettings?.telegramUrl || ''} onChange={e => updateDoc(settingsRef!, { telegramUrl: e.target.value })} className="bg-black border-white/10 font-mono text-xs h-12" />
                 </div>
                 <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5">
                    <div>
                       <p className="text-sm font-black uppercase italic">Maintenance Mode</p>
                       <p className="text-[10px] text-muted-foreground font-bold">Restrict platform access to Admin only</p>
                    </div>
                    <button 
                      onClick={() => updateDoc(settingsRef!, { maintenanceMode: !globalSettings?.maintenanceMode })}
                      className={cn("w-14 h-8 rounded-full transition-all flex items-center px-1", globalSettings?.maintenanceMode ? "bg-red-500 justify-end" : "bg-white/10 justify-start")}
                    >
                       <div className="w-6 h-6 rounded-full bg-white shadow-xl" />
                    </button>
                 </div>
              </Card>
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
