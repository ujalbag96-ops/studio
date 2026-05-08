
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
  Power,
  DollarSign,
  Globe,
  Filter,
  Coins,
  ShieldAlert,
  ArrowRight
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
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, GameType } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'warriors' | 'campaigns' | 'control'>('overview');
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
      const uRef = doc(firestore, 'users', userId);
      updateDoc(uRef, {
        coins: increment(amount),
        withdrawableCoins: increment(amount)
      });
      addDoc(collection(firestore, 'users', userId, 'ledger'), {
        type: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: 'Administrative Credit Adjustment'
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

  const countryStats = usersData?.reduce((acc: any, u) => {
    const country = u.country || 'Unknown';
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {});

  const countries = ['All', ...Object.keys(countryStats || {})];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#050508] text-foreground">
      {/* Professional Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0a0a0f] border-r border-border/50 hidden lg:flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 border-b border-border/50 flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-black uppercase tracking-tighter text-lg">EAGLE<span className="text-primary">EYE</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem active={activeTab === 'overview'} icon={<LayoutDashboard />} label="Dashboard" onClick={() => setActiveTab('overview')} />
          <NavItem active={activeTab === 'warriors'} icon={<UsersIcon />} label="Warriors Hub" onClick={() => setActiveTab('warriors')} />
          <NavItem active={activeTab === 'campaigns'} icon={<Trophy />} label="Campaigns" onClick={() => setActiveTab('campaigns')} />
          <NavItem active={activeTab === 'control'} icon={<Settings />} label="Control Sector" onClick={() => setActiveTab('control')} />
        </nav>
      </aside>

      <main className="flex-1 lg:ml-64 pb-20">
        <header className="h-16 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-40 px-8 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{activeTab} sector</h2>
          <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary px-3">Master Admin Online</Badge>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} color="blue" />
              <StatCard title="Global Regions" value={Object.keys(countryStats || {}).length} icon={<Globe />} color="green" />
              <StatCard title="Active Campaigns" value={tournamentsData?.length || 0} icon={<Trophy />} color="orange" />
              <StatCard title="Pending Payouts" value={transactionsData?.filter(t => t.status === 'pending').length || 0} icon={<DollarSign />} color="red" />
            </div>
          )}

          {activeTab === 'warriors' && (
            <div className="space-y-6">
              <Card className="p-4 border-border/50 flex items-center justify-between rounded-2xl bg-white/5 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Region Hub:</span>
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
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">Showing {usersData?.length || 0} warriors from {countryFilter}</p>
              </Card>

              <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="px-8 font-black uppercase text-[10px] tracking-widest">Warrior Sig</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Region</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">Assets</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-right px-8">Operational Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.map(u => (
                      <TableRow key={u.id} className="border-border/50 hover:bg-muted/30">
                        <TableCell className="px-8 py-6">
                          <p className="font-black text-xs uppercase text-white">{u.email || u.id.substring(0,12)}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">{u.deviceId || 'No Digital Signature'}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[9px] font-black uppercase flex items-center gap-1 w-fit border-white/10">
                            <Globe className="h-2 w-2" /> {u.country || 'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-sm text-secondary">{u.coins || 0} 🪙</TableCell>
                        <TableCell className="text-right px-8 space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 text-[9px] font-black uppercase border-primary/20 text-primary hover:bg-primary/10"
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
                <Button onClick={() => { setEditingTournament({}); setIsTournamentDialogOpen(true); }} className="rounded-xl h-11 font-black px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"><Plus className="mr-2 h-4 w-4" /> DEPLOY NEW CAMPAIGN</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournamentsData?.map(t => (
                  <Card key={t.id} className="p-6 border-white/5 bg-white/5 backdrop-blur-3xl rounded-[2rem] relative overflow-hidden group hover:border-primary/40 transition-all">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Badge className="bg-primary/20 text-primary border-primary/20 uppercase font-black px-3">{t.gameType}</Badge>
                        <Badge variant="outline" className="uppercase font-black text-[9px] border-white/10">{t.status}</Badge>
                      </div>
                      <h4 className="text-xl font-black uppercase tracking-tight text-white italic">{t.name}</h4>
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <div>Entry: <span className="text-secondary">{t.entryFee} 🪙</span></div>
                        <div>Pool: <span className="text-accent">{t.prizePool}</span></div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => { setEditingTournament(t); setIsTournamentDialogOpen(true); }} className="flex-1 h-9 font-black text-[9px] uppercase border-white/10 hover:bg-white/5"><Edit2 className="h-3 w-3 mr-2" /> Modify</Button>
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
              <Card className="p-8 rounded-[3rem] bg-white/5 border-white/5 space-y-6 backdrop-blur-3xl shadow-2xl">
                <h3 className="text-lg font-black uppercase italic flex items-center gap-2"><TrendingUp className="text-primary" /> Economic Constants</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Coin Value (Per 1.00 USD/₹ Equivalent)</Label>
                    <Input type="number" value={config.coinValuePerDollar} onChange={e => setConfig({ ...config, coinValuePerDollar: Number(e.target.value) })} className="mt-1 bg-black/40 border-white/10 h-12 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">CPA Lead API URL</Label>
                    <Input value={config.cpaLeadUrl} onChange={e => setConfig({ ...config, cpaLeadUrl: e.target.value })} className="mt-1 bg-black/40 border-white/10 h-12 rounded-xl" />
                  </div>
                  <Button onClick={() => handleUpdateSettings({ coinValuePerDollar: config.coinValuePerDollar, cpaLeadUrl: config.cpaLeadUrl })} className="w-full h-12 font-black uppercase tracking-widest bg-primary shadow-xl shadow-primary/20">SYNC GLOBAL ECONOMY</Button>
                </div>
              </Card>

              <Card className="p-8 rounded-[3rem] bg-white/5 border-white/5 space-y-6 backdrop-blur-3xl shadow-2xl">
                <h3 className="text-lg font-black uppercase italic flex items-center gap-2"><Power className="text-destructive" /> Maintenance Protocol</h3>
                <div className="flex items-center justify-between p-5 bg-black/40 rounded-[1.5rem] border border-white/10">
                    <div>
                      <p className="text-xs font-black uppercase text-white">Arena Lockdown</p>
                      <p className="text-[9px] text-muted-foreground uppercase italic font-bold">Prevent user access for system updates</p>
                    </div>
                    <Switch checked={config.maintenanceMode} onCheckedChange={val => handleUpdateSettings({ maintenanceMode: val })} />
                </div>
                <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Monetization Toggles</Label>
                    <div className="grid gap-3">
                       <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-[10px] font-black uppercase text-white">Elite Offer Wall</span>
                          <Switch checked={config.offerWallEnabled} onCheckedChange={val => handleUpdateSettings({ offerWallEnabled: val })} />
                       </div>
                       <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                          <span className="text-[10px] font-black uppercase text-white">Global Video Ads</span>
                          <Switch checked={config.videoWallEnabled} onCheckedChange={val => handleUpdateSettings({ videoWallEnabled: val })} />
                       </div>
                    </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Manual Balance Adjustment Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="rounded-[2.5rem] bg-[#121216] border-white/10 text-white">
            <DialogHeader><DialogTitle className="text-xl font-black uppercase italic">Adjust Warrior Asset</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Coins to Credit (Use negative for debit)</Label>
                <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="bg-black/40 h-14 rounded-xl text-xl font-black" />
              </div>
              <Button onClick={handleAdjustBalance} className="w-full h-14 bg-secondary text-secondary-foreground font-black uppercase tracking-widest rounded-xl shadow-xl shadow-secondary/20">EXECUTE CREDIT TRANSFER</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Tournament Deployment Dialog */}
      <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
        <DialogContent className="rounded-[2.5rem] bg-[#121216] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase italic tracking-tighter">Campaign Intelligence</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveTournament} className="space-y-6 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Campaign Name</Label>
              <Input value={editingTournament?.name} onChange={e => setEditingTournament({...editingTournament!, name: e.target.value})} placeholder="e.g. Pro Battle Series" className="bg-black/40 border-white/10 h-12 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Game Category</Label>
                <Select value={editingTournament?.gameType} onValueChange={val => setEditingTournament({...editingTournament!, gameType: val as GameType})}>
                   <SelectTrigger className="h-12 rounded-xl bg-black/40 border-white/10">
                      <SelectValue placeholder="Select Game" />
                   </SelectTrigger>
                   <SelectContent className="bg-[#121216] border-white/10">
                      <SelectItem value="BGMI">BGMI</SelectItem>
                      <SelectItem value="Free Fire">Free Fire</SelectItem>
                      <SelectItem value="Ludo King">Ludo King</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                   </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Entry (Coins)</Label>
                <Input type="number" value={editingTournament?.entryFee} onChange={e => setEditingTournament({...editingTournament!, entryFee: Number(e.target.value)})} placeholder="50" className="bg-black/40 border-white/10 h-12 rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Prize Pool</Label>
                  <Input value={editingTournament?.prizePool} onChange={e => setEditingTournament({...editingTournament!, prizePool: e.target.value})} placeholder="₹5,000" className="bg-black/40 border-white/10 h-12 rounded-xl" />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Status</Label>
                  <Select value={editingTournament?.status} onValueChange={val => setEditingTournament({...editingTournament!, status: val as any})}>
                     <SelectTrigger className="h-12 rounded-xl bg-black/40 border-white/10">
                        <SelectValue placeholder="Status" />
                     </SelectTrigger>
                     <SelectContent className="bg-[#121216] border-white/10">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                     </SelectContent>
                  </Select>
               </div>
            </div>
            <Button type="submit" className="w-full h-16 bg-primary font-black uppercase tracking-widest rounded-xl text-lg shadow-xl shadow-primary/20">DEPLOY CAMPAIGN TO ARENA</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 relative group", active ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      <span className={cn("h-5 w-5 transition-transform", active ? "scale-110 rotate-3" : "group-hover:scale-110")}>{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{label}</span>
      {active && <div className="absolute left-2 h-6 w-1 bg-white rounded-full opacity-60" />}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap = { blue: "bg-blue-600", red: "bg-destructive", orange: "bg-primary", green: "bg-secondary" };
  return (
    <Card className="bg-white/5 border-white/5 backdrop-blur-3xl shadow-xl p-8 rounded-[2.5rem] flex items-center justify-between group transition-all hover:scale-[1.03] hover:border-white/10">
       <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">{title}</p>
          <h4 className="text-3xl font-black text-white italic tracking-tighter">{value}</h4>
       </div>
       <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all group-hover:rotate-12", colorMap[color as keyof typeof colorMap])}>
          {icon}
       </div>
    </Card>
  );
}
