
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { 
  LayoutDashboard, 
  Users as UsersIcon, 
  Trophy, 
  Settings, 
  ShieldCheck, 
  Plus,
  History,
  Wrench,
  Loader2,
  TrendingUp,
  Zap,
  Sword,
  Edit2,
  Trash2,
  Fingerprint,
  Radio,
  Power,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, UserLedgerEntry, Match, Tournament } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tournaments' | 'matches' | 'transactions' | 'control' | 'repair'>('dashboard');
  const [isRepairing, setIsRepairing] = useState(false);

  // Identity check
  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const transactionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc')) : null, [firestore, isAdminUser]);
  const matchesQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'matches') : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: transactionsData } = useCollection<UserLedgerEntry & { userId?: string }>(transactionsQuery);
  const { data: matchesData } = useCollection<Match>(matchesQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  // Control Center States
  const [config, setConfig] = useState<Partial<AppSettings>>({});
  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Partial<Tournament> | null>(null);

  useEffect(() => {
    if (settings) setConfig(settings);
  }, [settings]);

  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, updates, { merge: true });
      toast({ title: "Global Intel Updated" });
    } catch (e: any) { 
      toast({ variant: "destructive", title: "Update Failed", description: e.message }); 
    }
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !editingTournament) return;
    try {
      if (editingTournament.id) {
        await setDoc(doc(firestore, 'tournaments', editingTournament.id), editingTournament, { merge: true });
      } else {
        await addDoc(collection(firestore, 'tournaments'), { 
          ...editingTournament, 
          status: 'active', 
          entryFee: Number(editingTournament.entryFee || 0),
          startDate: new Date().toISOString()
        });
      }
      setIsTournamentDialogOpen(false);
      toast({ title: "Campaign Synchronized" });
    } catch (e) { toast({ variant: "destructive", title: "Action Failed" }); }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center text-white bg-black"><ShieldCheck className="h-16 w-16 mb-4 text-destructive" /><h1 className="text-2xl font-black uppercase italic">Access Denied</h1><p className="text-muted-foreground mt-2 font-medium">Restricted to {ADMIN_EMAIL}.</p></div>;

  const deviceMap = new Map();
  usersData?.forEach(u => { if (u.deviceId) { const list = deviceMap.get(u.deviceId) || []; list.push(u); deviceMap.set(u.deviceId, list); } });

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      {/* Side Command Rail */}
      <aside className="w-64 border-r border-white/5 bg-card/10 backdrop-blur-2xl hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-black uppercase tracking-tighter text-xl italic">Command</span>
        </div>
        <nav className="flex-1 p-6 space-y-2 mt-4">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Intelligence" />
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="Warriors" />
          <SidebarItem active={activeTab === 'tournaments'} onClick={() => setActiveTab('tournaments')} icon={<Trophy />} label="Campaigns" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Ledger" />
          <SidebarItem active={activeTab === 'control'} onClick={() => setActiveTab('control')} icon={<Settings />} label="Control Sector" />
          <div className="pt-8 opacity-50">
            <SidebarItem active={activeTab === 'repair'} onClick={() => setActiveTab('repair')} icon={<Wrench className="text-amber-500" />} label="System Restore" />
          </div>
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-6 md:p-12 space-y-10 pb-32">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
             <h1 className="text-5xl font-black uppercase tracking-tighter italic">Command <span className="text-primary">Center</span></h1>
             <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-[10px]">Session: {ADMIN_EMAIL}</p>
           </div>
           {config.maintenanceMode && <Badge variant="destructive" className="animate-pulse h-10 px-6 font-black uppercase tracking-widest rounded-xl">Maintenance Active</Badge>}
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatsCard title="Warriors" value={usersData?.length || 0} icon={<UsersIcon />} />
            <StatsCard title="Violations" value={Array.from(deviceMap.values()).filter(l => l.length > 1).length} icon={<Fingerprint className="text-red-500" />} color="destructive" />
            <StatsCard title="Campaigns" value={tournamentsData?.length || 0} icon={<Trophy />} />
            <StatsCard title="Pending Payouts" value={transactionsData?.filter(t => t.status === 'pending' && t.type === 'withdrawal').length || 0} icon={<History />} color="secondary" />
          </div>
        )}

        {activeTab === 'control' && (
          <div className="max-w-4xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-card/20 border-white/5 rounded-[2.5rem] p-10 space-y-8">
                <h3 className="text-xl font-black uppercase italic flex items-center gap-3">
                  <TrendingUp className="text-primary" /> Economics
                </h3>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Coin Value per $ (CPA Base)</Label>
                    <Input type="number" value={config.coinValuePerDollar} onChange={e => handleUpdateSettings({ coinValuePerDollar: Number(e.target.value) })} className="bg-black/40 h-14 rounded-2xl border-white/5 font-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-40">Admin Profit Margin %</Label>
                    <Input type="number" value={config.adminProfitPercentage} onChange={e => handleUpdateSettings({ adminProfitPercentage: Number(e.target.value) })} className="bg-black/40 h-14 rounded-2xl border-white/5 font-black" />
                  </div>
                </div>
              </Card>

              <Card className="bg-card/20 border-white/5 rounded-[2.5rem] p-10 space-y-8">
                <h3 className="text-xl font-black uppercase italic flex items-center gap-3">
                  <Radio className="text-secondary" /> Intel Hubs
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase">Video Wall</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Enable Video Ads</p>
                    </div>
                    <Switch checked={config.videoWallEnabled} onCheckedChange={val => handleUpdateSettings({ videoWallEnabled: val })} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase">Offer Wall</p>
                      <p className="text-[9px] text-muted-foreground uppercase">Enable CPA missions</p>
                    </div>
                    <Switch checked={config.offerWallEnabled} onCheckedChange={val => handleUpdateSettings({ offerWallEnabled: val })} />
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-card/20 border-white/5 rounded-[2.5rem] p-10 space-y-6">
              <h3 className="text-xl font-black uppercase italic">Master Intel Feed (CPALead API)</h3>
              <p className="text-xs text-muted-foreground font-medium">Connect your global CPA network by providing the JSON feed URL.</p>
              <Input value={config.cpaLeadUrl} onChange={e => setConfig({ ...config, cpaLeadUrl: e.target.value })} placeholder="https://cpalead.com/dashboard/reports/campaign_json.php?..." className="bg-black/40 h-14 rounded-2xl border-white/5" />
              <Button onClick={() => handleUpdateSettings({ cpaLeadUrl: config.cpaLeadUrl })} className="w-full h-14 font-black uppercase tracking-widest bg-primary">SYNC GLOBAL FEED</Button>
            </Card>

            <div className="flex items-center justify-between p-10 bg-destructive/5 rounded-[2.5rem] border border-destructive/20">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase italic text-destructive">Maintenance Protocol</h3>
                <p className="text-xs text-muted-foreground font-medium">Temporarily disable arena access for all warriors.</p>
              </div>
              <Switch checked={config.maintenanceMode} onCheckedChange={val => handleUpdateSettings({ maintenanceMode: val })} />
            </div>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase italic">Campaign Deployment</h3>
              <Button onClick={() => { setEditingTournament({ name: '', prizePool: '', entryFee: 0, gameType: 'BGMI' }); setIsTournamentDialogOpen(true); }} className="bg-primary rounded-xl font-black">
                <Plus className="mr-2 h-4 w-4" /> DEPLOY NEW
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournamentsData?.map(t => (
                <Card key={t.id} className="bg-card/20 border-white/5 p-6 rounded-3xl flex items-center justify-between group">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-lg uppercase italic leading-none">{t.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{t.gameType} • {t.prizePool}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingTournament(t); setIsTournamentDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="icon" variant="destructive" onClick={() => deleteDoc(doc(firestore, 'tournaments', t.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card className="bg-card/10 border-white/5 rounded-[2.5rem] overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="px-8">Warrior</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right px-8">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionsData?.map(t => (
                  <TableRow key={t.id} className="border-white/5 hover:bg-white/5">
                    <TableCell className="px-8 font-black uppercase text-[10px]">{t.userId?.substring(0,8)}...</TableCell>
                    <TableCell className="capitalize text-[10px] font-bold">{t.type}</TableCell>
                    <TableCell className="font-black text-secondary">₹{t.amount}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className="uppercase text-[8px]">
                        {t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      {t.status === 'pending' && (
                        <Button size="sm" onClick={() => updateDoc(doc(firestore, 'users', t.userId!, 'ledger', t.id), { status: 'completed' })} className="rounded-xl h-9 px-6 bg-green-600 font-black uppercase text-[10px]">
                          PAID
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {activeTab === 'repair' && (
          <Card className="max-w-xl mx-auto bg-amber-500/5 border-amber-500/20 rounded-[2.5rem] p-12 text-center space-y-8">
            <Wrench className="h-16 w-16 text-amber-500 mx-auto animate-pulse" />
            <div className="space-y-4">
              <h2 className="text-4xl font-black uppercase italic">System Restore</h2>
              <p className="text-muted-foreground font-medium text-sm">Forces synchronization of admin credentials and resets core app settings to default recovery state.</p>
            </div>
            <Button onClick={async () => {
              setIsRepairing(true);
              try {
                await setDoc(doc(firestore, 'settings', 'global'), {
                  maintenanceMode: false,
                  coinValuePerDollar: 100,
                  adminProfitPercentage: 50,
                  withdrawalGateways: ['UPI', 'Paytm', 'Google Pay'],
                  videoWallEnabled: true,
                  offerWallEnabled: true,
                  cpaLeadUrl: ''
                }, { merge: true });
                toast({ title: "Protocol Restored" });
              } catch (e) { toast({ variant: "destructive", title: "Repair Failed" }); } finally { setIsRepairing(false); }
            }} disabled={isRepairing} className="w-full h-16 bg-amber-500 text-black font-black text-lg rounded-2xl">
              {isRepairing ? <Loader2 className="animate-spin" /> : "EXECUTE RESTORATION"}
            </Button>
          </Card>
        )}
      </main>

      {/* Tournament Dialog */}
      <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
        <DialogContent className="bg-[#121216] border-white/5 text-white rounded-[2rem] p-8 max-w-lg">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">Campaign Config</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveTournament} className="space-y-6 pt-4">
            <Input value={editingTournament?.name} onChange={e => setEditingTournament({...editingTournament!, name: e.target.value})} placeholder="Tournament Name" className="bg-black/40 h-14 rounded-2xl border-white/5" />
            <div className="grid grid-cols-2 gap-4">
              <Input value={editingTournament?.prizePool} onChange={e => setEditingTournament({...editingTournament!, prizePool: e.target.value})} placeholder="Prize Pool (e.g. ₹1000)" className="bg-black/40 h-14 rounded-2xl border-white/5" />
              <Input type="number" value={editingTournament?.entryFee} onChange={e => setEditingTournament({...editingTournament!, entryFee: Number(e.target.value)})} placeholder="Entry Fee (Coins)" className="bg-black/40 h-14 rounded-2xl border-white/5" />
            </div>
            <Select value={editingTournament?.gameType} onValueChange={val => setEditingTournament({...editingTournament!, gameType: val as any})}>
              <SelectTrigger className="bg-black/40 h-14 rounded-2xl border-white/5"><SelectValue placeholder="Game Type" /></SelectTrigger>
              <SelectContent className="bg-[#121216] border-white/5">
                <SelectItem value="BGMI">BGMI</SelectItem>
                <SelectItem value="Free Fire">Free Fire</SelectItem>
                <SelectItem value="Ludo King">Ludo King</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full h-16 bg-primary font-black uppercase text-lg rounded-2xl shadow-xl">DEPLOY CAMPAIGN</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 text-left", active ? "bg-primary text-white font-black shadow-xl" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      <span className={cn("h-5 w-5", active && "animate-pulse")}>{icon}</span>
      <span className="text-[11px] font-black uppercase tracking-widest italic">{label}</span>
    </button>
  );
}

function StatsCard({ title, value, icon, color = "primary" }: any) {
  const colorMap = {
    primary: "border-primary/20 text-primary bg-primary/5",
    secondary: "border-secondary/20 text-secondary bg-secondary/5",
    destructive: "border-red-500/20 text-red-500 bg-red-500/5"
  };

  return (
    <Card className={cn("bg-card/40 border-white/5 p-8 rounded-[2rem] transition-all hover:scale-[1.05] duration-500", colorMap[color as keyof typeof colorMap])}>
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center mb-4 border", colorMap[color as keyof typeof colorMap])}>{icon}</div>
      <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-40 mb-1">{title}</p>
      <h4 className="text-4xl font-black text-white italic">{value}</h4>
    </Card>
  );
}
