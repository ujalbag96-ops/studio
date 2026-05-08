
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, limit, deleteDoc, increment, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
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
  Award,
  SearchX,
  Gamepad2,
  LogOut,
  Bell,
  Menu,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Flag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import TransactionReceipt from '@/components/TransactionReceipt';
import { getCurrencyData } from '@/lib/currency';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'warriors' | 'security' | 'support' | 'campaigns' | 'finance' | 'control'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [financeTimeFilter, setFinanceTimeFilter] = useState<'day' | 'week' | 'month' | 'year' | 'all'>('month');
  const [ledgerFilter, setLedgerFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<UserLedgerEntry | null>(null);
  const [coinAdjustment, setCoinAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [winnerUid, setWinnerId] = useState('');
  const [sysConfig, setSysConfig] = useState<Partial<AppSettings>>({});

  const [newTour, setNewTour] = useState({
    name: '',
    game: '',
    gameType: 'BGMI' as GameType,
    prizePool: '₹500',
    entryFee: 10,
    startDate: '',
    banner: 'https://picsum.photos/seed/tournament/800/400'
  });

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

  const { data: usersData, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: ledgerData, isLoading: isLedgerLoading } = useCollection<UserLedgerEntry>(allLedgerQuery);
  const { data: supportTickets, isLoading: isSupportLoading } = useCollection<SupportMessage>(supportQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    if (settings) setSysConfig(settings);
  }, [settings]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    const q = searchQuery.toLowerCase().trim();
    return usersData.filter(u => 
      !q || 
      u.email?.toLowerCase().includes(q) || 
      u.id.toLowerCase().includes(q) || 
      u.mobile?.includes(q)
    );
  }, [usersData, searchQuery]);

  const filteredLedger = useMemo(() => {
    if (!ledgerData) return [];
    let list = ledgerData;
    if (ledgerFilter === 'flagged') list = list.filter(t => t.status === 'review_required' || t.isFlagged);
    else if (ledgerFilter !== 'all') list = list.filter(t => t.type === ledgerFilter);
    return list;
  }, [ledgerData, ledgerFilter]);

  const financialStats = useMemo(() => {
    if (!ledgerData) return { revenue: 0, profit: 0, chart: [] };
    const chart = ledgerData.slice(0, 7).reverse().map(l => ({ date: l.date, value: l.amount }));
    return { revenue: 1410, profit: 41410, chart };
  }, [ledgerData]);

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-bold">UNAUTHORIZED ACCESS</div>;

  return (
    <div className="flex min-h-screen bg-[#f4f7f6]">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      {/* Sidebar - ThemeKit Style */}
      <aside className="w-[280px] bg-[#1a2035] text-white flex flex-col fixed inset-y-0 z-50 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center font-black text-white">TK</div>
          <span className="font-bold tracking-tight text-xl">ThemeKit</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-4">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-3">Navigation</p>
          <SideLink active={activeTab === 'overview'} icon={<LayoutDashboard />} label="Dashboard" onClick={() => setActiveTab('overview')} badge="NEW" />
          <SideLink active={false} icon={<Menu />} label="Navigation" onClick={() => {}} badge="NEW" />
          <SideLink active={false} icon={<Wrench />} label="Widgets" onClick={() => {}} badge="150+" />
          
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-3 mt-8">Operational Control</p>
          <SideLink active={activeTab === 'warriors'} icon={<UsersIcon />} label="Warriors" onClick={() => setActiveTab('warriors')} />
          <SideLink active={activeTab === 'finance'} icon={<TrendingUp />} label="Finance Hub" onClick={() => setActiveTab('finance')} />
          <SideLink active={activeTab === 'campaigns'} icon={<Trophy />} label="Arena Master" onClick={() => setActiveTab('campaigns')} />
          <SideLink active={activeTab === 'support'} icon={<MessageSquare />} label="Support Center" onClick={() => setActiveTab('support')} count={supportTickets?.length} />
          
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-3 mt-8">System</p>
          <SideLink active={activeTab === 'control'} icon={<Settings />} label="Settings" onClick={() => setActiveTab('control')} />
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-3 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
             <LogOut className="h-5 w-5" /> Logout
          </button>
        </nav>
      </aside>

      <main className="flex-1 ml-[280px]">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-6">
             <Button variant="ghost" size="icon" className="text-gray-400"><Menu className="h-5 w-5" /></Button>
             <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-gray-50 border-none rounded-full pl-10 h-10 text-xs" />
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <Button variant="ghost" size="icon" className="relative text-gray-400">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
             </Button>
             <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                   <AvatarImage src="https://picsum.photos/seed/admin/100/100" />
                   <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                   <p className="text-[11px] font-bold text-gray-900 leading-none">Admin</p>
                   <p className="text-[9px] text-gray-500">Super User</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
             </div>
          </div>
        </header>

        {/* Content Sector */}
        <div className="p-8 space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Stat Cards - From Screenshot */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernStatCard label="Bookmarks" value="1,410" sub="10% higher than last month" icon={<ShieldCheck />} color="purple" />
                <ModernStatCard label="Likes" value="41,410" sub="61% higher than last month" icon={<Trophy />} color="blue" />
                <ModernStatCard label="Events" value="410" sub="Total Events" icon={<Calendar />} color="green" />
                <ModernStatCard label="Comments" value="41,410" sub="Total Comments" icon={<MessageSquare />} color="orange" />
              </div>

              {/* Charts Row */}
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-sm rounded-xl p-8 bg-white">
                   <div className="flex justify-between items-center mb-8">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Revenue Analysis</h3>
                        <p className="text-xs text-gray-400">Visitor activity across platform</p>
                      </div>
                      <Select defaultValue="month">
                         <SelectTrigger className="w-32 h-8 text-[10px]"><SelectValue /></SelectTrigger>
                         <SelectContent><SelectItem value="month">This Month</SelectItem></SelectContent>
                      </Select>
                   </div>
                   <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={financialStats.chart}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" hide />
                            <YAxis vertical={false} hide />
                            <Tooltip contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <Card className="border-none shadow-sm rounded-xl p-8 bg-white">
                   <h3 className="text-sm font-bold text-gray-900 mb-6">User Distribution</h3>
                   <div className="h-[250px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                         <RePieChart>
                            <Pie data={[{name: 'A', value: 400}, {name: 'B', value: 300}, {name: 'C', value: 300}]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                               <Cell fill="#3b82f6" />
                               <Cell fill="#10b981" />
                               <Cell fill="#f59e0b" />
                            </Pie>
                            <Tooltip />
                         </RePieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="space-y-3 mt-6">
                      <LegendItem color="bg-blue-500" label="Active Warriors" value="40%" />
                      <LegendItem color="bg-green-500" label="Arena Masters" value="30%" />
                      <LegendItem color="bg-yellow-500" label="Recruits" value="30%" />
                   </div>
                </Card>
              </div>

              {/* User Table - Redesigned */}
              <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900">Warrior Roster</h3>
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold">Export Data</Button>
                 </div>
                 <Table>
                    <TableHeader className="bg-gray-50/50">
                       <TableRow className="border-gray-100 hover:bg-transparent">
                          <TableHead className="text-[10px] font-black uppercase text-gray-400 py-4">Warrior</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-gray-400">Position</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-gray-400">Wealth</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-gray-400">Status</TableHead>
                          <TableHead className="text-right text-[10px] font-black uppercase text-gray-400 px-8">Actions</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {filteredUsers.slice(0, 10).map(u => (
                          <TableRow key={u.id} className="border-gray-100 hover:bg-gray-50/50 transition-colors">
                             <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                   <Avatar className="h-8 w-8">
                                      <AvatarImage src={`https://picsum.photos/seed/${u.id}/100/100`} />
                                      <AvatarFallback>{u.email?.[0] || 'W'}</AvatarFallback>
                                   </Avatar>
                                   <div>
                                      <p className="text-xs font-bold text-gray-900">{u.email?.split('@')[0] || u.id.slice(0,8)}</p>
                                      <p className="text-[10px] text-gray-400">UID: {u.id.slice(0,10)}</p>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell className="text-xs text-gray-600">Warrior</TableCell>
                             <TableCell className="text-xs font-bold text-gray-900">{u.coins.toFixed(1)} 🪙</TableCell>
                             <TableCell>
                                <Badge className={cn("text-[9px] font-bold px-2.5 py-0.5 rounded-full border-none", u.isBanned ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>
                                   {u.isBanned ? 'BANNED' : 'ACTIVE'}
                                </Badge>
                             </TableCell>
                             <TableCell className="text-right px-8">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400"><MoreVertical className="h-4 w-4" /></Button>
                             </TableCell>
                          </TableRow>
                       ))}
                    </TableBody>
                 </Table>
              </Card>
            </>
          )}

          {activeTab === 'warriors' && (
            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white">
                 <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900">Advanced Warrior Search</h3>
                    <div className="flex gap-2">
                       <Button size="sm" className="h-9 bg-blue-500 hover:bg-blue-600"><Plus className="h-4 w-4 mr-2" /> Add User</Button>
                    </div>
                 </div>
                 <Table>
                    <TableHeader className="bg-gray-50/50">
                       <TableRow className="border-gray-100">
                          <TableHead className="text-[10px] font-bold text-gray-400 py-5">Warrior Details</TableHead>
                          <TableHead className="text-[10px] font-bold text-gray-400">Deposit / Winning</TableHead>
                          <TableHead className="text-[10px] font-bold text-gray-400">Security</TableHead>
                          <TableHead className="text-right text-[10px] font-bold text-gray-400 px-8">Command</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {filteredUsers.map(u => (
                          <TableRow key={u.id} className="border-gray-100">
                             <TableCell className="py-5">
                                <div className="flex items-center gap-3">
                                   <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 uppercase">{u.email?.[0] || 'U'}</div>
                                   <div>
                                      <p className="text-xs font-bold text-gray-900">{u.email || u.mobile}</p>
                                      <p className="text-[9px] text-gray-400">{u.id}</p>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell>
                                <div className="flex flex-col gap-1">
                                   <p className="text-[11px] font-bold text-blue-600">D: {u.depositBalance} 🪙</p>
                                   <p className="text-[11px] font-bold text-green-600">W: {u.winningBalance} 🪙</p>
                                </div>
                             </TableCell>
                             <TableCell>
                                {u.isVpnActive && <Badge className="bg-red-50 text-red-600 text-[9px] font-bold border-none">VPN</Badge>}
                             </TableCell>
                             <TableCell className="text-right px-8 space-x-2">
                                <Button onClick={() => setCoinAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} size="sm" variant="outline" className="h-8 text-[10px] font-bold border-gray-200">Adjust</Button>
                                <Button onClick={() => updateDoc(doc(firestore!, 'users', u.id), { isBanned: !u.isBanned })} variant={u.isBanned ? "outline" : "destructive"} size="sm" className="h-8 text-[10px] font-bold">
                                   {u.isBanned ? 'Unlock' : 'Ban'}
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
            <div className="space-y-8">
               <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900">Campaign Management</h3>
                  <Button onClick={() => setIsCreatingTournament(true)} className="h-10 bg-blue-500 hover:bg-blue-600 font-bold text-xs px-6 rounded-lg shadow-lg shadow-blue-200">
                    <Plus className="h-4 w-4 mr-2" /> CREATE CAMPAIGN
                  </Button>
               </div>
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tournamentsData?.map(tour => (
                    <Card key={tour.id} className="border-none shadow-sm rounded-xl overflow-hidden bg-white group transition-all hover:shadow-md">
                       <div className="h-40 bg-gray-200 relative">
                          <img src={tour.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <Badge className="absolute top-4 left-4 bg-white/90 text-gray-900 text-[9px] font-black uppercase px-3 backdrop-blur-sm border-none">{tour.status}</Badge>
                       </div>
                       <CardContent className="p-6 space-y-4">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight">{tour.name}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">{new Date(tour.startDate).toLocaleString()}</p>
                             </div>
                             <Button onClick={async () => {
                                if(confirm("Delete this campaign?")) {
                                   await deleteDoc(doc(firestore!, 'tournaments', tour.id));
                                   toast({ title: "Campaign Deleted" });
                                }
                             }} variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                             <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Room ID</p>
                                <Input 
                                  value={tour.roomCredentials?.roomId || ''} 
                                  onChange={e => updateDoc(doc(firestore!, 'tournaments', tour.id), { 'roomCredentials.roomId': e.target.value })} 
                                  className="h-8 text-xs font-bold bg-white border-gray-200"
                                />
                             </div>
                             <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Password</p>
                                <Input 
                                  value={tour.roomCredentials?.roomPassword || ''} 
                                  onChange={e => updateDoc(doc(firestore!, 'tournaments', tour.id), { 'roomCredentials.roomPassword': e.target.value })} 
                                  className="h-8 text-xs font-bold bg-white border-gray-200"
                                />
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="max-w-3xl mx-auto">
               <Card className="border-none shadow-sm rounded-xl p-10 space-y-10 bg-white">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                      <Settings className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">System Core Settings</h3>
                      <p className="text-xs text-gray-400">Configure global platform protocols</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 pt-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">CPA Network Endpoint</Label>
                        <Input value={sysConfig.cpaLeadUrl || ''} onChange={e => setSysConfig({...sysConfig, cpaLeadUrl: e.target.value})} className="h-12 border-gray-100 rounded-lg bg-gray-50/50" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Telegram Admin Link</Label>
                        <Input value={sysConfig.telegramUrl || ''} onChange={e => setSysConfig({...sysConfig, telegramUrl: e.target.value})} className="h-12 border-gray-100 rounded-lg bg-gray-50/50" />
                     </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-gray-400 uppercase">Conversion Fee (%)</Label>
                        <Input type="number" value={sysConfig.conversionFeePercent || ''} onChange={e => setSysConfig({...sysConfig, conversionFeePercent: Number(e.target.value)})} className="h-10" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-gray-400 uppercase">Withdraw Fee (%)</Label>
                        <Input type="number" value={sysConfig.withdrawalFeePercent || ''} onChange={e => setSysConfig({...sysConfig, withdrawalFeePercent: Number(e.target.value)})} className="h-10" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-bold text-gray-400 uppercase">Referral Reward (Coins)</Label>
                        <Input type="number" value={sysConfig.referralRewardCoins || ''} onChange={e => setSysConfig({...sysConfig, referralRewardCoins: Number(e.target.value)})} className="h-10" />
                     </div>
                  </div>

                  <Button onClick={async () => {
                     if (!firestore) return;
                     await setDoc(doc(firestore, 'settings', 'global'), sysConfig, { merge: true });
                     toast({ title: "Core Configuration Saved" });
                  }} className="w-full h-14 bg-blue-500 hover:bg-blue-600 font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-blue-100">COMMIT SYSTEM CHANGES</Button>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* Modern Creation Dialog */}
      <Dialog open={isCreatingTournament} onOpenChange={setIsCreatingTournament}>
         <DialogContent className="bg-white border-none rounded-2xl p-8 max-w-2xl">
            <DialogHeader>
               <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900 uppercase italic">Deploy Campaign</DialogTitle>
               <DialogDescription className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Configure a new battlefield deployment</DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-8 pt-6">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase text-gray-400">Campaign Title</Label>
                     <Input value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="h-12 border-gray-100" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase text-gray-400">Arena Hub</Label>
                     <Select value={newTour.gameType} onValueChange={(val: any) => setNewTour({...newTour, gameType: val})}>
                        <SelectTrigger className="h-12 border-gray-100"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="BGMI">BGMI Elite</SelectItem>
                           <SelectItem value="Free Fire">Free Fire Squad</SelectItem>
                           <SelectItem value="Ludo King">Ludo Kingdom</SelectItem>
                           <SelectItem value="Other">Custom Arena</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase text-gray-400">Entry Fee (Coins)</Label>
                     <Input type="number" value={newTour.entryFee} onChange={e => setNewTour({...newTour, entryFee: Number(e.target.value)})} className="h-12 border-gray-100" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase text-gray-400">Mission Start</Label>
                     <Input type="datetime-local" value={newTour.startDate} onChange={e => setNewTour({...newTour, startDate: e.target.value})} className="h-12 border-gray-100" />
                  </div>
               </div>
            </div>
            <DialogFooter className="pt-8">
               <Button onClick={async () => {
                  if (!firestore) return;
                  const id = 'tour_' + Date.now();
                  await setDoc(doc(firestore, 'tournaments', id), { ...newTour, id, status: 'active' });
                  toast({ title: "Campaign Deployed" });
                  setIsCreatingTournament(false);
               }} className="w-full h-14 bg-blue-500 hover:bg-blue-600 font-bold uppercase tracking-widest rounded-xl">INITIATE DEPLOYMENT</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Balance Adjustment Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="bg-white rounded-2xl p-10 max-w-sm">
            <DialogHeader><DialogTitle className="text-xl font-bold uppercase text-gray-900">Adjust Balance</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-6">
              <Select value={coinAdjustment.bucket} onValueChange={(val: any) => setCoinAdjustment({...coinAdjustment, bucket: val})}>
                <SelectTrigger className="h-12 border-gray-100"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="deposit">Deposit</SelectItem><SelectItem value="winning">Winning</SelectItem><SelectItem value="task">Task</SelectItem></SelectContent>
              </Select>
              <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="h-16 text-2xl font-bold text-center border-gray-100" />
              <Button onClick={async () => {
                 const { userId, bucket, amount } = coinAdjustment;
                 const payload: any = { coins: increment(amount) };
                 if (bucket === 'deposit') payload.depositBalance = increment(amount);
                 if (bucket === 'winning') payload.winningBalance = increment(amount);
                 if (bucket === 'task') payload.taskBalance = increment(amount);
                 await updateDoc(doc(firestore!, 'users', userId), payload);
                 await addDoc(collection(firestore!, 'users', userId, 'ledger'), { type: 'income', amount, date: new Date().toISOString().split('T')[0], status: 'completed', description: `Admin Balance Override: ${bucket}` });
                 setCoinAdjustment(null);
                 toast({ title: "Warrior Wealth Updated" });
              }} className="w-full h-14 bg-blue-500 hover:bg-blue-600 font-bold uppercase rounded-xl">APPLY OVERRIDE</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SideLink({ active, icon, label, onClick, badge, count }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all text-sm font-medium",
        active ? "bg-blue-500 text-white shadow-lg shadow-blue-900/40" : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("h-5 w-5", active ? "text-white" : "text-gray-500")}>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && <Badge className="bg-blue-400/20 text-blue-400 text-[8px] font-black border-none px-1.5 h-4">{badge}</Badge>}
      {count !== undefined && count > 0 && <Badge className="bg-red-500 text-white text-[8px] font-bold border-none h-5 w-5 flex items-center justify-center p-0 rounded-full">{count}</Badge>}
    </button>
  );
}

function ModernStatCard({ label, value, sub, icon, color }: any) {
  const colorMap: any = { 
    purple: "text-purple-600 bg-purple-50", 
    blue: "text-blue-600 bg-blue-50", 
    green: "text-green-600 bg-green-50", 
    orange: "text-orange-600 bg-orange-50" 
  };
  return (
    <Card className="border-none shadow-sm rounded-xl p-6 bg-white flex items-center justify-between group hover:scale-[1.02] transition-all">
       <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
          <h4 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h4>
          <p className="text-[10px] font-medium text-green-500">{sub}</p>
       </div>
       <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-6", colorMap[color])}>
          {icon}
       </div>
    </Card>
  );
}

function LegendItem({ color, label, value }: any) {
   return (
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className={cn("h-2 w-2 rounded-full", color)} />
            <span className="text-[10px] font-bold text-gray-500">{label}</span>
         </div>
         <span className="text-[10px] font-black text-gray-900">{value}</span>
      </div>
   );
}
