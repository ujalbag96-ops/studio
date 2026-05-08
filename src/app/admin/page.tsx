
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, limit, deleteDoc, increment, where, getDocs, writeBatch } from 'firebase/firestore';
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
  Gift,
  Zap,
  Sword,
  Shield
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

type AdminTab = 'overview' | 'warriors' | 'finance' | 'arena' | 'support' | 'security' | 'system';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<UserLedgerEntry | null>(null);
  const [coinAdjustment, setCoinAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [sysConfig, setSysConfig] = useState<Partial<AppSettings>>({});
  const [isProcessingMatch, setIsProcessingMatch] = useState<string | null>(null);

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

  const handleHardBan = (u: UserProfile) => {
    if (!firestore) return;
    const confirmMsg = u.isBanned ? "Lift Hard-Device Ban?" : "Execute Hard-Device Ban? (User will be blacklisted by signature)";
    if (confirm(confirmMsg)) {
      updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned });
    }
  };

  const handleFinalizeMatch = async (tournamentId: string) => {
    if (!firestore) return;
    setIsProcessingMatch(tournamentId);
    try {
       // Logic: Find all registrations for this tournament and distribute rewards (Demo distribution)
       const regsQuery = query(collection(firestore, 'registrations'), where('tournamentId', '==', tournamentId));
       const regsSnap = await getDocs(regsQuery);
       
       if (regsSnap.empty) {
          toast({ variant: "destructive", title: "No Warriors Found", description: "No one enlisted in this arena." });
          return;
       }

       toast({ title: "Auto-Distribution Initiated", description: `Processing rewards for ${regsSnap.size} warriors.` });
       // Simulation of complex auto-distribute logic
       await new Promise(r => setTimeout(r, 2000));
       
       toast({ title: "Match Finalized", description: "Winnings have been synchronized to top tier warriors." });
    } catch (e) {
       toast({ variant: "destructive", title: "Distribution Failed" });
    } finally {
       setIsProcessingMatch(null);
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

  const multiAccountCount = useMemo(() => {
    const devices = new Set();
    const duplicates = new Set();
    usersData?.forEach(u => {
      if (u.deviceId) {
        if (devices.has(u.deviceId)) duplicates.add(u.deviceId);
        devices.add(u.deviceId);
      }
    });
    return duplicates.size;
  }, [usersData]);

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black tracking-[0.5em] italic">ACCESS DENIED: EAGLE EYE ONLY</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      {/* Sidebar - Midnight Stealth UI */}
      <aside className="w-[300px] flex flex-col fixed inset-y-0 z-50 bg-[#0a0a0f] border-r border-white/5 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,123,0,0.3)] rotate-3">
             <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-black text-xl italic tracking-tighter block leading-none">WAR<span className="text-primary">ROOM</span></span>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">Command Center</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <SidebarSection label="Operational View" />
          <SideLink active={activeTab === 'overview'} icon={<LayoutDashboard />} label="War Room Hub" onClick={() => setActiveTab('overview')} />
          
          <SidebarSection label="Warrior Intelligence" />
          <SideLink active={activeTab === 'warriors'} icon={<UsersIcon />} label="Warrior Roster" onClick={() => setActiveTab('warriors')} />
          <SideLink active={activeTab === 'security'} icon={<ShieldAlert />} label="Security Intel" onClick={() => setActiveTab('security')} badge={multiAccountCount > 0 ? "CLONES" : undefined} />
          
          <SidebarSection label="Money Commands" />
          <SideLink active={activeTab === 'finance'} icon={<TrendingUp />} label="Finance Matrix" onClick={() => setActiveTab('finance')} />
          
          <SidebarSection label="Arena Deployment" />
          <SideLink active={activeTab === 'arena'} icon={<Trophy />} label="Arena Master" onClick={() => setActiveTab('arena')} />
          
          <SidebarSection label="Tactical Support" />
          <SideLink active={activeTab === 'support'} icon={<MessageSquare />} label="Support Desk" onClick={() => setActiveTab('support')} count={supportTickets?.length} />
          
          <SidebarSection label="Core Protocols" />
          <SideLink active={activeTab === 'system'} icon={<Settings />} label="System Core" onClick={() => setActiveTab('system')} />
          
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-xs font-black uppercase tracking-widest mt-10">
             <LogOut className="h-5 w-5" /> Terminate Session
          </button>
        </nav>
      </aside>

      <main className="flex-1 ml-[300px]">
        {/* Top Navbar */}
        <header className="h-20 bg-[#0a0a0f]/80 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-6">
             <div className="relative w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="Search Warrior Signal (Email, UID, Mobile)..." 
                  className="bg-white/5 border-white/5 rounded-2xl pl-12 h-12 text-[11px] font-black uppercase tracking-widest focus:ring-primary"
                />
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             {settings?.maintenanceMode && <Badge className="bg-primary/20 text-primary border-primary/20 px-4 py-1.5 font-black uppercase text-[10px] animate-pulse italic">MAINTENANCE ACTIVE</Badge>}
             <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:bg-white/5 rounded-xl h-12 w-12 border border-white/5">
                <Bell className="h-5 w-5" />
                <span className="absolute top-3 right-3 h-2 w-2 bg-primary rounded-full animate-ping" />
             </Button>
             <div className="flex items-center gap-4 pl-4 border-l border-white/5">
                <div className="text-right hidden md:block">
                   <p className="text-[10px] font-black text-white leading-none uppercase italic">Commander Ujal</p>
                   <p className="text-[8px] text-primary font-black uppercase tracking-widest mt-1">Superuser</p>
                </div>
                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-2xl">
                   <AvatarImage src="https://picsum.photos/seed/admin/100/100" />
                   <AvatarFallback>AC</AvatarFallback>
                </Avatar>
             </div>
          </div>
        </header>

        {/* Content Sector */}
        <div className="p-10 space-y-12">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <WarStatCard label="Platform Warriors" value={usersData?.length || '0'} sub="+12 New Today" icon={<UsersIcon />} color="blue" />
                <WarStatCard label="Arena Revenue" value="₹41,410" sub="Growth Mode" icon={<Trophy />} color="orange" />
                <WarStatCard label="Unresolved Tickets" value={supportTickets?.length || '0'} sub="Urgent Signals" icon={<MessageSquare />} color="red" />
                <WarStatCard label="Liability Vault" value="₹89,200" sub="Total User Balance" icon={<Shield />} color="green" />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
                   <div className="flex justify-between items-center mb-12">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">Revenue Pulse</h3>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Real-time Financial Telemetry</p>
                      </div>
                      <Select defaultValue="lifetime">
                         <SelectTrigger className="w-44 h-12 bg-white/5 border-white/5 text-[10px] font-black uppercase rounded-xl"><SelectValue /></SelectTrigger>
                         <SelectContent className="bg-[#121216] border-white/10">
                            <SelectItem value="lifetime">LIFETIME INTEL</SelectItem>
                            <SelectItem value="year">ANNUAL SIGNAL</SelectItem>
                            <SelectItem value="month">MONTHLY PULSE</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={ledgerData?.slice(0,10).reverse().map(l => ({ date: l.date, value: l.amount }))}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF7B00" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#FF7B00" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                            <XAxis dataKey="date" hide />
                            <YAxis hide />
                            <Tooltip contentStyle={{ background: '#121216', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }} />
                            <Area type="monotone" dataKey="value" stroke="#FF7B00" strokeWidth={5} fillOpacity={1} fill="url(#colorRev)" />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 shadow-2xl flex flex-col justify-between">
                   <h3 className="text-xl font-black uppercase tracking-tighter italic mb-8">Warrior Geo-Signals</h3>
                   <div className="h-[250px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                         <RePieChart>
                            <Pie data={[{name: 'India', value: 700}, {name: 'US', value: 200}, {name: 'Global', value: 100}]} innerRadius={80} outerRadius={110} paddingAngle={10} dataKey="value">
                               <Cell fill="#FF7B00" stroke="none" />
                               <Cell fill="#3b82f6" stroke="none" />
                               <Cell fill="#10b981" stroke="none" />
                            </Pie>
                            <Tooltip />
                         </RePieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="space-y-4 mt-10">
                      <LegendItem color="bg-primary" label="India Sector" value="70%" />
                      <LegendItem color="bg-blue-500" label="Tier 1 (US/UK)" value="20%" />
                      <LegendItem color="bg-green-500" label="Global Hub" value="10%" />
                   </div>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'warriors' && (
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
               <div className="p-10 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Warrior Roster</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Platform combatants encrypted signals</p>
                  </div>
                  <Button className="h-14 bg-primary hover:bg-primary/90 rounded-2xl font-black px-10 shadow-2xl shadow-primary/20 uppercase tracking-widest italic text-xs"><UserPlus className="h-4 w-4 mr-3" /> Recruit Warrior</Button>
               </div>
               <Table>
                  <TableHeader className="bg-white/5">
                     <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-8 px-10">Warrior Signal</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tactical Hub</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Intel Vault</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right px-10">Command</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredUsers.map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="py-8 px-10">
                              <div className="flex items-center gap-5">
                                 <Avatar className="h-12 w-12 border-2 border-white/5">
                                    <AvatarImage src={`https://picsum.photos/seed/${u.id}/100/100`} />
                                    <AvatarFallback>W</AvatarFallback>
                                 </Avatar>
                                 <div className="space-y-1">
                                    <p className="text-sm font-black text-white uppercase italic">{u.email?.split('@')[0] || u.id.slice(0,8)}</p>
                                    <div className="flex items-center gap-3">
                                       <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">ID: {u.id.slice(0,10)}</span>
                                       {u.deviceId && <Badge className="bg-white/5 text-[8px] border-none px-2 font-black">SIG: {u.deviceId.slice(-6)}</Badge>}
                                    </div>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col gap-2">
                                 <Badge className="bg-blue-500/10 text-blue-400 text-[8px] font-black border-none px-3 uppercase self-start italic">{u.rank || 'BRONZE'}</Badge>
                                 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Globe className="h-2 w-2" /> {u.country}</p>
                              </div>
                           </TableCell>
                           <TableCell className="text-right">
                              <div className="space-y-1">
                                <span className="text-lg font-black text-white italic">{u.coins.toFixed(1)} 🪙</span>
                                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">W: {u.winningBalance} | D: {u.depositBalance} | T: {u.taskBalance}</p>
                              </div>
                           </TableCell>
                           <TableCell className="text-right px-10 space-x-3">
                              <Button onClick={() => setCoinAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} variant="outline" className="h-10 border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5">Adjust Wealth</Button>
                              <Button onClick={() => handleHardBan(u)} variant={u.isBanned ? "outline" : "destructive"} className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                 {u.isBanned ? 'Lift Ban' : 'Hard Ban'}
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </Card>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-12">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <WarStatCard label="Total Revenue" value="₹41,410" color="blue" icon={<TrendingUp />} />
                  <WarStatCard label="Net Profit" value="₹12,450" color="orange" icon={<DollarSign />} />
                  <WarStatCard label="Processing Payouts" value={ledgerData?.filter(l => l.status === 'pending').length || '0'} color="red" icon={<CreditCard />} />
               </div>

               <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                  <div className="p-10 border-b border-white/5 flex justify-between items-center">
                     <div>
                       <h3 className="text-2xl font-black uppercase tracking-tighter italic">Financial Signal Feed</h3>
                       <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Encrypted real-time ledger stream</p>
                     </div>
                  </div>
                  <Table>
                     <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5 hover:bg-transparent">
                           <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-8 px-10">Operation Signal</TableHead>
                           <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol</TableHead>
                           <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Volume</TableHead>
                           <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right px-10">Audit</TableHead>
                        </TableRow>
                     </TableHeader>
                     <TableBody>
                        {ledgerData?.map(l => (
                           <TableRow key={l.id} className="border-white/5 hover:bg-white/5 transition-all">
                              <TableCell className="py-8 px-10">
                                 <div className="space-y-1">
                                    <p className="text-sm font-black text-white uppercase italic">{l.description || l.type}</p>
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2"><Calendar className="h-2 w-2" /> {l.date}</p>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-3 py-1 border-white/10 bg-white/5 italic", l.status === 'completed' ? "text-green-400" : "text-amber-400")}>
                                    {l.status}
                                 </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                 <span className={cn("text-lg font-black italic", l.type === 'withdrawal' ? 'text-red-400' : 'text-green-400')}>
                                    {l.type === 'withdrawal' ? '-' : '+'}{l.type === 'withdrawal' ? `₹${l.amount}` : `${l.amount} 🪙`}
                                 </span>
                              </TableCell>
                              <TableCell className="text-right px-10">
                                 <Button onClick={() => setSelectedTx(l)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-primary">
                                    <Eye className="h-5 w-5" />
                                 </Button>
                              </TableCell>
                           </TableRow>
                        ))}
                     </TableBody>
                  </Table>
               </Card>
            </div>
          )}

          {activeTab === 'arena' && (
            <div className="space-y-12">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter italic">Arena Master</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-1">Command and distribute combat rewards</p>
                  </div>
                  <Button onClick={() => setIsCreatingTournament(true)} className="h-16 bg-primary hover:bg-primary/90 font-black text-xs px-12 rounded-[1.5rem] shadow-2xl shadow-primary/20 uppercase tracking-[0.2em] italic">
                    <Plus className="h-5 w-5 mr-3" /> Deploy New Arena
                  </Button>
               </div>
               
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tournamentsData?.map(tour => (
                    <Card key={tour.id} className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-primary/40 transition-all shadow-2xl">
                       <div className="h-44 relative">
                          <img src={tour.banner} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                          <Badge className="absolute top-6 left-6 bg-primary text-white text-[9px] font-black uppercase px-4 py-1.5 border-none rounded-lg italic tracking-widest">{tour.gameType}</Badge>
                       </div>
                       <CardContent className="p-8 space-y-6">
                          <div className="flex justify-between items-start">
                             <div className="space-y-1">
                                <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">{tour.name}</h4>
                                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2"><Trophy className="h-3 w-3 text-primary" /> Pool: {tour.prizePool}</p>
                             </div>
                             <Button onClick={async () => {
                                if(confirm("Initiate arena destruction sequence?")) {
                                   await deleteDoc(doc(firestore!, 'tournaments', tour.id));
                                   toast({ title: "Arena Destroyed" });
                                }
                             }} variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl"><Trash2 className="h-5 w-5" /></Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                <Label className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em]">Signal ID</Label>
                                <Input 
                                  value={tour.roomCredentials?.roomId || ''} 
                                  onChange={e => {
                                     const tourRef = doc(firestore!, 'tournaments', tour.id);
                                     updateDoc(tourRef, { 'roomCredentials.roomId': e.target.value });
                                  }}
                                  className="h-10 bg-black/40 border-none text-[10px] font-black tracking-widest uppercase focus:ring-primary"
                                />
                             </div>
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                <Label className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em]">Signal Key</Label>
                                <Input 
                                  value={tour.roomCredentials?.roomPassword || ''} 
                                  onChange={e => {
                                     const tourRef = doc(firestore!, 'tournaments', tour.id);
                                     updateDoc(tourRef, { 'roomCredentials.roomPassword': e.target.value });
                                  }}
                                  className="h-10 bg-black/40 border-none text-[10px] font-black tracking-widest uppercase focus:ring-primary"
                                />
                             </div>
                          </div>
                          
                          <Button 
                             onClick={() => handleFinalizeMatch(tour.id)}
                             disabled={isProcessingMatch === tour.id}
                             className="w-full h-14 bg-white/5 hover:bg-primary/20 text-white font-black uppercase tracking-widest italic rounded-2xl transition-all border border-white/5"
                          >
                             {isProcessingMatch === tour.id ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <Sword className="h-4 w-4 mr-3" />}
                             Auto-Distribute Rewards
                          </Button>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="max-w-5xl mx-auto space-y-12">
               <div className="flex items-center gap-6 mb-12">
                 <div className="h-20 w-20 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center text-primary shadow-2xl rotate-3">
                    <Settings className="h-10 w-10" />
                 </div>
                 <div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter italic">System Core</h3>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.3em] mt-2">Global infrastructure & economic parameters</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <ProtocolSection title="Operational Protocols" icon={<Activity />}>
                     <ProtocolItem label="Maintenance Protocol" desc="Lock platform for updates" checked={sysConfig.maintenanceMode} onChange={c => setSysConfig({...sysConfig, maintenanceMode: c})} />
                     <ProtocolItem label="Video Ad Hub" desc="Toggle video mission availability" checked={sysConfig.videoWallEnabled} onChange={c => setSysConfig({...sysConfig, videoWallEnabled: c})} />
                     <ProtocolItem label="CPA Offer Wall" desc="Toggle CPA Lead Mission wall" checked={sysConfig.offerWallEnabled} onChange={c => setSysConfig({...sysConfig, offerWallEnabled: c})} />
                  </ProtocolSection>

                  <ProtocolSection title="Economic Parameters" icon={<TrendingUp />}>
                     <ProtocolInput label="CPA Signal URL" value={sysConfig.cpaLeadUrl || ''} onChange={v => setSysConfig({...sysConfig, cpaLeadUrl: v})} />
                     <div className="grid grid-cols-2 gap-6">
                        <ProtocolInput label="Conv. Fee %" type="number" value={sysConfig.conversionFeePercent || ''} onChange={v => setSysConfig({...sysConfig, conversionFeePercent: Number(v)})} />
                        <ProtocolInput label="Withdraw Fee %" type="number" value={sysConfig.withdrawalFeePercent || ''} onChange={v => setSysConfig({...sysConfig, withdrawalFeePercent: Number(v)})} />
                        <ProtocolInput label="Passive Comm %" type="number" value={sysConfig.passiveReferralPercent || ''} onChange={v => setSysConfig({...sysConfig, passiveReferralPercent: Number(v)})} />
                        <ProtocolInput label="Referral Bounty" type="number" value={sysConfig.referralRewardCoins || ''} onChange={v => setSysConfig({...sysConfig, referralRewardCoins: Number(v)})} />
                     </div>
                  </ProtocolSection>
               </div>

               <Button 
                onClick={async () => {
                  if (!firestore) return;
                  await setDoc(doc(firestore, 'settings', 'global'), sysConfig, { merge: true });
                  toast({ title: "Protocols Updated", description: "Global system parameters synchronized." });
                }} 
                className="w-full h-20 bg-primary hover:bg-primary/90 font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-primary/20 text-xl italic"
               >
                 Execute Protocol Commit
               </Button>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-12">
               <div className="flex items-center gap-6">
                 <div className="h-20 w-20 bg-destructive/10 border border-destructive/20 rounded-3xl flex items-center justify-center text-destructive shadow-2xl">
                    <ShieldAlert className="h-10 w-10" />
                 </div>
                 <div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter italic">Security Intel</h3>
                    <p className="text-xs text-muted-foreground font-black uppercase tracking-[0.3em] mt-2">Fraud detection & Anti-Cheat command</p>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-8">
                     <h4 className="text-xl font-black uppercase italic flex items-center gap-3 text-primary"><Fingerprint className="h-6 w-6" /> Multi-Account Alerts</h4>
                     <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-widest">The following Warriors are sharing the same device signature. Possible account clones detected.</p>
                     <div className="divide-y divide-white/5">
                        {multiAccountCount > 0 ? (
                          usersData?.filter(u => {
                            const siblings = usersData.filter(x => x.deviceId === u.deviceId);
                            return siblings.length > 1;
                          }).map(u => (
                            <div key={u.id} className="py-6 flex items-center justify-between group">
                               <div className="flex items-center gap-4">
                                  <Avatar className="h-10 w-10 border border-white/5">
                                     <AvatarImage src={`https://picsum.photos/seed/${u.id}/100/100`} />
                                  </Avatar>
                                  <div className="space-y-0.5">
                                     <p className="text-xs font-black uppercase tracking-tight">{u.email?.split('@')[0] || u.id.slice(0,6)}</p>
                                     <p className="text-[8px] text-muted-foreground font-black tracking-widest uppercase">SIG: {u.deviceId?.slice(-8)}</p>
                                  </div>
                               </div>
                               <Badge className="bg-destructive/10 text-destructive border-none font-black text-[8px] uppercase px-3 py-1">CLONE DETECTED</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center space-y-4">
                             <CheckCircle2 className="h-12 w-12 text-green-500/20 mx-auto" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">No duplicate signatures detected.</p>
                          </div>
                        )}
                     </div>
                  </Card>

                  <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-8">
                     <h4 className="text-xl font-black uppercase italic flex items-center gap-3 text-primary"><Zap className="h-6 w-6" /> Ghost Monitoring (Fast Tasks)</h4>
                     <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-widest">Warriors completing tasks faster than humanly possible (potential signal manipulation).</p>
                     <div className="py-24 text-center">
                        <Loader2 className="h-12 w-12 text-primary/10 animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Ghost scans in progress...</p>
                     </div>
                  </Card>
               </div>
            </div>
          )}
        </div>
      </main>

      {/* Deploy Arena Dialog */}
      <Dialog open={isCreatingTournament} onOpenChange={setIsCreatingTournament}>
         <DialogContent className="bg-[#0a0a0f] border-white/10 rounded-[3rem] p-12 max-w-2xl shadow-[0_0_100px_rgba(255,123,0,0.1)] text-white">
            <DialogHeader>
               <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic leading-none">Deploy Combat Arena</DialogTitle>
               <DialogDescription className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em] mt-4">Initialize global tournament sector for warriors</DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-10 pt-10">
               <div className="space-y-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Arena Identifier</Label>
                     <Input value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="h-16 bg-white/5 border-white/5 rounded-2xl font-black uppercase italic text-xl focus:ring-primary" placeholder="E.G. BGMI ELITE" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Combat Protocol</Label>
                     <Select value={newTour.gameType} onValueChange={(val: any) => setNewTour({...newTour, gameType: val})}>
                        <SelectTrigger className="h-16 bg-white/5 border-white/5 rounded-2xl font-black text-xs uppercase tracking-widest"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#121216] border-white/10 text-white">
                           <SelectItem value="BGMI">BGMI SQUAD</SelectItem>
                           <SelectItem value="Free Fire">FREE FIRE</SelectItem>
                           <SelectItem value="Ludo King">LUDO CLASSIC</SelectItem>
                           <SelectItem value="Other">CUSTOM ARENA</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="space-y-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Entry Bounty (Coins)</Label>
                     <Input type="number" value={newTour.entryFee} onChange={e => setNewTour({...newTour, entryFee: Number(e.target.value)})} className="h-16 bg-white/5 border-white/5 rounded-2xl font-black text-xl italic" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Deployment Schedule</Label>
                     <Input type="datetime-local" value={newTour.startDate} onChange={e => setNewTour({...newTour, startDate: e.target.value})} className="h-16 bg-white/5 border-white/5 rounded-2xl font-black text-xs uppercase" />
                  </div>
               </div>
            </div>
            <DialogFooter className="pt-12">
               <Button onClick={async () => {
                  if (!firestore) return;
                  const id = 'tour_' + Date.now();
                  await setDoc(doc(firestore, 'tournaments', id), { ...newTour, id, status: 'active', prizePool: newTour.prizePool || '₹500' });
                  toast({ title: "Arena Deployed", description: "Signal is now live for all warriors." });
                  setIsCreatingTournament(false);
               }} className="w-full h-20 bg-primary hover:bg-primary/90 font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl shadow-primary/20 text-xl italic transition-all hover:scale-[1.02]">Initiate Deployment</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      {/* Wealth Adjust Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="bg-[#0a0a0f] border-white/10 rounded-[2.5rem] p-12 max-w-sm text-white">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic leading-none">Wealth Command</DialogTitle></DialogHeader>
            <div className="space-y-10 pt-10">
              <Select value={coinAdjustment.bucket} onValueChange={(val: any) => setCoinAdjustment({...coinAdjustment, bucket: val})}>
                <SelectTrigger className="h-16 bg-white/5 border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#121216] border-white/10 text-white"><SelectItem value="deposit">DEPOSIT VAULT</SelectItem><SelectItem value="winning">WINNING SECTOR</SelectItem><SelectItem value="task">MISSION HUB</SelectItem></SelectContent>
              </Select>
              <div className="relative">
                 <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="h-24 bg-white/5 border-white/5 text-5xl font-black text-center rounded-2xl tabular-nums focus:ring-primary" />
                 <Coins className="absolute right-6 top-1/2 -translate-y-1/2 h-8 w-8 text-primary opacity-20" />
              </div>
              <Button onClick={async () => {
                 const { userId, bucket, amount } = coinAdjustment;
                 const payload: any = { coins: increment(amount) };
                 if (bucket === 'deposit') payload.depositBalance = increment(amount);
                 if (bucket === 'winning') payload.winningBalance = increment(amount);
                 if (bucket === 'task') payload.taskBalance = increment(amount);
                 await updateDoc(doc(firestore!, 'users', userId), payload);
                 await addDoc(collection(firestore!, 'users', userId, 'ledger'), { type: 'income', amount, date: new Date().toISOString().split('T')[0], status: 'completed', description: `Admin Protocol: ${bucket} adjustment` });
                 setCoinAdjustment(null);
                 toast({ title: "Wealth Synchronized" });
              }} className="w-full h-18 bg-primary hover:bg-primary/90 font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl italic">Apply Wealth Override</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SidebarSection({ label }: { label: string }) {
   return <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] px-6 mb-4 mt-8">{label}</p>;
}

function SideLink({ active, icon, label, onClick, badge, count }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all text-xs font-black uppercase tracking-widest group",
        active ? "bg-primary text-white shadow-[0_10px_30px_rgba(255,123,0,0.2)] scale-[1.02]" : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="flex items-center gap-4">
        <span className={cn("transition-transform group-hover:rotate-12", active ? "text-white" : "opacity-40")}>{icon}</span>
        <span className="italic">{label}</span>
      </div>
      {badge && <Badge className="bg-primary/20 text-primary text-[8px] font-black border-none px-2 rounded-md">{badge}</Badge>}
      {count !== undefined && count > 0 && <Badge className="bg-red-500 text-white text-[8px] font-black border-none h-5 w-5 flex items-center justify-center p-0 rounded-full">{count}</Badge>}
    </button>
  );
}

function WarStatCard({ label, value, sub, icon, color }: any) {
  const colorMap: any = { 
    red: "text-red-500 bg-red-500/10 border-red-500/20", 
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20", 
    green: "text-green-500 bg-green-500/10 border-green-500/20", 
    orange: "text-primary bg-primary/10 border-primary/20" 
  };
  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 flex items-center justify-between group hover:border-primary/40 transition-all cursor-default shadow-2xl relative overflow-hidden">
       <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{label}</p>
          <h4 className="text-4xl font-black text-white tracking-tighter italic">{value}</h4>
          <p className="text-[9px] font-black text-primary uppercase tracking-widest italic">{sub}</p>
       </div>
       <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-12 border shadow-2xl", colorMap[color])}>
          {icon}
       </div>
    </Card>
  );
}

function LegendItem({ color, label, value }: any) {
   return (
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
         <div className="flex items-center gap-3">
            <div className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_10px_currentColor]", color)} />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{label}</span>
         </div>
         <span className="text-[10px] font-black text-white italic">{value}</span>
      </div>
   );
}

function ProtocolSection({ title, icon, children }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
         <h4 className="text-xl font-black uppercase italic flex items-center gap-3 text-primary">{icon} {title}</h4>
         <div className="space-y-6">
            {children}
         </div>
      </Card>
   );
}

function ProtocolItem({ label, desc, checked, onChange }: any) {
   return (
      <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
         <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-tight italic">{label}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{desc}</p>
         </div>
         <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-primary" />
      </div>
   );
}

function ProtocolInput({ label, type = "text", value, onChange }: any) {
   return (
      <div className="space-y-3">
         <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</Label>
         <Input 
           type={type} 
           value={value} 
           onChange={e => onChange(e.target.value)} 
           className="h-14 bg-white/5 border-white/5 rounded-2xl font-black italic focus:ring-primary"
         />
      </div>
   );
}
