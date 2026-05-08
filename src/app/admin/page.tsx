
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
  Flag,
  Copy,
  Gift
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
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'warriors' | 'security' | 'support' | 'campaigns' | 'finance' | 'control'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<UserLedgerEntry | null>(null);
  const [coinAdjustment, setCoinAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
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

  const handleUpdateTournamentRoom = (tourId: string, field: string, value: string) => {
    if (!firestore) return;
    const tourRef = doc(firestore, 'tournaments', tourId);
    const updateData = { [`roomCredentials.${field}`]: value };
    updateDoc(tourRef, updateData).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: tourRef.path,
        operation: 'update',
        requestResourceData: updateData
      }));
    });
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

  const financialStats = useMemo(() => {
    if (!ledgerData) return { revenue: 0, profit: 0, chart: [] };
    const chart = ledgerData.slice(0, 7).reverse().map(l => ({ date: l.date, value: l.amount }));
    return { revenue: 1410, profit: 41410, chart };
  }, [ledgerData]);

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-[#f4f7f6]"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-bold tracking-widest">UNAUTHORIZED ACCESS: EAGLE EYE ONLY</div>;

  return (
    <div className="flex min-h-screen bg-[#f4f7f6]">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      {/* Sidebar - ThemeKit Style */}
      <aside className="w-[280px] bg-[#1a2035] text-white flex flex-col fixed inset-y-0 z-50 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">TK</div>
          <span className="font-bold tracking-tight text-xl">ThemeKit</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-4">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-4 mb-4">Navigation</p>
          <SideLink active={activeTab === 'overview'} icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" onClick={() => setActiveTab('overview')} badge="LIVE" />
          
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-4 mb-4 mt-8">Operational Control</p>
          <SideLink active={activeTab === 'warriors'} icon={<UsersIcon className="h-5 w-5" />} label="Warrior Roster" onClick={() => setActiveTab('warriors')} />
          <SideLink active={activeTab === 'campaigns'} icon={<Trophy className="h-5 w-5" />} label="Arena Deployments" onClick={() => setActiveTab('campaigns')} />
          <SideLink active={activeTab === 'finance'} icon={<TrendingUp className="h-5 w-5" />} label="Financial Hub" onClick={() => setActiveTab('finance')} />
          <SideLink active={activeTab === 'support'} icon={<MessageSquare className="h-5 w-5" />} label="Tactical Helpdesk" onClick={() => setActiveTab('support')} count={supportTickets?.length} />
          
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] px-4 mb-4 mt-8">System Protocols</p>
          <SideLink active={activeTab === 'control'} icon={<Settings className="h-5 w-5" />} label="Core Configuration" onClick={() => setActiveTab('control')} />
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm font-bold mt-4">
             <LogOut className="h-5 w-5" /> Terminate Session
          </button>
        </nav>
      </aside>

      <main className="flex-1 ml-[280px]">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-6">
             <div className="relative w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Warrior ID or Mobile..." className="bg-gray-50 border-gray-100 rounded-xl pl-12 h-11 text-xs font-medium" />
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <Button variant="ghost" size="icon" className="relative text-gray-400 hover:bg-gray-50 rounded-xl h-11 w-11">
                <Bell className="h-5 w-5" />
                <span className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
             </Button>
             <div className="h-10 w-px bg-gray-100" />
             <div className="flex items-center gap-4">
                <div className="text-right hidden md:block">
                   <p className="text-[11px] font-black text-gray-900 leading-none uppercase">Admin Commander</p>
                   <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Superuser Access</p>
                </div>
                <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-1 ring-gray-100">
                   <AvatarImage src="https://picsum.photos/seed/admin/100/100" />
                   <AvatarFallback>AC</AvatarFallback>
                </Avatar>
             </div>
          </div>
        </header>

        {/* Content Sector */}
        <div className="p-10 space-y-10">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <ModernStatCard label="Platform Users" value={usersData?.length || '0'} sub="Total Registered" icon={<UsersIcon />} color="blue" />
                <ModernStatCard label="Arena Earnings" value="₹41,410" sub="+12% this week" icon={<Trophy />} color="green" />
                <ModernStatCard label="Pending Support" value={supportTickets?.length || '0'} sub="Open Tickets" icon={<MessageSquare />} color="orange" />
                <ModernStatCard label="Active Campaigns" value={tournamentsData?.length || '0'} sub="Live Arenas" icon={<Target />} color="purple" />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-sm rounded-3xl p-10 bg-white">
                   <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Revenue Analysis</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Global Transaction Trends</p>
                      </div>
                      <Select defaultValue="month">
                         <SelectTrigger className="w-40 h-10 text-[10px] font-bold rounded-xl"><SelectValue /></SelectTrigger>
                         <SelectContent><SelectItem value="month">Current Month</SelectItem></SelectContent>
                      </Select>
                   </div>
                   <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={financialStats.chart}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" x1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="date" hide />
                            <YAxis vertical={false} hide />
                            <Tooltip contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontSize: '11px', fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorValue)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <Card className="border-none shadow-sm rounded-3xl p-10 bg-white">
                   <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-8">Warrior Distribution</h3>
                   <div className="h-[280px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                         <RePieChart>
                            <Pie data={[{name: 'A', value: 400}, {name: 'B', value: 300}, {name: 'C', value: 300}]} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                               <Cell fill="#3b82f6" stroke="none" />
                               <Cell fill="#10b981" stroke="none" />
                               <Cell fill="#f59e0b" stroke="none" />
                            </Pie>
                            <Tooltip />
                         </RePieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="space-y-4 mt-8">
                      <LegendItem color="bg-blue-500" label="Active BGMI" value="40%" />
                      <LegendItem color="bg-green-500" label="Free Fire Elite" value="30%" />
                      <LegendItem color="bg-yellow-500" label="Ludo Casual" value="30%" />
                   </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'warriors' && (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
               <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Warrior Roster</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Manage platform participants</p>
                  </div>
                  <Button size="sm" className="h-11 bg-blue-500 hover:bg-blue-600 rounded-xl font-bold px-6 shadow-lg shadow-blue-100"><Plus className="h-4 w-4 mr-2" /> ADD WARRIOR</Button>
               </div>
               <Table>
                  <TableHeader className="bg-gray-50/50">
                     <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase text-gray-400 py-6 px-8">Warrior Details</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-gray-400">Position / Tier</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-gray-400">Tactical Wealth</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-gray-400">Status</TableHead>
                        <TableHead className="text-right text-[10px] font-black uppercase text-gray-400 px-10">Command</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredUsers.map(u => (
                        <TableRow key={u.id} className="border-gray-100 hover:bg-gray-50/50 transition-colors">
                           <TableCell className="py-6 px-8">
                              <div className="flex items-center gap-4">
                                 <Avatar className="h-10 w-10 border border-gray-100">
                                    <AvatarImage src={`https://picsum.photos/seed/${u.id}/100/100`} />
                                    <AvatarFallback>{u.email?.[0] || 'W'}</AvatarFallback>
                                 </Avatar>
                                 <div>
                                    <p className="text-sm font-black text-gray-900">{u.email?.split('@')[0] || u.id.slice(0,8)}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">UID: {u.id.slice(0,12)}</p>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge className="bg-blue-50 text-blue-600 text-[9px] font-black border-none px-3 uppercase">{u.rank || 'BRONZE'}</Badge>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-900">{u.coins.toFixed(1)} 🪙</span>
                                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">D: {u.depositBalance} | W: {u.winningBalance}</span>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge className={cn("text-[9px] font-black px-3 py-1 rounded-lg border-none uppercase", u.isBanned ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600")}>
                                 {u.isBanned ? 'Banned' : 'Operational'}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right px-10 space-x-2">
                              <Button onClick={() => setCoinAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} variant="outline" size="sm" className="h-9 text-[10px] font-black border-gray-200 rounded-lg">ADJUST</Button>
                              <Button onClick={() => updateDoc(doc(firestore!, 'users', u.id), { isBanned: !u.isBanned })} variant={u.isBanned ? "outline" : "destructive"} size="sm" className="h-9 text-[10px] font-black rounded-lg">
                                 {u.isBanned ? 'REVOKE' : 'BAN'}
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </Card>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-10">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">Arena Master</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Deploy and monitor combat arenas</p>
                  </div>
                  <Button onClick={() => setIsCreatingTournament(true)} className="h-12 bg-blue-500 hover:bg-blue-600 font-black text-xs px-8 rounded-xl shadow-xl shadow-blue-100 uppercase tracking-widest">
                    <Plus className="h-4 w-4 mr-2" /> Deploy Arena
                  </Button>
               </div>
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tournamentsData?.map(tour => (
                    <Card key={tour.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white group transition-all hover:shadow-xl">
                       <div className="h-48 bg-gray-200 relative overflow-hidden">
                          <img src={tour.banner} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <Badge className="absolute top-6 left-6 bg-white/90 text-gray-900 text-[10px] font-black uppercase px-4 py-1.5 backdrop-blur-md border-none rounded-lg">{tour.status}</Badge>
                       </div>
                       <CardContent className="p-8 space-y-6">
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight italic">{tour.name}</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2"><Calendar className="h-3 w-3" /> {new Date(tour.startDate).toLocaleString()}</p>
                             </div>
                             <Button onClick={async () => {
                                if(confirm("Confirm destruction of this arena?")) {
                                   await deleteDoc(doc(firestore!, 'tournaments', tour.id));
                                   toast({ title: "Arena Destroyed" });
                                }
                             }} variant="ghost" size="icon" className="h-10 w-10 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="h-5 w-5" /></Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Room ID</Label>
                                <Input 
                                  value={tour.roomCredentials?.roomId || ''} 
                                  onChange={e => handleUpdateTournamentRoom(tour.id, 'roomId', e.target.value)} 
                                  className="h-11 text-xs font-black bg-gray-50 border-gray-100 rounded-xl"
                                  placeholder="ID..."
                                />
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Pass Key</Label>
                                <Input 
                                  value={tour.roomCredentials?.roomPassword || ''} 
                                  onChange={e => handleUpdateTournamentRoom(tour.id, 'roomPassword', e.target.value)} 
                                  className="h-11 text-xs font-black bg-gray-50 border-gray-100 rounded-xl"
                                  placeholder="KEY..."
                                />
                             </div>
                          </div>
                          
                          <Button variant="outline" className="w-full h-11 border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                            <Activity className="h-4 w-4 mr-2" /> Monitor Arena
                          </Button>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="max-w-3xl mx-auto">
               <Card className="border-none shadow-sm rounded-[2.5rem] p-12 space-y-12 bg-white">
                  <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shadow-inner">
                      <Settings className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">Core Systems</h3>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Global Platform Configuration</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-10">
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">CPA Network Target</Label>
                        <Input value={sysConfig.cpaLeadUrl || ''} onChange={e => setSysConfig({...sysConfig, cpaLeadUrl: e.target.value})} className="h-14 border-gray-100 rounded-2xl bg-gray-50/50 font-medium" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Support Comms Link</Label>
                        <Input value={sysConfig.telegramUrl || ''} onChange={e => setSysConfig({...sysConfig, telegramUrl: e.target.value})} className="h-14 border-gray-100 rounded-2xl bg-gray-50/50 font-medium" />
                     </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-8">
                     <div className="space-y-3">
                        <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Conv. Fee (%)</Label>
                        <Input type="number" value={sysConfig.conversionFeePercent || ''} onChange={e => setSysConfig({...sysConfig, conversionFeePercent: Number(e.target.value)})} className="h-12 rounded-xl" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Withdraw Fee (%)</Label>
                        <Input type="number" value={sysConfig.withdrawalFeePercent || ''} onChange={e => setSysConfig({...sysConfig, withdrawalFeePercent: Number(e.target.value)})} className="h-12 rounded-xl" />
                     </div>
                     <div className="space-y-3">
                        <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Referral Bounty</Label>
                        <Input type="number" value={sysConfig.referralRewardCoins || ''} onChange={e => setSysConfig({...sysConfig, referralRewardCoins: Number(e.target.value)})} className="h-12 rounded-xl" />
                     </div>
                  </div>

                  <Button onClick={async () => {
                     if (!firestore) return;
                     await setDoc(doc(firestore, 'settings', 'global'), sysConfig, { merge: true });
                     toast({ title: "System Protocols Updated" });
                  }} className="w-full h-18 bg-blue-500 hover:bg-blue-600 font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-100 text-lg italic">Commit Configuration</Button>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* Deployment Dialog */}
      <Dialog open={isCreatingTournament} onOpenChange={setIsCreatingTournament}>
         <DialogContent className="bg-white border-none rounded-[2.5rem] p-10 max-w-2xl shadow-2xl">
            <DialogHeader>
               <DialogTitle className="text-3xl font-black tracking-tighter text-gray-900 uppercase italic">Deploy Arena Sector</DialogTitle>
               <DialogDescription className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Initialize a new combat zone for warriors</DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-10 pt-8">
               <div className="space-y-6">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Arena Identifier</Label>
                     <Input value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="h-14 border-gray-100 rounded-xl font-bold" placeholder="E.g. Cyber Squad" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Operational Hub</Label>
                     <Select value={newTour.gameType} onValueChange={(val: any) => setNewTour({...newTour, gameType: val})}>
                        <SelectTrigger className="h-14 border-gray-100 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="BGMI">BGMI Elite</SelectItem>
                           <SelectItem value="Free Fire">Free Fire S.</SelectItem>
                           <SelectItem value="Ludo King">Ludo King</SelectItem>
                           <SelectItem value="Other">Custom Arena</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Entry Bounty (Coins)</Label>
                     <Input type="number" value={newTour.entryFee} onChange={e => setNewTour({...newTour, entryFee: Number(e.target.value)})} className="h-14 border-gray-100 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Deployment Schedule</Label>
                     <Input type="datetime-local" value={newTour.startDate} onChange={e => setNewTour({...newTour, startDate: e.target.value})} className="h-14 border-gray-100 rounded-xl font-bold" />
                  </div>
               </div>
            </div>
            <DialogFooter className="pt-10">
               <Button onClick={async () => {
                  if (!firestore) return;
                  const id = 'tour_' + Date.now();
                  await setDoc(doc(firestore, 'tournaments', id), { ...newTour, id, status: 'active' });
                  toast({ title: "Arena Sector Deployed" });
                  setIsCreatingTournament(false);
               }} className="w-full h-18 bg-blue-500 hover:bg-blue-600 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-100 text-lg italic">Initiate Deployment</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Balance Adjustment Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="bg-white rounded-[2rem] p-10 max-w-sm">
            <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic text-gray-900">Adjust Wealth</DialogTitle></DialogHeader>
            <div className="space-y-8 pt-8">
              <Select value={coinAdjustment.bucket} onValueChange={(val: any) => setCoinAdjustment({...coinAdjustment, bucket: val})}>
                <SelectTrigger className="h-14 border-gray-100 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="deposit">Deposit Vault</SelectItem><SelectItem value="winning">Winning Vault</SelectItem><SelectItem value="task">Task Hub</SelectItem></SelectContent>
              </Select>
              <div className="relative">
                 <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="h-20 text-4xl font-black text-center border-gray-100 rounded-2xl tabular-nums pr-12" />
                 <Coins className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-amber-500 opacity-40" />
              </div>
              <Button onClick={async () => {
                 const { userId, bucket, amount } = coinAdjustment;
                 const payload: any = { coins: increment(amount) };
                 if (bucket === 'deposit') payload.depositBalance = increment(amount);
                 if (bucket === 'winning') payload.winningBalance = increment(amount);
                 if (bucket === 'task') payload.taskBalance = increment(amount);
                 await updateDoc(doc(firestore!, 'users', userId), payload);
                 await addDoc(collection(firestore!, 'users', userId, 'ledger'), { type: 'income', amount, date: new Date().toISOString().split('T')[0], status: 'completed', description: `Admin Override: ${bucket}` });
                 setCoinAdjustment(null);
                 toast({ title: "Warrior Wealth Synced" });
              }} className="w-full h-16 bg-blue-500 hover:bg-blue-600 font-black uppercase tracking-widest rounded-2xl shadow-xl italic">Apply Override</Button>
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
        "w-full flex items-center justify-between px-6 py-4 rounded-xl transition-all text-sm font-bold",
        active ? "bg-blue-500 text-white shadow-xl shadow-blue-900/20" : "text-gray-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="flex items-center gap-4">
        <span className={cn("transition-transform", active ? "scale-110" : "opacity-60")}>{icon}</span>
        <span className={cn(active ? "tracking-tight" : "opacity-80")}>{label}</span>
      </div>
      {badge && <Badge className="bg-blue-400/20 text-blue-300 text-[8px] font-black border-none px-2 py-0.5 rounded-md">{badge}</Badge>}
      {count !== undefined && count > 0 && <Badge className="bg-red-500 text-white text-[8px] font-black border-none h-5 w-5 flex items-center justify-center p-0 rounded-full shadow-lg shadow-red-500/20">{count}</Badge>}
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
    <Card className="border-none shadow-sm rounded-3xl p-8 bg-white flex items-center justify-between group hover:scale-[1.02] transition-all cursor-default">
       <div className="space-y-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{label}</p>
          <h4 className="text-3xl font-black text-gray-900 tracking-tight italic">{value}</h4>
          <p className="text-[9px] font-black text-green-500 uppercase tracking-widest">{sub}</p>
       </div>
       <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-12 shadow-inner", colorMap[color])}>
          {icon}
       </div>
    </Card>
  );
}

function LegendItem({ color, label, value }: any) {
   return (
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className={cn("h-3 w-3 rounded-full", color)} />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</span>
         </div>
         <span className="text-[10px] font-black text-gray-900">{value}</span>
      </div>
   );
}
