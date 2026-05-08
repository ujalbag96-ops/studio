
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
  Sword,
  Edit2,
  Trash2,
  Fingerprint,
  Radio,
  Power,
  ExternalLink,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  Activity,
  Globe,
  ArrowUpRight,
  MoreVertical,
  Search,
  Bell
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { AppSettings, UserProfile, UserLedgerEntry, Match, Tournament, SupportMessage } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'tournaments' | 'transactions' | 'control' | 'repair'>('dashboard');
  const [isRepairing, setIsRepairing] = useState(false);

  // Identity check
  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const transactionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc'), limit(50)) : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const supportQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'support'), orderBy('timestamp', 'desc'), limit(5)) : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: transactionsData } = useCollection<UserLedgerEntry & { userId?: string }>(transactionsQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: supportData } = useCollection<SupportMessage>(supportQuery);
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
  const violationsCount = Array.from(deviceMap.values()).filter(l => l.length > 1).length;

  // Chart Data
  const pieData = [
    { name: 'BGMI', value: tournamentsData?.filter(t => t.gameType === 'BGMI').length || 0, color: '#FF7B00' },
    { name: 'Free Fire', value: tournamentsData?.filter(t => t.gameType === 'Free Fire').length || 0, color: '#22C55E' },
    { name: 'Ludo King', value: tournamentsData?.filter(t => t.gameType === 'Ludo King').length || 0, color: '#FACC15' },
  ];

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      {/* Sidebar - ThemeKit Style */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0f] hidden lg:flex flex-col fixed inset-y-0 left-0 z-50">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-black uppercase tracking-tighter text-lg">EAGLE<span className="text-primary">EYE</span></span>
        </div>
        
        <div className="flex-1 px-4 py-8 space-y-6">
          <div>
            <p className="px-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-4">Navigation</p>
            <nav className="space-y-1">
              <SidebarItem active={activeTab === 'dashboard'} icon={<LayoutDashboard />} label="Dashboard" onClick={() => setActiveTab('dashboard')} />
              <SidebarItem active={activeTab === 'users'} icon={<UsersIcon />} label="Warriors" onClick={() => setActiveTab('users')} badge={violationsCount > 0 ? violationsCount : undefined} />
              <SidebarItem active={activeTab === 'tournaments'} icon={<Trophy />} label="Campaigns" onClick={() => setActiveTab('tournaments')} />
              <SidebarItem active={activeTab === 'transactions'} icon={<History />} label="Financials" onClick={() => setActiveTab('transactions')} />
            </nav>
          </div>
          
          <div>
            <p className="px-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-4">System Control</p>
            <nav className="space-y-1">
              <SidebarItem active={activeTab === 'control'} icon={<Settings />} label="Control Center" onClick={() => setActiveTab('control')} />
              <SidebarItem active={activeTab === 'repair'} icon={<Wrench />} label="Repair Protocol" onClick={() => setActiveTab('repair')} />
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
           <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary">A</div>
              <div className="truncate">
                <p className="text-[10px] font-black uppercase">Admin Profile</p>
                <p className="text-[9px] text-muted-foreground truncate">{ADMIN_EMAIL}</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 bg-[#f4f7fa] dark:bg-[#050508] min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-[#0a0a0f] border-b border-black/5 dark:border-white/5 flex items-center justify-between px-8 sticky top-0 z-40">
           <div className="flex items-center gap-4 bg-black/5 dark:bg-white/5 px-4 py-2 rounded-xl w-96">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search operational data..." className="bg-transparent border-none outline-none text-xs w-full text-foreground" />
           </div>
           <div className="flex items-center gap-6">
              <div className="relative">
                <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><MoreVertical className="h-4 w-4" /></Button>
           </div>
        </header>

        <div className="p-8 space-y-8">
          {/* Section: Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <TopStatCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} color="blue" subtitle="Verified combatants" />
            <TopStatCard title="Device Violations" value={violationsCount} icon={<Fingerprint />} color="red" subtitle="Multi-account threats" />
            <TopStatCard title="Active Campaigns" value={tournamentsData?.length || 0} icon={<Trophy />} color="orange" subtitle="Current tournaments" />
            <TopStatCard title="Pending Payouts" value={transactionsData?.filter(t => t.status === 'pending').length || 0} icon={<ArrowUpRight />} color="green" subtitle="Awaiting authorization" />
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Middle Section: Distribution Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-2xl overflow-hidden">
                   <CardHeader className="border-b border-black/5 dark:border-white/5 flex flex-row items-center justify-between py-4">
                      <CardTitle className="text-xs font-black uppercase text-foreground">Operational Distribution</CardTitle>
                      <Globe className="h-4 w-4 text-muted-foreground" />
                   </CardHeader>
                   <CardContent className="p-8 h-80">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={pieData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                            <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0a0a0f', borderColor: '#ffffff10' }} />
                            <Bar dataKey="value" fill="#FF7B00" radius={[4, 4, 0, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-2xl overflow-hidden">
                   <CardHeader className="border-b border-black/5 dark:border-white/5 py-4">
                      <CardTitle className="text-xs font-black uppercase text-foreground">Campaign Mix</CardTitle>
                   </CardHeader>
                   <CardContent className="p-8 h-80">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                               {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                         </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-4 mt-4">
                         {pieData.map(item => (
                           <div key={item.name} className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-[10px] font-bold text-muted-foreground">{item.name}</span>
                           </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>
              </div>

              {/* Lower Section: Chat, Status, Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-2xl overflow-hidden h-[400px] flex flex-col">
                    <CardHeader className="border-b border-black/5 dark:border-white/5 py-4">
                       <CardTitle className="text-xs font-black uppercase text-foreground">Recent Intelligence</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 overflow-y-auto space-y-4 no-scrollbar">
                       {supportData?.map(msg => (
                         <div key={msg.id} className="flex gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                               <MessageSquare className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[10px] font-black uppercase truncate w-40">{msg.userId.substring(0,8)}...</p>
                               <p className="text-[11px] text-muted-foreground line-clamp-2">{msg.message}</p>
                            </div>
                         </div>
                       ))}
                    </CardContent>
                    <div className="p-4 border-t border-black/5 dark:border-white/5">
                       <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-primary">View Support Hub</Button>
                    </div>
                 </Card>

                 <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-2xl overflow-hidden h-[400px]">
                    <CardHeader className="border-b border-black/5 dark:border-white/5 py-4">
                       <CardTitle className="text-xs font-black uppercase text-foreground">Operational Health</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8 text-center">
                       <div className="h-24 w-24 rounded-full border-4 border-primary/20 flex items-center justify-center mx-auto relative">
                          <Activity className="h-10 w-10 text-primary animate-pulse" />
                       </div>
                       <div className="space-y-2">
                          <h4 className="text-2xl font-black uppercase italic">Arena Stable</h4>
                          <p className="text-xs text-muted-foreground">All global sectors functioning within nominal parameters.</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                             <p className="text-[9px] font-black uppercase text-muted-foreground">Latancy</p>
                             <p className="text-sm font-black text-green-500">24ms</p>
                          </div>
                          <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl">
                             <p className="text-[9px] font-black uppercase text-muted-foreground">Uptime</p>
                             <p className="text-sm font-black text-green-500">99.9%</p>
                          </div>
                       </div>
                    </CardContent>
                 </Card>

                 <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-2xl overflow-hidden h-[400px] flex flex-col">
                    <CardHeader className="border-b border-black/5 dark:border-white/5 py-4">
                       <CardTitle className="text-xs font-black uppercase text-foreground">Mission Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 overflow-y-auto space-y-6 no-scrollbar">
                       {transactionsData?.slice(0, 5).map((t, i) => (
                         <div key={t.id} className="flex gap-4 relative">
                            {i !== 4 && <div className="absolute left-[15px] top-8 w-px h-full bg-white/5" />}
                            <div className="h-8 w-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                               <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_primary]" />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[11px] font-black uppercase">{t.type} Sector Action</p>
                               <p className="text-[10px] text-muted-foreground italic">Operation {t.id.substring(0, 6)} synchronized.</p>
                            </div>
                         </div>
                       ))}
                    </CardContent>
                 </Card>
              </div>

              {/* Bottom Section: Data Tables */}
              <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-black/5 dark:border-white/5 p-6">
                   <CardTitle className="text-xs font-black uppercase text-foreground">Warrior Ledger</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader className="bg-black/5 dark:bg-white/5">
                    <TableRow className="border-black/5 dark:border-white/5">
                      <TableHead className="px-10 h-16 font-black uppercase text-[10px]">Warrior ID</TableHead>
                      <TableHead className="h-16 font-black uppercase text-[10px]">Security Tier</TableHead>
                      <TableHead className="h-16 font-black uppercase text-[10px]">Asset Balance</TableHead>
                      <TableHead className="h-16 font-black uppercase text-[10px] text-right px-10">Protocols</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.slice(0, 10).map(u => (
                      <TableRow key={u.id} className="border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                        <TableCell className="px-10 py-6">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary italic">W</div>
                             <div className="space-y-0.5">
                               <p className="font-black text-xs uppercase italic">{u.email || u.id.substring(0, 12)}</p>
                               <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Sig: {u.deviceId?.substring(0, 12)}...</p>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isBanned ? "destructive" : "secondary"} className="uppercase text-[8px] font-black tracking-widest px-3">
                            {u.isBanned ? "Excluded" : "Authenticated"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-black text-secondary text-sm">
                          {u.coins || 0} <span className="text-[8px] opacity-40 italic">🪙</span>
                        </TableCell>
                        <TableCell className="text-right px-10">
                           <Button variant="ghost" size="sm" className="h-10 w-10 rounded-xl"><MoreVertical className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Warrior Intelligence</h3>
                {violationsCount > 0 && (
                  <Badge variant="destructive" className="h-10 px-6 font-black uppercase">
                    <AlertTriangle className="mr-2 h-4 w-4" /> {violationsCount} Multi-Account Threats Detected
                  </Badge>
                )}
              </div>
              <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-3xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-black/5 dark:bg-white/5">
                    <TableRow className="border-black/5 dark:border-white/5">
                      <TableHead className="px-10 h-16 font-black uppercase text-[10px] tracking-widest">Warrior ID</TableHead>
                      <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                      <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest">Balance</TableHead>
                      <TableHead className="h-16 font-black uppercase text-[10px] tracking-widest text-right px-10">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.map(u => (
                      <TableRow key={u.id} className="border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
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
                <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-3xl p-12 space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <TrendingUp className="text-primary h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Economic constants</h3>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Coin Value per 1.00 Local Currency</Label>
                      <Input type="number" value={config.coinValuePerDollar} onChange={e => setConfig({ ...config, coinValuePerDollar: Number(e.target.value) })} className="bg-black/5 dark:bg-black/40 h-16 rounded-[1.5rem] border-black/10 dark:border-white/10 font-black text-xl px-6" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Admin Profit Retention %</Label>
                      <Input type="number" value={config.adminProfitPercentage} onChange={e => setConfig({ ...config, adminProfitPercentage: Number(e.target.value) })} className="bg-black/5 dark:bg-black/40 h-16 rounded-[1.5rem] border-black/10 dark:border-white/10 font-black text-xl px-6" />
                    </div>
                    <Button onClick={() => handleUpdateSettings({ coinValuePerDollar: config.coinValuePerDollar, adminProfitPercentage: config.adminProfitPercentage })} className="w-full h-16 bg-primary font-black uppercase tracking-widest text-base rounded-[1.5rem]">SYNC ECONOMIC DATA</Button>
                  </div>
                </Card>

                <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-3xl p-12 space-y-10">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
                      <Radio className="text-secondary h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Global Ad Hubs</h3>
                  </div>
                  <div className="space-y-8">
                    <div className="flex items-center justify-between p-6 bg-black/5 dark:bg-black/40 rounded-3xl border border-black/5 dark:border-white/5">
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest">Video Rewards</p>
                        <p className="text-[9px] text-muted-foreground font-medium uppercase italic">Enable Global Video Ads</p>
                      </div>
                      <Switch checked={config.videoWallEnabled} onCheckedChange={val => handleUpdateSettings({ videoWallEnabled: val })} />
                    </div>
                    <div className="flex items-center justify-between p-6 bg-black/5 dark:bg-black/40 rounded-3xl border border-black/5 dark:border-white/5">
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest">Elite Offer Wall</p>
                        <p className="text-[9px] text-muted-foreground font-medium uppercase italic">Enable CPA Lead Missions</p>
                      </div>
                      <Switch checked={config.offerWallEnabled} onCheckedChange={val => handleUpdateSettings({ offerWallEnabled: val })} />
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-3xl p-12 space-y-8">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                   <Zap className="text-amber-500" /> CPA Master Intel (JSON URL)
                </h3>
                <p className="text-xs text-muted-foreground font-medium max-w-2xl leading-relaxed">Provide your global CPA Lead API endpoint. All monetization will sync automatically with the user hub.</p>
                <div className="flex flex-col md:flex-row gap-6">
                  <Input value={config.cpaLeadUrl} onChange={e => setConfig({ ...config, cpaLeadUrl: e.target.value })} placeholder="https://cpalead.com/dashboard/reports/campaign_json.php?..." className="flex-1 bg-black/5 dark:bg-black/40 h-16 rounded-[1.5rem] border-black/10 dark:border-white/10" />
                  <Button onClick={() => handleUpdateSettings({ cpaLeadUrl: config.cpaLeadUrl })} className="h-16 px-12 bg-primary text-white font-black uppercase tracking-widest rounded-[1.5rem]">DEPLOY FEED</Button>
                </div>
              </Card>

              <div className="flex items-center justify-between p-12 bg-destructive/5 rounded-3xl border border-destructive/20">
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
                  <Card key={t.id} className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm p-8 rounded-[2.5rem] flex items-center justify-between group transition-all hover:scale-[1.02]">
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
              <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm rounded-3xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-black/5 dark:bg-white/5">
                    <TableRow className="border-black/5 dark:border-white/5">
                      <TableHead className="px-10 h-16 font-black uppercase text-[10px]">Warrior Signature</TableHead>
                      <TableHead className="h-16 font-black uppercase text-[10px]">Operation Type</TableHead>
                      <TableHead className="h-16 font-black uppercase text-[10px]">Volume</TableHead>
                      <TableHead className="h-16 font-black uppercase text-[10px]">Status</TableHead>
                      <TableHead className="text-right px-10 h-16 font-black uppercase text-[10px]">Protocol Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionsData?.map(t => (
                      <TableRow key={t.id} className="border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
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
            <Card className="max-w-2xl mx-auto bg-amber-500/5 border-amber-500/20 rounded-3xl p-16 text-center space-y-10 shadow-2xl">
              <div className="h-24 w-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20 animate-pulse">
                 <Wrench className="h-12 w-12 text-amber-500" />
              </div>
              <div className="space-y-4">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter text-foreground">System Restore</h2>
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
              }} disabled={isRepairing} className="w-full h-20 bg-amber-500 text-black font-black text-xl rounded-[1.5rem] shadow-2xl hover:bg-amber-400">
                {isRepairing ? <Loader2 className="animate-spin h-8 w-8" /> : "EXECUTE RESTORATION PROTOCOL"}
              </Button>
            </Card>
          )}
        </div>
      </main>

      {/* Tournament Deployment Dialog */}
      <Dialog open={isTournamentDialogOpen} onOpenChange={setIsTournamentDialogOpen}>
        <DialogContent className="bg-white dark:bg-[#121216] border-none text-foreground rounded-[3rem] p-12 max-w-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Campaign Intelligence</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTournament} className="space-y-8 pt-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Campaign Name</Label>
              <Input value={editingTournament?.name} onChange={e => setEditingTournament({...editingTournament!, name: e.target.value})} placeholder="e.g. Cyber Strike Alpha" className="bg-black/5 dark:bg-black/40 h-16 rounded-[1.5rem] border-black/10 dark:border-white/10 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prize Vault</Label>
                <Input value={editingTournament?.prizePool} onChange={e => setEditingTournament({...editingTournament!, prizePool: e.target.value})} placeholder="e.g. ₹5,000" className="bg-black/5 dark:bg-black/40 h-16 rounded-[1.5rem] border-black/10 dark:border-white/10 font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Entry (Coins)</Label>
                <Input type="number" value={editingTournament?.entryFee} onChange={e => setEditingTournament({...editingTournament!, entryFee: Number(e.target.value)})} placeholder="e.g. 50" className="bg-black/5 dark:bg-black/40 h-16 rounded-[1.5rem] border-black/10 dark:border-white/10 font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tactical Mode</Label>
              <Select value={editingTournament?.gameType} onValueChange={val => setEditingTournament({...editingTournament!, gameType: val as any})}>
                <SelectTrigger className="bg-black/5 dark:bg-black/40 h-16 rounded-[1.5rem] border-black/10 dark:border-white/10 font-bold"><SelectValue placeholder="Select Game" /></SelectTrigger>
                <SelectContent className="bg-white dark:bg-[#121216] border-white/5">
                  <SelectItem value="BGMI">BGMI</SelectItem>
                  <SelectItem value="Free Fire">Free Fire</SelectItem>
                  <SelectItem value="Ludo King">Ludo King</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full h-20 bg-primary font-black uppercase text-xl rounded-[1.5rem] shadow-2xl mt-4">
              DEPLOY TO ARENA
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SidebarItem({ active, icon, label, onClick, badge }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group", active ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground")}>
      <div className="flex items-center gap-3">
        <span className={cn("h-4 w-4", active && "text-primary")}>{icon}</span>
        <span className="text-[11px] font-black uppercase tracking-widest italic">{label}</span>
      </div>
      {badge && <span className="h-5 w-5 bg-destructive text-white rounded-md text-[8px] flex items-center justify-center font-black">{badge}</span>}
    </button>
  );
}

function TopStatCard({ title, value, icon, color, subtitle }: any) {
  const colorMap = {
    blue: "bg-blue-500",
    red: "bg-red-500",
    orange: "bg-primary",
    green: "bg-secondary"
  };

  return (
    <Card className="bg-white dark:bg-[#0a0a0f] border-none shadow-sm p-6 rounded-2xl flex items-center justify-between group transition-all hover:translate-y-[-4px]">
       <div className="space-y-1">
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{title}</p>
          <h4 className="text-2xl font-black text-foreground">{value}</h4>
          <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-widest">{subtitle}</p>
       </div>
       <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg", colorMap[color as keyof typeof colorMap])}>
          {icon}
       </div>
    </Card>
  );
}
