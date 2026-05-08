
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
  DollarSign,
  AlertTriangle
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
    setDoc(settingsRef, updates, { merge: true });
    toast({ title: "Command Intel Updated" });
  };

  const handleSaveTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !editingTournament) return;
    
    if (editingTournament.id) {
      setDoc(doc(firestore, 'tournaments', editingTournament.id), editingTournament, { merge: true });
    } else {
      addDoc(collection(firestore, 'tournaments'), { 
        ...editingTournament, 
        status: 'active', 
        entryFee: Number(editingTournament.entryFee || 0),
        startDate: new Date().toISOString(),
        banner: `https://picsum.photos/seed/${Math.random()}/800/400`
      });
    }
    setIsTournamentDialogOpen(false);
    toast({ title: "Campaign Synchronized" });
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  
  if (!isAdminUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center text-white bg-black">
        <ShieldCheck className="h-20 w-20 mb-6 text-destructive animate-pulse" />
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Identity Conflict</h1>
        <p className="text-muted-foreground mt-4 font-bold max-w-sm uppercase tracking-widest text-xs">
          Restricted to administrative signature: {ADMIN_EMAIL}
        </p>
      </div>
    );
  }

  const deviceMap = new Map();
  usersData?.forEach(u => { 
    if (u.deviceId) { 
      const list = deviceMap.get(u.deviceId) || []; 
      list.push(u); 
      deviceMap.set(u.deviceId, list); 
    } 
  });
  const violations = Array.from(deviceMap.values()).filter(l => l.length > 1);

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      {/* Side Command Rail */}
      <aside className="w-72 border-r border-white/5 bg-card/10 backdrop-blur-3xl hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-10 border-b border-white/5 flex items-center gap-4">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-2xl shadow-primary/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-black uppercase tracking-tighter text-2xl italic">EAGLE<span className="text-primary">EYE</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2 mt-4">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="INTELLIGENCE" />
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="WARRIOR MONITOR" />
          <SidebarItem active={activeTab === 'tournaments'} onClick={() => setActiveTab('tournaments')} icon={<Trophy />} label="CAMPAIGN HUB" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="FINANCIAL LEDGER" />
          <SidebarItem active={activeTab === 'control'} onClick={() => setActiveTab('control')} icon={<Settings />} label="MASTER CONTROL" />
          <div className="pt-12 mt-12 border-t border-white/5 opacity-50">
            <SidebarItem active={activeTab === 'repair'} onClick={() => setActiveTab('repair')} icon={<Wrench className="text-amber-500" />} label="SYSTEM RESTORE" />
          </div>
        </nav>
      </aside>

      <main className="flex-1 md:ml-72 p-6 md:p-16 space-y-12 pb-32">
        <div className="flex items-center justify-between">
           <div className="space-y-1">
             <h1 className="text-6xl font-black uppercase tracking-tighter italic">Command <span className="text-primary">Center</span></h1>
             <p className="text-muted-foreground font-black uppercase tracking-[0.4em] text-[10px]">Active Session: {ADMIN_EMAIL}</p>
           </div>
           <div className="flex gap-4">
             {config.maintenanceMode && <Badge variant="destructive" className="animate-pulse h-12 px-8 font-black uppercase tracking-[0.3em] rounded-2xl border-none shadow-2xl shadow-red-900/40">Maintenance Protocol Active</Badge>}
             <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center animate-spin-slow">
                <Settings className="h-6 w-6 text-muted-foreground" />
             </div>
           </div>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatsCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} />
            <StatsCard title="Device Violations" value={violations.length} icon={<Fingerprint className="text-red-500" />} color="destructive" />
            <StatsCard title="Active Campaigns" value={tournamentsData?.length || 0} icon={<Trophy />} />
            <StatsCard title="Pending Payouts" value={transactionsData?.filter(t => t.status === 'pending' && t.type === 'withdrawal').length || 0} icon={<History />} color="secondary" />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Warrior Database</h3>
              {violations.length > 0 && (
                <Badge variant="destructive" className="h-10 px-6 font-black uppercase">
                  <AlertTriangle className="mr-2 h-4 w-4" /> {violations.length} Multi-Account Threats Detected
                </Badge>
              )}
            </div>
            <Card className="bg-card/10 border-white/5 rounded-[3rem] overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="px-10 h-16 font-black uppercase text-[10px] tracking-widest">Warrior ID</TableHead>
                    <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                    <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Balance</TableHead>
                    <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest text-right px-10">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersData?.map(u => (
                    <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="px-10 py-8">
                        <div className="space-y-1">
                          <p className="font-black text-sm uppercase italic group-hover:text-primary transition-colors">{u.email || u.id}</p>
                          <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Device: {u.deviceId?.substring(0, 16)}...</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.isBanned ? "destructive" : "secondary"} className="uppercase text-[9px] font-black tracking-widest px-3">
                          {u.isBanned ? "Excluded" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-secondary text-lg">
                        {u.coins || 0} <span className="text-[10px] opacity-40 italic">🪙</span>
                      </TableCell>
                      <TableCell className="text-right px-10">
                        <Button 
                          variant={u.isBanned ? "outline" : "destructive"} 
                          size="sm" 
                          className="rounded-xl font-black uppercase text-[10px] h-10 px-6"
                          onClick={() => updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned })}
                        >
                          {u.isBanned ? "Restore Access" : "Exclude Warrior"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'control' && (
          <div className="max-w-5xl space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <Card className="bg-card/20 border-white/5 rounded-[3rem] p-12 space-y-10 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <TrendingUp className="text-primary h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Economic constants</h3>
                </div>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Coin Value per 1.00 Local Currency</Label>
                    <Input type="number" value={config.coinValuePerDollar} onChange={e => setConfig({ ...config, coinValuePerDollar: Number(e.target.value) })} className="bg-black/40 h-16 rounded-[1.5rem] border-white/10 font-black text-xl px-6" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Admin Profit Retention %</Label>
                    <Input type="number" value={config.adminProfitPercentage} onChange={e => setConfig({ ...config, adminProfitPercentage: Number(e.target.value) })} className="bg-black/40 h-16 rounded-[1.5rem] border-white/10 font-black text-xl px-6" />
                  </div>
                  <Button onClick={() => handleUpdateSettings({ coinValuePerDollar: config.coinValuePerDollar, adminProfitPercentage: config.adminProfitPercentage })} className="w-full h-16 bg-primary font-black uppercase tracking-widest text-base rounded-[1.5rem]">SYNC ECONOMIC DATA</Button>
                </div>
              </Card>

              <Card className="bg-card/20 border-white/5 rounded-[3rem] p-12 space-y-10 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                    <Radio className="text-secondary h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Global Ad Hubs</h3>
                </div>
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 bg-black/40 rounded-3xl border border-white/5">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest">Video Rewards</p>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase italic">Enable Global Video Ads</p>
                    </div>
                    <Switch checked={config.videoWallEnabled} onCheckedChange={val => handleUpdateSettings({ videoWallEnabled: val })} />
                  </div>
                  <div className="flex items-center justify-between p-6 bg-black/40 rounded-3xl border border-white/5">
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-widest">Elite Offer Wall</p>
                      <p className="text-[9px] text-muted-foreground font-medium uppercase italic">Enable CPA Lead Missions</p>
                    </div>
                    <Switch checked={config.offerWallEnabled} onCheckedChange={val => handleUpdateSettings({ offerWallEnabled: val })} />
                  </div>
                </div>
              </Card>
            </div>

            <Card className="bg-card/20 border-white/5 rounded-[3rem] p-12 space-y-8 shadow-2xl">
              <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                 <Zap className="text-amber-500" /> CPA Master Intel (JSON URL)
              </h3>
              <p className="text-xs text-muted-foreground font-medium max-w-2xl leading-relaxed">Provide your global CPA Lead API endpoint. All monetization will sync automatically with the user hub.</p>
              <div className="flex flex-col md:flex-row gap-6">
                <Input value={config.cpaLeadUrl} onChange={e => setConfig({ ...config, cpaLeadUrl: e.target.value })} placeholder="https://cpalead.com/dashboard/reports/campaign_json.php?..." className="flex-1 bg-black/40 h-16 rounded-[1.5rem] border-white/10" />
                <Button onClick={() => handleUpdateSettings({ cpaLeadUrl: config.cpaLeadUrl })} className="h-16 px-12 bg-white text-black font-black uppercase tracking-widest rounded-[1.5rem]">DEPLOY FEED</Button>
              </div>
            </Card>

            <div className="flex items-center justify-between p-12 bg-destructive/5 rounded-[3rem] border border-destructive/20">
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase italic text-destructive">Maintenance Lock</h3>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Temporarily disable arena access for synchronization.</p>
              </div>
              <Switch checked={config.maintenanceMode} onCheckedChange={val => handleUpdateSettings({ maintenanceMode: val })} />
            </div>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter">Campaign Deployment</h3>
              <Button onClick={() => { setEditingTournament({ name: '', prizePool: '', entryFee: 0, gameType: 'BGMI', game: 'Pro League' }); setIsTournamentDialogOpen(true); }} className="bg-primary rounded-2xl h-14 font-black px-10 shadow-xl shadow-primary/20">
                <Plus className="mr-3 h-5 w-5" /> DEPLOY NEW CAMPAIGN
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {tournamentsData?.map(t => (
                <Card key={t.id} className="bg-card/20 border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between group transition-all hover:bg-white/5">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                      <Trophy className="h-10 w-10 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-xl uppercase italic leading-none">{t.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2">{t.gameType} • {t.prizePool} • {t.entryFee} 🪙</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button size="icon" variant="ghost" className="h-12 w-12 rounded-xl" onClick={() => { setEditingTournament(t); setIsTournamentDialogOpen(true); }}><Edit2 className="h-5 w-5" /></Button>
                    <Button size="icon" variant="destructive" className="h-12 w-12 rounded-xl" onClick={() => deleteDoc(doc(firestore, 'tournaments', t.id))}><Trash2 className="h-5 w-5" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-8">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">Financial Monitor</h3>
            <Card className="bg-card/10 border-white/5 rounded-[3rem] overflow-hidden">
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="border-white/5">
                    <TableHead className="px-10 h-16 font-black uppercase text-[10px]">Warrior Signature</TableHead>
                    <TableHead className="h-16 font-black uppercase text-[10px]">Operation Type</TableHead>
                    <TableHead className="h-16 font-black uppercase text-[10px]">Volume</TableHead>
                    <TableHead className="h-16 font-black uppercase text-[10px]">Status</TableHead>
                    <TableHead className="text-right px-10 h-16 font-black uppercase text-[10px]">Protocol Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsData?.map(t => (
                    <TableRow key={t.id} className="border-white/5 hover:bg-white/5">
                      <TableCell className="px-10 py-8 font-black uppercase text-[10px] italic">{t.userId?.substring(0,12)}...</TableCell>
                      <TableCell className="capitalize text-[10px] font-black tracking-widest">{t.type}</TableCell>
                      <TableCell className="font-black text-secondary text-lg">₹{t.amount}</TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'completed' ? 'default' : 'secondary'} className="uppercase text-[8px] font-black px-3">
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-10">
                        {t.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => updateDoc(doc(firestore, 'users', t.userId!, 'ledger', t.id), { status: 'completed' })} 
                            className="rounded-xl h-10 px-8 bg-green-600 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-green-900/40"
                          >
                            APPROVE PAYOUT
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {activeTab === 'repair' && (
          <Card className="max-w-2xl mx-auto bg-amber-500/5 border-amber-500/20 rounded-[3rem] p-16 text-center space-y-10 shadow-[0_40px_100px_rgba(0,0,0,0.6)] border-2">
            <div className="h-24 w-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20 animate-pulse">
               <Wrench className="h-12 w-12 text-amber-500" />
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black uppercase italic tracking-tighter">System Restore</h2>
              <p className="text-muted-foreground font-medium text-base max-w-md mx-auto leading-relaxed">
                Emergency protocol to synchronize admin signatures and reset economic configurations to default recovery state.
              </p>
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
                toast({ title: "System Synchronized" });
              } catch (e) { toast({ variant: "destructive", title: "Restore Failed" }); } finally { setIsRepairing(false); }
            }} disabled={isRepairing} className="w-full h-20 bg-amber-500 text-black font-black text-xl rounded-[1.5rem] shadow-2xl shadow-amber-900/40 hover:bg-amber-400 transition-all active:scale-95">
              {isRepairing ? <Loader2 className="animate-spin h-8 w-8" /> : "EXECUTE RESTORATION PROTOCOL"}
            </Button>
          </Card>
        )}
      </main>

      {/* Tournament Deployment Dialog */}
      <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
        <DialogContent className="bg-[#121216] border-white/5 text-white rounded-[3rem] p-12 max-w-xl shadow-[0_50px_150px_rgba(0,0,0,0.9)] border-2">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Campaign Intelligence</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTournament} className="space-y-8 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Campaign Name</Label>
              <Input value={editingTournament?.name} onChange={e => setEditingTournament({...editingTournament!, name: e.target.value})} placeholder="e.g. Cyber Strike Alpha" className="bg-black/40 h-16 rounded-[1.5rem] border-white/10 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prize Vault</Label>
                <Input value={editingTournament?.prizePool} onChange={e => setEditingTournament({...editingTournament!, prizePool: e.target.value})} placeholder="e.g. ₹5,000" className="bg-black/40 h-16 rounded-[1.5rem] border-white/10 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Entry (Coins)</Label>
                <Input type="number" value={editingTournament?.entryFee} onChange={e => setEditingTournament({...editingTournament!, entryFee: Number(e.target.value)})} placeholder="e.g. 50" className="bg-black/40 h-16 rounded-[1.5rem] border-white/10 font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tactical Mode</Label>
              <Select value={editingTournament?.gameType} onValueChange={val => setEditingTournament({...editingTournament!, gameType: val as any})}>
                <SelectTrigger className="bg-black/40 h-16 rounded-[1.5rem] border-white/10 font-bold"><SelectValue placeholder="Select Game" /></SelectTrigger>
                <SelectContent className="bg-[#121216] border-white/5">
                  <SelectItem value="BGMI">BGMI</SelectItem>
                  <SelectItem value="Free Fire">Free Fire</SelectItem>
                  <SelectItem value="Ludo King">Ludo King</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-20 bg-primary font-black uppercase text-xl rounded-[1.5rem] shadow-2xl shadow-primary/40 mt-4 transition-all hover:scale-[1.02] active:scale-95">
              DEPLOY TO ARENA
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-5 px-8 py-5 rounded-[1.5rem] transition-all duration-300 text-left relative group", active ? "bg-primary text-white font-black shadow-2xl shadow-primary/40 scale-105" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      <span className={cn("h-6 w-6", active && "animate-pulse")}>{icon}</span>
      <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">{label}</span>
      {active && <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-1 bg-white rounded-full shadow-[0_0_10px_white]" />}
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
    <Card className={cn("bg-card/40 border-white/5 p-10 rounded-[3rem] transition-all hover:scale-[1.08] duration-500 shadow-2xl relative overflow-hidden group", colorMap[color as keyof typeof colorMap])}>
      <div className={cn("absolute -top-4 -right-4 h-24 w-24 opacity-5 transition-transform group-hover:scale-150 group-hover:rotate-12 duration-700", colorMap[color as keyof typeof colorMap])}>{icon}</div>
      <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center mb-6 border-2 shadow-2xl", colorMap[color as keyof typeof colorMap])}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">{title}</p>
      <h4 className="text-5xl font-black text-white italic tracking-tighter tabular-nums">{value}</h4>
    </Card>
  );
}
