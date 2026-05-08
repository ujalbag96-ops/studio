
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
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Calendar,
  Activity,
  Palette,
  CreditCard,
  Target
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
  const [coinAdjustment, setCoinAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    if (countryFilter === 'All') return collection(firestore, 'users');
    return query(collection(firestore, 'users'), where('country', '==', countryFilter));
  }, [firestore, isAdminUser, countryFilter]);

  const allLedgerQuery = useMemoFirebase(() => 
    (firestore && isAdminUser) ? collectionGroup(firestore, 'ledger') : null, 
    [firestore, isAdminUser]
  );

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
  const { data: ledgerData } = useCollection<UserLedgerEntry>(allLedgerQuery);
  const { data: flaggedTxs } = useCollection<UserLedgerEntry>(flaggedTxsQuery);
  const { data: supportTickets } = useCollection<SupportMessage>(supportQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const [config, setConfig] = useState<Partial<AppSettings>>({});

  useEffect(() => {
    if (settings) setConfig(settings);
  }, [settings]);

  // Financial Intelligence Engine
  const financialStats = useMemo(() => {
    if (!ledgerData || !usersData) return { totalRevenue: 0, totalProfit: 0, totalUserBalance: 0, chartData: [] };

    const now = new Date();
    const filteredLedger = ledgerData.filter(tx => {
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
    
    filteredLedger.forEach(tx => {
      if (tx.type === 'deposit' || tx.type === 'income') totalRevenue += tx.amount;
      if (tx.type === 'conversion' || tx.type === 'withdrawal') {
        const fee = tx.type === 'conversion' ? (tx.amount / 0.988) * 0.012 : (tx.amount / 0.92) * 0.08;
        totalProfit += fee;
      }
    });

    const totalUserBalance = usersData.reduce((acc, u) => acc + (u.coins || 0), 0) / 10;

    const dailyData: Record<string, { date: string, revenue: number, profit: number }> = {};
    filteredLedger.forEach(tx => {
      const d = tx.date;
      if (!dailyData[d]) dailyData[d] = { date: d, revenue: 0, profit: 0 };
      if (tx.type === 'deposit' || tx.type === 'income') dailyData[d].revenue += tx.amount / 10;
      if (tx.type === 'conversion' || tx.type === 'withdrawal') {
         const fee = tx.type === 'conversion' ? (tx.amount / 0.988) * 0.012 : (tx.amount / 0.92) * 0.08;
         dailyData[d].profit += fee / 10;
      }
    });

    const chartData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));

    return { totalRevenue, totalProfit, totalUserBalance, chartData };
  }, [ledgerData, usersData, financeTimeFilter]);

  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    if (!firestore || !settingsRef) return;
    await setDoc(settingsRef, updates, { merge: true });
    toast({ title: "Intelligence Synced" });
  };

  const handleAdjustBalance = async () => {
    if (!firestore || !coinAdjustment) return;
    const { userId, bucket, amount } = coinAdjustment;
    try {
      const uRef = doc(firestore, 'users', userId);
      const updatePayload: any = {};
      if (bucket === 'deposit') updatePayload.depositBalance = increment(amount);
      if (bucket === 'winning') updatePayload.winningBalance = increment(amount);
      if (bucket === 'task') updatePayload.taskBalance = increment(amount);
      updatePayload.coins = increment(amount);

      await updateDoc(uRef, updatePayload);
      await addDoc(collection(firestore, 'users', userId, 'ledger'), {
        type: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Command Override: ${bucket} manual adjustment`
      });
      toast({ title: "Transfer Executed" });
      setCoinAdjustment(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Protocol Interrupted" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black">UNAUTHORIZED ACCESS DETECTED</div>;

  const activeTheme = THEMES[theme];

  return (
    <div className={cn("flex min-h-screen transition-colors duration-500", activeTheme.bg, activeTheme.text)}>
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
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Warriors" value={usersData?.length || 0} icon={<UsersIcon />} color="blue" />
                <StatCard title="Security Flags" value={flaggedTxs?.length || 0} icon={<AlertTriangle />} color="red" />
                <StatCard title="Active Campaigns" value={tournamentsData?.length || 0} icon={<Trophy />} color="orange" />
                <StatCard title="Daily Revenue" value={`₹${financialStats.totalRevenue.toFixed(0)}`} icon={<TrendingUp />} color="green" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-black/20 border-white/5 rounded-[2.5rem] p-8 space-y-6 overflow-hidden relative">
                   <div className="flex justify-between items-center relative z-10">
                      <div>
                        <h3 className="text-xl font-black italic uppercase">Revenue Matrix</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Global Payout Analysis</p>
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
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Platform Profit</p>
                         <h4 className="text-5xl font-black italic tracking-tighter text-green-500">₹{financialStats.totalProfit.toFixed(2)}</h4>
                      </div>
                      <div className="flex items-center gap-2 pt-4 relative z-10">
                         <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] uppercase">+12.5% from last epoch</Badge>
                      </div>
                   </Card>

                   <Card className="bg-black/20 border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Total User Liability</p>
                         <h4 className="text-4xl font-black italic tracking-tighter">₹{financialStats.totalUserBalance.toFixed(2)}</h4>
                         <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">Total value locked in warrior wallets</p>
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Region Filter:</span>
                  </div>
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-64 bg-black/40 border-white/10 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      <SelectValue placeholder="All Sectors" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0f] border-white/10 text-white">
                      <SelectItem value="All">Global Command</SelectItem>
                      <SelectItem value="India">India Hub</SelectItem>
                      <SelectItem value="USA">USA Hub</SelectItem>
                      <SelectItem value="UK">UK Hub</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="bg-black/20 border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="px-8 font-black uppercase text-[9px] tracking-widest text-muted-foreground py-6">Warrior Identity</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Asset Portfolio (D/W/T)</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Tactical Status</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground text-right px-8">Operational Control</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.map(u => (
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
                           <div className="flex gap-2">
                              <div className="bg-blue-500/5 px-3 py-1.5 rounded-lg border border-blue-500/10 text-center">
                                 <p className="text-[7px] font-black text-blue-500/60 uppercase mb-0.5">DEP</p>
                                 <p className="text-xs font-black">{u.depositBalance || 0}</p>
                              </div>
                              <div className="bg-green-500/5 px-3 py-1.5 rounded-lg border border-green-500/10 text-center">
                                 <p className="text-[7px] font-black text-green-500/60 uppercase mb-0.5">WIN</p>
                                 <p className="text-xs font-black text-green-500">{u.winningBalance?.toFixed(0) || 0}</p>
                              </div>
                              <div className="bg-amber-500/5 px-3 py-1.5 rounded-lg border border-amber-500/10 text-center">
                                 <p className="text-[7px] font-black text-amber-500/60 uppercase mb-0.5">TASK</p>
                                 <p className="text-xs font-black text-amber-500">{u.taskBalance || 0}</p>
                              </div>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="space-y-2">
                              <Badge variant="outline" className={cn("text-[9px] border-white/10 font-black uppercase px-4", u.rank === 'Gold' ? 'text-amber-500 border-amber-500/20' : 'text-primary')}>
                                 {u.rank || 'Bronze'}
                              </Badge>
                              <div className="flex items-center gap-2 text-[8px] font-black uppercase text-muted-foreground italic">
                                 <Globe className="h-2.5 w-2.5" /> {u.country || 'Global'}
                              </div>
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
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}
          
          {/* Other tabs follow same structure */}
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
                 <Button onClick={handleAdjustBalance} className={cn("h-16 rounded-2xl font-black uppercase tracking-widest shadow-2xl text-black", activeTheme.accent)}>EXECUTE</Button>
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
