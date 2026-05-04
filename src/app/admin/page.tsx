
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, increment, writeBatch, addDoc, deleteDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Trophy, 
  CreditCard, 
  ArrowUpRight, 
  Settings, 
  ShieldCheck, 
  Plus,
  Activity,
  Clock,
  Lock,
  Loader2,
  Save,
  X,
  History,
  Check,
  ToggleLeft,
  MessageSquareShare,
  Sword,
  Edit3,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings, UserLedgerEntry, Tournament, Match, UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tournaments' | 'matches' | 'users' | 'transactions' | 'modules' | 'settings'>('dashboard');

  // Real-time Data Subscriptions
  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const tournamentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'tournaments') : null, [firestore]);
  const matchesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'matches') : null, [firestore]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  
  const allTransactionsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collectionGroup(firestore, 'ledger'));
  }, [firestore]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: matchesData } = useCollection<Match>(matchesQuery);
  const { data: settingsData } = useDoc<AppSettings>(settingsRef);
  const { data: transactionsData, isLoading: transactionsLoading } = useCollection<UserLedgerEntry & { userId: string }>(allTransactionsQuery);

  // Module & Settings States
  const [videoWallEnabled, setVideoWallEnabled] = useState(true);
  const [offerWallEnabled, setOfferWallEnabled] = useState(true);
  const [cpaLeadEnabled, setCpaLeadEnabled] = useState(true);
  const [telegramUrl, setTelegramUrl] = useState('');
  const [cpaUrl, setCpaUrl] = useState('');
  const [cpaApiKey, setCpaApiKey] = useState('');
  const [cpaPostback, setCpaPostback] = useState('');
  const [videoProvider, setVideoProvider] = useState<'unity' | 'applovin'>('unity');
  const [videoPlacementId, setVideoPlacementId] = useState('');

  useEffect(() => {
    if (settingsData) {
      setVideoWallEnabled(settingsData.videoWallEnabled ?? true);
      setOfferWallEnabled(settingsData.offerWallEnabled ?? true);
      setCpaLeadEnabled(settingsData.cpaLeadEnabled ?? true);
      setTelegramUrl(settingsData.telegramUrl || '');
      setCpaUrl(settingsData.cpaLeadUrl || '');
      setCpaApiKey(settingsData.cpaLeadApiKey || '');
      setCpaPostback(settingsData.cpaLeadPostbackUrl || '');
      setVideoProvider(settingsData.videoAdProvider || 'unity');
      setVideoPlacementId(settingsData.videoAdPlacementId || '');
    }
  }, [settingsData]);

  // Handlers
  const handleUpdateModules = async () => {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, { 
        videoWallEnabled,
        offerWallEnabled,
        cpaLeadEnabled,
        telegramUrl
      }, { merge: true });
      toast({ title: "Module Config Saved" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleTransactionAction = async (transaction: UserLedgerEntry & { userId: string }, status: 'completed' | 'failed') => {
    if (!firestore || !transaction.userId) return;
    try {
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', transaction.userId);
      const ledgerRef = doc(firestore, 'users', transaction.userId, 'ledger', transaction.id);
      batch.update(ledgerRef, { status });
      if (status === 'failed' && transaction.type === 'withdrawal') {
        batch.update(userRef, { coins: increment(transaction.amount) });
      }
      await batch.commit();
      toast({ title: "Processed", description: `Transaction updated to ${status}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleCreateTournament = async (e: any) => {
    e.preventDefault();
    if (!firestore) return;
    const formData = new FormData(e.target);
    try {
      await addDoc(collection(firestore, 'tournaments'), {
        name: formData.get('name'),
        game: formData.get('game'),
        prizePool: formData.get('prizePool'),
        startDate: formData.get('startDate'),
        status: 'active',
        banner: `https://picsum.photos/seed/${Math.random()}/800/400`
      });
      toast({ title: "Tournament Created" });
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
        teamA: { name: formData.get('teamA'), logo: `https://picsum.photos/seed/${Math.random()}/100/100` },
        teamB: { name: formData.get('teamB'), logo: `https://picsum.photos/seed/${Math.random()}/101/101` },
        scoreA: 0,
        scoreB: 0,
        status: 'scheduled',
        startTime: new Date().toISOString(),
        description: formData.get('description'),
        votesA: 0,
        votesB: 0
      });
      toast({ title: "Match Created" });
      e.target.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleDeleteDoc = async (coll: string, id: string) => {
    if (!firestore || !confirm('Are you sure?')) return;
    await deleteDoc(doc(firestore, coll, id));
    toast({ title: "Deleted Successfully" });
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  const isAuthorized = user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
  if (!isAuthorized) return <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center"><Lock className="h-12 w-12 mb-4" /><h1>Restricted</h1></div>;

  return (
    <div className="flex min-h-screen bg-[#0d0d12] text-foreground">
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-2xl hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-black tracking-tighter text-lg">BATTLE ADMIN</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
          <SidebarItem active={activeTab === 'tournaments'} onClick={() => setActiveTab('tournaments')} icon={<Trophy />} label="Tournaments" />
          <SidebarItem active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<Sword />} label="Matches" />
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="Users" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Transactions" />
          <SidebarItem active={activeTab === 'modules'} onClick={() => setActiveTab('modules')} icon={<ToggleLeft />} label="Earning Hub" />
          <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Settings" />
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8 pb-24">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnalyticsCard title="Users" value={usersData?.length?.toString() || "0"} icon={<UsersIcon />} color="primary" trend="Live" />
            <AnalyticsCard title="Tournaments" value={tournamentsData?.length?.toString() || "0"} icon={<Trophy />} color="secondary" trend="Active" />
            <AnalyticsCard title="Live Matches" value={matchesData?.filter(m => m.status === 'live').length?.toString() || "0"} icon={<Activity />} color="destructive" trend="Live" />
            <AnalyticsCard title="Pending" value={transactionsData?.filter(t => t.status === 'pending').length?.toString() || "0"} icon={<Clock />} color="yellow" trend="Needs Review" />
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <Card className="bg-card/30 border-white/5 p-6">
              <h2 className="text-xl font-black uppercase mb-4">Create Tournament</h2>
              <form onSubmit={handleCreateTournament} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input name="name" placeholder="Tournament Name" required className="bg-black/40 border-white/10" />
                <Input name="game" placeholder="Game Name" required className="bg-black/40 border-white/10" />
                <Input name="prizePool" placeholder="Prize Pool (e.g. ₹5,000)" required className="bg-black/40 border-white/10" />
                <Input name="startDate" type="date" required className="bg-black/40 border-white/10" />
                <Button type="submit" className="md:col-span-4 font-black uppercase tracking-widest"><Plus className="h-4 w-4 mr-2" /> Add Tournament</Button>
              </form>
            </Card>
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Game</TableHead><TableHead>Prize</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {tournamentsData?.map(t => (
                  <TableRow key={t.id}><TableCell>{t.name}</TableCell><TableCell>{t.game}</TableCell><TableCell>{t.prizePool}</TableCell>
                    <TableCell><Button variant="destructive" size="sm" onClick={() => handleDeleteDoc('tournaments', t.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            <Card className="bg-card/30 border-white/5 p-6">
              <h2 className="text-xl font-black uppercase mb-4">Create Match</h2>
              <form onSubmit={handleCreateMatch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select name="tournamentId">
                  <SelectTrigger className="bg-black/40 border-white/10"><SelectValue placeholder="Select Tournament" /></SelectTrigger>
                  <SelectContent>{tournamentsData?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
                <Input name="teamA" placeholder="Team A Name" required className="bg-black/40 border-white/10" />
                <Input name="teamB" placeholder="Team B Name" required className="bg-black/40 border-white/10" />
                <Input name="description" placeholder="Match Context (e.g. Finals)" required className="md:col-span-3 bg-black/40 border-white/10" />
                <Button type="submit" className="md:col-span-3 font-black uppercase tracking-widest"><Plus className="h-4 w-4 mr-2" /> Add Match</Button>
              </form>
            </Card>
            <Table>
              <TableHeader><TableRow><TableHead>Match</TableHead><TableHead>Score</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {matchesData?.map(m => (
                  <TableRow key={m.id}>
                    <TableCell>{m.teamA.name} vs {m.teamB.name}</TableCell>
                    <TableCell>{m.scoreA} - {m.scoreB}</TableCell>
                    <TableCell><Badge>{m.status}</Badge></TableCell>
                    <TableCell className="space-x-2">
                       <Button size="sm" variant="outline" onClick={() => updateDoc(doc(firestore!, 'matches', m.id), { status: 'live' })}>Go Live</Button>
                       <Button size="sm" variant="destructive" onClick={() => handleDeleteDoc('matches', m.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {activeTab === 'users' && (
          <Table>
            <TableHeader><TableRow><TableHead>User ID</TableHead><TableHead>Email/Phone</TableHead><TableHead>Coins</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {usersData?.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-mono text-xs">{u.id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>{u.email || u.mobile || 'Anonymous'}</TableCell>
                  <TableCell className="font-black">{u.coins || 0} 🪙</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => updateDoc(doc(firestore!, 'users', u.id), { coins: increment(100) })}>Add 100 🪙</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {activeTab === 'transactions' && (
          <Card className="bg-card/30 border-white/5">
            <CardHeader><CardTitle>Global Ledger</CardTitle></CardHeader>
            <CardContent className="p-0">
              {transactionsLoading ? <Loader2 className="h-8 w-8 animate-spin mx-auto p-12" /> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Management</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {transactionsData?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-xs font-mono">{tx.date}</TableCell>
                        <TableCell><Badge variant="outline">{tx.userId.slice(-6).toUpperCase()}</Badge> {tx.type}</TableCell>
                        <TableCell className="font-black">₹{tx.amount}</TableCell>
                        <TableCell><Badge className={tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}>{tx.status}</Badge></TableCell>
                        <TableCell>
                          {tx.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600" onClick={() => handleTransactionAction(tx, 'completed')}><Check className="h-4 w-4" /></Button>
                              <Button size="sm" variant="destructive" onClick={() => handleTransactionAction(tx, 'failed')}><X className="h-4 w-4" /></Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'modules' && (
          <Card className="bg-card/30 border-white/5 p-8">
            <h2 className="text-2xl font-black uppercase mb-6 flex items-center gap-2"><ToggleLeft className="text-primary" /> Hub Configuration</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4 p-6 bg-black/20 rounded-2xl border border-white/5">
                <div className="flex justify-between"><Label>Video Wall</Label><Switch checked={videoWallEnabled} onCheckedChange={setVideoWallEnabled} /></div>
                <div className="flex justify-between"><Label>Offer Wall</Label><Switch checked={offerWallEnabled} onCheckedChange={setOfferWallEnabled} /></div>
                <div className="flex justify-between"><Label>CPA Lead</Label><Switch checked={cpaLeadEnabled} onCheckedChange={setCpaLeadEnabled} /></div>
              </div>
              <div className="space-y-4 p-6 bg-black/20 rounded-2xl border border-white/5">
                <Label className="text-[10px] uppercase font-black text-primary">Telegram Support Link</Label>
                <Input value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} placeholder="https://t.me/..." className="bg-black/40 border-white/10" />
              </div>
            </div>
            <Button onClick={handleUpdateModules} className="w-full mt-8 font-black h-12 uppercase tracking-widest"><Save className="h-4 w-4 mr-2" /> Save Config</Button>
          </Card>
        )}
      </main>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all", active ? "bg-primary text-white font-bold" : "text-muted-foreground hover:bg-white/5")}>
      <span className="h-5 w-5">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function AnalyticsCard({ title, value, icon, color, trend }: any) {
  const colors: any = { primary: "text-primary border-primary/20 bg-primary/10", secondary: "text-secondary border-secondary/20 bg-secondary/10", destructive: "text-destructive border-destructive/20 bg-destructive/10", yellow: "text-amber-500 border-amber-500/20 bg-amber-500/10" };
  return (
    <Card className="bg-card/40 border-white/5 p-6">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 border", colors[color])}>{icon}</div>
      <p className="text-[10px] font-black uppercase text-muted-foreground">{title}</p>
      <h4 className="text-2xl font-black">{value}</h4>
      <Badge variant="outline" className="mt-2 opacity-50 text-[10px]">{trend}</Badge>
    </Card>
  );
}
