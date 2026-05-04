
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, increment } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Trophy, 
  Settings, 
  ShieldCheck, 
  Plus,
  History,
  X,
  Save,
  Key,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Gamepad2,
  Globe,
  CheckCircle2,
  XCircle,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings, Tournament, UserProfile, SupportMessage, UserLedgerEntry, Match } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tournaments' | 'matches' | 'support' | 'transactions' | 'settings'>('dashboard');

  const isAdminUser = user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

  const usersQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? collection(firestore, 'users') : null, 
    [firestore, isAdminUser]
  );
  const tournamentsQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, 
    [firestore, isAdminUser]
  );
  const matchesQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? query(collection(firestore, 'matches'), orderBy('startTime', 'desc')) : null, 
    [firestore, isAdminUser]
  );
  const supportQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? query(collection(firestore, 'support'), orderBy('timestamp', 'desc')) : null, 
    [firestore, isAdminUser]
  );
  const transactionsQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc')) : null, 
    [firestore, isAdminUser]
  );
  const settingsRef = useMemoFirebase(() => 
    (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, 
    [firestore, isAdminUser]
  );

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: matchesData } = useCollection<Match>(matchesQuery);
  const { data: supportData } = useCollection<SupportMessage>(supportQuery);
  const { data: transactionsData } = useCollection<UserLedgerEntry & { userId: string }>(transactionsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [roomId, setRoomId] = useState('');
  const [roomPass, setRoomPass] = useState('');
  const [telegramInput, setTelegramInput] = useState('');

  useEffect(() => {
    if (settings?.telegramUrl) {
      setTelegramInput(settings.telegramUrl);
    }
  }, [settings]);

  const handleUpdateRoom = async () => {
    if (!firestore || !selectedTournament) return;
    try {
      await updateDoc(doc(firestore, 'tournaments', selectedTournament.id), {
        roomCredentials: { roomId, roomPassword: roomPass }
      });
      toast({ title: "Room Updated", description: "Credentials are now visible to joined players." });
      setSelectedTournament(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    }
  };

  const handleCreateTournament = async (e: any) => {
    e.preventDefault();
    if (!firestore) return;
    const formData = new FormData(e.target);
    try {
      await addDoc(collection(firestore, 'tournaments'), {
        name: formData.get('name'),
        gameType: formData.get('gameType'),
        game: formData.get('game'),
        prizePool: formData.get('prizePool'),
        entryFee: parseInt(formData.get('entryFee') as string || '0'),
        startDate: new Date(formData.get('startDate') as string || Date.now()).toISOString(),
        status: 'upcoming',
        banner: `https://picsum.photos/seed/${Math.random()}/800/400`
      });
      toast({ title: "Tournament Created Successfully" });
      e.target.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleCreateMatch = async (e: any) => {
    e.preventDefault();
    if (!firestore) return;
    const formData = new FormData(e.target);
    try {
      await addDoc(collection(firestore, 'matches'), {
        tournamentId: formData.get('tournamentId'),
        teamA: { name: formData.get('teamA'), logo: `https://picsum.photos/seed/a${Math.random()}/100/100` },
        teamB: { name: formData.get('teamB'), logo: `https://picsum.photos/seed/b${Math.random()}/100/100` },
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        startTime: new Date(formData.get('startTime') as string || Date.now()).toISOString(),
        description: formData.get('description') || 'Battle Arena Match',
        votesA: 0,
        votesB: 0
      });
      toast({ title: "Match Added to Arena" });
      e.target.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to Add Match" });
    }
  };

  const handleUpdateScore = async (matchId: string, scoreA: number, scoreB: number, status: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'matches', matchId), { scoreA, scoreB, status });
      toast({ title: "Live Data Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleProcessTransaction = async (transaction: UserLedgerEntry & { id: string, userId: string }, status: 'completed' | 'failed') => {
    if (!firestore || !transaction.userId) return;
    
    try {
      const transactionRef = doc(firestore, 'users', transaction.userId, 'ledger', transaction.id);
      await updateDoc(transactionRef, { status });

      if (transaction.type === 'withdrawal' && status === 'failed') {
        const userRef = doc(firestore, 'users', transaction.userId);
        await updateDoc(userRef, { coins: increment(transaction.amount) });
        toast({ title: "Transaction Rejected", description: "Funds have been refunded to the user." });
      } else {
        toast({ title: `Transaction ${status}`, description: "Status updated successfully." });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    }
  };

  const handleToggleModule = async (module: keyof AppSettings, value: boolean) => {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, { [module]: value }, { merge: true });
      toast({ title: "Settings Updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleUpdateTelegram = async () => {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, { telegramUrl: telegramInput }, { merge: true });
      toast({ title: "Telegram URL Updated" });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center"><ShieldCheck className="h-16 w-16 mb-4 text-destructive" /><h1>Access Restricted</h1></div>;

  return (
    <div className="flex min-h-screen bg-[#0d0d12] text-foreground">
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-2xl hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-black tracking-tighter text-lg uppercase">Arena Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Overview" />
          <SidebarItem active={activeTab === 'tournaments'} onClick={() => setActiveTab('tournaments')} icon={<Trophy />} label="Tournaments" />
          <SidebarItem active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<Activity />} label="Live Matches" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Payments" />
          <SidebarItem active={activeTab === 'support'} onClick={() => setActiveTab('support')} icon={<MessageSquare />} label="AI Logs" />
          <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Global" />
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 space-y-8 pb-32 pt-20 md:pt-10">
        <div className="md:hidden overflow-x-auto flex gap-2 pb-2 no-scrollbar fixed top-16 left-0 right-0 z-40 bg-[#0d0d12] p-4 border-b border-white/5">
          <Button size="sm" variant={activeTab === 'dashboard' ? 'default' : 'outline'} onClick={() => setActiveTab('dashboard')} className="whitespace-nowrap">Dash</Button>
          <Button size="sm" variant={activeTab === 'tournaments' ? 'default' : 'outline'} onClick={() => setActiveTab('tournaments')} className="whitespace-nowrap">Event</Button>
          <Button size="sm" variant={activeTab === 'matches' ? 'default' : 'outline'} onClick={() => setActiveTab('matches')} className="whitespace-nowrap">Match</Button>
          <Button size="sm" variant={activeTab === 'transactions' ? 'default' : 'outline'} onClick={() => setActiveTab('transactions')} className="whitespace-nowrap">Finance</Button>
          <Button size="sm" variant={activeTab === 'support' ? 'default' : 'outline'} onClick={() => setActiveTab('support')} className="whitespace-nowrap">Logs</Button>
          <Button size="sm" variant={activeTab === 'settings' ? 'default' : 'outline'} onClick={() => setActiveTab('settings')} className="whitespace-nowrap">Global</Button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StatsCard title="Warriors" value={usersData?.length || 0} icon={<UsersIcon />} />
            <StatsCard title="Events" value={tournamentsData?.length || 0} icon={<Trophy />} />
            <StatsCard title="Flagged AI" value={supportData?.filter(s => s.isFlagged).length || 0} icon={<AlertTriangle />} />
            <StatsCard title="Payouts" value={transactionsData?.filter(t => t.type === 'withdrawal' && t.status === 'pending').length || 0} icon={<History />} />
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-8">
            <Card className="bg-card/30 border-white/5 p-6 rounded-[2rem]">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Plus className="text-primary" /> Create Event</h2>
              <form onSubmit={handleCreateTournament} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input name="name" placeholder="Tournament Name" required className="bg-black/40 border-white/10" />
                <Select name="gameType" defaultValue="BGMI">
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BGMI">BGMI</SelectItem>
                    <SelectItem value="Free Fire">Free Fire</SelectItem>
                    <SelectItem value="Ludo King">Ludo King</SelectItem>
                  </SelectContent>
                </Select>
                <Input name="game" placeholder="Map/Mode" required className="bg-black/40 border-white/10" />
                <Input name="prizePool" placeholder="Prize Pool" required className="bg-black/40 border-white/10" />
                <Input name="entryFee" type="number" placeholder="Entry (Coins)" required className="bg-black/40 border-white/10" />
                <Input name="startDate" type="datetime-local" required className="bg-black/40 border-white/10" />
                <Button type="submit" className="md:col-span-3 font-black uppercase tracking-widest bg-primary">Host Battle</Button>
              </form>
            </Card>

            <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden">
              <CardHeader><CardTitle className="uppercase font-black text-sm">Room Management</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {tournamentsData?.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-bold">{t.name}</TableCell>
                        <TableCell><Badge variant="outline">{t.status}</Badge></TableCell>
                        <TableCell>
                           {selectedTournament?.id === t.id ? (
                             <div className="flex gap-2">
                                <Input placeholder="Room ID" className="w-24 h-8 text-xs" value={roomId} onChange={e => setRoomId(e.target.value)} />
                                <Input placeholder="PASS" className="w-24 h-8 text-xs" value={roomPass} onChange={e => setRoomPass(e.target.value)} />
                                <Button size="sm" className="h-8" onClick={handleUpdateRoom}><Save className="h-3 w-3" /></Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelectedTournament(null)}><X className="h-3 w-3" /></Button>
                             </div>
                           ) : (
                             <Button size="sm" variant="outline" className="h-8" onClick={() => { setSelectedTournament(t); setRoomId(t.roomCredentials?.roomId || ''); setRoomPass(t.roomCredentials?.roomPassword || ''); }}>
                               <Key className="h-3 w-3 mr-1" /> Update Room
                             </Button>
                           )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-8">
            <Card className="bg-card/30 border-white/5 p-6 rounded-[2rem]">
               <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Gamepad2 className="text-secondary" /> Add Live Match</h2>
               <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input name="tournamentId" placeholder="Tournament ID" required className="bg-black/40" />
                  <Input name="teamA" placeholder="Team A Name" required className="bg-black/40" />
                  <Input name="teamB" placeholder="Team B Name" required className="bg-black/40" />
                  <Input name="startTime" type="datetime-local" required className="bg-black/40" />
                  <Input name="description" placeholder="Description (e.g. Finals)" className="bg-black/40" />
                  <Button type="submit" className="lg:col-span-3 bg-secondary text-secondary-foreground font-black">ACTIVATE MATCH</Button>
               </form>
            </Card>

            <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden">
               <CardHeader><CardTitle className="uppercase font-black text-sm">Match Control</CardTitle></CardHeader>
               <CardContent>
                  <Table>
                     <TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead><TableHead>Save</TableHead></TableRow></TableHeader>
                     <TableBody>
                        {matchesData?.map(m => (
                          <TableRow key={m.id}>
                             <TableCell className="font-bold text-xs">{m.teamA.name} vs {m.teamB.name}</TableCell>
                             <TableCell>
                                <div className="flex items-center gap-1">
                                   <Input type="number" className="w-12 h-8 p-1 text-center" defaultValue={m.scoreA} id={`sA-${m.id}`} />
                                   <span>:</span>
                                   <Input type="number" className="w-12 h-8 p-1 text-center" defaultValue={m.scoreB} id={`sB-${m.id}`} />
                                </div>
                             </TableCell>
                             <TableCell>
                                <Select defaultValue={m.status} id={`st-${m.id}`}>
                                   <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                      <SelectItem value="scheduled">Scheduled</SelectItem>
                                      <SelectItem value="live">Live</SelectItem>
                                      <SelectItem value="finished">Finished</SelectItem>
                                   </SelectContent>
                                </Select>
                             </TableCell>
                             <TableCell>
                                <Button size="sm" onClick={() => {
                                   const sA = parseInt((document.getElementById(`sA-${m.id}`) as HTMLInputElement).value);
                                   const sB = parseInt((document.getElementById(`sB-${m.id}`) as HTMLInputElement).value);
                                   handleUpdateScore(m.id, sA, sB, 'live'); 
                                }}>Update</Button>
                             </TableCell>
                          </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden">
            <CardHeader>
              <CardTitle className="uppercase font-black text-sm tracking-widest text-primary">Global Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow><TableHead>User</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsData?.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-mono text-[10px]">{String(tx.userId || '').slice(-6)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] uppercase">{tx.type}</Badge></TableCell>
                      <TableCell className="font-black">₹{tx.amount}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[8px] uppercase", tx.status === 'completed' ? "bg-green-500" : tx.status === 'failed' ? "bg-red-500" : "bg-yellow-500")}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tx.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-8 border-green-500/20 text-green-500" onClick={() => handleProcessTransaction(tx as any, 'completed')}><CheckCircle2 className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" className="h-8 border-red-500/20 text-red-500" onClick={() => handleProcessTransaction(tx as any, 'failed')}><XCircle className="h-4 w-4" /></Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card/30 border-white/5 p-8 rounded-[2rem] space-y-8">
              <h2 className="text-lg font-black uppercase flex items-center gap-2"><Globe className="text-primary" /> Modules</h2>
              <div className="space-y-6">
                <ModuleToggle label="Video Wall" enabled={settings?.videoWallEnabled ?? true} onToggle={(v) => handleToggleModule('videoWallEnabled', v)} />
                <ModuleToggle label="Offer Wall" enabled={settings?.offerWallEnabled ?? true} onToggle={(v) => handleToggleModule('offerWallEnabled', v)} />
                <ModuleToggle label="CPA Lead" enabled={settings?.cpaLeadEnabled ?? true} onToggle={(v) => handleToggleModule('cpaLeadEnabled', v)} />
              </div>
            </Card>

            <Card className="bg-card/30 border-white/5 p-8 rounded-[2rem] space-y-6">
               <h2 className="text-lg font-black uppercase flex items-center gap-2"><MessageSquare className="text-secondary" /> Support Config</h2>
               <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telegram Link</Label>
                  <div className="flex gap-2">
                    <Input placeholder="https://t.me/your_channel" value={telegramInput} onChange={(e) => setTelegramInput(e.target.value)} className="bg-black/40" />
                    <Button onClick={handleUpdateTelegram}>Update</Button>
                  </div>
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'support' && (
          <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden">
             <CardHeader><CardTitle className="font-black uppercase text-sm">AI Activity Logs</CardTitle></CardHeader>
             <CardContent>
                <Table>
                   <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Message</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                   <TableBody>
                      {supportData?.map(m => (
                        <TableRow key={m.id} className={m.isFlagged ? "bg-destructive/5" : ""}>
                           <TableCell className="font-mono text-[10px]">{String(m.userId || '').slice(-4)}</TableCell>
                           <TableCell className="text-xs italic">{m.message}</TableCell>
                           <TableCell>
                              {m.isFlagged ? <Badge variant="destructive" className="text-[8px]">FLAGGED</Badge> : <Badge variant="outline" className="text-[8px]">Auto</Badge>}
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left", active ? "bg-primary text-white font-bold" : "text-muted-foreground hover:bg-white/5")}>
      <span className="h-5 w-5">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatsCard({ title, value, icon }: any) {
  return (
    <Card className="bg-card/40 border-white/5 p-4 md:p-6 rounded-2xl">
      <div className="h-8 w-8 md:h-10 md:w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary">{icon}</div>
      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{title}</p>
      <h4 className="text-xl md:text-2xl font-black">{value}</h4>
    </Card>
  );
}

function ModuleToggle({ label, enabled, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
      <p className="text-xs font-bold uppercase tracking-tight">{label}</p>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}
