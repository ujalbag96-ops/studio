
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, limit, deleteDoc, increment, where } from 'firebase/firestore';
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
  Edit2,
  Trash2,
  Fingerprint,
  Radio,
  Power,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  Activity,
  ArrowUpRight,
  MoreVertical,
  Search,
  Bell,
  Coins,
  ShieldAlert,
  Globe,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, SupportMessage, GameType } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'warriors' | 'campaigns' | 'ledger' | 'control'>('overview');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [coinAdjustment, setCoinAdjustment] = useState<{ userId: string; amount: number } | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    if (countryFilter === 'All') return collection(firestore, 'users');
    return query(collection(firestore, 'users'), where('country', '==', countryFilter));
  }, [firestore, isAdminUser, countryFilter]);

  const transactionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc'), limit(50)) : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: transactionsData } = useCollection<UserLedgerEntry & { userId?: string }>(transactionsQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const [config, setConfig] = useState<Partial<AppSettings>>({});
  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Partial<Tournament> | null>(null);

  useEffect(() => {
    if (settings) setConfig(settings);
  }, [settings]);

  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    if (!firestore || !settingsRef) return;
    await setDoc(settingsRef, updates, { merge: true });
    toast({ title: "Configuration Updated" });
  };

  const handleAdjustBalance = async () => {
    if (!firestore || !coinAdjustment) return;
    const { userId, amount } = coinAdjustment;
    try {
      await updateDoc(doc(firestore, 'users', userId), {
        coins: increment(amount),
        withdrawableCoins: increment(amount)
      });
      await addDoc(collection(firestore, 'users', userId, 'ledger'), {
        type: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Administrative Balance Adjustment'
      });
      toast({ title: `Added ${amount} coins to Warrior.` });
      setCoinAdjustment(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Adjustment Failed" });
    }
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !editingTournament) return;
    
    const tournamentData = {
      ...editingTournament,
      entryFee: Number(editingTournament.entryFee || 0),
      status: editingTournament.status || 'active',
      gameType: editingTournament.gameType || 'Other',
      startDate: editingTournament.startDate || new Date().toISOString(),
      banner: editingTournament.banner || `https://picsum.photos/seed/${Math.random()}/800/400`
    };

    if (editingTournament.id) {
      await updateDoc(doc(firestore, 'tournaments', editingTournament.id), tournamentData);
    } else {
      await addDoc(collection(firestore, 'tournaments'), tournamentData);
    }
    
    setIsTournamentDialogOpen(false);
    toast({ title: "Tournament Synchronized" });
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  
  if (!isAdminUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-black">
        <ShieldCheck className="h-20 w-20 mb-6 text-destructive" />
        <h1 className="text-3xl font-black uppercase italic">Access Denied</h1>
        <p className="text-muted-foreground mt-2 uppercase text-[10px] tracking-widest">Administrative Clearance Required.</p>
      </div>
    );
  }

  const deviceMap = new Map();
  usersData?.forEach(u => { if (u.deviceId) { const list = deviceMap.get(u.deviceId) || []; list.push(u); deviceMap.set(u.deviceId, list); } });
  const violationsCount = Array.from(deviceMap.values()).filter(l => l.length > 1).length;

  const countryStats = usersData?.reduce((acc: any, u) => {
    const country = u.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  const countries = ['All', ...Object.keys(countryStats || {})];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#050508] text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0a0a0f] border-r border-border/50 hidden lg:flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 border-b border-border/50 flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-black uppercase tracking-tighter text-lg">EAGLE<span className="text-primary">EYE</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem active={activeTab === 'overview'} icon={<LayoutDashboard />} label="Dashboard" onClick={() => setActiveTab('overview')} />
          <NavItem active={activeTab === 'warriors'} icon={<UsersIcon />} label="Warriors" onClick={() => setActiveTab('warriors')} badge={violationsCount > 0 ? violationsCount : undefined} />
          <NavItem active={activeTab === 'campaigns'} icon={<Trophy />} label="Campaigns" onClick={() => setActiveTab('campaigns')} />
          <NavItem active={activeTab === 'ledger'} icon={<History />} label="Transactions" onClick={() => setActiveTab('ledger')} />
          <NavItem active={activeTab === 'control'} icon={<Settings />} label="Settings" onClick={() => setActiveTab('control')} />
        </nav>
      </aside>

      <main className="flex-1 lg:ml-64 pb-20">
        <header className="h-16 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-40 px-8 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{activeTab} sector</h2>
          <Badge variant="outline" className="text-[9px] font-black uppercase border-green-500/20 text-green-500 px-3">Master Admin Online</Badge>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} color="blue" />
              <StatCard title="Multi-Accounts" value={violationsCount} icon={<Fingerprint />} color="red" />
              <StatCard title="Campaigns" value={tournamentsData?.length || 0} icon={<Trophy />} color="orange" />
              <StatCard title="Payout Requests" value={transactionsData?.filter(t => t.status === 'pending').length || 0} icon={<DollarSign />} color="green" />
            </div>
          )}

          {activeTab === 'warriors' && (
            <div className="space-y-6">
              <Card className="p-4 border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-black uppercase">Country Hub:</span>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-48 h-9 rounded-xl">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Showing {usersData?.length || 0} warriors from {countryFilter}</p>
              </Card>

              <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="px-8 font-black uppercase text-[10px]">Warrior Sig</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Region</TableHead>
                      <TableHead className="font-black uppercase text-[10px]">Assets</TableHead>
                      <TableHead className="font-black uppercase text-[10px] text-right px-8">Operational Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.map(u => (
                      <TableRow key={u.id} className="border-border/50">
                        <TableCell className="px-8 py-4">
                          <p className="font-black text-xs uppercase">{u.email || u.id.substring(0,12)}</p>
                          <p className="text-[9px] text-muted-foreground">{u.deviceId || 'No Signature'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] font-black uppercase flex items-center gap-1 w-fit">
                            <Globe className="h-2 w-2" /> {u.country || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-sm text-secondary">{u.coins || 0} 🪙</TableCell>
                        <TableCell className="text-right px-8 space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 text-[9px] font-black uppercase"
                            onClick={() => setCoinAdjustment({ userId: u.id, amount: 100 })}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add 100
                          </Button>
                          <Button 
                            variant={u.isBanned ? "outline" : "destructive"} 
                            size="sm" 
                            className="h-8 px-4 font-black text-[9px] uppercase"
                            onClick={() => updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned })}
                          >
                            {u.isBanned ? "Restore" : "Ban"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black uppercase italic tracking-tighter">Campaign Intelligence</h3>
                <Button onClick={() => { setEditingTournament({}); setIsTournamentDialogOpen(true); }} className="rounded-xl h-11 font-black px-6"><Plus className="mr-2 h-4 w-4" /> DEPLOY NEW</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournamentsData?.map(t => (
                  <Card key={t.id} className="p-6 border-border/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Trophy className="h-12 w-12" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Badge className="bg-primary/20 text-primary border-primary/20 uppercase font-black px-3">{t.gameType}</Badge>
                        <Badge variant="outline" className="uppercase font-black text-[9px]">{t.status}</Badge>
                      </div>
                      <h4 className="text-xl font-black uppercase tracking-tight">{t.name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-bold text-muted-foreground uppercase">
                        <div>Entry: <span className="text-white">{t.entryFee} 🪙</span></div>
                        <div>Pool: <span className="text-white">{t.prizePool}</span></div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingTournament(t); setIsTournamentDialogOpen(true); }} className="flex-1 h-9 font-black text-[9px] uppercase"><Edit2 className="h-3 w-3 mr-2" /> Modify</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteDoc(doc(firestore, 'tournaments', t.id))} className="h-9 w-9 p-0"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="p-8 rounded-3xl space-y-6">
                <h3 className="text-lg font-black uppercase italic flex items-center gap-2"><TrendingUp className="text-primary" /> Economic constants</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[10px] font-black uppercase">Coin Value (Per 1.00 INR)</Label>
                    <Input type="number" value={config.coinValuePerDollar} onChange={e => setConfig({ ...config, coinValuePerDollar: Number(e.target.value) })} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase">CPA LEAD API URL</Label>
                    <Input value={config.cpaLeadUrl} onChange={e => setConfig({ ...config, cpaLeadUrl: e.target.value })} className="mt-1" />
                  </div>
                  <Button onClick={() => handleUpdateSettings({ coinValuePerDollar: config.coinValuePerDollar, cpaLeadUrl: config.cpaLeadUrl })} className="w-full h-12 font-black">SYNC ECONOMY</Button>
                </div>
              </Card>

              <Card className="p-8 rounded-3xl space-y-6">
                <h3 className="text-lg font-black uppercase italic flex items-center gap-2"><Power className="text-destructive" /> Maintenance Protocol</h3>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <div>
                      <p className="text-xs font-black uppercase">Arena Lockdown</p>
                      <p className="text-[9px] text-muted-foreground uppercase italic">Prevent user access for updates</p>
                    </div>
                    <Switch checked={config.maintenanceMode} onCheckedChange={val => handleUpdateSettings({ maintenanceMode: val })} />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase">Monetization Toggles</Label>
                    <div className="grid gap-3">
                       <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                          <span className="text-[10px] font-black uppercase">Offer Wall</span>
                          <Switch checked={config.offerWallEnabled} onCheckedChange={val => handleUpdateSettings({ offerWallEnabled: val })} />
                       </div>
                       <div className="flex items-center justify-between p-3 bg-muted/20 rounded-xl">
                          <span className="text-[10px] font-black uppercase">Video Ads</span>
                          <Switch checked={config.videoWallEnabled} onCheckedChange={val => handleUpdateSettings({ videoWallEnabled: val })} />
                       </div>
                    </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Adjustment Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="rounded-3xl">
            <DialogHeader><DialogTitle className="text-xl font-black uppercase">Adjust Balance</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Amount of Coins</Label>
                <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} />
              </div>
              <Button onClick={handleAdjustBalance} className="w-full h-12 font-black uppercase">EXECUTE TRANSFER</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Tournament Dialog */}
      <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
        <DialogContent className="rounded-3xl max-w-lg">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase italic">Campaign Intelligence</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveTournament} className="space-y-6 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase">Campaign Name</Label>
              <Input value={editingTournament?.name} onChange={e => setEditingTournament({...editingTournament!, name: e.target.value})} placeholder="e.g. Pro Battle Series" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Game Category</Label>
                <Select value={editingTournament?.gameType} onValueChange={val => setEditingTournament({...editingTournament!, gameType: val as GameType})}>
                   <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Select Game" />
                   </SelectTrigger>
                   <SelectContent>
                      <SelectItem value="BGMI">BGMI</SelectItem>
                      <SelectItem value="Free Fire">Free Fire</SelectItem>
                      <SelectItem value="Ludo King">Ludo King</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase">Entry (Coins)</Label>
                <Input type="number" value={editingTournament?.entryFee} onChange={e => setEditingTournament({...editingTournament!, entryFee: Number(e.target.value)})} placeholder="50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase">Prize Pool</Label>
              <Input value={editingTournament?.prizePool} onChange={e => setEditingTournament({...editingTournament!, prizePool: e.target.value})} placeholder="₹5,000" />
            </div>
            <Button type="submit" className="w-full h-14 bg-primary font-black uppercase rounded-xl">DEPLOY CAMPAIGN</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavItem({ active, icon, label, onClick, badge }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all", active ? "bg-primary text-white font-bold" : "text-muted-foreground hover:bg-muted/50")}>
      <div className="flex items-center gap-3">
        <span className="h-4 w-4">{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      </div>
      {badge && <span className="h-5 w-5 bg-destructive text-white rounded-md text-[8px] flex items-center justify-center font-black">{badge}</span>}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap = { blue: "bg-blue-500", red: "bg-red-500", orange: "bg-primary", green: "bg-green-500" };
  return (
    <Card className="border-border/50 shadow-sm p-6 rounded-2xl flex items-center justify-between group transition-all hover:-translate-y-1">
       <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground">{title}</p>
          <h4 className="text-2xl font-black">{value}</h4>
       </div>
       <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white", colorMap[color as keyof typeof colorMap])}>
          {icon}
       </div>
    </Card>
  );
}
