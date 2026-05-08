
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
  X
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
  BarChart,
  Bar
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
  const [financeTimeFilter, setFinanceTimeFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
  const [ledgerFilter, setLedgerFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<UserLedgerEntry | null>(null);
  const [coinAdjustment, setCoinAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);
  
  // System Config State
  const [sysConfig, setSysConfig] = useState<Partial<AppSettings>>({});

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    if (countryFilter === 'All') return collection(firestore, 'users');
    return query(collection(firestore, 'users'), where('country', '==', countryFilter));
  }, [firestore, isAdminUser, countryFilter]);

  const allLedgerQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    let baseQuery = collectionGroup(firestore, 'ledger');
    return query(baseQuery, orderBy('date', 'desc'), limit(100));
  }, [firestore, isAdminUser]);

  const flaggedTxsQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? query(collectionGroup(firestore, 'ledger'), where('status', '==', 'review_required'), orderBy('date', 'desc')) : null, 
    [firestore, isAdminUser]
  );

  const supportQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? query(collection(firestore, 'support'), where('status', '==', 'open'), orderBy('timestamp', 'desc'), limit(20)) : null, 
    [firestore, isAdminUser]
  );

  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);

  const { data: usersData } = useCollection<UserProfile>(usersQuery);
  const { data: ledgerData, isLoading: isLedgerLoading } = useCollection<UserLedgerEntry>(allLedgerQuery);
  const { data: flaggedTxs } = useCollection<UserLedgerEntry>(flaggedTxsQuery);
  const { data: supportTickets } = useCollection<SupportMessage>(supportQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    if (settings) setSysConfig(settings);
  }, [settings]);

  const filteredLedger = useMemo(() => {
    if (!ledgerData) return [];
    if (ledgerFilter === 'all') return ledgerData;
    if (ledgerFilter === 'flagged') return ledgerData.filter(t => t.status === 'review_required' || t.isFlagged);
    return ledgerData.filter(t => t.type === ledgerFilter);
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
        const fee = tx.type === 'conversion' ? (tx.amount / 0.988) * 0.012 : (tx.amount / 0.92) * 0.08;
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
         const fee = tx.type === 'conversion' ? (tx.amount / 0.988) * 0.012 : (tx.amount / 0.92) * 0.08;
         dailyData[d].profit += fee;
      }
    });

    const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    return { totalRevenue, totalProfit, totalUserBalance, chartData };
  }, [ledgerData, usersData, financeTimeFilter]);

  const handleUpdateStatus = async (tx: UserLedgerEntry, newStatus: string) => {
    if (!firestore || !tx.userId) return;
    try {
      const txRef = doc(firestore, 'users', tx.userId, 'ledger', tx.id);
      await updateDoc(txRef, { status: newStatus });
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
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem active={activeTab === 'overview'} icon={<LayoutDashboard />} label="CONTROL" onClick={() => setActiveTab('overview')} theme={activeTheme} />
          <NavItem active={activeTab === 'warriors'} icon={<UsersIcon />} label="WARRIORS" onClick={() => setActiveTab('warriors')} theme={activeTheme} />
          <NavItem active={activeTab === 'finance'} icon={<TrendingUp />} label="FINANCE" onClick={() => setActiveTab('finance')} theme={activeTheme} />
          <NavItem active={activeTab === 'security'} icon={<ShieldAlert />} label="SECURITY" onClick={() => setActiveTab('security')} count={flaggedTxs?.length} theme={activeTheme} />
          <NavItem active={activeTab === 'support'} icon={<MessageSquare />} label="SUPPORT" onClick={() => setActiveTab('support')} count={supportTickets?.length} theme={activeTheme} />
          <NavItem active={activeTab === 'campaigns'} icon={<Trophy />} label="ARENA" onClick={() => setActiveTab('campaigns')} theme={activeTheme} />
          <NavItem active={activeTab === 'control'} icon={<Settings />} label="SYSTEM" onClick={() => setActiveTab('control')} theme={activeTheme} />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
           <div className="flex items-center gap-2 px-4 mb-2">
              <Palette className="h-4 w-4 opacity-40" />
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Admin Theme</span>
           </div>
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
             <Badge className={cn("border-none text-[9px] font-black uppercase px-4 py-1", activeTheme.accent, "text-black")}>ADMIN TERMINAL ACTIVE</Badge>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'finance' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Volume Aggregate" value={`~₹${financialStats.totalRevenue.toFixed(0)}`} icon={<TrendingUp />} color="green" />
                <StatCard title="Est. Platform Profit" value={`~₹${financialStats.totalProfit.toFixed(0)}`} icon={<Target />} color="orange" />
                <StatCard title="Global User Liability" value={`~₹${financialStats.totalUserBalance.toFixed(0)}`} icon={<Coins />} color="blue" />
                <StatCard title="Security Flags" value={flaggedTxs?.length || 0} icon={<ShieldAlert />} color="red" />
              </div>

              <Card className="bg-black/20 border-white/5 rounded-[3rem] overflow-hidden">
                <CardHeader className="p-10 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black italic uppercase flex items-center gap-3">
                      <History className={activeTheme.primary} />
                      Multi-Currency Audit
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Global Payout & Intake Audit Feed</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Select value={ledgerFilter} onValueChange={setLedgerFilter}>
                      <SelectTrigger className="w-40 bg-black/40 border-white/10 h-11 rounded-xl text-[10px] font-black uppercase">
                        <SelectValue placeholder="Protocol" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                        <SelectItem value="all">All Protocols</SelectItem>
                        <SelectItem value="withdrawal">Withdrawals</SelectItem>
                        <SelectItem value="deposit">Deposits</SelectItem>
                        <SelectItem value="conversion">Conversions</SelectItem>
                        <SelectItem value="flagged">Flagged Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="px-10 font-black uppercase text-[9px] tracking-widest py-6">Warrior / Date</TableHead>
                        <TableHead className="font-black uppercase text-[9px] tracking-widest">Region / Protocol</TableHead>
                        <TableHead className="font-black uppercase text-[9px] tracking-widest">Local Volume</TableHead>
                        <TableHead className="font-black uppercase text-[9px] tracking-widest">Status</TableHead>
                        <TableHead className="px-10 text-right font-black uppercase text-[9px] tracking-widest">Command</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLedgerLoading ? (
                        <TableRow><TableCell colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" /></TableCell></TableRow>
                      ) : filteredLedger.length > 0 ? (
                        filteredLedger.map(tx => {
                          const currency = tx.currencySymbol || (tx.type === 'withdrawal' ? '₹' : '');
                          return (
                            <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 transition-all group">
                              <TableCell className="px-10 py-6">
                                 <div className="space-y-1">
                                    <p className="font-black text-xs uppercase tracking-tight text-white">{tx.userId?.substring(0,12) || 'UNKNOWN'}</p>
                                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest italic">{tx.date}</p>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-col gap-1">
                                    <Badge variant="outline" className="w-fit border-white/10 text-[8px] font-black uppercase px-3 bg-white/5">
                                       {tx.type}
                                    </Badge>
                                    <span className="text-[7px] text-muted-foreground font-bold uppercase">{tx.currencySymbol ? 'Global Hub' : 'India Hub'}</span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <p className={cn(
                                   "text-lg font-black tracking-tighter tabular-nums",
                                   tx.type === 'withdrawal' ? 'text-red-400' : 'text-green-400'
                                 )}>
                                   {tx.type === 'withdrawal' ? `${currency}${tx.amount.toFixed(2)}` : `${tx.amount} 🪙`}
                                 </p>
                              </TableCell>
                              <TableCell>
                                 <Badge 
                                  className={cn(
                                    "capitalize text-[8px] font-black px-4 py-1 rounded-lg",
                                    tx.status === 'completed' ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                                    tx.status === 'review_required' ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                                    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                  )}
                                 >
                                   {tx.status}
                                 </Badge>
                              </TableCell>
                              <TableCell className="px-10 text-right space-x-2">
                                 <Button size="icon" variant="ghost" onClick={() => setSelectedTx(tx)} className="h-9 w-9 rounded-xl hover:bg-white/10">
                                    <Eye className="h-4 w-4" />
                                 </Button>
                                 {tx.status !== 'completed' && (
                                   <Button 
                                     onClick={() => handleUpdateStatus(tx, 'completed')}
                                     className="h-9 w-9 rounded-xl bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border-none"
                                   >
                                      <Check className="h-4 w-4" />
                                   </Button>
                                 )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow><TableCell colSpan={5} className="py-20 text-center text-muted-foreground italic font-black uppercase text-[10px]">No operational records found.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} color="blue" />
                <StatCard title="Active Campaigns" value={tournamentsData?.length || 0} icon={<Trophy />} color="orange" />
                <StatCard title="Est. Profit (Base)" value={`₹${financialStats.totalProfit.toFixed(0)}`} icon={<Target />} color="green" />
                <StatCard title="Support Tickets" value={supportTickets?.length || 0} icon={<MessageSquare />} color="red" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-black/20 border-white/5 rounded-[2.5rem] p-8 space-y-6 overflow-hidden relative">
                   <div className="flex justify-between items-center relative z-10">
                      <div>
                        <h3 className="text-xl font-black italic uppercase">Revenue Matrix</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Global Aggregate Analysis (INR Base)</p>
                      </div>
                      <Activity className="h-6 w-6 opacity-20" />
                   </div>
                   <div className="h-[250px] w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={financialStats.chartData}>
                            <defs>
                               <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={activeTheme.primary.replace('text-', '#')} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={activeTheme.primary.replace('text-', '#')} stopOpacity={0}/>
                               </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                            <XAxis dataKey="date" stroke="#ffffff20" fontSize={8} />
                            <YAxis stroke="#ffffff20" fontSize={8} />
                            <Tooltip 
                               contentStyle={{ background: '#0a0a0f', border: '1px solid #ffffff10', borderRadius: '12px' }}
                               itemStyle={{ fontSize: '10px', fontWeight: '900' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke={activeTheme.primary.replace('text-', '#')} fillOpacity={1} fill="url(#colorRev)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <div className="grid gap-6">
                   <Card className="bg-black/20 border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between overflow-hidden relative group">
                      <div className="absolute -top-10 -right-10 opacity-5 rotate-12 transition-transform group-hover:scale-125 duration-1000">
                         <Target className="h-40 w-40" />
                      </div>
                      <div className="space-y-1 relative z-10">
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Platform Est. Profit</p>
                         <h4 className="text-5xl font-black italic tracking-tighter text-green-500">₹{financialStats.totalProfit.toFixed(2)}</h4>
                      </div>
                      <div className="flex items-center gap-2 pt-4 relative z-10">
                         <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] uppercase">Normalized to INR Base</Badge>
                      </div>
                   </Card>

                   <Card className="bg-black/20 border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total User Liability</p>
                         <h4 className="text-4xl font-black italic tracking-tighter">~₹{financialStats.totalUserBalance.toFixed(2)}</h4>
                         <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Estimated global value locked in warrior wallets</p>
                      </div>
                   </Card>
                </div>
              </div>
            </>
          )}

          {activeTab === 'warriors' && (
            <div className="space-y-6">
              <Card className="bg-white/5 border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Filter className={cn("h-4 w-4", activeTheme.primary)} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Region Hub:</span>
                  </div>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-64 bg-black/40 border-white/10 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      <SelectValue placeholder="All Sectors" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                      <SelectItem value="All">Global Command</SelectItem>
                      <SelectItem value="India">India Hub (₹)</SelectItem>
                      <SelectItem value="United States">USA Hub ($)</SelectItem>
                      <SelectItem value="United Kingdom">UK Hub (£)</SelectItem>
                      <SelectItem value="United Arab Emirates">UAE Hub (د.إ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="bg-black/20 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="px-8 font-black uppercase text-[9px] tracking-widest text-muted-foreground py-6">Warrior Identity</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Local Portfolio / Region</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Tactical Status</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground text-right px-8">Operational Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.map(u => {
                      const currency = getCurrencyData(u.country);
                      return (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                          <TableCell className="px-8 py-8">
                            <div className="space-y-1">
                               <p className="font-black text-sm uppercase italic tracking-tight">{u.email || u.id.substring(0,10)}</p>
                               <div className="flex items-center gap-2">
                                  <Badge className="bg-white/5 text-[7px] font-black border-none px-2 text-muted-foreground">{u.deviceId?.substring(0,12)}</Badge>
                                  {u.isVpnActive && <Badge className="bg-red-500/20 text-red-500 text-[7px] border-none font-black uppercase">VPN ALERT</Badge>}
                               </div>
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="space-y-3">
                                <div className="flex gap-2">
                                   <div className="bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10 text-center">
                                      <p className="text-[7px] font-black text-blue-500/60 uppercase mb-0.5">DEP</p>
                                      <p className="text-xs font-black">{u.depositBalance || 0}</p>
                                   </div>
                                   <div className="bg-green-500/5 px-3 py-1.5 rounded-lg border border-green-500/10 text-center">
                                      <p className="text-[7px] font-black text-green-500/60 uppercase mb-0.5">WIN</p>
                                      <p className="text-xs font-black text-green-500">{u.winningBalance?.toFixed(0) || 0}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2 text-[8px] font-black uppercase text-muted-foreground">
                                   <Globe className="h-2.5 w-2.5" /> {u.country || 'Global'} ({currency.symbol})
                                </div>
                             </div>
                          </TableCell>
                          <TableCell>
                             <div className="space-y-2">
                                <Badge variant="outline" className={cn("text-[9px] border-white/10 font-black uppercase px-4", u.rank === 'Gold' ? 'text-amber-500 border-amber-500/20' : 'text-primary')}>
                                   {u.rank || 'Bronze'}
                                </Badge>
                                <p className="text-[8px] font-black text-muted-foreground uppercase italic">VAL: {currency.symbol}{((u.coins || 0) / currency.rateToCoins).toFixed(2)}</p>
                             </div>
                          </TableCell>
                          <TableCell className="text-right px-8 space-x-2">
                             <Button 
                               onClick={() => setCoinAdjustment({ userId: u.id, bucket: 'winning', amount: 100 })}
                               className="h-10 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border-none text-[9px] font-black uppercase px-6 rounded-xl"
                             >
                               ADD +100
                             </Button>
                             <Button 
                               variant={u.isBanned ? "outline" : "destructive"} 
                               size="sm" 
                               className="h-10 px-6 font-black text-[9px] uppercase rounded-xl"
                               onClick={() => updateDoc(doc(firestore!, 'users', u.id), { isBanned: !u.isBanned })}
                             >
                               {u.isBanned ? "RELEASE" : "BAN"}
                             </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8">
              <Card className="bg-red-500/5 border-red-500/20 rounded-[3rem] p-10 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <ShieldAlert className="h-12 w-12 text-red-500" />
                  <div>
                    <h3 className="text-2xl font-black uppercase italic">Threat Intelligence</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Manual review requested for suspicious payouts</p>
                  </div>
                </div>
                <Badge className="bg-red-500 text-white font-black px-6 h-8 text-[10px] uppercase">{flaggedTxs?.length || 0} ALERTS</Badge>
              </Card>

              <Card className="bg-black/20 border-white/5 rounded-[3rem] overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="px-10 font-black uppercase text-[9px] py-6">Identity / Risk</TableHead>
                      <TableHead className="font-black uppercase text-[9px]">Requested Volume</TableHead>
                      <TableHead className="font-black uppercase text-[9px]">Security Reason</TableHead>
                      <TableHead className="px-10 text-right font-black uppercase text-[9px]">Command</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flaggedTxs?.map(tx => (
                      <TableRow key={tx.id} className="border-white/5">
                        <TableCell className="px-10 py-8">
                          <p className="font-black text-xs uppercase">{tx.userId?.substring(0,15)}</p>
                          <p className="text-[8px] text-muted-foreground font-bold">{tx.date}</p>
                        </TableCell>
                        <TableCell className="text-red-400 font-black text-lg tabular-nums">
                          {tx.currencySymbol}{tx.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-red-500/10 text-red-500 text-[8px] font-black uppercase px-3">HIGH TASK VOLUME</Badge>
                        </TableCell>
                        <TableCell className="px-10 text-right space-x-2">
                           <Button onClick={() => handleUpdateStatus(tx, 'completed')} className="h-10 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border-none font-black text-[9px] uppercase px-6 rounded-xl">RELEASE</Button>
                           <Button variant="outline" className="h-10 border-white/10 font-black text-[9px] uppercase px-6 rounded-xl">REJECT</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {supportTickets?.map(ticket => (
                <Card key={ticket.id} className="bg-black/20 border-white/5 rounded-[2.5rem] p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                        <UserPlus className="h-5 w-5 opacity-40" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Warrior ID: {ticket.userId.substring(0,8)}</p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase">{ticket.timestamp}</p>
                      </div>
                    </div>
                    {ticket.isFlagged && <Badge className="bg-red-500/20 text-red-500 border-none text-[8px] font-black uppercase">PRIORITY</Badge>}
                  </div>
                  
                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-sm font-medium italic">"{ticket.message}"</p>
                  </div>

                  {ticket.aiResponse && (
                    <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10">
                      <p className="text-[8px] font-black uppercase text-primary mb-2">AI Initial Brief:</p>
                      <p className="text-xs text-muted-foreground font-medium italic">"{ticket.aiResponse}"</p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <Button onClick={() => handleResolveSupport(ticket.id)} className="flex-1 h-14 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border-none font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-green-900/10">MARK RESOLVED</Button>
                    <Button variant="outline" className="h-14 border-white/10 px-8 rounded-2xl">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-8">
               <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black italic uppercase">Campaign Deployment</h3>
                  <Button className={cn("h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-2xl", activeTheme.accent, "text-black")}>
                    <Plus className="h-5 w-5 mr-2" /> NEW CAMPAIGN
                  </Button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {tournamentsData?.map(tour => (
                    <Card key={tour.id} className="bg-black/20 border-white/5 rounded-[3rem] overflow-hidden group">
                       <div className="relative h-48">
                          <img src={tour.banner} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                          <Badge className="absolute top-4 left-4 bg-primary font-black uppercase text-[9px]">{tour.gameType}</Badge>
                       </div>
                       <CardContent className="p-8 space-y-6">
                          <div>
                             <h4 className="text-xl font-black uppercase italic tracking-tighter">{tour.name}</h4>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase">{tour.startDate}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Fee</p>
                                <p className="text-lg font-black">{tour.entryFee} 🪙</p>
                             </div>
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Pool</p>
                                <p className="text-lg font-black text-amber-500">{tour.prizePool}</p>
                             </div>
                          </div>
                          <div className="flex gap-3">
                             <Button variant="outline" className="flex-1 border-white/10 h-12 rounded-xl">
                                <Edit2 className="h-4 w-4 mr-2" /> EDIT
                             </Button>
                             <Button variant="ghost" className="h-12 w-12 rounded-xl text-red-400 hover:bg-red-500/10">
                                <Trash2 className="h-4 w-4" />
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="max-w-4xl mx-auto space-y-8">
               <Card className="bg-black/20 border-white/5 rounded-[3rem] p-12 space-y-10 shadow-2xl">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-2xl">
                      <Settings className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">System Protocol</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Global App Configuration & Monetization</p>
                    </div>
                  </div>

                  <div className="grid gap-10">
                     <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">CPA Lead Network URL</Label>
                           <Input value={sysConfig.cpaLeadUrl || ''} onChange={e => setSysConfig({...sysConfig, cpaLeadUrl: e.target.value})} className="h-14 bg-black/40 border-white/10 rounded-xl font-mono text-xs" />
                        </div>
                        <div className="space-y-4">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telegram Support Channel</Label>
                           <Input value={sysConfig.telegramUrl || ''} onChange={e => setSysConfig({...sysConfig, telegramUrl: e.target.value})} className="h-14 bg-black/40 border-white/10 rounded-xl font-mono text-xs" />
                        </div>
                     </div>

                     <div className="grid md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Coins Per Dollar</Label>
                           <Input type="number" value={sysConfig.coinValuePerDollar || ''} onChange={e => setSysConfig({...sysConfig, coinValuePerDollar: Number(e.target.value)})} className="h-14 bg-black/40 border-white/10 rounded-xl" />
                        </div>
                        <div className="space-y-4">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Referral Prize (Coins)</Label>
                           <Input type="number" value={sysConfig.referralRewardCoins || ''} onChange={e => setSysConfig({...sysConfig, referralRewardCoins: Number(e.target.value)})} className="h-14 bg-black/40 border-white/10 rounded-xl" />
                        </div>
                        <div className="space-y-4">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Admin Profit Margin (%)</Label>
                           <Input type="number" value={sysConfig.adminProfitPercentage || ''} onChange={e => setSysConfig({...sysConfig, adminProfitPercentage: Number(e.target.value)})} className="h-14 bg-black/40 border-white/10 rounded-xl" />
                        </div>
                     </div>

                     <div className="grid md:grid-cols-2 gap-8 p-8 bg-white/5 rounded-[2rem] border border-white/5">
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <p className="text-sm font-black uppercase italic">Video Ad Sector</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase">Toggle extra income missions</p>
                           </div>
                           <Switch checked={sysConfig.videoWallEnabled} onCheckedChange={val => setSysConfig({...sysConfig, videoWallEnabled: val})} />
                        </div>
                        <div className="flex items-center justify-between">
                           <div className="space-y-1">
                              <p className="text-sm font-black uppercase italic">Maintenance Mode</p>
                              <p className="text-[10px] text-muted-foreground font-bold uppercase">App-wide lock system</p>
                           </div>
                           <Switch checked={sysConfig.maintenanceMode} onCheckedChange={val => setSysConfig({...sysConfig, maintenanceMode: val})} />
                        </div>
                     </div>
                  </div>

                  <Button onClick={handleSaveConfig} className={cn("w-full h-20 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-lg italic shadow-2xl text-black", activeTheme.accent)}>SAVE CORE CONFIG</Button>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* Manual Adjustment Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="bg-[#0a0a0f] border-white/10 text-white rounded-[3rem] p-10 max-w-md">
            <DialogHeader>
               <DialogTitle className="text-2xl font-black italic uppercase flex items-center gap-4">
                  <Wrench className={activeTheme.primary} />
                  Adjust Balance
               </DialogTitle>
            </DialogHeader>
            <div className="space-y-8 pt-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Wallet Selector</Label>
                <Select value={coinAdjustment.bucket} onValueChange={(val: any) => setCoinAdjustment({...coinAdjustment, bucket: val})}>
                  <SelectTrigger className="bg-black/40 border-white/10 h-14 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                    <SelectItem value="deposit">Deposit Wallet</SelectItem>
                    <SelectItem value="winning">Winning Wallet</SelectItem>
                    <SelectItem value="task">Task Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amount (Coins)</Label>
                <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="bg-black/40 border-white/10 h-16 rounded-2xl text-3xl font-black text-primary tabular-nums" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <Button onClick={() => setCoinAdjustment(null)} variant="outline" className="h-16 rounded-2xl font-black uppercase tracking-widest border-white/5">CANCEL</Button>
                 <Button onClick={() => {
                   if (!firestore || !coinAdjustment) return;
                   const { userId, bucket, amount } = coinAdjustment;
                   const uRef = doc(firestore, 'users', userId);
                   const updatePayload: any = { coins: increment(amount) };
                   if (bucket === 'deposit') updatePayload.depositBalance = increment(amount);
                   if (bucket === 'winning') updatePayload.winningBalance = increment(amount);
                   if (bucket === 'task') updatePayload.taskBalance = increment(amount);
                   updateDoc(uRef, updatePayload);
                   addDoc(collection(firestore, 'users', userId, 'ledger'), {
                     type: 'income',
                     amount: amount,
                     date: new Date().toISOString().split('T')[0],
                     status: 'completed',
                     description: `Command Override: ${bucket} manual adjustment`
                   });
                   toast({ title: "Transfer Executed" });
                   setCoinAdjustment(null);
                 }} className={cn("h-16 rounded-2xl font-black uppercase tracking-widest shadow-2xl text-black", activeTheme.accent)}>EXECUTE</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function NavItem({ active, icon, label, onClick, count, theme }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden", 
        active ? theme.accent + " text-black shadow-2xl" : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="flex items-center gap-4 relative z-10">
        <span className={cn("h-5 w-5 transition-transform", active ? "scale-110" : "group-hover:scale-110 opacity-60")}>{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{label}</span>
      </div>
      {count > 0 && <Badge className="bg-red-500 text-white border-none text-[8px] h-4 min-w-4 flex items-center justify-center p-0 rounded-full font-black relative z-10">{count}</Badge>}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap = { 
    blue: "bg-blue-600/10 text-blue-500 border-blue-500/20", 
    orange: "bg-primary/10 text-primary border-primary/20", 
    red: "bg-red-600/10 text-red-500 border-red-500/20", 
    green: "bg-green-600/10 text-green-500 border-green-500/20" 
  };
  return (
    <Card className="bg-black/20 border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between group hover:scale-[1.02] transition-all relative overflow-hidden">
       <div className="space-y-1 relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
          <h4 className="text-3xl font-black italic tracking-tighter">{value}</h4>
       </div>
       <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center border shadow-xl transition-transform group-hover:rotate-12 relative z-10", colorMap[color as keyof typeof colorMap])}>
          {icon}
       </div>
    </Card>
  );
}
