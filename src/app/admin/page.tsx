
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
  Radio,
  Timer,
  CheckCircle2,
  Activity,
  Flame,
  LineChart,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { WithdrawalRequest, AppSettings, Tournament, CricketMatch, ESportsMatch, PredictionPoll } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { fetchLiveCricketMatches } from '@/lib/cricket-service';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type TabType = 'withdrawals' | 'tournaments' | 'cricket' | 'esports' | 'polls' | 'tasks' | 'settings';

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
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const cricketQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cricket_matches') : null, [firestore, isAdminUser]);
  const esportsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'esports_matches') : null, [firestore, isAdminUser]);
  const pollsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'polls'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const tasksQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_tasks') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  
  const { data: withdrawalsData } = useCollection<WithdrawalRequest>(withdrawalsQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: cricketData } = useCollection<CricketMatch>(cricketQuery);
  const { data: esportsData } = useCollection<ESportsMatch>(esportsQuery);
  const { data: pollsData } = useCollection<PredictionPoll>(pollsQuery);
  const { data: tasksData } = useCollection<any>(tasksQuery);
  const { data: globalSettings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    if (activeTab === 'cricket' || activeTab === 'polls') {
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
        batch.update(withdrawalRef, { status: 'rejected', processedAt: new Date().toISOString() });
        batch.update(userRef, {
          winningBalance: increment(withdrawal.amount * 10),
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

  const deployOverSignal = async () => {
    if (!firestore) return;
    setIsProcessing('over-signal');
    const question = `Will Over #${targetOver} yield ${targetRuns}+ runs?`;
    try {
      await addDoc(collection(firestore, 'polls'), {
        question,
        category: 'Cricket Live',
        entryFee: 10,
        totalPool: 0,
        status: 'active',
        expiry: '10 Mins',
        optionA: 'YES',
        optionB: 'NO',
        timestamp: new Date().toISOString()
      });
      toast({ title: "OVER SIGNAL LIVE", description: question });
      setTargetOver((prev) => (parseInt(prev) + 1).toString());
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
        optionB: 'NO',
        timestamp: new Date().toISOString()
      });
      toast({ title: "POLL DEPLOYED" });
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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Ledger" onClick={() => setActiveTab('withdrawals')} />
          <SidebarLink active={activeTab === 'polls'} icon={<Target />} label="Prediction Polls" onClick={() => setActiveTab('polls')} />
          <SidebarLink active={activeTab === 'cricket'} icon={<Flag />} label="Cricket Arena" onClick={() => setActiveTab('cricket')} />
          <SidebarLink active={activeTab === 'esports'} icon={<Radio />} label="E-Sports Hub" onClick={() => setActiveTab('esports')} />
          <SidebarLink active={activeTab === 'tournaments'} icon={<Trophy />} label="Tournament List" onClick={() => setActiveTab('tournaments')} />
          <SidebarLink active={activeTab === 'tasks'} icon={<Smartphone />} label="CPA Missions" onClick={() => setActiveTab('tasks')} />
          <SidebarLink active={activeTab === 'settings'} icon={<Settings />} label="System Config" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-64 p-8 space-y-10 pb-32">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Sector</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Live Platform Logistics & Security</p>
           </div>
           <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 uppercase italic">Master: {user?.email}</Badge>
        </header>

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
             <h2 className="text-xl font-black uppercase italic flex items-center gap-2"><Wallet className="text-primary h-5 w-5" /> Withdrawal Queue</h2>
             <Card className="bg-[#0a0a0f] border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] uppercase font-black tracking-widest px-8">Warrior ID / Gateway</TableHead>
                        <TableHead className="text-[10px] uppercase font-black tracking-widest text-center">Volume</TableHead>
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
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black uppercase italic flex items-center gap-2">
                     <Flame className="text-primary h-5 w-5 animate-pulse" /> Live Over Predictor
                  </h2>
                  <Button variant="ghost" onClick={refreshLiveIntel} disabled={intelLoading} className="text-[9px] font-black uppercase italic text-muted-foreground">
                     {intelLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <RefreshCw className="h-3 w-3 mr-2" />} Sync Live Intel
                  </Button>
               </div>
               <div className="grid lg:grid-cols-2 gap-8">
                  <Card className="bg-primary/5 border-primary/20 border-2 rounded-[2rem] p-8">
                     <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-primary ml-1">Target Over #</Label>
                              <Input 
                                 type="number" 
                                 value={targetOver} 
                                 onChange={(e) => setTargetOver(e.target.value)}
                                 className="h-14 bg-black/60 border-primary/20 rounded-xl font-black text-xl text-center" 
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-primary ml-1">Target Runs Threshold</Label>
                              <Input 
                                 type="number" 
                                 value={targetRuns} 
                                 onChange={(e) => setTargetRuns(e.target.value)}
                                 className="h-14 bg-black/60 border-primary/20 rounded-xl font-black text-xl text-center" 
                              />
                           </div>
                        </div>
                        <Button 
                           onClick={deployOverSignal} 
                           disabled={isProcessing === 'over-signal'}
                           className="h-14 px-10 bg-primary hover:bg-primary/90 rounded-xl font-black uppercase italic text-lg shadow-xl shadow-primary/20"
                        >
                           {isProcessing === 'over-signal' ? <Loader2 className="animate-spin" /> : "DEPLOY OVER SIGNAL"}
                        </Button>
                     </div>
                  </Card>

                  {/* Live Intel Snippet */}
                  <Card className="bg-blue-500/5 border-blue-500/20 border-2 rounded-[2rem] p-6 flex flex-col justify-between">
                     <div className="flex items-center justify-between mb-4">
                        <Badge className="bg-blue-500/20 text-blue-400 border-none uppercase font-black text-[8px] italic">Live Intelligence</Badge>
                        <span className="text-[9px] font-black text-blue-400/60 uppercase">{liveMatches[0]?.series}</span>
                     </div>
                     {liveMatches[0] ? (
                        <div className="space-y-4">
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-black uppercase">{liveMatches[0].teamA}</span>
                              <span className="text-xl font-black italic">{liveMatches[0].liveScore?.runsA}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-black uppercase">{liveMatches[0].teamB}</span>
                              <span className="text-xl font-black italic">{liveMatches[0].liveScore?.runsB}</span>
                           </div>
                           <div className="flex items-center gap-2 pt-2 border-t border-blue-500/10">
                              <span className="text-[9px] font-black text-muted-foreground uppercase">Last 6 Balls:</span>
                              <div className="flex gap-1">
                                 {liveMatches[0].liveScore?.lastBalls?.map((b, i) => (
                                    <div key={i} className={cn("h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black", b === 'W' ? "bg-red-500 text-white" : b === '6' || b === '4' ? "bg-green-500 text-black" : "bg-white/10 text-white")}>{b}</div>
                                 ))}
                              </div>
                           </div>
                        </div>
                     ) : (
                        <div className="text-center py-6 text-[10px] font-black text-muted-foreground uppercase italic opacity-40">Connecting to Stadium Signal...</div>
                     )}
                  </Card>
               </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-1 space-y-6">
                <h2 className="text-xl font-black uppercase italic">Custom Event Deploy</h2>
                <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2rem] shadow-2xl">
                  <form onSubmit={addPoll} className="space-y-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Sawāl (Question)</Label>
                       <Input name="question" placeholder="e.g. Will Virat score 50+?" required className="bg-black border-white/10 h-14 rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category</Label>
                       <Input name="category" placeholder="e.g. Cricket World Cup" required className="bg-black border-white/10 h-14 rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Entry Fee (Coins)</Label>
                       <Input name="fee" type="number" defaultValue="10" required className="bg-black border-white/10 h-14 rounded-xl font-bold" />
                    </div>
                    <Button type="submit" disabled={isProcessing === 'poll-add'} className="w-full bg-primary hover:bg-primary/90 font-black uppercase italic h-16 rounded-2xl shadow-xl text-lg">
                      {isProcessing === 'poll-add' ? <Loader2 className="animate-spin h-6 w-6" /> : "DEPLOY EVENT"}
                    </Button>
                  </form>
                </Card>
              </div>
              <div className="lg:col-span-2 space-y-6">
                 <h2 className="text-xl font-black uppercase italic">Active Signals ({pollsData?.length})</h2>
                 <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                    {pollsData?.map(p => (
                      <Card key={p.id} className="bg-[#0a0a0f] border-white/5 p-6 flex items-center justify-between hover:border-primary/20 transition-all rounded-2xl group">
                         <div>
                            <Badge className={cn("border-none text-[8px] font-black uppercase px-2 mb-2 italic", p.category.includes('Cricket') ? "bg-blue-500/20 text-blue-500" : "bg-primary/10 text-primary")}>
                               {p.category}
                            </Badge>
                            <p className="font-black text-sm text-white uppercase italic">{p.question}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">Pool: {p.totalPool} 🪙 • Entry: {p.entryFee} 🪙</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-green-500/20 text-green-500 font-black italic">{p.status}</Badge>
                            <Button variant="ghost" onClick={() => deleteDoc(doc(firestore!, 'polls', p.id))} className="text-red-500 hover:bg-red-500/10 h-10 w-10 rounded-xl"><Trash2 className="h-5 w-5" /></Button>
                         </div>
                      </Card>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cricket' && (
          <div className="space-y-12">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <h2 className="text-xl font-black uppercase italic">New Match Deploy</h2>
                <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2rem] shadow-2xl">
                  <form onSubmit={async (e: any) => {
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
                  }} className="space-y-4">
                    <Input name="teamA" placeholder="Team A Name" required className="bg-black border-white/10 h-12" />
                    <Input name="logoA" placeholder="Team A Logo URL" className="bg-black border-white/10 h-12" />
                    <Input name="teamB" placeholder="Team B Name" required className="bg-black border-white/10 h-12" />
                    <Input name="logoB" placeholder="Team B Logo URL" className="bg-black border-white/10 h-12" />
                    <Input name="series" placeholder="Series (e.g. IPL 2024)" required className="bg-black border-white/10 h-12" />
                    <Button type="submit" disabled={isProcessing === 'cricket-add'} className="w-full bg-primary font-black uppercase italic h-14 rounded-xl mt-4">
                      {isProcessing === 'cricket-add' ? <Loader2 className="animate-spin" /> : "LAUNCH ARENA"}
                    </Button>
                  </form>
                </Card>
              </div>
              <div className="lg:col-span-2 space-y-6">
                 <h2 className="text-xl font-black uppercase italic">Live Arena Signals</h2>
                 <div className="grid gap-4">
                    {cricketData?.map(m => (
                      <Card key={m.id} className="bg-[#0a0a0f] border-white/5 p-5 flex items-center justify-between rounded-2xl hover:border-blue-500/20 transition-all">
                         <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                               <img src={m.teamALogo} className="h-10 w-10 object-contain rounded-lg bg-white/5 p-1" />
                               <span className="font-black italic text-sm">{m.teamA.substring(0, 3).toUpperCase()}</span>
                            </div>
                            <span className="text-primary font-black italic text-xs">VS</span>
                            <div className="flex items-center gap-2">
                               <span className="font-black italic text-sm">{m.teamB.substring(0, 3).toUpperCase()}</span>
                               <img src={m.teamBLogo} className="h-10 w-10 object-contain rounded-lg bg-white/5 p-1" />
                            </div>
                            <Badge variant="outline" className="border-white/10 text-[8px] font-bold text-muted-foreground uppercase">{m.series}</Badge>
                         </div>
                         <div className="flex items-center gap-3">
                            <Badge className="bg-blue-600/10 text-blue-500 border-none italic font-black uppercase text-[9px]">{m.status}</Badge>
                            <Button variant="ghost" onClick={() => deleteDoc(doc(firestore!, 'cricket_matches', m.id))} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                         </div>
                      </Card>
                    ))}
                 </div>
              </div>
            </div>
            
            <div className="space-y-6">
               <h2 className="text-xl font-black uppercase italic flex items-center gap-3">
                  <LineChart className="text-blue-400 h-5 w-5" /> Live Intelligence Feed (External API)
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {liveMatches.map((m) => (
                    <Card key={m.id} className="bg-white/5 border-white/5 p-6 rounded-2xl space-y-4 group hover:border-blue-500/40 transition-all">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-blue-400 italic">Match Intel</span>
                          <Badge className="bg-red-500/20 text-red-500 border-none text-[8px] font-black animate-pulse">LIVE</Badge>
                       </div>
                       <div className="space-y-3">
                          <p className="text-sm font-black uppercase italic text-center text-white/80">{m.teamA} vs {m.teamB}</p>
                          <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
                             <p className="text-2xl font-black text-blue-400 tabular-nums">{m.liveScore?.runsA || 'Awaiting'}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Overs: {m.liveScore?.overs}</p>
                          </div>
                       </div>
                       <Button variant="outline" onClick={() => {
                          setTargetOver(Math.ceil(parseFloat(m.liveScore?.overs || '0') + 1).toString());
                          setActiveTab('polls');
                       }} className="w-full h-10 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 font-black text-[9px] uppercase tracking-widest rounded-xl">
                          AUTO-FILL SIGNAL
                       </Button>
                    </Card>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
           <div className="max-w-2xl space-y-10">
              <h2 className="text-xl font-black uppercase italic">Master Protocol Sync</h2>
              <Card className="bg-[#0a0a0f] border-white/5 p-10 space-y-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5">
                    <Settings className="h-32 w-32 animate-spin" style={{ animationDuration: '10s' }} />
                 </div>
                 
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                       <Zap className="h-3 w-3" /> System State
                    </Label>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div>
                          <p className="text-sm font-black uppercase italic">Maintenance Mode</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Blocks all regular access signals.</p>
                       </div>
                       <button 
                        onClick={() => updateDoc(settingsRef!, { maintenanceMode: !globalSettings?.maintenanceMode })}
                        className={cn("w-14 h-7 rounded-full transition-all flex items-center px-1", globalSettings?.maintenanceMode ? "bg-red-500 justify-end shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-white/10 justify-start")}
                      >
                         <div className="w-5 h-5 rounded-full bg-white shadow-xl" />
                      </button>
                    </div>
                 </div>

                 <div className="grid gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Cricket API Intelligence ID</Label>
                       <Input value={globalSettings?.cricketApiKey || ''} onChange={e => updateDoc(settingsRef!, { cricketApiKey: e.target.value })} placeholder="Enter CricAPI or RapidAPI Key" className="bg-black border-white/10 h-12 font-mono text-xs text-blue-400" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Telegram Fleet URL</Label>
                       <Input value={globalSettings?.telegramUrl || ''} onChange={e => updateDoc(settingsRef!, { telegramUrl: e.target.value })} className="bg-black border-white/10 h-12 font-mono text-xs text-primary" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Withdrawal Fee (%)</Label>
                          <Input type="number" value={globalSettings?.withdrawalFeePercent || 8} onChange={e => updateDoc(settingsRef!, { withdrawalFeePercent: parseInt(e.target.value) })} className="bg-black border-white/10 h-12 font-black italic" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Referral Credit (Coins)</Label>
                          <Input type="number" value={globalSettings?.referralRewardCoins || 10} onChange={e => updateDoc(settingsRef!, { referralRewardCoins: parseInt(e.target.value) })} className="bg-black border-white/10 h-12 font-black italic" />
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
      active ? "bg-primary text-white shadow-xl italic translate-x-2" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      <span className={cn("transition-transform", active && "scale-110")}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
