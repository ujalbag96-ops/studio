
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
  PlayCircle,
  Target,
  Flag,
  Radio
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { WithdrawalRequest, AppSettings, Tournament, CricketMatch, ESportsMatch, PredictionPoll } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type TabType = 'withdrawals' | 'tournaments' | 'cricket' | 'esports' | 'polls' | 'tasks' | 'settings';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<TabType>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Queries
  const withdrawalsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'withdrawals'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const cricketQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cricket_matches') : null, [firestore, isAdminUser]);
  const esportsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'esports_matches') : null, [firestore, isAdminUser]);
  const pollsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'polls') : null, [firestore, isAdminUser]);
  const tasksQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_tasks') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  
  const { data: withdrawalsData } = useCollection<WithdrawalRequest>(withdrawalsQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: cricketData } = useCollection<CricketMatch>(cricketQuery);
  const { data: esportsData } = useCollection<ESportsMatch>(esportsQuery);
  const { data: pollsData } = useCollection<PredictionPoll>(pollsQuery);
  const { data: tasksData } = useCollection<any>(tasksQuery);
  const { data: globalSettings } = useDoc<AppSettings>(settingsRef);

  const handleWithdrawalAction = async (withdrawal: WithdrawalRequest, action: 'approved' | 'rejected') => {
    if (!firestore) return;
    setIsProcessing(withdrawal.id);
    try {
      const withdrawalRef = doc(firestore, 'withdrawals', withdrawal.id);
      const userRef = doc(firestore, 'users', withdrawal.userId);
      const batch = writeBatch(firestore);
      
      if (action === 'rejected') {
        batch.update(withdrawalRef, { status: 'rejected', processedAt: new Date().toISOString() });
        batch.update(userRef, {
          winningBalance: increment(withdrawal.amount * 10), // Assuming 10 coins/INR
          coins: increment(withdrawal.amount * 10)
        });
        await batch.commit();
        toast({ title: "PAYOUT REJECTED", description: "Coins refunded to user." });
      } else {
        batch.update(withdrawalRef, { status: 'approved', processedAt: new Date().toISOString() });
        await batch.commit();
        toast({ title: "PAYOUT APPROVED" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const addCricketMatch = async (e: any) => {
    e.preventDefault();
    if (!firestore) return;
    const form = e.target;
    setIsProcessing('cricket-add');
    try {
      await addDoc(collection(firestore, 'cricket_matches'), {
        teamA: form.teamA.value,
        teamB: form.teamB.value,
        teamALogo: form.logoA.value || 'https://picsum.photos/seed/teama/100/100',
        teamBLogo: form.logoB.value || 'https://picsum.photos/seed/teamb/100/100',
        series: form.series.value,
        status: 'upcoming',
        startTime: new Date().toISOString()
      });
      toast({ title: "CRICKET MATCH DEPLOYED" });
      form.reset();
    } finally {
      setIsProcessing(null);
    }
  };

  const addPoll = async (e: any) => {
    e.preventDefault();
    if (!firestore) return;
    const form = e.target;
    setIsProcessing('poll-add');
    try {
      await addDoc(collection(firestore, 'polls'), {
        question: form.question.value,
        category: form.category.value,
        entryFee: parseInt(form.fee.value),
        totalPool: 0,
        status: 'active',
        expiry: '2 Hours',
        optionA: 'YES',
        optionB: 'NO'
      });
      toast({ title: "POLL DEPLOYED" });
      form.reset();
    } finally {
      setIsProcessing(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black">ACCESS RESTRICTED: ADMIN ONLY</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-64 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-black text-lg italic uppercase">ADMIN <span className="text-primary">HUB</span></span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payouts" onClick={() => setActiveTab('withdrawals')} />
          <SidebarLink active={activeTab === 'cricket'} icon={<Flag />} label="Cricket" onClick={() => setActiveTab('cricket')} />
          <SidebarLink active={activeTab === 'esports'} icon={<Radio />} label="E-Sports" onClick={() => setActiveTab('esports')} />
          <SidebarLink active={activeTab === 'polls'} icon={<Target />} label="Polls (Runs)" onClick={() => setActiveTab('polls')} />
          <SidebarLink active={activeTab === 'tournaments'} icon={<Trophy />} label="Tournaments" onClick={() => setActiveTab('tournaments')} />
          <SidebarLink active={activeTab === 'tasks'} icon={<Smartphone />} label="CPA Tasks" onClick={() => setActiveTab('tasks')} />
          <SidebarLink active={activeTab === 'settings'} icon={<Settings />} label="Settings" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-64 p-8 space-y-10 pb-32">
        <header className="flex items-center justify-between">
           <h1 className="text-3xl font-black uppercase italic italic">Control <span className="text-primary">Center</span></h1>
           <Badge className="bg-primary/20 text-primary border-none font-bold">Admin: {user?.email}</Badge>
        </header>

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
             <h2 className="text-xl font-black uppercase italic flex items-center gap-2"><Wallet className="text-primary h-5 w-5" /> Payout Queue</h2>
             <Card className="bg-[#0a0a0f] border-white/5 rounded-2xl overflow-hidden">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] uppercase font-black">User / Method</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-center">Amount</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right">Action</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {withdrawalsData?.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="py-12 text-center text-muted-foreground text-xs uppercase font-bold">No pending payouts.</TableCell></TableRow>
                      ) : withdrawalsData?.map(w => (
                        <TableRow key={w.id} className="border-white/5">
                           <TableCell className="py-4">
                              <p className="text-[10px] font-black">{w.userId}</p>
                              <p className="text-[9px] text-muted-foreground uppercase">{w.method}: {w.destination}</p>
                           </TableCell>
                           <TableCell className="text-center font-black text-green-500">₹{w.amount}</TableCell>
                           <TableCell className="text-right">
                              {w.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                   <Button size="sm" onClick={() => handleWithdrawalAction(w, 'approved')} disabled={!!isProcessing} className="bg-green-600 h-8 text-[9px] font-black uppercase">Approve</Button>
                                   <Button size="sm" variant="destructive" onClick={() => handleWithdrawalAction(w, 'rejected')} disabled={!!isProcessing} className="h-8 text-[9px] font-black uppercase">Reject</Button>
                                </div>
                              ) : (
                                <Badge className={cn("text-[9px] uppercase", w.status === 'approved' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{w.status}</Badge>
                              )}
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'cricket' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-xl font-black uppercase italic">New Match</h2>
              <Card className="bg-[#0a0a0f] border-white/5 p-6 rounded-2xl">
                <form onSubmit={addCricketMatch} className="space-y-4">
                  <Input name="teamA" placeholder="Team A Name" required className="bg-black" />
                  <Input name="logoA" placeholder="Team A Logo URL" className="bg-black" />
                  <Input name="teamB" placeholder="Team B Name" required className="bg-black" />
                  <Input name="logoB" placeholder="Team B Logo URL" className="bg-black" />
                  <Input name="series" placeholder="Series Name (e.g. IPL 2024)" required className="bg-black" />
                  <Button type="submit" disabled={isProcessing === 'cricket-add'} className="w-full bg-primary font-black uppercase italic h-12">
                    {isProcessing === 'cricket-add' ? <Loader2 className="animate-spin" /> : "DEPLOY MATCH"}
                  </Button>
                </form>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
               <h2 className="text-xl font-black uppercase italic">Live Matches</h2>
               <div className="grid gap-4">
                  {cricketData?.map(m => (
                    <Card key={m.id} className="bg-[#0a0a0f] border-white/5 p-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <img src={m.teamALogo} className="h-8 w-8 object-contain" />
                          <span className="font-black italic">{m.teamA} VS {m.teamB}</span>
                          <img src={m.teamBLogo} className="h-8 w-8 object-contain" />
                       </div>
                       <div className="flex items-center gap-3">
                          <Badge variant="outline" className="border-primary/20 text-primary">{m.status}</Badge>
                          <Button variant="ghost" onClick={() => deleteDoc(doc(firestore!, 'cricket_matches', m.id))} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'polls' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-xl font-black uppercase italic">New Prediction Poll</h2>
              <Card className="bg-[#0a0a0f] border-white/5 p-6 rounded-2xl">
                <form onSubmit={addPoll} className="space-y-4">
                  <Input name="question" placeholder="Question (e.g. 10+ runs in 5th over?)" required className="bg-black" />
                  <Input name="category" placeholder="Category (e.g. IPL Runs)" required className="bg-black" />
                  <Input name="fee" type="number" placeholder="Entry Fee (Coins)" required className="bg-black" />
                  <Button type="submit" disabled={isProcessing === 'poll-add'} className="w-full bg-primary font-black uppercase italic h-12">
                    {isProcessing === 'poll-add' ? <Loader2 className="animate-spin" /> : "DEPLOY POLL"}
                  </Button>
                </form>
              </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
               <h2 className="text-xl font-black uppercase italic">Active Polls</h2>
               <div className="grid gap-4">
                  {pollsData?.map(p => (
                    <Card key={p.id} className="bg-[#0a0a0f] border-white/5 p-4 flex items-center justify-between">
                       <div>
                          <p className="font-black text-sm">{p.question}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">{p.category} • Fee: {p.entryFee} 🪙</p>
                       </div>
                       <Button variant="ghost" onClick={() => deleteDoc(doc(firestore!, 'polls', p.id))} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </Card>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
           <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                 <h2 className="text-xl font-black uppercase italic">New CPA Mission</h2>
                 <Card className="bg-[#0a0a0f] border-white/5 p-6 rounded-2xl">
                    <form onSubmit={async (e: any) => {
                      e.preventDefault();
                      const form = e.target;
                      await addDoc(collection(firestore!, 'cpa_tasks'), { appName: form.name.value, link: form.link.value, reward: parseInt(form.reward.value) });
                      form.reset();
                      toast({ title: "TASK DEPLOYED" });
                    }} className="space-y-4">
                       <Input name="name" placeholder="App Name" required className="bg-black" />
                       <Input name="link" placeholder="Tracking Link" required className="bg-black" />
                       <Input name="reward" type="number" placeholder="Reward Coins" required className="bg-black" />
                       <Button type="submit" className="w-full bg-primary font-black uppercase h-12">DEPLOY TASK</Button>
                    </form>
                 </Card>
              </div>
              <div className="lg:col-span-2 space-y-6">
                 <h2 className="text-xl font-black uppercase italic">Live Tasks</h2>
                 <Card className="bg-[#0a0a0f] border-white/5">
                    <Table>
                       <TableHeader>
                          <TableRow className="border-white/5">
                             <TableHead className="text-[10px] font-black uppercase">App</TableHead>
                             <TableHead className="text-[10px] font-black uppercase text-center">Reward</TableHead>
                             <TableHead className="text-[10px] font-black uppercase text-right">Delete</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {tasksData?.map(t => (
                            <TableRow key={t.id} className="border-white/5">
                               <TableCell className="text-xs font-bold">{t.appName}</TableCell>
                               <TableCell className="text-center font-black text-amber-500">{t.reward} 🪙</TableCell>
                               <TableCell className="text-right">
                                  <Button variant="ghost" size="sm" onClick={() => deleteDoc(doc(firestore!, 'cpa_tasks', t.id))} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
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
           <div className="max-w-xl space-y-8">
              <h2 className="text-xl font-black uppercase italic">System Protocol</h2>
              <Card className="bg-[#0a0a0f] border-white/5 p-8 space-y-6 rounded-2xl">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Maintenance Mode</Label>
                    <button 
                      onClick={() => updateDoc(settingsRef!, { maintenanceMode: !globalSettings?.maintenanceMode })}
                      className={cn("w-12 h-6 rounded-full transition-all flex items-center px-1", globalSettings?.maintenanceMode ? "bg-red-500 justify-end" : "bg-white/10 justify-start")}
                    >
                       <div className="w-4 h-4 rounded-full bg-white" />
                    </button>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">AdMob Banner ID</Label>
                    <Input value={globalSettings?.adMobBannerId || ''} onChange={e => updateDoc(settingsRef!, { adMobBannerId: e.target.value })} className="bg-black font-mono text-xs" />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Telegram Support URL</Label>
                    <Input value={globalSettings?.telegramUrl || ''} onChange={e => updateDoc(settingsRef!, { telegramUrl: e.target.value })} className="bg-black font-mono text-xs" />
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
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-lg italic" : "text-muted-foreground hover:bg-white/5"
    )}>
      {icon} <span>{label}</span>
    </button>
  );
}
