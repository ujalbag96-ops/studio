
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, addDoc, increment, query, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  ShieldCheck,
  Wallet,
  Zap,
  Smartphone,
  Trash2,
  Trophy,
  Plus,
  Radio,
  Timer,
  CheckCircle2,
  Activity,
  LineChart,
  RefreshCw,
  Eye,
  Flag,
  Target
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { WithdrawalRequest, AppSettings, Tournament, CricketMatch, PredictionPoll } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { fetchLiveCricketMatches } from '@/lib/cricket-service';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type TabType = 'withdrawals' | 'tournaments' | 'cricket' | 'polls' | 'tasks' | 'settings';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Over Predictor States
  const [targetOver, setTargetOver] = useState('1');
  const [targetRuns, setTargetRuns] = useState('12');

  // Live Intelligence State
  const [liveMatches, setLiveMatches] = useState<CricketMatch[]>([]);
  const [intelLoading, setLiveIntelLoading] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Queries
  const withdrawalsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'withdrawals'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const cricketQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cricket_matches') : null, [firestore, isAdminUser]);
  const pollsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'polls'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const tasksQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_tasks') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  
  const { data: withdrawalsData } = useCollection<WithdrawalRequest>(withdrawalsQuery);
  const { data: cricketData } = useCollection<CricketMatch>(cricketQuery);
  const { data: pollsData } = useCollection<PredictionPoll>(pollsQuery);
  const { data: tasksData } = useCollection<any>(tasksQuery);
  const { data: globalSettings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    if (activeTab === 'cricket') {
       refreshLiveIntel();
    }
  }, [activeTab]);

  const refreshLiveIntel = async () => {
    setLiveIntelLoading(true);
    try {
      const data = await fetchLiveCricketMatches(globalSettings?.cricketApiKey);
      setLiveMatches(data);
    } finally {
      setLiveIntelLoading(false);
    }
  };

  const handleWithdrawalAction = async (withdrawal: WithdrawalRequest, action: 'approved' | 'rejected') => {
    if (!firestore) return;
    setIsProcessing(withdrawal.id);
    
    try {
      const withdrawalRef = doc(firestore, 'withdrawals', withdrawal.id);
      const userRef = doc(firestore, 'users', withdrawal.userId);
      const batch = writeBatch(firestore);
      
      if (action === 'rejected') {
        // Refund logic: Withdrawal amount (in local currency) converted back to coins
        const refundAmountCoins = withdrawal.amount * 10; 
        batch.update(withdrawalRef, { status: 'rejected', processedAt: new Date().toISOString() });
        batch.update(userRef, {
          winningBalance: increment(refundAmountCoins),
          coins: increment(refundAmountCoins)
        });
        
        // Log refund in ledger
        const ledgerRef = doc(collection(firestore, 'users', withdrawal.userId, 'ledger'));
        batch.set(ledgerRef, {
          type: 'income',
          amount: refundAmountCoins,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Withdrawal Rejected (Refunded ${refundAmountCoins} 🪙)`
        });

        await batch.commit();
        toast({ title: "PAYOUT REJECTED", description: "Deducted coins have been restored to user." });
      } else {
        batch.update(withdrawalRef, { status: 'approved', processedAt: new Date().toISOString() });
        await batch.commit();
        toast({ title: "PAYOUT APPROVED", description: "Transaction finalized in ledger." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed", description: "Atomic sync error." });
    } finally {
      setIsProcessing(null);
    }
  };

  const deployOverSignal = async () => {
    if (!firestore) return;
    setIsProcessing('over-signal');
    const question = `Will Over #${targetOver} yield ${targetRuns}+ runs?`;
    const pollData = {
      question,
      category: 'Cricket Live',
      entryFee: 10,
      totalPool: 0,
      status: 'active',
      expiry: '10 Mins',
      optionA: 'YES',
      optionB: 'NO',
      timestamp: new Date().toISOString()
    };

    addDoc(collection(firestore, 'polls'), pollData).catch(async (e) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'polls',
        operation: 'create',
        requestResourceData: pollData
      }));
    });

    toast({ title: "OVER SIGNAL LIVE", description: question });
    setTargetOver((prev) => (parseInt(prev) + 1).toString());
    setIsProcessing(null);
  };

  const handleAddTask = async (e: any) => {
    e.preventDefault();
    if (!firestore) return;
    const form = e.target;
    setIsProcessing('task-add');
    const taskData = {
      appName: form.appName.value,
      link: form.link.value,
      reward: parseInt(form.reward.value),
      category: 'Mobile Install',
      timestamp: new Date().toISOString()
    };

    try {
      await addDoc(collection(firestore, 'cpa_tasks'), taskData);
      toast({ title: "MISSION DEPLOYED", description: `${taskData.appName} is now live.` });
      form.reset();
    } finally {
      setIsProcessing(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black text-center p-10">ACCESS RESTRICTED: MASTER ADMIN ONLY</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-64 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-black text-lg italic uppercase tracking-tighter">ADMIN <span className="text-primary">HUB</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <SidebarLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Ledger" onClick={() => setActiveTab('withdrawals')} />
          <SidebarLink active={activeTab === 'polls'} icon={<Target />} label="Over Predictor" onClick={() => setActiveTab('polls')} />
          <SidebarLink active={activeTab === 'cricket'} icon={<Flag />} label="Cricket Arena" onClick={() => setActiveTab('cricket')} />
          <SidebarLink active={activeTab === 'tasks'} icon={<Smartphone />} label="CPA Missions" onClick={() => setActiveTab('tasks')} />
          <SidebarLink active={activeTab === 'settings'} icon={<Settings />} label="System Config" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-64 p-8 space-y-10 pb-32">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Sector</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic italic">Live Industrial Control</p>
           </div>
           <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 uppercase italic">Master Admin Active</Badge>
        </header>

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
             <h2 className="text-xl font-black uppercase italic flex items-center gap-2"><Wallet className="text-primary h-5 w-5" /> Withdrawal Queue</h2>
             <Card className="bg-[#0a0a0f] border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] uppercase font-black tracking-widest px-8">Warrior ID / Email</TableHead>
                        <TableHead className="text-[10px] uppercase font-black tracking-widest text-center">Amount (Local)</TableHead>
                        <TableHead className="text-[10px] uppercase font-black tracking-widest text-right px-8">Decision</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {withdrawalsData?.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="py-24 text-center text-muted-foreground text-[10px] uppercase font-black tracking-widest italic opacity-40">No pending logistics found.</TableCell></TableRow>
                      ) : withdrawalsData?.map(w => (
                        <TableRow key={w.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="py-6 px-8">
                              <p className="text-[11px] font-black text-white">{w.userId}</p>
                              <div className="flex items-center gap-2 mt-1">
                                 <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10 text-muted-foreground">{w.method}</Badge>
                                 <p className="text-[9px] text-primary font-black uppercase tracking-tighter">{w.destination}</p>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <p className="text-xl font-black text-green-500 tabular-nums italic">₹{w.amount}</p>
                           </TableCell>
                           <TableCell className="text-right px-8">
                              {w.status === 'pending' ? (
                                <div className="flex justify-end gap-3">
                                   <Button size="sm" onClick={() => handleWithdrawalAction(w, 'approved')} disabled={!!isProcessing} className="bg-green-600 hover:bg-green-500 h-10 px-6 text-[10px] font-black uppercase italic rounded-xl">Approve</Button>
                                   <Button size="sm" variant="destructive" onClick={() => handleWithdrawalAction(w, 'rejected')} disabled={!!isProcessing} className="h-10 px-6 text-[10px] font-black uppercase italic rounded-xl">Reject</Button>
                                </div>
                              ) : (
                                <Badge className={cn("text-[10px] font-black uppercase italic px-4 py-1 rounded-lg", w.status === 'approved' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500")}>{w.status}</Badge>
                              )}
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="space-y-12">
            <div className="space-y-6">
               <h2 className="text-xl font-black uppercase italic flex items-center gap-2"><Activity className="text-blue-500 h-5 w-5" /> Live Over Predictor</h2>
               <Card className="bg-blue-500/5 border-blue-500/20 border-2 rounded-[2rem] p-8 max-w-2xl">
                  <div className="grid grid-cols-2 gap-8 mb-8">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-blue-400">Target Over #</Label>
                        <Input type="number" value={targetOver} onChange={e => setTargetOver(e.target.value)} className="bg-black border-blue-500/20 h-14 text-2xl font-black text-center rounded-xl" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-blue-400">Target Runs Threshold</Label>
                        <Input type="number" value={targetRuns} onChange={e => setTargetRuns(e.target.value)} className="bg-black border-blue-500/20 h-14 text-2xl font-black text-center rounded-xl" />
                     </div>
                  </div>
                  <Button onClick={deployOverSignal} disabled={isProcessing === 'over-signal'} className="w-full h-16 bg-blue-600 hover:bg-blue-500 font-black uppercase italic text-lg rounded-2xl shadow-xl">
                     {isProcessing === 'over-signal' ? <Loader2 className="animate-spin" /> : "DEPLOY OVER SIGNAL"}
                  </Button>
               </Card>
            </div>

            <div className="space-y-6">
               <h2 className="text-xl font-black uppercase italic">Active Signals ({pollsData?.length})</h2>
               <div className="grid gap-4">
                  {pollsData?.map(p => (
                    <Card key={p.id} className="bg-[#0a0a0f] border-white/5 p-6 flex items-center justify-between rounded-2xl">
                       <div>
                          <Badge className="bg-blue-500/10 text-blue-500 border-none uppercase font-black text-[8px] mb-2">{p.category}</Badge>
                          <p className="font-black text-sm uppercase italic">{p.question}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Pool: {p.totalPool} 🪙 • Entry: {p.entryFee} 🪙</p>
                       </div>
                       <Button variant="ghost" onClick={() => deleteDoc(doc(firestore!, 'polls', p.id))} className="text-red-500 hover:bg-red-500/10 h-10 w-10 rounded-xl"><Trash2 className="h-5 w-5" /></Button>
                    </Card>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1 space-y-6">
               <h2 className="text-xl font-black uppercase italic">New Mission Deploy</h2>
               <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2rem] shadow-2xl">
                  <form onSubmit={handleAddTask} className="space-y-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground">App Name</Label>
                       <Input name="appName" placeholder="e.g. WinZO Games" required className="bg-black border-white/10 h-12" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground">Tracking / App Link</Label>
                       <Input name="link" placeholder="https://..." required className="bg-black border-white/10 h-12" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground">Reward (Coins)</Label>
                       <Input name="reward" type="number" defaultValue="50" required className="bg-black border-white/10 h-12" />
                    </div>
                    <Button type="submit" disabled={isProcessing === 'task-add'} className="w-full bg-primary h-14 font-black uppercase italic rounded-xl">
                       {isProcessing === 'task-add' ? <Loader2 className="animate-spin" /> : "LAUNCH MISSION"}
                    </Button>
                  </form>
               </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
               <h2 className="text-xl font-black uppercase italic">Active Missions</h2>
               <div className="grid gap-4">
                  {tasksData?.map(t => (
                    <Card key={t.id} className="bg-[#0a0a0f] border-white/5 p-6 flex items-center justify-between rounded-2xl group">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10"><Smartphone className="h-5 w-5 text-primary" /></div>
                          <div>
                             <p className="font-black uppercase text-sm italic">{t.appName}</p>
                             <p className="text-[10px] text-muted-foreground font-bold">{t.reward} COINS • VERIFIED</p>
                          </div>
                       </div>
                       <Button variant="ghost" onClick={() => deleteDoc(doc(firestore!, 'cpa_tasks', t.id))} className="text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="h-5 w-5" /></Button>
                    </Card>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="max-w-2xl space-y-10">
              <h2 className="text-xl font-black uppercase italic">Master System Config</h2>
              <Card className="bg-[#0a0a0f] border-white/5 p-10 space-y-8 rounded-[2.5rem] shadow-2xl">
                 <div className="grid gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Cricket API Intelligence Key</Label>
                       <Input value={globalSettings?.cricketApiKey || ''} onChange={e => updateDoc(settingsRef!, { cricketApiKey: e.target.value })} placeholder="CricAPI or RapidAPI Key" className="bg-black border-white/10 h-12 font-mono text-xs text-blue-400" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">CPA Postback Base URL</Label>
                       <Input value={globalSettings?.cpaLeadUrl || ''} onChange={e => updateDoc(settingsRef!, { cpaLeadUrl: e.target.value })} className="bg-black border-white/10 h-12 font-mono text-xs" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Withdrawal Fee (%)</Label>
                          <Input type="number" value={globalSettings?.withdrawalFeePercent || 8} onChange={e => updateDoc(settingsRef!, { withdrawalFeePercent: parseInt(e.target.value) })} className="bg-black border-white/10 h-12 font-black italic" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Telegram Support URL</Label>
                          <Input value={globalSettings?.telegramUrl || ''} onChange={e => updateDoc(settingsRef!, { telegramUrl: e.target.value })} className="bg-black border-white/10 h-12 font-mono text-xs text-primary" />
                       </div>
                    </div>
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
      "w-full flex items-center gap-3 px-5 py-4 rounded-xl transition-all text-[11px] font-black uppercase tracking-[0.1em]",
      active ? "bg-primary text-white shadow-xl italic" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      {icon} <span>{label}</span>
    </button>
  );
}
