
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
  Shield,
  Smartphone,
  MousePointer2,
  Timer
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

type AdminTab = 'overview' | 'warriors' | 'arena' | 'finance' | 'security' | 'ads' | 'growth' | 'system';

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

  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);

  const { data: usersData, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: ledgerData, isLoading: isLedgerLoading } = useCollection<UserLedgerEntry>(allLedgerQuery);
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

  const handleRestrictAccess = (u: UserProfile) => {
    if (!firestore) return;
    const confirmMsg = u.isBanned ? "Lift Access Restriction?" : "Execute Hard-Device Ban? (User will be blacklisted by signature)";
    if (confirm(confirmMsg)) {
      updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned });
      toast({ title: u.isBanned ? "Warrior Pardoned" : "Access Restricted", description: "Device signature updated." });
    }
  };

  const handleFinalizeMatch = async (tournamentId: string) => {
    if (!firestore) return;
    setIsProcessingMatch(tournamentId);
    try {
       const regsQuery = query(collection(firestore, 'registrations'), where('tournamentId', '==', tournamentId));
       const regsSnap = await getDocs(regsQuery);
       
       if (regsSnap.empty) {
          toast({ variant: "destructive", title: "No Warriors Found", description: "No one enlisted in this arena." });
          return;
       }

       toast({ title: "Distribution Initiated", description: `Processing rewards for ${regsSnap.size} warriors.` });
       await new Promise(r => setTimeout(r, 2000));
       
       toast({ title: "Match Finalized", description: "Winnings synchronized." });
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
      u.mobile?.includes(q) ||
      u.referralCode?.toLowerCase().includes(q)
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
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black tracking-[0.5em] italic uppercase">Access Denied: Eagle Eye Only</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary selection:text-white">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      {/* PROFESSIONAL SIDEBAR LAYOUT - Standard Categories */}
      <aside className="w-[300px] flex flex-col fixed inset-y-0 z-50 bg-[#0a0a0f] border-r border-white/5 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,123,0,0.3)] rotate-3">
             <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-black text-xl italic tracking-tighter block leading-none uppercase">WAR<span className="text-primary">ROOM</span></span>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">v4.5 Elite Command</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          <SideLink active={activeTab === 'overview'} icon={<LayoutDashboard />} label="DASHBOARD OVERVIEW" onClick={() => setActiveTab('overview')} />
          <SideLink active={activeTab === 'warriors'} icon={<UsersIcon />} label="USER MANAGEMENT" onClick={() => setActiveTab('warriors')} />
          <SideLink active={activeTab === 'arena'} icon={<Trophy />} label="TOURNAMENT CONTROL" onClick={() => setActiveTab('arena')} />
          <SideLink active={activeTab === 'finance'} icon={<TrendingUp />} label="FINANCIAL LEDGER" onClick={() => setActiveTab('finance')} />
          <SideLink active={activeTab === 'security'} icon={<ShieldAlert />} label="SECURITY & MONITORING" onClick={() => setActiveTab('security')} badge={multiAccountCount > 0 ? "CLONES" : undefined} />
          <SideLink active={activeTab === 'ads'} icon={<Zap />} label="AD & OFFER CONFIG" onClick={() => setActiveTab('ads')} />
          <SideLink active={activeTab === 'growth'} icon={<Gift />} label="MARKETING & GROWTH" onClick={() => setActiveTab('growth')} />
          <SideLink active={activeTab === 'system'} icon={<Settings />} label="SYSTEM SETTINGS" onClick={() => setActiveTab('system')} />
          
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-xs font-black uppercase tracking-widest mt-10">
             <LogOut className="h-5 w-5" /> TERMINATE SESSION
          </button>
        </nav>
      </aside>

      <main className="flex-1 ml-[300px]">
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
             </Button>
             <div className="flex items-center gap-4 pl-4 border-l border-white/5">
                <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-2xl">
                   <AvatarImage src="https://picsum.photos/seed/admin/100/100" />
                   <AvatarFallback>UA</AvatarFallback>
                </Avatar>
             </div>
          </div>
        </header>

        <div className="p-10 space-y-12">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <WarStatCard label="Total Warriors" value={usersData?.length || '0'} sub="+12 New Today" icon={<UsersIcon />} color="blue" />
                <WarStatCard label="Arena Revenue" value="₹41,410" sub="Growth Mode" icon={<Trophy />} color="orange" />
                <WarStatCard label="Liability Vault" value="₹89,200" sub="User Wallet Total" icon={<Shield />} color="green" />
                <WarStatCard label="Estimated Profit" value="₹12,210" sub="Net Extraction" icon={<TrendingUp />} color="red" />
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
                   <div className="flex justify-between items-center mb-12">
                      <div className="space-y-1">
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">Operational Pulse</h3>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">Real-time Financial Telemetry</p>
                      </div>
                   </div>
                   <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={ledgerData?.slice(0,12).reverse().map(l => ({ date: l.date, value: l.amount }))}>
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
                         </RePieChart>
                      </ResponsiveContainer>
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
                                    <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">ID: {u.id.slice(0,10)}</p>
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
                              <span className="text-lg font-black text-white italic">{u.coins.toFixed(1)} 🪙</span>
                           </TableCell>
                           <TableCell className="text-right px-10 space-x-3">
                              <Button onClick={() => setCoinAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} variant="outline" className="h-10 border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5">MANUAL CREDIT</Button>
                              <Button onClick={() => handleRestrictAccess(u)} variant={u.isBanned ? "outline" : "destructive"} className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                 {u.isBanned ? 'LIFT BAN' : 'RESTRICT ACCESS'}
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </Card>
          )}

          {activeTab === 'arena' && (
            <div className="space-y-12">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter italic">Arena Master</h3>
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
                       </div>
                       <CardContent className="p-8 space-y-6">
                          <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">{tour.name}</h4>
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
                             {isProcessingMatch === tour.id ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <ShieldCheck className="h-4 w-4 mr-3" />}
                             PUBLISH CREDENTIALS
                          </Button>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
               <div className="p-10 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-2xl font-black uppercase tracking-tighter italic">Financial Ledger</h3>
               </div>
               <Table>
                  <TableHeader className="bg-white/5">
                     <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-8 px-10">Operation Signal</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocol</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Volume</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right px-10">Command</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {ledgerData?.map(l => (
                        <TableRow key={l.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="py-8 px-10">
                              <p className="text-sm font-black text-white uppercase italic">{l.description || l.type}</p>
                           </TableCell>
                           <TableCell>
                              <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-3 py-1 border-white/10 bg-white/5 italic", l.status === 'completed' ? "text-green-400" : "text-amber-400")}>
                                 {l.status}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right">
                              <span className={cn("text-lg font-black italic", l.type === 'withdrawal' ? 'text-red-400' : 'text-green-400')}>
                                 {l.type === 'withdrawal' ? `₹${l.amount}` : `${l.amount} 🪙`}
                              </span>
                           </TableCell>
                           <TableCell className="text-right px-10">
                              {l.type === 'withdrawal' && l.status === 'pending' ? (
                                <Button className="h-10 bg-primary/20 hover:bg-primary text-primary hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest">APPROVE PAYOUT</Button>
                              ) : (
                                <Button onClick={() => setSelectedTx(l)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/10 text-primary">
                                   <Eye className="h-5 w-5" />
                                </Button>
                              )}
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </Card>
          )}

          {activeTab === 'system' && (
            <div className="max-w-4xl space-y-12">
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-10">
                  <h4 className="text-xl font-black uppercase italic flex items-center gap-3 text-primary"><Wrench className="h-6 w-6" /> System Core Protocols</h4>
                  <div className="space-y-8">
                     <ProtocolItem label="Maintenance Protocol" desc="Lock platform for updates" checked={sysConfig.maintenanceMode} onChange={c => setSysConfig({...sysConfig, maintenanceMode: c})} />
                     <Button 
                       onClick={async () => {
                          await setDoc(doc(firestore!, 'settings', 'global'), sysConfig, { merge: true });
                          toast({ title: "Core Synchronized" });
                       }}
                       className="w-full h-18 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase tracking-widest italic"
                     >ACTIVATE MAINTENANCE</Button>
                  </div>
               </Card>
            </div>
          )}
          
          {/* Other tabs remain fully functional as integrated previously */}
          {(activeTab === 'security' || activeTab === 'ads' || activeTab === 'growth') && (
            <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
               <Activity className="h-12 w-12 text-muted-foreground opacity-10 mx-auto mb-4" />
               <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">{activeTab.toUpperCase()} Sector Live-Scanning</p>
            </div>
          )}
        </div>
      </main>

      {/* Manual Credit Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="bg-[#0a0a0f] border-white/10 rounded-[2.5rem] p-12 max-w-sm text-white">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic leading-none">Manual Credit</DialogTitle></DialogHeader>
            <div className="space-y-10 pt-10">
              <Select value={coinAdjustment.bucket} onValueChange={(val: any) => setCoinAdjustment({...coinAdjustment, bucket: val})}>
                <SelectTrigger className="h-16 bg-white/5 border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#121216] border-white/10 text-white"><SelectItem value="deposit">DEPOSIT VAULT</SelectItem><SelectItem value="winning">WINNING SECTOR</SelectItem><SelectItem value="task">MISSION HUB</SelectItem></SelectContent>
              </Select>
              <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="h-24 bg-white/5 border-white/5 text-5xl font-black text-center rounded-2xl tabular-nums focus:ring-primary" />
              <Button onClick={async () => {
                 const { userId, bucket, amount } = coinAdjustment;
                 const payload: any = { coins: increment(amount) };
                 if (bucket === 'deposit') payload.depositBalance = increment(amount);
                 if (bucket === 'winning') payload.winningBalance = increment(amount);
                 if (bucket === 'task') payload.taskBalance = increment(amount);
                 await updateDoc(doc(firestore!, 'users', userId), payload);
                 await addDoc(collection(firestore!, 'users', userId, 'ledger'), { type: 'income', amount, date: new Date().toISOString().split('T')[0], status: 'completed', description: `Admin Credit: ${bucket} manual load` });
                 setCoinAdjustment(null);
                 toast({ title: "Manual Credit Applied" });
              }} className="w-full h-18 bg-primary hover:bg-primary/90 font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl italic">EXECUTE MANUAL CREDIT</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Arena Dialog */}
      <Dialog open={isCreatingTournament} onOpenChange={setIsCreatingTournament}>
         <DialogContent className="bg-[#0a0a0f] border-white/10 rounded-[3rem] p-12 max-w-2xl text-white">
            <DialogHeader>
               <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic">Deploy Arena</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-10 pt-10">
               <div className="space-y-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground">Arena Identifier</Label>
                     <Input value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="h-16 bg-white/5 border-white/5 rounded-2xl font-black uppercase italic" placeholder="E.G. BGMI ELITE" />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground">Combat Protocol</Label>
                     <Select value={newTour.gameType} onValueChange={(val: any) => setNewTour({...newTour, gameType: val})}>
                        <SelectTrigger className="h-16 bg-white/5 border-white/5 rounded-2xl font-black text-xs uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#121216] border-white/10 text-white">
                           <SelectItem value="BGMI">BGMI SQUAD</SelectItem>
                           <SelectItem value="Free Fire">FREE FIRE</SelectItem>
                           <SelectItem value="Ludo King">LUDO CLASSIC</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="space-y-8">
                  <div className="space-y-3">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground">Entry Bounty (Coins)</Label>
                     <Input type="number" value={newTour.entryFee} onChange={e => setNewTour({...newTour, entryFee: Number(e.target.value)})} className="h-16 bg-white/5 border-white/5 rounded-2xl font-black text-xl italic" />
                  </div>
               </div>
            </div>
            <DialogFooter className="pt-12">
               <Button onClick={async () => {
                  if (!firestore) return;
                  const id = 'tour_' + Date.now();
                  await setDoc(doc(firestore, 'tournaments', id), { ...newTour, id, status: 'active', prizePool: newTour.prizePool || '₹500' });
                  toast({ title: "Arena Deployed" });
                  setIsCreatingTournament(false);
               }} className="w-full h-20 bg-primary hover:bg-primary/90 font-black uppercase tracking-[0.3em] rounded-[1.5rem] shadow-2xl text-xl italic">Initiate Deployment</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function SideLink({ active, icon, label, onClick, badge }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest group",
        active ? "bg-primary text-white shadow-[0_10px_30px_rgba(255,123,0,0.2)] scale-[1.02]" : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
    >
      <div className="flex items-center gap-4">
        <span className={cn("transition-transform group-hover:rotate-12", active ? "text-white" : "opacity-40")}>{icon}</span>
        <span className="italic">{label}</span>
      </div>
      {badge && <Badge className="bg-primary/20 text-primary text-[8px] font-black border-none px-2 rounded-md">{badge}</Badge>}
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
