
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
  Ban,
  AlertTriangle,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, UserLedgerEntry, Match } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams, useRouter } from 'next/navigation';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'revenue' | 'transactions' | 'matches' | 'repair'>('dashboard');
  const [isRepairing, setIsRepairing] = useState(false);

  // Check if we should auto-repair based on URL param
  useEffect(() => {
    if (searchParams.get('repair') === 'true') {
      setActiveTab('repair');
    }
  }, [searchParams]);

  const isAdminUser = !!user && user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

  // Queries - Strictly conditional on isAdminUser check
  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const transactionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc')) : null, [firestore, isAdminUser]);
  const matchesQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'matches') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);

  const { data: usersData, isLoading: isUsersLoading, error: usersError } = useCollection<UserProfile>(usersQuery);
  const { data: transactionsData, isLoading: isTransLoading, error: transError } = useCollection<UserLedgerEntry & { userId?: string }>(transactionsQuery);
  const { data: matchesData } = useCollection<Match>(matchesQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  // Form States
  const [coinValue, setCoinValue] = useState<string>('100');
  const [profitMargin, setProfitMargin] = useState<string>('50');
  const [cpaUrl, setCpaUrl] = useState<string>('');
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Partial<Match> | null>(null);

  useEffect(() => {
    if (settings) {
      if (settings.coinValuePerDollar !== undefined) setCoinValue(settings.coinValuePerDollar.toString());
      if (settings.adminProfitPercentage !== undefined) setProfitMargin(settings.adminProfitPercentage.toString());
      if (settings.cpaLeadUrl) setCpaUrl(settings.cpaLeadUrl);
    }
  }, [settings]);

  const handleUpdateRevenue = async () => {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, { 
        coinValuePerDollar: parseFloat(coinValue), 
        adminProfitPercentage: parseFloat(profitMargin),
        cpaLeadUrl: cpaUrl
      }, { merge: true });
      toast({ title: "Revenue Settings Updated" });
    } catch (e: any) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleEmergencyRepair = async () => {
    if (!firestore || !user) return;
    setIsRepairing(true);
    try {
      // 1. Repair Global Settings
      const globalRef = doc(firestore, 'settings', 'global');
      await setDoc(globalRef, {
        maintenanceMode: false,
        coinValuePerDollar: 100,
        adminProfitPercentage: 50,
        cpaLeadUrl: cpaUrl || "",
        withdrawalGateways: ['UPI', 'Paytm', 'Google Pay']
      }, { merge: true });

      // 2. Repair Admin Profile to force isAdmin flag in Firestore
      const adminRef = doc(firestore, 'users', user.uid);
      await setDoc(adminRef, {
        isAdmin: true,
        email: ADMIN_EMAIL,
        isBanned: false,
        lastActive: new Date().toISOString()
      }, { merge: true });

      toast({ title: "System Repaired Successfully", description: "Admin identity and settings stabilized." });
      
      // Clear URL and refresh
      router.replace('/admin');
      setTimeout(() => window.location.reload(), 500);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Repair Failed", description: e.message });
    } finally {
      setIsRepairing(false);
    }
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !editingMatch) return;
    try {
      if (editingMatch.id) {
        await setDoc(doc(firestore, 'matches', editingMatch.id), editingMatch, { merge: true });
        toast({ title: "Match Updated" });
      } else {
        await addDoc(collection(firestore, 'matches'), {
          ...editingMatch,
          votesA: 0,
          votesB: 0,
          scoreA: 0,
          scoreB: 0,
          startTime: new Date().toISOString()
        });
        toast({ title: "Match Created" });
      }
      setIsMatchDialogOpen(false);
      setEditingMatch(null);
    } catch (e) { toast({ variant: "destructive", title: "Action Failed" }); }
  };

  const handleDeleteMatch = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'matches', id));
      toast({ title: "Match Removed" });
    } catch (e) { toast({ variant: "destructive", title: "Delete Failed" }); }
  };

  const handleUpdateTransactionStatus = async (userId: string, entryId: string, newStatus: 'completed' | 'failed') => {
    if (!firestore || !userId) return;
    try {
      await updateDoc(doc(firestore, 'users', userId, 'ledger', entryId), { status: newStatus });
      toast({ title: `Transaction marked as ${newStatus}` });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  if (isUserLoading) return <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-white bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Verifying Administrator Authority...</p></div>;
  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center text-white bg-black"><ShieldCheck className="h-16 w-16 mb-4 text-destructive" /><h1 className="text-2xl font-black uppercase italic">Unauthorized Sector</h1><p className="text-muted-foreground mt-2 font-medium">This command center is restricted to authorized personnel only.</p></div>;

  // If there's a permission error, show a prominent repair link
  if (usersError || transError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center text-white bg-[#0d0d12]">
        <ShieldAlert className="h-20 w-20 mb-6 text-destructive animate-pulse" />
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Permission Lockdown Detected</h1>
        <p className="text-muted-foreground mt-4 max-w-md font-medium">Firestore has restricted your administrative access. This usually happens if your identity flag is missing in the database.</p>
        <div className="mt-10 p-8 bg-amber-500/10 border border-amber-500/20 rounded-3xl space-y-6">
          <p className="text-sm font-bold text-amber-500">Click below to bypass restrictions and stabilize your authority.</p>
          <Button onClick={handleEmergencyRepair} disabled={isRepairing} className="bg-amber-500 hover:bg-amber-600 text-black font-black px-10 h-14 rounded-2xl w-full">
            {isRepairing ? <Loader2 className="animate-spin" /> : "AUTO-FIX & SYNC SYSTEM"}
          </Button>
        </div>
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

  return (
    <div className="flex min-h-screen bg-[#0d0d12] text-white">
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-2xl hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-black uppercase text-lg">Arena Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Overview" />
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="User Manager" />
          <SidebarItem active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<Sword />} label="Match Manager" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Transactions" />
          <SidebarItem active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} icon={<TrendingUp />} label="Revenue Control" />
          <SidebarItem active={activeTab === 'repair'} onClick={() => setActiveTab('repair')} icon={<Wrench className="text-amber-500" />} label="SYSTEM REPAIR" />
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 space-y-8 pb-32">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatsCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} />
            <StatsCard title="Device Violations" value={Array.from(deviceMap.values()).filter(l => l.length > 1).length} icon={<Fingerprint className="text-red-500" />} />
            <StatsCard title="Banned Users" value={usersData?.filter(u => u.isBanned).length || 0} icon={<Ban className="text-red-500" />} />
            <StatsCard title="Pending Payouts" value={transactionsData?.filter(t => t.type === 'withdrawal' && t.status === 'pending').length || 0} icon={<History />} />
          </div>
        )}

        {activeTab === 'repair' && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
            <Card className="bg-amber-500/5 border-amber-500/20 rounded-[2.5rem] p-10 space-y-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-20 w-20 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                  <Wrench className="h-10 w-10 text-amber-500 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter italic">One-Click System Repair</h2>
                <p className="text-muted-foreground font-medium">Click below to fix Firestore permissions, reset admin identity, and stabilize settings.</p>
              </div>

              <div className="space-y-4">
                <Alert className="bg-black/40 border-white/5 rounded-2xl">
                  <Zap className="h-4 w-4 text-primary" />
                  <AlertTitle className="font-black uppercase text-[10px]">What this does:</AlertTitle>
                  <AlertDescription className="text-xs text-muted-foreground space-y-2 mt-2">
                    <p>• Forces Global Settings to reset to safe defaults.</p>
                    <p>• Ensures your account is registered as Global Administrator in Firestore.</p>
                    <p>• Synchronizes security contexts to prevent "Missing Permission" errors.</p>
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleEmergencyRepair} 
                  disabled={isRepairing}
                  className="w-full h-20 rounded-3xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xl shadow-2xl shadow-amber-500/20"
                >
                  {isRepairing ? <Loader2 className="animate-spin h-8 w-8" /> : "EXECUTE ONE-CLICK REPAIR"}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="uppercase font-black text-sm text-primary">User Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow className="border-white/5 hover:bg-transparent"><TableHead>Identity</TableHead><TableHead>Device Fingerprint</TableHead><TableHead>Winning Balance</TableHead><TableHead>Status</TableHead><TableHead>Control</TableHead></TableRow></TableHeader>
                <TableBody>
                  {isUsersLoading ? <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell></TableRow> : 
                  usersData?.map(u => (
                    <TableRow key={u.id} className={cn("border-white/5", u.deviceId && deviceMap.get(u.deviceId).length > 1 && "bg-red-500/5")}>
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-bold text-xs">{u.email || u.mobile || u.id}</p>
                          {u.deviceId && deviceMap.get(u.deviceId).length > 1 && <Badge variant="destructive" className="text-[8px] h-4">DUPLICATE DEVICE</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[10px] opacity-50">{u.deviceId}</TableCell>
                      <TableCell className="font-black text-green-500">🪙{u.withdrawableCoins}</TableCell>
                      <TableCell><Badge variant={u.isBanned ? "destructive" : "outline"}>{u.isBanned ? "BANNED" : "ACTIVE"}</Badge></TableCell>
                      <TableCell>
                        <Button size="sm" variant={u.isBanned ? "outline" : "destructive"} onClick={() => updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned })}>
                          {u.isBanned ? "Pardon" : "Terminate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter italic">Battle Arena <span className="text-primary">Manager</span></h2>
              <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingMatch({ teamA: { id: 'a', name: '', logo: '' }, teamB: { id: 'b', name: '', logo: '' }, status: 'scheduled' })} className="rounded-xl font-black">
                    <Plus className="h-4 w-4 mr-2" /> NEW MATCH
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a1a1a] border-white/5 rounded-3xl text-white">
                  <DialogHeader><DialogTitle className="font-black uppercase">Battle Configuration</DialogTitle></DialogHeader>
                  <form onSubmit={handleSaveMatch} className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Team A Name</Label>
                        <Input value={editingMatch?.teamA?.name} onChange={(e) => setEditingMatch({...editingMatch!, teamA: {...editingMatch!.teamA!, name: e.target.value}})} className="bg-black/40 border-white/10" />
                      </div>
                      <div className="space-y-2">
                        <Label>Team B Name</Label>
                        <Input value={editingMatch?.teamB?.name} onChange={(e) => setEditingMatch({...editingMatch!, teamB: {...editingMatch!.teamB!, name: e.target.value}})} className="bg-black/40 border-white/10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Match Description</Label>
                      <Input value={editingMatch?.description} onChange={(e) => setEditingMatch({...editingMatch!, description: e.target.value})} className="bg-black/40 border-white/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={editingMatch?.status} onValueChange={(v: any) => setEditingMatch({...editingMatch!, status: v})}>
                          <SelectTrigger className="bg-black/40 border-white/10"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="finished">Finished</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tournament ID</Label>
                        <Input value={editingMatch?.tournamentId} onChange={(e) => setEditingMatch({...editingMatch!, tournamentId: e.target.value})} className="bg-black/40 border-white/10" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-black">SAVE BATTLE</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {matchesData?.map(m => (
                <Card key={m.id} className="bg-card/20 border-white/5 p-6 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 bg-white/5 rounded-xl flex items-center justify-center font-black border border-white/10 italic">VS</div>
                    <div>
                      <h4 className="font-black uppercase text-sm">{m.teamA?.name} <span className="text-primary italic">vs</span> {m.teamB?.name}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{m.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button size="sm" variant="outline" onClick={() => { setEditingMatch(m); setIsMatchDialogOpen(true); }}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteMatch(m.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden">
            <CardHeader><CardTitle className="uppercase font-black text-sm text-secondary">Financial Activity Log</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow className="border-white/5 hover:bg-transparent"><TableHead>Warrior</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {isTransLoading ? <TableRow><TableCell colSpan={5} className="text-center py-10"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></TableCell></TableRow> : 
                  transactionsData?.map(t => (
                    <TableRow key={t.id} className="border-white/5">
                      <TableCell className="font-bold text-xs">{t.userId ? String(t.userId).substring(0, 8) : 'unknown'}...</TableCell>
                      <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                      <TableCell className="font-black text-secondary">₹{t.amount}</TableCell>
                      <TableCell><Badge className={t.status === 'completed' ? 'bg-green-500' : t.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}>{t.status}</Badge></TableCell>
                      <TableCell>
                        {t.status === 'pending' && t.userId && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleUpdateTransactionStatus(t.userId!, t.id, 'completed')}>Approve</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateTransactionStatus(t.userId!, t.id, 'failed')}>Deny</Button>
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

        {activeTab === 'revenue' && (
          <Card className="bg-card/30 border-primary/20 p-8 rounded-[2.5rem] max-w-2xl mx-auto space-y-8">
             <h2 className="text-2xl font-black uppercase tracking-tighter italic flex items-center gap-3"><TrendingUp className="text-primary" /> Revenue Configuration</h2>
             <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="uppercase font-black text-[10px] tracking-widest text-muted-foreground">CPALead Arena API URL</Label>
                  <Input value={cpaUrl} onChange={(e) => setCpaUrl(e.target.value)} placeholder="https://www.cpalead.com/api/offers?id=..." className="h-14 rounded-2xl bg-black/40" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="uppercase font-black text-[10px] tracking-widest text-muted-foreground">Coin Value per $</Label>
                    <Input type="number" value={coinValue} onChange={(e) => setCoinValue(e.target.value)} className="h-14 rounded-2xl bg-black/40" />
                  </div>
                  <div className="space-y-2">
                    <Label className="uppercase font-black text-[10px] tracking-widest text-muted-foreground">Admin Profit (%)</Label>
                    <Input type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} className="h-14 rounded-2xl bg-black/40" />
                  </div>
                </div>
                <Button onClick={handleUpdateRevenue} className="w-full h-16 rounded-2xl font-black uppercase text-lg shadow-xl shadow-primary/20">SAVE CHANGES</Button>
             </div>
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
    <Card className="bg-card/40 border-white/5 p-6 rounded-2xl">
      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 text-primary">{icon}</div>
      <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">{title}</p>
      <h4 className="text-2xl font-black">{value}</h4>
    </Card>
  );
}
