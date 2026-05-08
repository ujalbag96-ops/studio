
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, limit, deleteDoc, increment, where, getDocs } from 'firebase/firestore';
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
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Calendar,
  Activity,
  Palette,
  CreditCard,
  Target,
  FileText,
  Search,
  Eye,
  Check,
  X,
  Key,
  Award
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
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, GameType, SupportMessage } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
} from 'recharts';
import TransactionReceipt from '@/components/TransactionReceipt';
import { getCurrencyData } from '@/lib/currency';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTheme = 'midnight' | 'ocean' | 'blood' | 'gold' | 'neon' | 'royal';

const THEMES: Record<AdminTheme, { bg: string, primary: string, accent: string, text: string }> = {
  midnight: { bg: 'bg-[#050508]', primary: 'text-[#FF7B00]', accent: 'bg-[#FF7B00]', text: 'text-white' },
  ocean: { bg: 'bg-[#000d1a]', primary: 'text-[#00d4ff]', accent: 'bg-[#00d4ff]', text: 'text-white' },
  blood: { bg: 'bg-[#0a0000]', primary: 'text-[#ff1a1a]', accent: 'bg-[#ff1a1a]', text: 'text-white' },
  gold: { bg: 'bg-[#0f0a00]', primary: 'text-[#ffcc00]', accent: 'bg-[#ffcc00]', text: 'text-white' },
  neon: { bg: 'bg-[#000000]', primary: 'text-[#39ff14]', accent: 'bg-[#39ff14]', text: 'text-white' },
  royal: { bg: 'bg-[#0a001a]', primary: 'text-[#9345FF]', accent: 'bg-[#9345FF]', text: 'text-white' }
};

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'warriors' | 'security' | 'support' | 'campaigns' | 'finance' | 'control'>('overview');
  const [theme, setTheme] = useState<AdminTheme>('midnight');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [financeTimeFilter, setFinanceTimeFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
  const [ledgerFilter, setLedgerFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<UserLedgerEntry | null>(null);
  const [coinAdjustment, setCoinAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [winnerUid, setWinnerId] = useState('');
  const [sysConfig, setSysConfig] = useState<Partial<AppSettings>>({});

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return collection(firestore, 'users');
  }, [firestore, isAdminUser]);

  const allLedgerQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc'), limit(200));
  }, [firestore, isAdminUser]);

  const supportQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? query(collection(firestore, 'support'), where('status', '==', 'open'), orderBy('timestamp', 'desc'), limit(50)) : null, 
    [firestore, isAdminUser]
  );

  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: ledgerData, isLoading: isLedgerLoading } = useCollection<UserLedgerEntry>(allLedgerQuery);
  const { data: supportTickets } = useCollection<SupportMessage>(supportQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    if (settings) setSysConfig(settings);
  }, [settings]);

  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    return usersData.filter(u => {
      const matchesCountry = countryFilter === 'All' || u.country === countryFilter;
      const matchesSearch = !searchQuery || u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || u.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCountry && matchesSearch;
    });
  }, [usersData, countryFilter, searchQuery]);

  const multiAccountAlerts = useMemo(() => {
    if (!usersData) return new Set();
    const deviceMap: Record<string, string[]> = {};
    usersData.forEach(u => {
      if (u.deviceId) {
        if (!deviceMap[u.deviceId]) deviceMap[u.deviceId] = [];
        deviceMap[u.deviceId].push(u.id);
      }
    });
    const suspectDevices = new Set();
    Object.keys(deviceMap).forEach(d => {
      if (deviceMap[d].length > 1) suspectDevices.add(d);
    });
    return suspectDevices;
  }, [usersData]);

  const filteredLedger = useMemo(() => {
    if (!ledgerData) return [];
    let list = ledgerData;
    if (ledgerFilter === 'flagged') list = list.filter(t => t.status === 'review_required' || t.isFlagged);
    else if (ledgerFilter !== 'all') list = list.filter(t => t.type === ledgerFilter);
    return list;
  }, [ledgerData, ledgerFilter]);

  const financialStats = useMemo(() => {
    if (!ledgerData || !usersData) return { totalRevenue: 0, totalProfit: 0, totalUserBalance: 0, chartData: [] };

    const now = new Date();
    const filteredForStats = ledgerData.filter(tx => {
      if (financeTimeFilter === 'all') return true;
      const txDate = new Date(tx.date);
      const diffTime = Math.abs(now.getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (financeTimeFilter === 'day') return diffDays <= 1;
      if (financeTimeFilter === 'week') return diffDays <= 7;
      if (financeTimeFilter === 'month') return diffDays <= 30;
      if (financeTimeFilter === 'year') return diffDays <= 365;
      return true;
    });

    let totalRevenue = 0;
    let totalProfit = 0;
    filteredForStats.forEach(tx => {
      if (tx.type === 'deposit' || tx.type === 'income') totalRevenue += tx.amount;
      if (tx.type === 'conversion' || tx.type === 'withdrawal') {
        const fee = tx.type === 'conversion' ? (tx.amount * (sysConfig.conversionFeePercent || 0.012)) : (tx.amount * (sysConfig.withdrawalFeePercent || 0.08));
        totalProfit += fee;
      }
    });

    const totalUserBalance = usersData.reduce((acc, u) => acc + (u.coins || 0), 0) / 10;
    const dailyData: Record<string, { date: string, revenue: number, profit: number }> = {};
    filteredForStats.forEach(tx => {
      const d = tx.date;
      if (!dailyData[d]) dailyData[d] = { date: d, revenue: 0, profit: 0 };
      if (tx.type === 'deposit' || tx.type === 'income') dailyData[d].revenue += tx.amount;
      if (tx.type === 'conversion' || tx.type === 'withdrawal') {
        const fee = tx.type === 'conversion' ? (tx.amount * (sysConfig.conversionFeePercent || 0.012)) : (tx.amount * (sysConfig.withdrawalFeePercent || 0.08));
        dailyData[d].profit += fee;
      }
    });
    const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    return { totalRevenue, totalProfit, totalUserBalance, chartData };
  }, [ledgerData, usersData, financeTimeFilter, sysConfig]);

  const handleUpdateStatus = async (tx: UserLedgerEntry, newStatus: string) => {
    if (!firestore || !tx.userId) return;
    try {
      await updateDoc(doc(firestore, 'users', tx.userId, 'ledger', tx.id), { status: newStatus });
      toast({ title: `Transaction marked as ${newStatus}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleSaveConfig = async () => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'settings', 'global'), sysConfig, { merge: true });
      toast({ title: "System Config Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Config Save Failed" });
    }
  };

  const handleResolveSupport = async (id: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'support', id), { status: 'resolved' });
    toast({ title: "Ticket Resolved" });
  };

  const handleDeployRoom = async (tour: Tournament) => {
    if (!firestore || !tour.roomCredentials?.roomId) {
      toast({ variant: "destructive", title: "Room ID Required" });
      return;
    }
    await updateDoc(doc(firestore, 'tournaments', tour.id), { 'roomCredentials.isDeployed': true });
    toast({ title: "Room Credentials Transmitted to Warriors" });
  };

  const handleDistributePrizes = async (tour: Tournament) => {
    if (!firestore || !winnerUid) {
      toast({ variant: "destructive", title: "Winner UID Required" });
      return;
    }
    const prize = parseFloat(tour.prizePool.replace(/[^0-9.]/g, '')) * 10; // Convert to coins
    const uRef = doc(firestore, 'users', winnerUid);
    await updateDoc(uRef, { 
      winningBalance: increment(prize),
      coins: increment(prize) 
    });
    await addDoc(collection(firestore, 'users', winnerUid, 'ledger'), {
      type: 'income',
      amount: prize,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      description: `Arena Winner: ${tour.name} Prize Pool`
    });
    await updateDoc(doc(firestore, 'tournaments', tour.id), { status: 'completed', winnerId: winnerUid });
    toast({ title: "Victory Spoils Distributed!" });
    setSelectedTournament(null);
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black">UNAUTHORIZED ACCESS DETECTED</div>;

  const activeTheme = THEMES[theme];

  return (
    <div className={cn("flex min-h-screen transition-colors duration-500", activeTheme.bg, activeTheme.text)}>
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      <aside className="w-64 bg-black/40 border-r border-white/5 hidden lg:flex flex-col fixed inset-y-0 z-50 backdrop-blur-xl">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className={cn("h-6 w-6", activeTheme.primary)} />
          <span className="font-black uppercase tracking-tighter text-lg italic">EAGLE<span className={activeTheme.primary.replace('text-', 'text-')}>EYE</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItem active={activeTab === 'overview'} icon={<LayoutDashboard />} label="CONTROL" onClick={() => setActiveTab('overview')} theme={activeTheme} />
          <NavItem active={activeTab === 'warriors'} icon={<UsersIcon />} label="WARRIORS" onClick={() => setActiveTab('warriors')} theme={activeTheme} />
          <NavItem active={activeTab === 'finance'} icon={<TrendingUp />} label="FINANCE" onClick={() => setActiveTab('finance')} theme={activeTheme} />
          <NavItem active={activeTab === 'security'} icon={<ShieldAlert />} label="SECURITY" onClick={() => setActiveTab('security')} count={filteredLedger.filter(l => l.status === 'review_required').length} theme={activeTheme} />
          <NavItem active={activeTab === 'support'} icon={<MessageSquare />} label="SUPPORT" onClick={() => setActiveTab('support')} count={supportTickets?.length} theme={activeTheme} />
          <NavItem active={activeTab === 'campaigns'} icon={<Trophy />} label="ARENA" onClick={() => setActiveTab('campaigns')} theme={activeTheme} />
          <NavItem active={activeTab === 'control'} icon={<Settings />} label="SYSTEM" onClick={() => setActiveTab('control')} theme={activeTheme} />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
           <div className="grid grid-cols-3 gap-2">
              {(Object.keys(THEMES) as AdminTheme[]).map(t => (
                <button 
                  key={t}
                  onClick={() => setTheme(t)}
                  className={cn(
                    "h-6 w-full rounded-full border border-white/10 transition-all",
                    theme === t ? "ring-2 ring-white ring-offset-2 ring-offset-black scale-110" : "opacity-40 hover:opacity-100",
                    THEMES[t].bg.replace('bg-', 'bg-')
                  )}
                />
              ))}
           </div>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 pb-20">
        <header className="h-16 bg-black/20 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-60">{activeTab} Sector</h2>
          </div>
          <div className="flex items-center gap-4">
             <Badge className={cn("border-none text-[9px] font-black uppercase px-4 py-1", activeTheme.accent, "text-black")}>COMMAND TERMINAL</Badge>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} color="blue" />
                <StatCard title="Platform Revenue" value={`₹${financialStats.totalRevenue.toFixed(0)}`} icon={<TrendingUp />} color="orange" />
                <StatCard title="Est. Payout Profit" value={`₹${financialStats.totalProfit.toFixed(0)}`} icon={<Target />} color="green" />
                <StatCard title="User Liabilities" value={`₹${financialStats.totalUserBalance.toFixed(0)}`} icon={<Coins />} color="red" />
              </div>

              <Card className="bg-black/20 border-white/5 rounded-[2.5rem] p-10">
                 <div className="flex justify-between mb-8">
                    <h3 className="text-xl font-black italic uppercase">Revenue Matrix</h3>
                    <div className="flex gap-2">
                       {['day', 'week', 'month', 'all'].map(f => (
                         <Button key={f} size="sm" variant={financeTimeFilter === f ? 'secondary' : 'ghost'} onClick={() => setFinanceTimeFilter(f as any)} className="text-[9px] font-black uppercase h-8 px-4">{f}</Button>
                       ))}
                    </div>
                 </div>
                 <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={financialStats.chartData}>
                          <defs>
                             <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                          <XAxis dataKey="date" stroke="#ffffff20" fontSize={8} />
                          <YAxis stroke="#ffffff20" fontSize={8} />
                          <Tooltip contentStyle={{ background: '#0a0a0f', border: 'none', borderRadius: '12px' }} />
                          <Area type="monotone" dataKey="profit" stroke="#22C55E" fillOpacity={1} fill="url(#colorProfit)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>
            </>
          )}

          {activeTab === 'warriors' && (
            <div className="space-y-6">
              <div className="flex gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by Email or Warrior UID..." className="h-14 pl-12 bg-black/40 border-white/10 rounded-2xl" />
                 </div>
                 <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-64 h-14 bg-black/40 border-white/10 rounded-2xl">
                      <SelectValue placeholder="All Regions" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                      <SelectItem value="All">Global Command</SelectItem>
                      <SelectItem value="India">India Hub</SelectItem>
                      <SelectItem value="United States">USA Hub</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              <Card className="bg-black/20 border-white/5 rounded-[3rem] overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="px-8 font-black uppercase text-[9px] py-6">Warrior Profile</TableHead>
                      <TableHead className="font-black uppercase text-[9px]">Balances (Dep/Win/Task)</TableHead>
                      <TableHead className="font-black uppercase text-[9px]">Security Status</TableHead>
                      <TableHead className="text-right px-8 font-black uppercase text-[9px]">Operational Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map(u => (
                      <TableRow key={u.id} className="border-white/5">
                        <TableCell className="px-8 py-8">
                           <p className="font-black text-xs uppercase text-white">{u.email || u.id.substring(0,10)}</p>
                           <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{u.id}</p>
                        </TableCell>
                        <TableCell>
                           <div className="flex gap-2 text-[10px] font-black">
                              <span className="text-blue-400">D:{u.depositBalance}</span>
                              <span className="text-green-400">W:{u.winningBalance?.toFixed(0)}</span>
                              <span className="text-amber-400">T:{u.taskBalance?.toFixed(0)}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           {multiAccountAlerts.has(u.deviceId) && <Badge className="bg-red-500 text-white text-[8px] font-black uppercase">SAME DEVICE ALERT</Badge>}
                           {u.isVpnActive && <Badge className="bg-orange-500 text-white text-[8px] font-black uppercase ml-1">VPN</Badge>}
                        </TableCell>
                        <TableCell className="text-right px-8 space-x-2">
                           <Button onClick={() => setCoinAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} size="sm" className="h-9 px-4 text-[9px] font-black uppercase rounded-xl">EDIT BAL</Button>
                           <Button onClick={() => updateDoc(doc(firestore!, 'users', u.id), { isBanned: !u.isBanned })} variant={u.isBanned ? "outline" : "destructive"} size="sm" className="h-9 px-4 text-[9px] font-black uppercase rounded-xl">
                              {u.isBanned ? "RELEASE" : "BAN"}
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase italic">Transactional Audit Sector</h3>
                  <Select value={ledgerFilter} onValueChange={setLedgerFilter}>
                    <SelectTrigger className="w-48 bg-black/40 border-white/10 rounded-xl h-10 text-[10px] font-black uppercase">
                       <SelectValue placeholder="All Activities" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10 text-white">
                       <SelectItem value="all">All Records</SelectItem>
                       <SelectItem value="withdrawal">Withdrawals</SelectItem>
                       <SelectItem value="deposit">Deposits</SelectItem>
                       <SelectItem value="flagged">Flagged Alerts</SelectItem>
                    </SelectContent>
                  </Select>
               </div>
               <Card className="bg-black/20 border-white/5 rounded-[2.5rem] overflow-hidden">
                 <Table>
                    <TableHeader className="bg-white/5">
                       <TableRow className="border-white/5">
                          <TableHead className="px-8 py-5 font-black uppercase text-[9px]">Transaction / Date</TableHead>
                          <TableHead className="font-black uppercase text-[9px]">User / Region</TableHead>
                          <TableHead className="font-black uppercase text-[9px]">Volume</TableHead>
                          <TableHead className="font-black uppercase text-[9px]">Status</TableHead>
                          <TableHead className="text-right px-8 font-black uppercase text-[9px]">Command</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {filteredLedger.map(tx => (
                         <TableRow key={tx.id} className="border-white/5 hover:bg-white/5">
                            <TableCell className="px-8 py-6">
                               <p className="font-black text-xs uppercase">{tx.type}</p>
                               <p className="text-[8px] font-bold text-muted-foreground">{tx.date}</p>
                            </TableCell>
                            <TableCell className="text-[10px] font-bold">{tx.userId?.substring(0,12)}</TableCell>
                            <TableCell className={cn("text-lg font-black", tx.type === 'withdrawal' ? 'text-red-400' : 'text-green-400')}>
                               {tx.currencySymbol}{tx.amount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                               <Badge className={cn("text-[8px] font-black", tx.status === 'completed' ? 'bg-green-500/10 text-green-500' : tx.status === 'review_required' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500')}>
                                  {tx.status}
                               </Badge>
                            </TableCell>
                            <TableCell className="text-right px-8 space-x-2">
                               <Button size="icon" variant="ghost" onClick={() => setSelectedTx(tx)}><Eye className="h-4 w-4" /></Button>
                               {tx.status !== 'completed' && <Button onClick={() => handleUpdateStatus(tx, 'completed')} size="icon" className="bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white"><Check className="h-4 w-4" /></Button>}
                               {tx.status !== 'failed' && <Button onClick={() => handleUpdateStatus(tx, 'failed')} size="icon" variant="ghost" className="text-red-400"><X className="h-4 w-4" /></Button>}
                            </TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                 </Table>
               </Card>
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-8">
               <div className="flex justify-between">
                  <h3 className="text-2xl font-black italic uppercase">Campaign Deployment</h3>
                  <Button className={cn("h-14 px-10 rounded-2xl font-black uppercase text-black", activeTheme.accent)}>NEW CAMPAIGN</Button>
               </div>
               <div className="grid md:grid-cols-2 gap-8">
                  {tournamentsData?.map(tour => (
                    <Card key={tour.id} className="bg-black/20 border-white/5 rounded-[3rem] overflow-hidden">
                       <div className="h-40 bg-muted relative">
                          <img src={tour.banner} className="w-full h-full object-cover opacity-60" />
                          <Badge className="absolute top-4 left-4 bg-primary text-black font-black uppercase text-[9px]">{tour.status}</Badge>
                       </div>
                       <CardContent className="p-8 space-y-6">
                          <div>
                             <h4 className="text-xl font-black uppercase italic">{tour.name}</h4>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase">{tour.startDate}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Room ID</p>
                                <Input 
                                  value={tour.roomCredentials?.roomId || ''} 
                                  onChange={e => updateDoc(doc(firestore!, 'tournaments', tour.id), { 'roomCredentials.roomId': e.target.value })} 
                                  className="h-10 bg-black/40 text-center font-black"
                                />
                             </div>
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Password</p>
                                <Input 
                                  value={tour.roomCredentials?.roomPassword || ''} 
                                  onChange={e => updateDoc(doc(firestore!, 'tournaments', tour.id), { 'roomCredentials.roomPassword': e.target.value })} 
                                  className="h-10 bg-black/40 text-center font-black"
                                />
                             </div>
                          </div>
                          <div className="flex gap-3">
                             <Button onClick={() => handleDeployRoom(tour)} disabled={tour.roomCredentials?.isDeployed} className="flex-1 h-12 bg-primary text-black font-black uppercase text-[10px] rounded-xl">
                                {tour.roomCredentials?.isDeployed ? "DEPLOYED" : "DEPLOY ROOM"}
                             </Button>
                             <Button onClick={() => setSelectedTournament(tour)} variant="outline" className="h-12 w-12 rounded-xl border-white/10">
                                <Award className="h-5 w-5" />
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="max-w-4xl mx-auto space-y-10">
               <Card className="bg-black/20 border-white/5 rounded-[3rem] p-12 space-y-10">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-2xl">
                      <Settings className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter">System Core</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CPA Network URL</Label>
                        <Input value={sysConfig.cpaLeadUrl || ''} onChange={e => setSysConfig({...sysConfig, cpaLeadUrl: e.target.value})} className="h-14 bg-black/40 border-white/10 rounded-xl" />
                     </div>
                     <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telegram Support</Label>
                        <Input value={sysConfig.telegramUrl || ''} onChange={e => setSysConfig({...sysConfig, telegramUrl: e.target.value})} className="h-14 bg-black/40 border-white/10 rounded-xl" />
                     </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Conversion Fee (%)</Label>
                        <Input type="number" value={sysConfig.conversionFeePercent || ''} onChange={e => setSysConfig({...sysConfig, conversionFeePercent: Number(e.target.value)})} className="h-12 bg-black/40" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Withdraw Fee (%)</Label>
                        <Input type="number" value={sysConfig.withdrawalFeePercent || ''} onChange={e => setSysConfig({...sysConfig, withdrawalFeePercent: Number(e.target.value)})} className="h-12 bg-black/40" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Passive Ref (%)</Label>
                        <Input type="number" value={sysConfig.passiveReferralPercent || ''} onChange={e => setSysConfig({...sysConfig, passiveReferralPercent: Number(e.target.value)})} className="h-12 bg-black/40" />
                     </div>
                  </div>

                  <Button onClick={handleSaveConfig} className={cn("w-full h-20 rounded-[1.5rem] font-black uppercase tracking-widest text-lg shadow-2xl text-black", activeTheme.accent)}>SAVE CORE CONFIG</Button>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* Adjustment Dialogs */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="bg-[#0a0a0f] border-white/10 text-white rounded-[3rem] p-10 max-w-md">
            <DialogHeader><DialogTitle className="text-2xl font-black italic uppercase">Adjust Warrior Wealth</DialogTitle></DialogHeader>
            <div className="space-y-8 pt-8">
              <Select value={coinAdjustment.bucket} onValueChange={(val: any) => setCoinAdjustment({...coinAdjustment, bucket: val})}>
                <SelectTrigger className="h-14 bg-black/40 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black text-white"><SelectItem value="deposit">Deposit</SelectItem><SelectItem value="winning">Winning</SelectItem><SelectItem value="task">Task</SelectItem></SelectContent>
              </Select>
              <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="h-16 text-3xl font-black text-primary text-center" />
              <Button onClick={() => {
                 const { userId, bucket, amount } = coinAdjustment;
                 const payload: any = { coins: increment(amount) };
                 if (bucket === 'deposit') payload.depositBalance = increment(amount);
                 if (bucket === 'winning') payload.winningBalance = increment(amount);
                 if (bucket === 'task') payload.taskBalance = increment(amount);
                 updateDoc(doc(firestore!, 'users', userId), payload);
                 addDoc(collection(firestore!, 'users', userId, 'ledger'), { type: 'income', amount, date: new Date().toISOString().split('T')[0], status: 'completed', description: `Admin override: ${bucket} adjustment` });
                 setCoinAdjustment(null);
                 toast({ title: "Wealth Re-allocated" });
              }} className={cn("w-full h-16 rounded-xl font-black uppercase tracking-widest text-black", activeTheme.accent)}>EXECUTE OVERRIDE</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedTournament && (
        <Dialog open={!!selectedTournament} onOpenChange={() => setSelectedTournament(null)}>
          <DialogContent className="bg-[#0a0a0f] border-white/10 text-white rounded-[2rem] p-8">
             <DialogHeader><DialogTitle className="text-xl font-black uppercase italic">Validate Result: {selectedTournament.name}</DialogTitle></DialogHeader>
             <div className="space-y-6 pt-6">
                <p className="text-xs text-muted-foreground italic font-medium leading-relaxed">Enter the Warrior UID of the winner. The prize pool will be automatically converted to coins and distributed to their winning balance.</p>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground">Winner Warrior UID</Label>
                   <Input value={winnerUid} onChange={e => setWinnerId(e.target.value)} placeholder="Enter UID..." className="h-14 bg-black/40 border-white/10 rounded-xl" />
                </div>
                <Button onClick={() => handleDistributePrizes(selectedTournament)} className="w-full h-16 bg-green-500 hover:bg-green-600 text-black font-black uppercase tracking-widest rounded-xl">DISTRIBUTE SPOILS</Button>
             </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function NavItem({ active, icon, label, onClick, count, theme }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group", active ? theme.accent + " text-black shadow-xl" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      <div className="flex items-center gap-4">
        <span className={cn("h-5 w-5", active ? "scale-110" : "group-hover:scale-110 opacity-60")}>{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-widest italic">{label}</span>
      </div>
      {count > 0 && <Badge className="bg-red-500 text-white border-none text-[8px] h-4 min-w-4 flex items-center justify-center p-0 rounded-full font-black">{count}</Badge>}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap = { blue: "bg-blue-600/10 text-blue-500", orange: "bg-primary/10 text-primary", red: "bg-red-600/10 text-red-500", green: "bg-green-600/10 text-green-500" };
  return (
    <Card className="bg-black/20 border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between group hover:scale-[1.02] transition-all">
       <div className="space-y-1">
          <p className="text-[9px] font-black uppercase text-muted-foreground/60">{title}</p>
          <h4 className="text-3xl font-black italic tracking-tighter">{value}</h4>
       </div>
       <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:rotate-12", colorMap[color as keyof typeof colorMap])}>
          {icon}
       </div>
    </Card>
  );
}
