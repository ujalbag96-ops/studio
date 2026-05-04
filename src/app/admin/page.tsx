
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
  Check,
  Ban,
  Gamepad2,
  Video,
  Globe,
  Menu,
  CheckCircle2,
  XCircle
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
import { AppSettings, Tournament, UserProfile, SupportMessage, UserLedgerEntry } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tournaments' | 'support' | 'transactions' | 'settings'>('dashboard');

  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const tournamentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'tournaments') : null, [firestore]);
  const supportQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'support'), orderBy('timestamp', 'desc')) : null, [firestore]);
  const transactionsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc')) : null, [firestore]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
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

  const isAuthorized = user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();
  if (!isAuthorized) return <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center"><ShieldCheck className="h-16 w-16 mb-4 text-destructive" /><h1>Access Restricted</h1></div>;

  return (
    <div className="flex min-h-screen bg-[#0d0d12] text-foreground">
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-2xl hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-black tracking-tighter text-lg uppercase">Battle Control</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
          <SidebarItem active={activeTab === 'tournaments'} onClick={() => setActiveTab('tournaments')} icon={<Trophy />} label="Tournaments" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Finances" />
          <SidebarItem active={activeTab === 'support'} onClick={() => setActiveTab('support')} icon={<MessageSquare />} label="AI Support" />
          <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Global Settings" />
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 space-y-8 pb-32 pt-20 md:pt-10">
        <div className="md:hidden overflow-x-auto flex gap-2 pb-2 no-scrollbar">
          <Button size="sm" variant={activeTab === 'dashboard' ? 'default' : 'outline'} onClick={() => setActiveTab('dashboard')} className="whitespace-nowrap font-bold">Dashboard</Button>
          <Button size="sm" variant={activeTab === 'tournaments' ? 'default' : 'outline'} onClick={() => setActiveTab('tournaments')} className="whitespace-nowrap font-bold">Tournaments</Button>
          <Button size="sm" variant={activeTab === 'transactions' ? 'default' : 'outline'} onClick={() => setActiveTab('transactions')} className="whitespace-nowrap font-bold">Finances</Button>
          <Button size="sm" variant={activeTab === 'support' ? 'default' : 'outline'} onClick={() => setActiveTab('support')} className="whitespace-nowrap font-bold">Support</Button>
          <Button size="sm" variant={activeTab === 'settings' ? 'default' : 'outline'} onClick={() => setActiveTab('settings')} className="whitespace-nowrap font-bold">Settings</Button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <StatsCard title="Players" value={usersData?.length || 0} icon={<UsersIcon />} />
            <StatsCard title="Battles" value={tournamentsData?.length || 0} icon={<Trophy />} />
            <StatsCard title="Flagged" value={supportData?.filter(s => s.isFlagged).length || 0} icon={<AlertTriangle />} />
            <StatsCard title="Pending Payouts" value={transactionsData?.filter(t => t.type === 'withdrawal' && t.status === 'pending').length || 0} icon={<History />} />
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-8">
            <Card className="bg-card/30 border-white/5 p-4 md:p-8 rounded-[1.5rem] md:rounded-[2rem]">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Plus className="text-primary" /> Create Tournament</h2>
              <form onSubmit={handleCreateTournament} className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Input name="name" placeholder="Tournament Name" required className="bg-black/40 border-white/10 h-12" />
                <Select name="gameType" defaultValue="BGMI">
                  <SelectTrigger className="bg-black/40 border-white/10 h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BGMI">BGMI</SelectItem>
                    <SelectItem value="Free Fire">Free Fire</SelectItem>
                    <SelectItem value="Ludo King">Ludo King</SelectItem>
                  </SelectContent>
                </Select>
                <Input name="game" placeholder="Map/Mode" required className="bg-black/40 border-white/10 h-12" />
                <Input name="prizePool" placeholder="Prize (e.g. ₹5,000)" required className="bg-black/40 border-white/10 h-12" />
                <Input name="entryFee" type="number" placeholder="Entry (Coins)" required className="bg-black/40 border-white/10 h-12" />
                <Input name="startDate" type="datetime-local" required className="bg-black/40 border-white/10 h-12" />
                <Button type="submit" className="md:col-span-3 h-14 font-black uppercase tracking-widest bg-primary hover:bg-primary/90">Launch Battle</Button>
              </form>
            </Card>

            <Card className="bg-card/30 border-white/5 rounded-[1.5rem] md:rounded-[2rem] overflow-x-auto">
              <CardHeader><CardTitle className="uppercase font-black text-sm tracking-widest">Manage Room IDs</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead className="hidden md:table-cell">Type</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {tournamentsData?.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="font-bold text-xs md:text-sm">{t.name}</TableCell>
                        <TableCell className="hidden md:table-cell"><Badge variant="outline">{t.gameType}</Badge></TableCell>
                        <TableCell>
                           {selectedTournament?.id === t.id ? (
                             <div className="flex flex-col md:flex-row gap-2">
                                <Input placeholder="ID" className="w-full md:w-24 h-8 text-xs" value={roomId} onChange={e => setRoomId(e.target.value)} />
                                <Input placeholder="PASS" className="w-full md:w-24 h-8 text-xs" value={roomPass} onChange={e => setRoomPass(e.target.value)} />
                                <div className="flex gap-2">
                                  <Button size="sm" className="h-8" onClick={handleUpdateRoom}><Save className="h-3 w-3" /></Button>
                                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setSelectedTournament(null)}><X className="h-3 w-3" /></Button>
                                </div>
                             </div>
                           ) : (
                             <Button size="sm" variant="outline" className="border-primary/20 text-[10px] h-8" onClick={() => { setSelectedTournament(t); setRoomId(t.roomCredentials?.roomId || ''); setRoomPass(t.roomCredentials?.roomPassword || ''); }}>
                               <Key className="h-3 w-3 mr-1" /> Update
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

        {activeTab === 'transactions' && (
          <Card className="bg-card/30 border-white/5 rounded-[1.5rem] md:rounded-[2rem] overflow-x-auto">
            <CardHeader>
              <CardTitle className="uppercase font-black text-sm tracking-widest">Global Transaction Ledger</CardTitle>
              <CardDescription>Approve or reject withdrawal and earning requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsData?.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-[10px] text-muted-foreground whitespace-nowrap">{tx.date || 'N/A'}</TableCell>
                      <TableCell className="font-mono text-[10px]">{String(tx.userId || '').slice(-6)}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[8px] uppercase">{tx.type}</Badge></TableCell>
                      <TableCell className="font-black text-xs">₹{tx.amount}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "text-[8px] uppercase",
                          tx.status === 'completed' ? "bg-green-500" : tx.status === 'failed' ? "bg-red-500" : "bg-yellow-500"
                        )}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {tx.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-green-500/20 text-green-500" onClick={() => handleProcessTransaction(tx as any, 'completed')}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-red-500/20 text-red-500" onClick={() => handleProcessTransaction(tx as any, 'failed')}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!transactionsData || transactionsData.length === 0) && (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 italic text-muted-foreground">No transactions found.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Card className="bg-card/30 border-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] space-y-8">
              <h2 className="text-lg font-black uppercase flex items-center gap-2"><Globe className="text-secondary" /> Modules</h2>
              <div className="space-y-6">
                <ModuleToggle label="Video Wall" enabled={settings?.videoWallEnabled ?? true} onToggle={(v) => handleToggleModule('videoWallEnabled', v)} />
                <ModuleToggle label="Offer Wall" enabled={settings?.offerWallEnabled ?? true} onToggle={(v) => handleToggleModule('offerWallEnabled', v)} />
                <ModuleToggle label="CPA Lead" enabled={settings?.cpaLeadEnabled ?? true} onToggle={(v) => handleToggleModule('cpaLeadEnabled', v)} />
              </div>
            </Card>

            <Card className="bg-card/30 border-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] space-y-6">
               <h2 className="text-lg font-black uppercase flex items-center gap-2"><MessageSquare className="text-primary" /> Support</h2>
               <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Telegram Link</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://t.me/your_channel" 
                      value={telegramInput} 
                      onChange={(e) => setTelegramInput(e.target.value)}
                      className="bg-black/40 border-white/10" 
                    />
                    <Button onClick={handleUpdateTelegram}>Update</Button>
                  </div>
               </div>
            </Card>
          </div>
        )}

        {activeTab === 'support' && (
          <Card className="bg-card/30 border-white/5 rounded-[1.5rem] md:rounded-[2rem] overflow-x-auto">
             <CardHeader><CardTitle className="font-black uppercase text-sm">AI Chat Logs</CardTitle></CardHeader>
             <CardContent>
                <Table>
                   <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Msg</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                   <TableBody>
                      {supportData?.map(m => (
                        <TableRow key={m.id} className={m.isFlagged ? "bg-destructive/5" : ""}>
                           <TableCell className="font-mono text-[10px]">{String(m.userId || '').slice(-4)}</TableCell>
                           <TableCell className="text-[10px] italic max-w-[150px] truncate">{m.message}</TableCell>
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
      <p className="text-[8px] md:text-[10px] font-black uppercase text-muted-foreground mb-1">{title}</p>
      <h4 className="text-xl md:text-2xl font-black">{value}</h4>
    </Card>
  );
}

function ModuleToggle({ label, enabled, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-black/40 border border-white/5">
      <p className="text-xs font-bold uppercase tracking-tight">{label}</p>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}
