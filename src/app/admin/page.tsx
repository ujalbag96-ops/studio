
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, limit, deleteDoc } from 'firebase/firestore';
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
  CheckCircle2
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
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, SupportMessage } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'warriors' | 'campaigns' | 'ledger' | 'control'>('overview');
  const [isRepairing, setIsRepairing] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const transactionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc'), limit(50)) : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const supportQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'support'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: transactionsData } = useCollection<UserLedgerEntry & { userId?: string }>(transactionsQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: supportData } = useCollection<SupportMessage>(supportQuery);
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
    toast({ title: "System Configuration Updated" });
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !editingTournament) return;
    
    const tournamentData = {
      ...editingTournament,
      entryFee: Number(editingTournament.entryFee || 0),
      status: editingTournament.status || 'active',
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

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  
  if (!isAdminUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-black">
        <ShieldCheck className="h-20 w-20 mb-6 text-destructive" />
        <h1 className="text-3xl font-black uppercase italic">Access Denied</h1>
        <p className="text-muted-foreground mt-2 uppercase text-[10px] tracking-widest">Administrative clearance required.</p>
      </div>
    );
  }

  const deviceMap = new Map();
  usersData?.forEach(u => { if (u.deviceId) { const list = deviceMap.get(u.deviceId) || []; list.push(u); deviceMap.set(u.deviceId, list); } });
  const violationsCount = Array.from(deviceMap.values()).filter(l => l.length > 1).length;

  const chartData = [
    { name: 'BGMI', count: tournamentsData?.filter(t => t.gameType === 'BGMI').length || 0 },
    { name: 'Free Fire', count: tournamentsData?.filter(t => t.gameType === 'Free Fire').length || 0 },
    { name: 'Ludo King', count: tournamentsData?.filter(t => t.gameType === 'Ludo King').length || 0 },
  ];

  return (
    <div className="flex min-h-screen bg-[#f8fafc] dark:bg-[#050508] text-foreground transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0a0a0f] border-r border-border/50 hidden lg:flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 border-b border-border/50 flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-black uppercase tracking-tighter text-lg">EAGLE<span className="text-primary">EYE</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem active={activeTab === 'overview'} icon={<LayoutDashboard />} label="Operational Hub" onClick={() => setActiveTab('overview')} />
          <NavItem active={activeTab === 'warriors'} icon={<UsersIcon />} label="Warrior Sector" onClick={() => setActiveTab('warriors')} badge={violationsCount > 0 ? violationsCount : undefined} />
          <NavItem active={activeTab === 'campaigns'} icon={<Trophy />} label="Campaign Center" onClick={() => setActiveTab('campaigns')} />
          <NavItem active={activeTab === 'ledger'} icon={<History />} label="Financial Ledger" onClick={() => setActiveTab('ledger')} />
          <NavItem active={activeTab === 'control'} icon={<Settings />} label="Control Center" onClick={() => setActiveTab('control')} />
        </nav>

        <div className="p-6 border-t border-border/50">
           <div className="bg-muted/50 rounded-2xl p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-xs">A</div>
              <div className="truncate">
                <p className="text-[9px] font-black uppercase text-muted-foreground">Master Admin</p>
                <p className="text-[10px] font-bold truncate">ujalbag96@gmail.com</p>
              </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 pb-20">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-[#0a0a0f]/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-40 px-8 flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">{activeTab} sector</h2>
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="rounded-xl"><Search className="h-4 w-4" /></Button>
             <Button variant="ghost" size="icon" className="rounded-xl"><Bell className="h-4 w-4" /></Button>
             <div className="h-4 w-px bg-border/50 mx-2" />
             <Badge variant="outline" className="text-[9px] font-black uppercase border-green-500/20 text-green-500 px-3">System Online</Badge>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} color="blue" />
                <StatCard title="Multi-Accounts" value={violationsCount} icon={<Fingerprint />} color="red" />
                <StatCard title="Active Campaigns" value={tournamentsData?.length || 0} icon={<Trophy />} color="orange" />
                <StatCard title="Pending Payouts" value={transactionsData?.filter(t => t.status === 'pending').length || 0} icon={<DollarSign />} color="green" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-border/50 shadow-sm rounded-3xl overflow-hidden">
                  <CardHeader className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Tournament Distribution</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="p-6 h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ borderRadius: '12px', border: 'none', background: '#1a1a1a', color: '#fff' }} />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden flex flex-col">
                  <CardHeader className="p-6 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Recent Intel</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 flex-1 overflow-y-auto space-y-4 no-scrollbar">
                    {supportData?.map(msg => (
                      <div key={msg.id} className="flex gap-3">
                         <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <MessageSquare className="h-4 w-4 text-primary" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase">{msg.userId.substring(0,8)}...</p>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 italic">{msg.message}</p>
                         </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'warriors' && (
            <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-8 font-black uppercase text-[10px]">Warrior ID / Email</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Security Signature</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Asset Value</TableHead>
                    <TableHead className="font-black uppercase text-[10px] text-right px-8">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.map(u => (
                    <TableRow key={u.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="px-8 py-4">
                        <div className="space-y-0.5">
                          <p className="font-black text-xs uppercase">{u.email || u.id.substring(0,12)}</p>
                          <p className="text-[9px] text-muted-foreground">Joined: {u.id.substring(0,8)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold text-muted-foreground">{u.deviceId || 'Unknown Sig'}</TableCell>
                      <TableCell className="font-black text-sm text-secondary">{u.coins || 0} 🪙</TableCell>
                      <TableCell className="text-right px-8">
                        <Button 
                          variant={u.isBanned ? "outline" : "destructive"} 
                          size="sm" 
                          className="rounded-xl h-8 px-4 font-black text-[9px] uppercase tracking-widest"
                          onClick={() => updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned })}
                        >
                          {u.isBanned ? "Restore" : "Exclude"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Campaign Deployment</h3>
                <Button onClick={() => { setEditingTournament({ name: '', prizePool: '', entryFee: 0, gameType: 'BGMI' }); setIsTournamentDialogOpen(true); }} className="bg-primary rounded-2xl h-12 font-black px-8">
                  <Plus className="mr-2 h-4 w-4" /> DEPLOY CAMPAIGN
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournamentsData?.map(t => (
                  <Card key={t.id} className="border-border/50 shadow-sm p-6 rounded-3xl flex items-center justify-between transition-all hover:scale-[1.01]">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                        <Trophy className="h-6 w-6 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-black text-base uppercase italic">{t.name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t.gameType} • {t.prizePool} • {t.entryFee} 🪙</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl" onClick={() => { setEditingTournament(t); setIsTournamentDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => deleteDoc(doc(firestore, 'tournaments', t.id))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ledger' && (
            <Card className="border-border/50 shadow-sm rounded-3xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-8 font-black uppercase text-[10px]">Warrior Sig</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Type</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Amount</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="text-right px-8 font-black uppercase text-[10px]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsData?.map(t => (
                    <TableRow key={t.id} className="border-border/50 hover:bg-muted/30">
                      <TableCell className="px-8 py-4 font-black text-[10px] text-muted-foreground italic">{t.userId?.substring(0,12)}...</TableCell>
                      <TableCell className="capitalize text-[10px] font-black">{t.type}</TableCell>
                      <TableCell className="font-black text-sm">₹{t.amount}</TableCell>
                      <TableCell><Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className="text-[8px] font-black uppercase">{t.status}</Badge></TableCell>
                      <TableCell className="text-right px-8">
                        {t.status === 'pending' && (
                          <Button size="sm" onClick={() => updateDoc(doc(firestore, 'users', t.userId!, 'ledger', t.id), { status: 'completed' })} className="rounded-xl h-8 px-4 bg-green-600 font-black text-[9px] uppercase">APPROVE</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}

          {activeTab === 'control' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-border/50 shadow-sm rounded-3xl p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-primary h-5 w-5" />
                  <h3 className="text-lg font-black uppercase italic">Economic Constants</h3>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Coin Value (Per 1.00 INR)</Label>
                    <Input type="number" value={config.coinValuePerDollar} onChange={e => setConfig({ ...config, coinValuePerDollar: Number(e.target.value) })} className="bg-muted/50 border-none rounded-xl h-12 font-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Admin Profit (%)</Label>
                    <Input type="number" value={config.adminProfitPercentage} onChange={e => setConfig({ ...config, adminProfitPercentage: Number(e.target.value) })} className="bg-muted/50 border-none rounded-xl h-12 font-black" />
                  </div>
                  <Button onClick={() => handleUpdateSettings({ coinValuePerDollar: config.coinValuePerDollar, adminProfitPercentage: config.adminProfitPercentage })} className="w-full h-12 bg-primary font-black uppercase rounded-xl">SYNC DATA</Button>
                </div>
              </Card>

              <Card className="border-border/50 shadow-sm rounded-3xl p-8 space-y-8">
                <div className="flex items-center gap-3">
                  <Radio className="text-primary h-5 w-5" />
                  <h3 className="text-lg font-black uppercase italic">Monetization Hub</h3>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <div>
                      <p className="text-xs font-black uppercase">Video Ads</p>
                      <p className="text-[9px] text-muted-foreground uppercase italic">Toggle rewards wall</p>
                    </div>
                    <Switch checked={config.videoWallEnabled} onCheckedChange={val => handleUpdateSettings({ videoWallEnabled: val })} />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <div>
                      <p className="text-xs font-black uppercase">CPA Offer Wall</p>
                      <p className="text-[9px] text-muted-foreground uppercase italic">Toggle network feed</p>
                    </div>
                    <Switch checked={config.offerWallEnabled} onCheckedChange={val => handleUpdateSettings({ offerWallEnabled: val })} />
                  </div>
                </div>
              </Card>

              <Card className="md:col-span-2 border-border/50 shadow-sm rounded-3xl p-8 space-y-6">
                <h3 className="text-lg font-black uppercase italic flex items-center gap-3"><Zap className="text-amber-500 h-5 w-5" /> CPA Lead JSON URL</h3>
                <div className="flex gap-4">
                  <Input value={config.cpaLeadUrl} onChange={e => setConfig({ ...config, cpaLeadUrl: e.target.value })} placeholder="Enter CPALead report JSON URL..." className="bg-muted/50 border-none rounded-xl h-12 flex-1 font-medium" />
                  <Button onClick={() => handleUpdateSettings({ cpaLeadUrl: config.cpaLeadUrl })} className="h-12 px-8 bg-primary rounded-xl font-black uppercase">DEPLOY FEED</Button>
                </div>
              </Card>

              <Card className="md:col-span-2 bg-destructive/5 border-destructive/20 border rounded-3xl p-8 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center"><Power className="text-destructive h-6 w-6" /></div>
                   <div>
                      <h4 className="text-lg font-black uppercase text-destructive italic">Maintenance Protocol</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global arena lock for system updates.</p>
                   </div>
                </div>
                <Switch checked={config.maintenanceMode} onCheckedChange={val => handleUpdateSettings({ maintenanceMode: val })} />
              </Card>

              <div className="md:col-span-2 pt-4">
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
                      toast({ title: "System Recovered to Defaults" });
                    } catch (e) { toast({ variant: "destructive", title: "Recovery Failed" }); } finally { setIsRepairing(false); }
                  }} disabled={isRepairing} variant="outline" className="w-full h-12 rounded-xl border-amber-500/20 text-amber-500 font-black uppercase tracking-widest hover:bg-amber-500/10">
                    {isRepairing ? <Loader2 className="animate-spin h-4 w-4" /> : "EXECUTE SYSTEM RECOVERY"}
                 </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Deployment Dialog */}
      <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#121216] border-none rounded-[2rem] p-10 max-w-lg shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Campaign Intelligence</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveTournament} className="space-y-6 pt-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Campaign Name</Label>
              <Input value={editingTournament?.name} onChange={e => setEditingTournament({...editingTournament!, name: e.target.value})} placeholder="e.g. Pro Battle Series" className="bg-muted/50 border-none h-12 rounded-xl font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Prize Pool</Label>
                <Input value={editingTournament?.prizePool} onChange={e => setEditingTournament({...editingTournament!, prizePool: e.target.value})} placeholder="₹5,000" className="bg-muted/50 border-none h-12 rounded-xl font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Entry (Coins)</Label>
                <Input type="number" value={editingTournament?.entryFee} onChange={e => setEditingTournament({...editingTournament!, entryFee: Number(e.target.value)})} placeholder="50" className="bg-muted/50 border-none h-12 rounded-xl font-bold" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">Tactical Mode</Label>
              <Select value={editingTournament?.gameType} onValueChange={val => setEditingTournament({...editingTournament!, gameType: val as any})}>
                <SelectTrigger className="bg-muted/50 border-none h-12 rounded-xl font-bold"><SelectValue placeholder="Select Mode" /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#121216] border-border/50">
                  <SelectItem value="BGMI">BGMI</SelectItem>
                  <SelectItem value="Free Fire">Free Fire</SelectItem>
                  <SelectItem value="Ludo King">Ludo King</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-14 bg-primary font-black uppercase text-lg rounded-xl shadow-xl mt-2">DEPLOY TO ARENA</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavItem({ active, icon, label, onClick, badge }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all group", active ? "bg-primary text-white font-bold shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>
      <div className="flex items-center gap-3">
        <span className={cn("h-4 w-4", active && "text-white")}>{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest italic">{label}</span>
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
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
          <h4 className="text-2xl font-black">{value}</h4>
       </div>
       <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg", colorMap[color as keyof typeof colorMap])}>
          {icon}
       </div>
    </Card>
  );
}
