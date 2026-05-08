
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
  ArrowRight,
  UserPlus,
  BarChart3,
  MessageSquare
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
  const [coinAdjustment, setCoinAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);

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
    toast({ title: "Configuration Synced" });
  };

  const handleAdjustBalance = async () => {
    if (!firestore || !coinAdjustment) return;
    const { userId, bucket, amount } = coinAdjustment;
    try {
      const uRef = doc(firestore, 'users', userId);
      const updatePayload: any = {};
      
      if (bucket === 'deposit') updatePayload.depositBalance = increment(amount);
      if (bucket === 'winning') {
        updatePayload.winningBalance = increment(amount);
        updatePayload.withdrawableCoins = increment(amount);
      }
      if (bucket === 'task') updatePayload.taskBalance = increment(amount);
      
      updatePayload.coins = increment(amount);

      await updateDoc(uRef, updatePayload);
      
      await addDoc(collection(firestore, 'users', userId, 'ledger'), {
        type: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Admin adjustment: ${amount} added to ${bucket} balance.`
      });
      
      toast({ title: `Credited ${amount} to ${bucket} bucket.` });
      setCoinAdjustment(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
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
    toast({ title: "Campaign Deployed" });
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black">ACCESS DENIED</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      {/* Tactical Sidebar */}
      <aside className="w-64 bg-[#0a0a0f] border-r border-white/5 hidden lg:flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg rotate-3">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-black uppercase tracking-tighter text-lg">EAGLE<span className="text-primary">EYE</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem active={activeTab === 'overview'} icon={<LayoutDashboard />} label="COMMAND" onClick={() => setActiveTab('overview')} />
          <NavItem active={activeTab === 'warriors'} icon={<UsersIcon />} label="WARRIORS" onClick={() => setActiveTab('warriors')} />
          <NavItem active={activeTab === 'campaigns'} icon={<Trophy />} label="CAMPAIGNS" onClick={() => setActiveTab('campaigns')} />
          <NavItem active={activeTab === 'control'} icon={<Settings />} label="ECONOMIC" onClick={() => setActiveTab('control')} />
        </nav>
      </aside>

      <main className="flex-1 lg:ml-64 pb-20">
        <header className="h-16 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 px-8 flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{activeTab} sector</h2>
          <Badge className="bg-primary/20 text-primary border-primary/20 text-[9px] font-black uppercase">Admin Terminal Active</Badge>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} color="blue" />
              <StatCard title="Task Revenue" value={usersData?.reduce((acc, u) => acc + (u.taskBalance || 0), 0) || 0} icon={<Zap />} color="amber" />
              <StatCard title="Active Hubs" value={tournamentsData?.length || 0} icon={<Trophy />} color="orange" />
              <StatCard title="Pending Payouts" value={transactionsData?.filter(t => t.status === 'pending').length || 0} icon={<DollarSign />} color="red" />
            </div>
          )}

          {activeTab === 'warriors' && (
            <div className="space-y-6">
              <Card className="bg-white/5 border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Filter className="h-4 w-4 text-primary" />
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-48 bg-black/40 border-white/10 h-10 rounded-xl">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121216] border-white/10 text-white">
                      <SelectItem value="All">Global Sector</SelectItem>
                      <SelectItem value="India">India Sector</SelectItem>
                      <SelectItem value="USA">USA Sector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="bg-[#0a0a0f] border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="px-8 font-black uppercase text-[9px] tracking-widest text-muted-foreground">Warrior Identity</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Balances (D/W/T)</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Region</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground text-right px-8">Direct Access</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.map(u => (
                      <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                        <TableCell className="px-8 py-6">
                          <p className="font-black text-xs uppercase italic">{u.email || u.id.substring(0,10)}</p>
                          <p className="text-[8px] text-muted-foreground font-bold uppercase">{u.deviceId || 'No ID Signature'}</p>
                        </TableCell>
                        <TableCell>
                           <div className="flex gap-2">
                              <Badge className="bg-white/5 text-white border-none text-[8px]">{u.depositBalance || 0}</Badge>
                              <Badge className="bg-green-500/10 text-green-500 border-none text-[8px]">{u.winningBalance || 0}</Badge>
                              <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px]">{u.taskBalance || 0}</Badge>
                           </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[9px] border-white/10">{u.country || 'Global'}</Badge></TableCell>
                        <TableCell className="text-right px-8 space-x-2">
                           <Button 
                             onClick={() => setCoinAdjustment({ userId: u.id, bucket: 'winning', amount: 100 })}
                             className="h-8 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border-none text-[8px] font-black uppercase"
                           >
                             +100 WIN
                           </Button>
                           <Button 
                             variant={u.isBanned ? "outline" : "destructive"} 
                             size="sm" 
                             className="h-8 px-4 font-black text-[9px] uppercase italic"
                             onClick={() => updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned })}
                           >
                             {u.isBanned ? "UNBAN" : "BAN"}
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
                 <h3 className="text-xl font-black uppercase italic tracking-tighter">Mission Deployment</h3>
                 <Button onClick={() => { setEditingTournament({}); setIsTournamentDialogOpen(true); }} className="h-12 bg-primary font-black px-8 rounded-xl italic">LAUNCH NEW MISSION</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {tournamentsData?.map(t => (
                    <Card key={t.id} className="bg-[#1a1a1a] border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                       <div className="space-y-4">
                          <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black px-2">{t.gameType}</Badge>
                          <h4 className="text-xl font-black italic uppercase tracking-tighter">{t.name}</h4>
                          <div className="flex gap-4">
                             <div className="text-[9px] font-black text-muted-foreground">Entry: <span className="text-white">{t.entryFee} 🪙</span></div>
                             <div className="text-[9px] font-black text-muted-foreground">Pool: <span className="text-secondary">{t.prizePool}</span></div>
                          </div>
                          <div className="flex gap-2 pt-2">
                             <Button variant="outline" size="sm" onClick={() => { setEditingTournament(t); setIsTournamentDialogOpen(true); }} className="flex-1 h-9 border-white/10 text-[9px] font-black uppercase italic">MODIFY</Button>
                             <Button variant="destructive" size="sm" onClick={() => deleteDoc(doc(firestore, 'tournaments', t.id))} className="h-9 w-9 p-0"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                       </div>
                    </Card>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="bg-[#1a1a1a] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                  <h3 className="text-lg font-black italic flex items-center gap-3"><DollarSign className="text-primary" /> Economic Constants</h3>
                  <div className="space-y-4">
                     <div>
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Coin Exchage Rate (Per ₹1)</Label>
                        <Input type="number" value={config.coinValuePerDollar} onChange={e => setConfig({...config, coinValuePerDollar: Number(e.target.value)})} className="bg-black/40 border-white/10 h-12 rounded-xl mt-1" />
                     </div>
                     <div>
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Referral Bounty (Task Coins)</Label>
                        <Input type="number" value={config.referralRewardCoins} onChange={e => setConfig({...config, referralRewardCoins: Number(e.target.value)})} className="bg-black/40 border-white/10 h-12 rounded-xl mt-1" />
                     </div>
                     <Button onClick={() => handleUpdateSettings({ coinValuePerDollar: config.coinValuePerDollar, referralRewardCoins: config.referralRewardCoins })} className="w-full h-14 bg-primary font-black uppercase italic shadow-xl">SYNC GLOBAL ECONOMY</Button>
                  </div>
               </Card>

               <Card className="bg-[#1a1a1a] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                  <h3 className="text-lg font-black italic flex items-center gap-3"><Zap className="text-amber-500" /> API Synchronizer</h3>
                  <div className="space-y-4">
                     <div>
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">CPA Lead JSON Intelligence Link</Label>
                        <Input value={config.cpaLeadUrl} onChange={e => setConfig({...config, cpaLeadUrl: e.target.value})} className="bg-black/40 border-white/10 h-12 rounded-xl mt-1" />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                           <span className="text-[9px] font-black">Offer Wall</span>
                           <Switch checked={config.offerWallEnabled} onCheckedChange={val => handleUpdateSettings({ offerWallEnabled: val })} />
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                           <span className="text-[9px] font-black">Video Ads</span>
                           <Switch checked={config.videoWallEnabled} onCheckedChange={val => handleUpdateSettings({ videoWallEnabled: val })} />
                        </div>
                     </div>
                     <Button onClick={() => handleUpdateSettings({ cpaLeadUrl: config.cpaLeadUrl })} className="w-full h-14 bg-amber-500 text-black font-black uppercase italic shadow-xl">UPDATE API FEED</Button>
                  </div>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* Manual Adjustment Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="bg-[#121216] border-white/10 text-white rounded-[2rem]">
            <DialogHeader><DialogTitle className="font-black italic uppercase">Asset Injection: {coinAdjustment.bucket}</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Coins to Credit (Use negative for debit)</Label>
                <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="bg-black/40 h-14 rounded-xl text-xl font-black text-primary" />
              </div>
              <Button onClick={handleAdjustBalance} className="w-full h-14 bg-primary font-black uppercase italic rounded-xl">EXECUTE TRANSFER</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Campaign Dialog */}
      <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
        <DialogContent className="bg-[#121216] border-white/10 text-white rounded-[2rem] max-w-lg">
           <DialogHeader><DialogTitle className="font-black italic uppercase">Deploy Campaign</DialogTitle></DialogHeader>
           <form onSubmit={handleSaveTournament} className="space-y-6 pt-4">
              <div className="space-y-1">
                 <Label className="text-[10px] font-black">Mission Codename</Label>
                 <Input value={editingTournament?.name} onChange={e => setEditingTournament({...editingTournament!, name: e.target.value})} className="bg-black/40 border-white/10 h-12 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black">Game Sector</Label>
                    <Select value={editingTournament?.gameType} onValueChange={val => setEditingTournament({...editingTournament!, gameType: val as any})}>
                       <SelectTrigger className="bg-black/40 border-white/10 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                       <SelectContent className="bg-[#121216] border-white/10 text-white">
                          <SelectItem value="BGMI">BGMI</SelectItem>
                          <SelectItem value="Free Fire">Free Fire</SelectItem>
                          <SelectItem value="Ludo King">Ludo King</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] font-black">Entry (Coins)</Label>
                    <Input type="number" value={editingTournament?.entryFee} onChange={e => setEditingTournament({...editingTournament!, entryFee: Number(e.target.value)})} className="bg-black/40 border-white/10 h-12 rounded-xl" />
                 </div>
              </div>
              <Button type="submit" className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-xl">COMMENCE DEPLOYMENT</Button>
           </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 group relative", active ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      <span className={cn("h-5 w-5", active ? "scale-110" : "group-hover:scale-110")}>{icon}</span>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{label}</span>
      {active && <div className="absolute left-2 h-6 w-1 bg-white rounded-full opacity-60" />}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap = { blue: "bg-blue-600", orange: "bg-primary", red: "bg-destructive", amber: "bg-amber-500 text-black" };
  return (
    <Card className="bg-[#1a1a1a] border-white/5 p-8 rounded-[2rem] flex items-center justify-between group hover:scale-[1.02] transition-all">
       <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
          <h4 className="text-3xl font-black italic tracking-tighter">{value.toLocaleString()}</h4>
       </div>
       <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12", colorMap[color as keyof typeof colorMap])}>
          {icon}
       </div>
    </Card>
  );
}
