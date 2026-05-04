
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, increment, getDocs } from 'firebase/firestore';
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
  Gamepad2,
  Globe,
  CheckCircle2,
  XCircle,
  Activity,
  Coins,
  TrendingUp,
  Percent,
  PlayCircle,
  Ban,
  Smartphone,
  Fingerprint,
  Link as LinkIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings, Tournament, UserProfile, SupportMessage, UserLedgerEntry, Match } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'revenue' | 'transactions' | 'settings'>('dashboard');

  const isAdminUser = !!user && user.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase();

  const usersQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? collection(firestore, 'users') : null, 
    [firestore, isAdminUser]
  );
  const transactionsQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc')) : null, 
    [firestore, isAdminUser]
  );
  const settingsRef = useMemoFirebase(() => 
    (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, 
    [firestore, isAdminUser]
  );

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: transactionsData } = useCollection<UserLedgerEntry & { userId: string }>(transactionsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const [coinValue, setCoinValue] = useState<string>('100');
  const [profitMargin, setProfitMargin] = useState<string>('50');
  const [cpaUrl, setCpaUrl] = useState<string>('');
  const [adProvider, setAdProvider] = useState<'unity' | 'applovin'>('unity');
  const [adPlacementId, setAdPlacementId] = useState('');

  useEffect(() => {
    if (settings) {
      if (settings.coinValuePerDollar !== undefined) setCoinValue(settings.coinValuePerDollar.toString());
      if (settings.adminProfitPercentage !== undefined) setProfitMargin(settings.adminProfitPercentage.toString());
      if (settings.cpaLeadUrl) setCpaUrl(settings.cpaLeadUrl);
      if (settings.videoAdProvider) setAdProvider(settings.videoAdProvider);
      if (settings.videoAdPlacementId) setAdPlacementId(settings.videoAdPlacementId);
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
      toast({ title: "Revenue & API Settings Updated" });
    } catch (e: any) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleUpdateAdSettings = async () => {
    if (!firestore || !settingsRef) return;
    try {
      await setDoc(settingsRef, { videoAdProvider: adProvider, videoAdPlacementId: adPlacementId }, { merge: true });
      toast({ title: "Ad Settings Updated" });
    } catch (e: any) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleBanUser = async (targetUser: UserProfile) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'users', targetUser.id), { isBanned: !targetUser.isBanned });
      toast({ title: targetUser.isBanned ? "User Unbanned" : "User Banned Successfully" });
    } catch (e) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  if (isUserLoading) return <div className="flex flex-col items-center justify-center min-h-screen gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-muted-foreground font-medium">Verifying Admin Access...</p></div>;
  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center"><ShieldCheck className="h-16 w-16 mb-4 text-destructive" /><h1>Access Restricted</h1></div>;

  const deviceMap = new Map();
  usersData?.forEach(u => {
    if (u.deviceId) {
      const list = deviceMap.get(u.deviceId) || [];
      list.push(u);
      deviceMap.set(u.deviceId, list);
    }
  });

  return (
    <div className="flex min-h-screen bg-[#0d0d12] text-foreground">
      <aside className="w-64 border-r border-white/5 bg-card/30 backdrop-blur-2xl hidden md:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-black uppercase text-lg">Arena Admin</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 mt-4">
          <SidebarItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Overview" />
          <SidebarItem active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<UsersIcon />} label="User Manager" />
          <SidebarItem active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={<History />} label="Finances" />
          <SidebarItem active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} icon={<TrendingUp />} label="Revenue & API" />
          <SidebarItem active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings />} label="Global Config" />
        </nav>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-10 space-y-8 pb-32">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatsCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} />
            <StatsCard title="Suspicious Devices" value={Array.from(deviceMap.values()).filter(l => l.length > 1).length} icon={<Fingerprint className="text-red-500" />} />
            <StatsCard title="Banned Users" value={usersData?.filter(u => u.isBanned).length || 0} icon={<Ban className="text-red-500" />} />
            <StatsCard title="Payout Requests" value={transactionsData?.filter(t => t.type === 'withdrawal' && t.status === 'pending').length || 0} icon={<History />} />
          </div>
        )}

        {activeTab === 'users' && (
          <Card className="bg-card/30 border-white/5 rounded-[2rem] overflow-hidden">
            <CardHeader><CardTitle className="uppercase font-black text-sm text-primary flex items-center gap-2"><Fingerprint className="h-4 w-4" /> User Management</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Device ID</TableHead><TableHead>Coins</TableHead><TableHead>Status</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {usersData?.map(u => (
                    <TableRow key={u.id} className={cn(u.deviceId && deviceMap.get(u.deviceId).length > 1 && "bg-red-500/5")}>
                      <TableCell><p className="font-bold text-xs">{u.email || u.mobile || u.id}</p></TableCell>
                      <TableCell className="font-mono text-[10px] opacity-50">{u.deviceId}</TableCell>
                      <TableCell className="font-black">🪙{u.coins}</TableCell>
                      <TableCell><Badge variant={u.isBanned ? "destructive" : "outline"}>{u.isBanned ? "Banned" : "Active"}</Badge></TableCell>
                      <TableCell><Button size="sm" variant={u.isBanned ? "outline" : "destructive"} onClick={() => handleBanUser(u)}>{u.isBanned ? "Unban" : "Ban"}</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {activeTab === 'revenue' && (
          <div className="max-w-2xl space-y-8">
            <Card className="bg-card/30 border-primary/20 p-8 rounded-[2.5rem] space-y-8">
               <h2 className="text-xl font-black uppercase flex items-center gap-3"><TrendingUp className="text-primary" /> Revenue & API Controls</h2>
               <div className="grid gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase">CPALead API URL</Label>
                    <div className="relative">
                      <Input value={cpaUrl} onChange={(e) => setCpaUrl(e.target.value)} placeholder="https://www.cpalead.com/api/offers?id=..." className="bg-black/40 h-14 rounded-2xl pl-12" />
                      <LinkIcon className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase">Coin Value per $</Label>
                      <Input type="number" value={coinValue} onChange={(e) => setCoinValue(e.target.value)} className="bg-black/40 h-14 rounded-2xl" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase">Admin Margin (%)</Label>
                      <Input type="number" value={profitMargin} onChange={(e) => setProfitMargin(e.target.value)} className="bg-black/40 h-14 rounded-2xl" />
                    </div>
                  </div>
               </div>
               <Button onClick={handleUpdateRevenue} className="w-full h-16 bg-primary font-black uppercase text-lg rounded-2xl">Save Settings</Button>
            </Card>

            <Card className="bg-card/30 border-secondary/20 p-8 rounded-[2.5rem] space-y-8">
               <h2 className="text-xl font-black uppercase flex items-center gap-3"><PlayCircle className="text-secondary" /> Video Ad Config</h2>
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase">Ad Provider</Label>
                    <Select value={adProvider} onValueChange={(v: any) => setAdProvider(v)}>
                       <SelectTrigger className="bg-black/40 h-14 rounded-2xl"><SelectValue /></SelectTrigger>
                       <SelectContent><SelectItem value="unity">Unity Ads</SelectItem><SelectItem value="applovin">AppLovin</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase">Placement ID</Label>
                    <Input value={adPlacementId} onChange={(e) => setAdPlacementId(e.target.value)} className="bg-black/40 h-14 rounded-2xl" />
                  </div>
               </div>
               <Button onClick={handleUpdateAdSettings} className="w-full h-16 bg-secondary text-black font-black uppercase text-lg rounded-2xl">Update Ads</Button>
            </Card>
          </div>
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
