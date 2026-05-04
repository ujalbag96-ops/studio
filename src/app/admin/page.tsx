
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, increment, writeBatch, addDoc, deleteDoc, where, orderBy } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Trophy, 
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
  Sword,
  Trash2,
  Key,
  MessageSquare,
  AlertTriangle
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
import { AppSettings, UserLedgerEntry, Tournament, Match, UserProfile, Registration, SupportMessage } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tournaments' | 'matches' | 'users' | 'support' | 'transactions' | 'settings'>('dashboard');

  const usersQuery = useMemoFirebase(() => firestore ? collection(firestore, 'users') : null, [firestore]);
  const tournamentsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'tournaments') : null, [firestore]);
  const matchesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'matches') : null, [firestore]);
  const supportQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'support'), orderBy('timestamp', 'desc')) : null, [firestore]);
  const transactionsQuery = useMemoFirebase(() => firestore ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc')) : null, [firestore]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: matchesData } = useCollection<Match>(matchesQuery);
  const { data: supportData } = useCollection<SupportMessage>(supportQuery);
  const { data: transactionsData } = useCollection<UserLedgerEntry & { userId: string }>(transactionsQuery);

  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [roomId, setRoomId] = useState('');
  const [roomPass, setRoomPass] = useState('');

  const handleUpdateRoom = async () => {
    if (!firestore || !selectedTournament) return;
    try {
      await updateDoc(doc(firestore, 'tournaments', selectedTournament.id), {
        roomCredentials: { roomId, roomPassword: roomPass }
      });
      toast({ title: "Room Updated", description: "Credentials are now visible to players." });
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
        game: formData.get('game'),
        gameType: formData.get('gameType'),
        prizePool: formData.get('prizePool'),
        entryFee: parseInt(formData.get('entryFee') as string),
        startDate: new Date(formData.get('startDate') as string).toISOString(),
        status: 'upcoming',
        banner: `https://picsum.photos/seed/${Math.random()}/800/400`
      });
      toast({ title: "Tournament Created" });
      e.target.reset();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
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
          <SidebarItem active={activeTab === 'support'} onClick={() => setActiveTab('support')} icon={<MessageSquare />} label="AI Support Logs" />
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="Users" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Transactions" />
          <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Settings" />
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-6 md:p-10 space-y-8 pb-24">
        {activeTab === 'tournaments' && (
          <div className="space-y-8">
            <Card className="bg-card/30 border-white/5 p-8">
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Plus className="text-primary" /> Create New Battle</h2>
              <form onSubmit={handleCreateTournament} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input name="name" placeholder="Tournament Name" required className="bg-black/40 border-white/10" />
                <Select name="gameType" defaultValue="BGMI">
                   <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                   <SelectContent>
                      <SelectItem value="BGMI">BGMI</SelectItem>
                      <SelectItem value="Free Fire">Free Fire</SelectItem>
                      <SelectItem value="Ludo King">Ludo King</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                   </SelectContent>
                </Select>
                <Input name="game" placeholder="Sub-game (e.g. Erangel Squad)" required className="bg-black/40 border-white/10" />
                <Input name="prizePool" placeholder="Prize Pool (e.g. ₹5,000)" required className="bg-black/40 border-white/10" />
                <Input name="entryFee" type="number" placeholder="Entry Fee (Coins)" required className="bg-black/40 border-white/10" />
                <Input name="startDate" type="datetime-local" required className="bg-black/40 border-white/10" />
                <Button type="submit" className="md:col-span-3 h-14 font-black uppercase tracking-widest">Launch Tournament</Button>
              </form>
            </Card>

            <Card className="bg-card/30 border-white/5">
               <CardHeader><CardTitle className="uppercase font-black text-sm tracking-widest">Active Tournament Controls</CardTitle></CardHeader>
               <CardContent>
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Game</TableHead><TableHead>Status</TableHead><TableHead>Room Info</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {tournamentsData?.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-bold">{t.name}</TableCell>
                          <TableCell><Badge variant="outline">{t.gameType}</Badge></TableCell>
                          <TableCell><Badge>{t.status}</Badge></TableCell>
                          <TableCell>
                             {selectedTournament?.id === t.id ? (
                               <div className="flex gap-2">
                                  <Input placeholder="ID" className="w-20" value={roomId} onChange={e => setRoomId(e.target.value)} />
                                  <Input placeholder="PASS" className="w-20" value={roomPass} onChange={e => setRoomPass(e.target.value)} />
                                  <Button size="sm" onClick={handleUpdateRoom}><Save className="h-4 w-4" /></Button>
                                  <Button size="sm" variant="ghost" onClick={() => setSelectedTournament(null)}><X className="h-4 w-4" /></Button>
                               </div>
                             ) : (
                               <Button size="sm" variant="outline" onClick={() => { setSelectedTournament(t); setRoomId(t.roomCredentials?.roomId || ''); setRoomPass(t.roomCredentials?.roomPassword || ''); }}>
                                 <Key className="h-4 w-4 mr-2" /> Update Room
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

        {activeTab === 'support' && (
          <div className="space-y-6">
             <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-black uppercase tracking-tight">AI Chat Logs</h2>
             </div>
             <Card className="bg-card/30 border-white/5">
                <Table>
                   <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>User ID</TableHead><TableHead>Message</TableHead><TableHead>AI Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                   <TableBody>
                      {supportData?.map(m => (
                        <TableRow key={m.id} className={m.isFlagged ? "bg-amber-500/5" : ""}>
                           <TableCell className="text-[10px] font-mono">{new Date(m.timestamp).toLocaleString()}</TableCell>
                           <TableCell className="font-bold text-xs">{m.userId.slice(-6)}</TableCell>
                           <TableCell className="text-xs italic max-w-md truncate">{m.message}</TableCell>
                           <TableCell>
                              {m.isFlagged ? (
                                <Badge className="bg-amber-500 text-black flex gap-1 items-center"><AlertTriangle className="h-3 w-3" /> FLAGGED</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-500 border-green-500/20">Auto-Resolved</Badge>
                              )}
                           </TableCell>
                           <TableCell><Button size="sm" variant="ghost">Reply Manually</Button></TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}
        
        {/* Placeholder views for other tabs to keep it concise */}
        {activeTab === 'dashboard' && <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <AnalyticsCard title="Total Users" value={usersData?.length || 0} icon={<UsersIcon />} color="primary" trend="Stable" />
           <AnalyticsCard title="Tournaments" value={tournamentsData?.length || 0} icon={<Trophy />} color="secondary" trend="Active" />
           <AnalyticsCard title="Issues Flagged" value={supportData?.filter(m => m.isFlagged).length || 0} icon={<AlertTriangle />} color="destructive" trend="Needs Review" />
           <AnalyticsCard title="Revenue" value={`₹${transactionsData?.filter(t => t.type === 'entry_fee').reduce((a,b) => a + b.amount, 0) || 0}`} icon={<History />} color="primary" trend="Earned" />
        </div>}
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

function AnalyticsCard({ title, value, icon, color, trend }: any) {
  const colors: any = { primary: "text-primary border-primary/20 bg-primary/10", secondary: "text-secondary border-secondary/20 bg-secondary/10", destructive: "text-destructive border-destructive/20 bg-destructive/10" };
  return (
    <Card className="bg-card/40 border-white/5 p-6">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 border", colors[color])}>{icon}</div>
      <p className="text-[10px] font-black uppercase text-muted-foreground">{title}</p>
      <h4 className="text-2xl font-black">{value}</h4>
      <Badge variant="outline" className="mt-2 opacity-50 text-[10px]">{trend}</Badge>
    </Card>
  );
}
