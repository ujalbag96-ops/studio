
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
  Power,
  Globe,
  Coins,
  ShieldAlert,
  UserPlus,
  MessageSquare,
  Activity,
  Search,
  Eye,
  Check,
  X,
  Copy,
  Zap,
  Shield,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  Download,
  AlertTriangle,
  Send,
  Bell,
  BarChart3,
  Image as ImageIcon,
  Lock,
  Key,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, GameType, SupportMessage } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import TransactionReceipt from '@/components/TransactionReceipt';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'overview' | 'warriors' | 'arena' | 'finance' | 'security' | 'ads' | 'growth' | 'system' | 'support';

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
  const [broadcast, setBroadcast] = useState({ title: 'New Tournament Live!', body: '', imageUrl: '', audience: 'all' });

  const [newTour, setNewTour] = useState({
    name: '',
    game: '',
    gameType: 'BGMI' as GameType,
    prizePool: '₹500',
    entryFee: 10,
    startDate: '',
    banner: 'https://picsum.photos/seed/tournament/800/400',
    maxParticipants: 100
  });

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return collection(firestore, 'users');
  }, [firestore, isAdminUser]);

  const allLedgerQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    return query(collectionGroup(firestore, 'ledger'), orderBy('date', 'desc'), limit(100));
  }, [firestore, isAdminUser]);

  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  const supportQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'support'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore, isAdminUser]);

  const { data: usersData, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: ledgerData, isLoading: isLedgerLoading } = useCollection<UserLedgerEntry>(allLedgerQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: supportMessages } = useCollection<SupportMessage>(supportQuery);

  useEffect(() => {
    if (settings) setSysConfig(settings);
  }, [settings]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Signal Copied", description: "UID ready for command." });
  };

  const handleRestrictAccess = (u: UserProfile) => {
    if (!firestore) return;
    const confirmMsg = u.isBanned ? "Lift Suspension Protocol?" : "Execute SUSPEND ACCOUNT protocol? (Hard-Device Ban will activate)";
    if (confirm(confirmMsg)) {
      updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned });
      toast({ title: u.isBanned ? "Warrior Pardoned" : "SUSPEND ACCOUNT ACTIVE", variant: u.isBanned ? "default" : "destructive" });
    }
  };

  const handleResolveSupport = (msgId: string) => {
    if (!firestore) return;
    updateDoc(doc(firestore, 'support', msgId), { status: 'resolved' });
    toast({ title: "RESOLVE ISSUE", description: "Support ticket closed." });
  };

  const handleBroadcast = () => {
    toast({ title: "SEND ANNOUNCEMENT", description: `Broadcasting to ${broadcast.audience} warriors.` });
    setBroadcast({ title: 'New Tournament Live!', body: '', imageUrl: '', audience: 'all' });
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

  const filteredLedger = useMemo(() => {
    if (!ledgerData) return [];
    const q = searchQuery.toLowerCase().trim();
    return ledgerData.filter(l => 
      !q || 
      l.id.toLowerCase().includes(q) || 
      l.userId?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q)
    );
  }, [ledgerData, searchQuery]);

  const multiAccountMap = useMemo(() => {
    if (!usersData) return new Map();
    const map = new Map<string, number>();
    usersData.forEach(u => {
      if (u.deviceId) {
        map.set(u.deviceId, (map.get(u.deviceId) || 0) + 1);
      }
    });
    return map;
  }, [usersData]);

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black tracking-[0.5em] italic uppercase">Access Denied: Eagle Eye Only</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary selection:text-white">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      <aside className="w-[280px] flex flex-col fixed inset-y-0 z-50 bg-[#0a0a0f] border-r border-white/5 shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(255,123,0,0.3)] rotate-3">
             <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-black text-lg italic tracking-tighter block leading-none uppercase text-white">EAGLE<span className="text-primary">EYE</span></span>
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.3em]">v5.0 Command</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar pt-6">
          <SideLink active={activeTab === 'overview'} icon={<LayoutDashboard />} label="SYSTEM DASHBOARD" onClick={() => setActiveTab('overview')} />
          <SideLink active={activeTab === 'warriors'} icon={<UsersIcon />} label="USER DIRECTORY" onClick={() => setActiveTab('warriors')} />
          <SideLink active={activeTab === 'arena'} icon={<Trophy />} label="ARENA MANAGEMENT" onClick={() => setActiveTab('arena')} />
          <SideLink active={activeTab === 'finance'} icon={<TrendingUp />} label="PAYMENT GATEWAY" onClick={() => setActiveTab('finance')} />
          <SideLink active={activeTab === 'security'} icon={<ShieldAlert />} label="SECURITY CENTER" onClick={() => setActiveTab('security')} />
          <SideLink active={activeTab === 'ads'} icon={<Zap />} label="AD & REVENUE HUB" onClick={() => setActiveTab('ads')} />
          <SideLink active={activeTab === 'growth'} icon={<Smartphone />} label="REFERRAL NETWORK" onClick={() => setActiveTab('growth')} />
          <SideLink active={activeTab === 'support'} icon={<MessageSquare />} label="SUPPORT DESK" onClick={() => setActiveTab('support')} />
          <SideLink active={activeTab === 'system'} icon={<Settings />} label="APPLICATION SETTINGS" onClick={() => setActiveTab('system')} />
          
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-[10px] font-black uppercase tracking-widest mt-8">
             <Power className="h-4 w-4" /> TERMINATE SESSION
          </button>
        </nav>
      </aside>

      <main className="flex-1 ml-[280px]">
        <header className="h-20 bg-[#0a0a0f]/80 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-10 sticky top-0 z-40">
          <div className="flex items-center gap-6">
             <div className="relative w-[500px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="GLOBAL TACTICAL SEARCH (UID, EMAIL, MOBILE)..." 
                  className="bg-white/5 border-white/5 rounded-xl pl-12 h-12 text-[10px] font-black uppercase tracking-widest focus:ring-primary w-full"
                />
             </div>
          </div>
          
          <div className="flex items-center gap-6">
             <Button variant="outline" className="h-10 border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5 gap-2">
                <Download className="h-3.5 w-3.5" /> EXPORT REPORT
             </Button>
             <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <ShieldCheck className="h-5 w-5 text-primary" />
             </div>
          </div>
        </header>

        <div className="p-10 space-y-10">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <WarStatCard label="Total Warriors" value={usersData?.length || '0'} sub="+14 Enlisted Today" icon={<UsersIcon />} color="blue" />
                <WarStatCard label="Platform Revenue" value="₹84,210" sub="Growth Stable" icon={<TrendingUp />} color="orange" />
                <WarStatCard label="User Liabilities" value="₹1,24,000" sub="Combined Vaults" icon={<Shield />} color="green" />
                <WarStatCard label="Operational Profit" value="₹24,500" sub="Net Extraction" icon={<Trophy />} color="red" />
              </div>

              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] p-8 shadow-2xl">
                 <div className="flex justify-between items-center mb-10">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tighter italic">FINANCIAL TELEMETRY</h3>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Real-time Operational Pulse</p>
                    </div>
                 </div>
                 <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={ledgerData?.slice(0,15).reverse().map(l => ({ date: l.date, value: l.amount }))}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF7B00" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#FF7B00" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                          <XAxis dataKey="date" hide />
                          <YAxis hide />
                          <Tooltip contentStyle={{ background: '#121216', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }} />
                          <Area type="monotone" dataKey="value" stroke="#FF7B00" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </Card>
            </>
          )}

          {activeTab === 'warriors' && (
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Warrior Directory</h3>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Standardized User Roster</p>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 h-11 rounded-xl px-8 font-black uppercase tracking-widest italic text-[10px]"><UserPlus className="h-3.5 w-3.5 mr-2" /> RECRUIT NEW</Button>
               </div>
               <Table>
                  <TableHeader className="bg-white/[0.03]">
                     <TableRow className="border-white/5 hover:bg-transparent h-16">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-8">Warrior ID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name/Email</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Wallet Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Engagement</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Flag</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right px-8">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredUsers.map(u => {
                        const isSameDevice = u.deviceId && (multiAccountMap.get(u.deviceId) || 0) > 1;
                        return (
                          <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] transition-all h-24">
                             <TableCell className="px-8">
                                <div className="flex items-center gap-3">
                                   <code className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg">#{u.id.slice(0,6).toUpperCase()}</code>
                                   <Button onClick={() => copyToClipboard(u.id)} variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-muted-foreground"><Copy className="h-3.5 w-3.5" /></Button>
                                </div>
                             </TableCell>
                             <TableCell>
                                <div className="flex items-center gap-4">
                                   <Avatar className="h-10 w-10 border border-white/10">
                                      <AvatarImage src={`https://picsum.photos/seed/${u.id}/100/100`} />
                                      <AvatarFallback>W</AvatarFallback>
                                   </Avatar>
                                   <div>
                                      <p className="text-xs font-black uppercase italic">{u.email?.split('@')[0] || 'Unknown Warrior'}</p>
                                      <p className="text-[9px] text-muted-foreground uppercase">{u.email || u.mobile || 'No Signal'}</p>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell>
                                <div className="flex flex-col gap-1.5">
                                   <div className="flex items-center gap-3 text-[9px] font-bold">
                                      <span className="w-12 text-blue-400">DEP:</span>
                                      <span className="text-white">₹{u.depositBalance?.toFixed(1) || '0.0'}</span>
                                   </div>
                                   <div className="flex items-center gap-3 text-[9px] font-bold">
                                      <span className="w-12 text-green-400">WIN:</span>
                                      <span className="text-white">₹{u.winningBalance?.toFixed(1) || '0.0'}</span>
                                   </div>
                                   <div className="flex items-center gap-3 text-[9px] font-bold">
                                      <span className="w-12 text-amber-400">TSK:</span>
                                      <span className="text-white">{u.taskBalance?.toFixed(1) || '0.0'} 🪙</span>
                                   </div>
                                </div>
                             </TableCell>
                             <TableCell>
                                <div className="flex items-center gap-2">
                                   <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", u.isBanned ? "bg-red-500" : "bg-green-500")} />
                                   <span className="text-[10px] font-black uppercase italic">{u.isBanned ? 'OFFLINE' : 'IN-ARENA'}</span>
                                </div>
                                <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Tier: {u.rank || 'Bronze'}</p>
                             </TableCell>
                             <TableCell>
                                <div className="flex flex-col gap-1">
                                   {u.isVpnActive && <Badge className="bg-red-500/20 text-red-500 border-none text-[8px] font-black uppercase tracking-widest px-3 italic mb-1 w-fit">VPN SIGNAL</Badge>}
                                   {isSameDevice && <Badge className="bg-orange-500/20 text-orange-500 border-none text-[8px] font-black uppercase tracking-widest px-3 italic w-fit">SAME DEVICE</Badge>}
                                   {!u.isVpnActive && !isSameDevice && <Badge className="bg-green-500/20 text-green-500 border-none text-[8px] font-black uppercase tracking-widest px-3 italic w-fit">VERIFIED</Badge>}
                                </div>
                             </TableCell>
                             <TableCell className="text-right px-8 space-x-2">
                                <Button onClick={() => setCoinAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} variant="outline" className="h-9 border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/5 px-4">CREDIT / DEBIT</Button>
                                <Button onClick={() => handleRestrictAccess(u)} variant={u.isBanned ? "outline" : "destructive"} className="h-9 rounded-lg text-[9px] font-black uppercase tracking-widest px-4">
                                   SUSPEND ACCOUNT
                                </Button>
                             </TableCell>
                          </TableRow>
                        );
                     })}
                  </TableBody>
               </Table>
            </Card>
          )}

          {activeTab === 'arena' && (
            <div className="space-y-10">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter italic">Arena Management</h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Live Combat Deployment</p>
                  </div>
                  <Button onClick={() => setIsCreatingTournament(true)} className="bg-primary hover:bg-primary/90 h-14 rounded-xl px-10 font-black uppercase tracking-widest italic text-xs shadow-2xl shadow-primary/20">
                    <Plus className="h-5 w-5 mr-3" /> DEPLOY NEW ARENA
                  </Button>
               </div>
               
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tournamentsData?.map(tour => (
                    <Card key={tour.id} className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-primary/40 transition-all shadow-2xl flex flex-col">
                       <div className="h-44 relative">
                          <img src={tour.banner} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                          <div className="absolute top-4 left-4 flex gap-2">
                             <Badge className={cn(
                                "uppercase font-black text-[9px] italic border-none px-3 py-1",
                                tour.status === 'active' ? "bg-red-500 text-white" : tour.status === 'upcoming' ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
                             )}>
                                {tour.status === 'active' ? 'LIVE' : tour.status.toUpperCase()}
                             </Badge>
                             <Badge className="bg-primary/20 text-primary border-primary/20 uppercase font-black text-[9px] italic">{tour.gameType}</Badge>
                          </div>
                          <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
                             <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">{tour.name}</h4>
                             <div className="text-right">
                                <p className="text-[7px] font-black uppercase text-muted-foreground">Prize Pool</p>
                                <p className="text-lg font-black text-amber-500 leading-none">{tour.prizePool}</p>
                             </div>
                          </div>
                       </div>
                       
                       <CardContent className="p-8 space-y-8 flex-1">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                <Label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                   <Key className="h-3 w-3 text-primary" /> ROOM ID
                                </Label>
                                <Input 
                                  value={tour.roomCredentials?.roomId || ''} 
                                  onChange={e => {
                                     const tourRef = doc(firestore!, 'tournaments', tour.id);
                                     updateDoc(tourRef, { 'roomCredentials.roomId': e.target.value });
                                  }}
                                  placeholder="Enter ID"
                                  className="h-10 bg-black/40 border-none text-[11px] font-black tracking-widest uppercase focus:ring-primary"
                                />
                             </div>
                             <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                <Label className="text-[8px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                                   <Lock className="h-3 w-3 text-primary" /> PASSWORD
                                </Label>
                                <Input 
                                  value={tour.roomCredentials?.roomPassword || ''} 
                                  onChange={e => {
                                     const tourRef = doc(firestore!, 'tournaments', tour.id);
                                     updateDoc(tourRef, { 'roomCredentials.roomPassword': e.target.value });
                                  }}
                                  placeholder="Enter Pass"
                                  className="h-10 bg-black/40 border-none text-[11px] font-black tracking-widest uppercase focus:ring-primary"
                                />
                             </div>
                          </div>

                          <div className="space-y-3">
                             <div className="flex justify-between items-end">
                                <p className="text-[8px] font-black uppercase text-muted-foreground">Participants (Enlisted)</p>
                                <p className="text-xs font-black text-white italic">{tour.participantsCount || 0} / {tour.maxParticipants || 100}</p>
                             </div>
                             <Progress value={((tour.participantsCount || 0) / (tour.maxParticipants || 100)) * 100} className="h-1.5 bg-white/5" />
                          </div>

                          <Button 
                             onClick={() => {
                                setIsProcessingMatch(tour.id);
                                toast({ title: "PUBLISH CREDENTIALS", description: "Warriors notified of deployment." });
                                setTimeout(() => setIsProcessingMatch(null), 1000);
                             }}
                             disabled={isProcessingMatch === tour.id}
                             className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest italic rounded-2xl shadow-xl shadow-primary/20 text-xs"
                          >
                             {isProcessingMatch === tour.id ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Send className="h-5 w-5 mr-3" />}
                             PUBLISH CREDENTIALS
                          </Button>
                       </CardContent>

                       <CardFooter className="p-6 bg-white/[0.02] border-t border-white/5 grid grid-cols-2 gap-3">
                          <Button variant="outline" className="h-10 border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/5">
                             SET RESULT
                          </Button>
                          <Button variant="ghost" onClick={() => deleteDoc(doc(firestore!, 'tournaments', tour.id))} className="h-10 text-red-500 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-[9px] font-black uppercase tracking-widest">
                             CANCEL ARENA
                          </Button>
                       </CardFooter>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="grid lg:grid-cols-3 gap-10">
               <div className="lg:col-span-2 space-y-10">
                  <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                     <div className="flex items-center gap-4 text-primary">
                        <MessageSquare className="h-6 w-6" />
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Quick Broadcast</h3>
                     </div>
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Notification Title</Label>
                           <Input 
                            value={broadcast.title} 
                            onChange={e => setBroadcast({...broadcast, title: e.target.value})}
                            className="h-14 bg-white/5 border-white/5 rounded-xl font-black text-xs" 
                           />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Message Body</Label>
                           <Textarea 
                            value={broadcast.body}
                            onChange={e => setBroadcast({...broadcast, body: e.target.value})}
                            placeholder="Example: Aaj ka Grand League match ₹5000 prize pool ke saath shuru hone wala hai. Jaldi join karein!"
                            className="bg-white/5 border-white/5 rounded-xl font-medium text-xs min-h-[120px]" 
                           />
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Image URL (Optional)</Label>
                              <div className="relative">
                                 <Input 
                                  value={broadcast.imageUrl}
                                  onChange={e => setBroadcast({...broadcast, imageUrl: e.target.value})}
                                  placeholder="https://..."
                                  className="h-14 bg-white/5 border-white/5 rounded-xl pl-12 font-black text-xs" 
                                 />
                                 <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                              </div>
                           </div>
                           <div className="space-y-3">
                              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Target Audience</Label>
                              <Select value={broadcast.audience} onValueChange={v => setBroadcast({...broadcast, audience: v})}>
                                 <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-xl font-black text-[10px] uppercase">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent className="bg-[#121216] border-white/10 text-white">
                                    <SelectItem value="all">ALL WARRIORS</SelectItem>
                                    <SelectItem value="paid">PAID USERS</SelectItem>
                                    <SelectItem value="inactive">INACTIVE USERS</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                        </div>
                        <Button onClick={handleBroadcast} className="w-full h-18 bg-primary hover:bg-primary/90 text-white rounded-2xl font-black text-lg tracking-[0.2em] uppercase italic shadow-2xl shadow-primary/20">
                           SEND ANNOUNCEMENT
                        </Button>
                     </div>
                  </Card>

                  <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 shadow-2xl space-y-8">
                     <div className="flex items-center gap-4 text-primary">
                        <Zap className="h-6 w-6" />
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Automated Triggers</h3>
                     </div>
                     <div className="grid md:grid-cols-2 gap-6">
                        <ProtocolItem label="Welcome Alert" desc="Triggered on new warrior registration" checked={sysConfig.welcomeAlertEnabled} onChange={c => setSysConfig({...sysConfig, welcomeAlertEnabled: c})} />
                        <ProtocolItem label="Winning Alert" desc="Triggered on tournament victory" checked={sysConfig.winningAlertEnabled} onChange={c => setSysConfig({...sysConfig, winningAlertEnabled: c})} />
                        <ProtocolItem label="Low Balance Alert" desc="Triggered when entry fee exceeds balance" checked={sysConfig.lowBalanceAlertEnabled} onChange={c => setSysConfig({...sysConfig, lowBalanceAlertEnabled: c})} />
                        <ProtocolItem label="Inactivity Nudge" desc="Triggered after 2 days of silence" checked={sysConfig.inactivityNudgeEnabled} onChange={c => setSysConfig({...sysConfig, inactivityNudgeEnabled: c})} />
                     </div>
                  </Card>
               </div>

               <div className="space-y-10">
                  <div className="grid grid-cols-1 gap-6">
                     <StatsCard title="Total Sent" value="15,400" icon={<Send />} />
                     <StatsCard title="Open Rate" value="45%" icon={<Bell />} />
                     <StatsCard title="Conversion" value="₹1,200" icon={<TrendingUp />} />
                  </div>

                  <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20 border-2 rounded-[2.5rem] p-8 text-center space-y-6">
                     <div className="h-16 w-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
                        <BarChart3 className="h-8 w-8 text-primary" />
                     </div>
                     <div className="space-y-2">
                        <h4 className="text-lg font-black uppercase italic">Engagement Index</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase leading-relaxed">Notifications increase match participation by 80% when using images.</p>
                     </div>
                  </Card>
               </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter italic">Payment Gateway</h3>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Financial Intelligence & Ledger</p>
                  </div>
                  <div className="flex gap-4">
                     <Badge className="bg-blue-500/20 text-blue-400 border-none px-4 py-1.5 font-black uppercase text-[9px] italic">FEE: 1.2% ACTIVE</Badge>
                  </div>
               </div>
               <Table>
                  <TableHeader className="bg-white/[0.03]">
                     <TableRow className="border-white/5 hover:bg-transparent h-16">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-8">Reference ID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">User Details</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Conversion Fee</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right px-8">Command</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredLedger.map(l => (
                        <TableRow key={l.id} className="border-white/5 hover:bg-white/[0.02] transition-all h-20">
                           <TableCell className="px-8">
                              <code className="text-[9px] font-black text-muted-foreground uppercase">TX#{l.id.slice(0,10).toUpperCase()}</code>
                           </TableCell>
                           <TableCell>
                              <div>
                                 <p className="text-[10px] font-black text-white uppercase italic">{l.userId?.slice(0,12) || 'Warrior'}</p>
                                 <p className="text-[8px] text-muted-foreground uppercase">{l.description?.split(':')[1] || 'Standard Payout'}</p>
                              </div>
                           </TableCell>
                           <TableCell>
                              <span className={cn("text-sm font-black italic", l.type === 'withdrawal' ? 'text-red-400' : 'text-green-400')}>
                                 {l.type === 'withdrawal' ? '-' : '+'}₹{l.amount.toFixed(2)}
                              </span>
                           </TableCell>
                           <TableCell>
                              <p className="text-[10px] font-bold text-muted-foreground">₹{(l.amount * 0.012).toFixed(2)}</p>
                              <p className="text-[7px] font-black text-primary uppercase">Auto-Calculated</p>
                           </TableCell>
                           <TableCell>
                              <Badge className={cn(
                                 "text-[8px] font-black uppercase px-3 py-1 border-none italic",
                                 l.status === 'completed' ? "bg-green-500/20 text-green-400" : 
                                 l.status === 'pending' ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
                              )}>
                                 {l.status === 'completed' ? 'SUCCESS' : l.status === 'pending' ? 'PROCESSING' : 'FLAGGED'}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right px-8">
                              {l.type === 'withdrawal' && l.status === 'pending' ? (
                                <div className="flex justify-end gap-2">
                                   <Button className="h-9 bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest px-4">APPROVE PAYOUT</Button>
                                   <Button variant="ghost" className="h-9 hover:bg-red-500/10 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-widest px-4">REJECT</Button>
                                </div>
                              ) : (
                                <Button onClick={() => setSelectedTx(l)} variant="ghost" className="h-9 hover:bg-white/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest px-4 gap-2">
                                   <Eye className="h-3.5 w-3.5" /> View Receipt
                                </Button>
                              )}
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </Card>
          )}

          {activeTab === 'support' && (
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                  <h3 className="text-xl font-black uppercase tracking-tighter italic">Support Desk</h3>
                  <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Warrior Comms & Intelligence</p>
               </div>
               <Table>
                  <TableHeader className="bg-white/[0.03]">
                     <TableRow className="border-white/5 hover:bg-transparent h-16">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-8">Warrior / Issue</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">AI Observation</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right px-8">Command</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {supportMessages?.map(m => (
                        <TableRow key={m.id} className="border-white/5 hover:bg-white/[0.02] transition-all h-24">
                           <TableCell className="px-8">
                              <div className="space-y-1">
                                 <p className="text-xs font-black text-white uppercase italic">{m.message}</p>
                                 <p className="text-[8px] text-muted-foreground uppercase">UID: {m.userId.slice(0,12)}</p>
                              </div>
                           </TableCell>
                           <TableCell>
                              <p className="text-[10px] italic text-muted-foreground leading-relaxed max-w-md">"{m.aiResponse}"</p>
                           </TableCell>
                           <TableCell className="text-right px-8">
                              {m.status === 'open' ? (
                                <Button onClick={() => handleResolveSupport(m.id)} className="bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest px-6 h-10">RESOLVE ISSUE</Button>
                              ) : (
                                <Badge className="bg-white/5 text-muted-foreground uppercase text-[8px] font-black px-4 py-1.5 italic border-none">RESOLVED</Badge>
                              )}
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </Card>
          )}

          {activeTab === 'system' && (
            <div className="max-w-2xl space-y-10">
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] p-8 space-y-8">
                  <div className="flex items-center gap-3 text-primary mb-2">
                     <Wrench className="h-5 w-5" />
                     <h4 className="text-lg font-black uppercase italic">APPLICATION SETTINGS</h4>
                  </div>
                  <div className="space-y-6">
                     <ProtocolItem label="Maintenance Protocol" desc="ACTIVATE MAINTENANCE mode for platform" checked={sysConfig.maintenanceMode} onChange={c => setSysConfig({...sysConfig, maintenanceMode: c})} />
                     <div className="space-y-3">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">CPA NETWORK API HUB</Label>
                        <Input value={sysConfig.cpaLeadUrl} onChange={e => setSysConfig({...sysConfig, cpaLeadUrl: e.target.value})} className="h-14 bg-white/5 border-white/5 rounded-xl font-black text-[10px]" />
                     </div>
                     <Button 
                       onClick={async () => {
                          await setDoc(doc(firestore!, 'settings', 'global'), sysConfig, { merge: true });
                          toast({ title: "SYNC API", description: "Global configuration updated." });
                       }}
                       className="w-full h-14 bg-primary hover:bg-primary/90 rounded-xl font-black uppercase tracking-widest italic text-xs"
                     >SYNC API</Button>
                  </div>
               </Card>
            </div>
          )}
          
          {(activeTab === 'security' || activeTab === 'ads') && (
            <div className="p-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
               <Activity className="h-16 w-16 text-muted-foreground opacity-10 mx-auto mb-6" />
               <p className="text-sm font-black uppercase text-muted-foreground tracking-[0.3em] italic">{activeTab.toUpperCase()} CENTER ACTIVE SCANNING...</p>
            </div>
          )}
        </div>
      </main>

      {/* Manual Credit Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="bg-[#0a0a0f] border-white/10 rounded-[2rem] p-10 max-w-sm text-white">
            <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic leading-none">CREDIT / DEBIT</DialogTitle></DialogHeader>
            <div className="space-y-8 pt-8">
              <Select value={coinAdjustment.bucket} onValueChange={(val: any) => setCoinAdjustment({...coinAdjustment, bucket: val})}>
                <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-xl font-black uppercase text-[10px] tracking-widest"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#121216] border-white/10 text-white"><SelectItem value="deposit">DEPOSIT VAULT</SelectItem><SelectItem value="winning">WINNING SECTOR</SelectItem><SelectItem value="task">MISSION HUB</SelectItem></SelectContent>
              </Select>
              <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="h-20 bg-white/5 border-white/5 text-4xl font-black text-center rounded-xl tabular-nums focus:ring-primary" />
              <Button onClick={async () => {
                 const { userId, bucket, amount } = coinAdjustment;
                 const payload: any = { coins: increment(amount) };
                 if (bucket === 'deposit') payload.depositBalance = increment(amount);
                 if (bucket === 'winning') payload.winningBalance = increment(amount);
                 if (bucket === 'task') payload.taskBalance = increment(amount);
                 await updateDoc(doc(firestore!, 'users', userId), payload);
                 await addDoc(collection(firestore!, 'users', userId, 'ledger'), { type: 'income', amount, date: new Date().toISOString().split('T')[0], status: 'completed', description: `Admin adjustment: ${bucket}` });
                 setCoinAdjustment(null);
                 toast({ title: "MANUAL CREDIT APPLIED" });
              }} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest rounded-xl shadow-2xl italic">EXECUTE ADJUSTMENT</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Arena Dialog */}
      <Dialog open={isCreatingTournament} onOpenChange={setIsCreatingTournament}>
         <DialogContent className="bg-[#0a0a0f] border-white/10 rounded-[2rem] p-10 max-w-2xl text-white">
            <DialogHeader>
               <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">Deploy Arena</DialogTitle>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-8 pt-8">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Arena Identifier</Label>
                     <Input value={newTour.name} onChange={e => setNewTour({...newTour, name: e.target.value})} className="h-14 bg-white/5 border-white/5 rounded-xl font-black uppercase italic text-xs" placeholder="BGMI ELITE SQUAD" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Combat Protocol</Label>
                     <Select value={newTour.gameType} onValueChange={(val: any) => setNewTour({...newTour, gameType: val})}>
                        <SelectTrigger className="h-14 bg-white/5 border-white/5 rounded-xl font-black text-[10px] uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-[#121216] border-white/10 text-white">
                           <SelectItem value="BGMI">BGMI MOBILE</SelectItem>
                           <SelectItem value="Free Fire">FREE FIRE</SelectItem>
                           <SelectItem value="Ludo King">LUDO KING</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Entry Bounty (₹)</Label>
                     <Input type="number" value={newTour.entryFee} onChange={e => setNewTour({...newTour, entryFee: Number(e.target.value)})} className="h-14 bg-white/5 border-white/5 rounded-xl font-black text-xl italic" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Start Date/Time</Label>
                     <Input type="datetime-local" value={newTour.startDate} onChange={e => setNewTour({...newTour, startDate: e.target.value})} className="h-14 bg-white/5 border-white/5 rounded-xl font-black text-[10px]" />
                  </div>
               </div>
            </div>
            <DialogFooter className="pt-10">
               <Button onClick={async () => {
                  if (!firestore) return;
                  const id = 'tour_' + Date.now();
                  await setDoc(doc(firestore, 'tournaments', id), { ...newTour, id, status: 'active', prizePool: newTour.prizePool || '₹500', participantsCount: 0 });
                  toast({ title: "Arena Deployed" });
                  setIsCreatingTournament(false);
               }} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase tracking-widest rounded-xl shadow-2xl text-sm italic">Initiate Deployment</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function SideLink({ active, icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest group text-left",
        active ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02] italic" : "text-muted-foreground hover:bg-white/5 hover:text-white"
      )}
    >
      <span className={cn("transition-transform group-hover:rotate-12", active ? "text-white" : "opacity-40")}>{icon}</span>
      <span>{label}</span>
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
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[1.5rem] p-6 flex items-center justify-between group hover:border-primary/40 transition-all cursor-default shadow-xl relative overflow-hidden">
       <div className="space-y-1 relative z-10">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{label}</p>
          <h4 className="text-3xl font-black text-white tracking-tighter italic">{value}</h4>
          <p className="text-[8px] font-black text-primary uppercase tracking-widest italic">{sub}</p>
       </div>
       <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-6 border shadow-xl", colorMap[color])}>
          {icon}
       </div>
    </Card>
  );
}

function ProtocolItem({ label, desc, checked, onChange }: any) {
   return (
      <div className="flex items-center justify-between p-5 bg-white/5 rounded-xl border border-white/5 group hover:border-primary/20 transition-all">
         <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-tight italic">{label}</p>
            <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">{desc}</p>
         </div>
         <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-primary" />
      </div>
   );
}

function StatsCard({ title, value, icon }: any) {
  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-primary/40 transition-all shadow-xl">
       <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
          <h4 className="text-2xl font-black text-white italic">{value}</h4>
       </div>
       <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-white/5">
          {icon}
       </div>
    </Card>
  );
}
