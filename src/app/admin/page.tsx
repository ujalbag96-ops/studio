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

  // Robust Identity check
  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const transactionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc')) : null, [firestore, isAdminUser]);
  const matchesQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'matches') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);

  const { data: usersData, isLoading: isUsersLoading, error: usersError } = useCollection<UserProfile>(usersQuery);
  const { data: transactionsData, isLoading: isTransLoading, error: transError } = useCollection<UserLedgerEntry & { userId?: string }>(transactionsQuery);
  const { data: matchesData } = useCollection<Match>(matchesQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  // Auto-switch to repair tab if URL contains ?repair=true
  useEffect(() => {
    if (searchParams.get('repair') === 'true') {
      setActiveTab('repair');
    }
  }, [searchParams]);

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
        cpaLeadUrl: cpaUrl,
        withdrawalGateways: settings?.withdrawalGateways || ['UPI', 'Paytm', 'Google Pay']
      }, { merge: true });
      toast({ title: "Revenue Settings Updated" });
    } catch (e: any) { 
      toast({ variant: "destructive", title: "Update Failed", description: e.message }); 
    }
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
        withdrawalGateways: ['UPI', 'Paytm', 'Google Pay'],
        videoWallEnabled: true,
        offerWallEnabled: true,
        cpaLeadEnabled: true
      }, { merge: true });

      // 2. Repair Admin Profile
      const adminRef = doc(firestore, 'users', user.uid);
      await setDoc(adminRef, {
        isAdmin: true,
        email: ADMIN_EMAIL,
        isBanned: false,
        lastActive: new Date().toISOString()
      }, { merge: true });

      toast({ title: "System Repaired Successfully" });
      router.replace('/admin');
      setTimeout(() => window.location.reload(), 1000);
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
      } else {
        await addDoc(collection(firestore, 'matches'), {
          ...editingMatch,
          votesA: 0,
          votesB: 0,
          scoreA: 0,
          scoreB: 0,
          startTime: new Date().toISOString()
        });
      }
      setIsMatchDialogOpen(false);
      toast({ title: "Match Saved" });
    } catch (e) { toast({ variant: "destructive", title: "Action Failed" }); }
  };

  const handleUpdateTransactionStatus = async (userId: string, entryId: string, newStatus: 'completed' | 'failed') => {
    if (!firestore || !userId) return;
    try {
      await updateDoc(doc(firestore, 'users', userId, 'ledger', entryId), { status: newStatus });
      toast({ title: `Transaction marked as ${newStatus}` });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center text-white bg-black"><ShieldCheck className="h-16 w-16 mb-4 text-destructive" /><h1 className="text-2xl font-black uppercase italic">Access Denied</h1><p className="text-muted-foreground mt-2 font-medium">This command center is restricted to {ADMIN_EMAIL}.</p></div>;

  if (usersError || transError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center text-white bg-[#0d0d12]">
        <ShieldAlert className="h-20 w-20 mb-6 text-destructive animate-pulse" />
        <h1 className="text-3xl font-black uppercase italic tracking-tighter">Permission Restricted</h1>
        <p className="text-muted-foreground mt-4 max-w-md">Your identity status in the database needs to be synchronized.</p>
        <Button onClick={handleEmergencyRepair} disabled={isRepairing} className="mt-8 bg-amber-500 hover:bg-amber-600 text-black font-black px-10 h-14 rounded-2xl">
          {isRepairing ? <Loader2 className="animate-spin" /> : "ONE-CLICK SYSTEM FIX"}
        </Button>
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
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="Warriors" />
          <SidebarItem active={activeTab === 'matches'} onClick={() => setActiveTab('matches')} icon={<Sword />} label="Battles" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Ledger" />
          <SidebarItem active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} icon={<TrendingUp />} label="Control" />
          <SidebarItem active={activeTab === 'repair'} onClick={() => setActiveTab('repair')} icon={<Wrench className="text-amber-500" />} label="SYSTEM FIX" />
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 space-y-8 pb-32">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatsCard title="Warriors" value={usersData?.length || 0} icon={<UsersIcon />} />
            <StatsCard title="Violations" value={Array.from(deviceMap.values()).filter(l => l.length > 1).length} icon={<Fingerprint className="text-red-500" />} />
            <StatsCard title="Banned" value={usersData?.filter(u => u.isBanned).length || 0} icon={<Ban className="text-red-500" />} />
            <StatsCard title="Payouts" value={transactionsData?.filter(t => t.type === 'withdrawal' && t.status === 'pending').length || 0} icon={<History />} />
          </div>
        )}

        {activeTab === 'repair' && (
          <Card className="bg-amber-500/5 border-amber-500/20 rounded-[2.5rem] p-10 space-y-8 max-w-2xl mx-auto">
            <div className="text-center space-y-4">
              <Wrench className="h-12 w-12 text-amber-500 mx-auto animate-pulse" />
              <h2 className="text-3xl font-black uppercase italic">System Repair Protocol</h2>
              <p className="text-muted-foreground">Force-sync your admin status and reset app configuration.</p>
            </div>
            <Button onClick={handleEmergencyRepair} disabled={isRepairing} className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xl">
              {isRepairing ? <Loader2 className="animate-spin" /> : "EXECUTE REPAIR"}
            </Button>
          </Card>
        )}

        {activeTab === 'users' && (
          <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Identity</TableHead><TableHead>Device</TableHead><TableHead>Balance</TableHead><TableHead>Control</TableHead></TableRow></TableHeader>
              <TableBody>
                {usersData?.map(u => (
                  <TableRow key={u.id} className={cn(u.deviceId && deviceMap.get(u.deviceId).length > 1 && "bg-red-500/5")}>
                    <TableCell><p className="font-bold text-xs">{u.email || u.id}</p></TableCell>
                    <TableCell className="font-mono text-[10px] opacity-50">{u.deviceId}</TableCell>
                    <TableCell className="font-black text-green-500">🪙{u.withdrawableCoins || 0}</TableCell>
                    <TableCell>
                      <Button size="sm" variant={u.isBanned ? "outline" : "destructive"} onClick={() => updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned })}>
                        {u.isBanned ? "Pardon" : "Ban"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            <Button onClick={() => { setEditingMatch({ teamA: { name: '', logo: '' }, teamB: { name: '', logo: '' }, status: 'scheduled' }); setIsMatchDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> NEW BATTLE
            </Button>
            <div className="grid gap-4">
              {matchesData?.map(m => (
                <Card key={m.id} className="bg-card/20 border-white/5 p-6 rounded-2xl flex items-center justify-between">
                  <h4 className="font-black uppercase text-sm">{m.teamA?.name} VS {m.teamB?.name}</h4>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingMatch(m); setIsMatchDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteDoc(doc(firestore, 'matches', m.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden">
            <Table>
              <TableHeader><TableRow><TableHead>Warrior</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {transactionsData?.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{t.userId?.substring(0,8)}</TableCell>
                    <TableCell><Badge variant="outline">{t.type}</Badge></TableCell>
                    <TableCell className="font-black text-secondary">₹{t.amount || 0}</TableCell>
                    <TableCell><Badge>{t.status}</Badge></TableCell>
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
          </Card>
        )}

        {activeTab === 'revenue' && (
          <Card className="bg-card/30 border-primary/20 p-8 rounded-[2.5rem] max-w-2xl mx-auto space-y-6">
             <h2 className="text-2xl font-black uppercase italic">Control Center</h2>
             <Input value={cpaUrl} onChange={(e) => setCpaUrl(e.target.value)} placeholder="CPALead API URL" className="bg-black/40 h-14" />
             <div className="grid grid-cols-2 gap-4">
               <Input type="number" value={coinValue} onChange={(e) => setCoinValue(e.target.value)} placeholder="Coin Value per $" className="bg-black/40 h-14" />
               <Input type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} placeholder="Admin Profit %" className="bg-black/40 h-14" />
             </div>
             <Button onClick={handleUpdateRevenue} className="w-full h-14 font-black">SAVE CHANGES</Button>
          </Card>
        )}
      </main>

      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent className="bg-[#1a1a1a] text-white border-white/10">
          <DialogHeader><DialogTitle>BATTLE CONFIG</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveMatch} className="space-y-4">
            <Input value={editingMatch?.teamA?.name} onChange={e => setEditingMatch({...editingMatch!, teamA: {...editingMatch!.teamA!, name: e.target.value}})} placeholder="Team A Name" className="bg-black/40" />
            <Input value={editingMatch?.teamB?.name} onChange={e => setEditingMatch({...editingMatch!, teamB: {...editingMatch!.teamB!, name: e.target.value}})} placeholder="Team B Name" className="bg-black/40" />
            <Input value={editingMatch?.description} onChange={e => setEditingMatch({...editingMatch!, description: e.target.value})} placeholder="Description" className="bg-black/40" />
            <Button type="submit" className="w-full">SAVE</Button>
          </form>
        </DialogContent>
      </Dialog>
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
