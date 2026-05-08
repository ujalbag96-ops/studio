
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
  Loader2,
  TrendingUp,
  Power,
  Coins,
  Shield,
  MessageSquare,
  Search,
  Check,
  X,
  Zap,
  Bell,
  BarChart3,
  Filter,
  FileBarChart,
  ShieldAlert,
  CreditCard,
  ArrowUpRight,
  Database,
  Lock,
  Globe,
  Share2,
  AlertTriangle
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, GameType, SupportMessage, Registration } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import TransactionReceipt from '@/components/TransactionReceipt';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'overview' | 'users' | 'events' | 'payouts' | 'security' | 'adhub' | 'referral' | 'system';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTx, setSelectedTx] = useState<UserLedgerEntry | null>(null);
  const [balanceAdjustment, setBalanceAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);
  const [sysConfig, setSysConfig] = useState<Partial<AppSettings>>({});
  const [isProcessingEvent, setIsProcessingEvent] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState({ title: 'System Analytical Update', body: '', imageUrl: '', audience: 'all' });

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Advanced Analytical Subscriptions
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
  
  const { data: usersData, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: ledgerData } = useCollection<UserLedgerEntry>(allLedgerQuery);
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

  const handleComplianceLock = (u: UserProfile) => {
    if (!firestore) return;
    const confirmMsg = u.isBanned ? "Reinstate account access?" : "Initiate Global Compliance Lockdown?";
    if (confirm(confirmMsg)) {
      updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned });
      toast({ title: u.isBanned ? "Compliance Status Restored" : "Account Deactivated", variant: u.isBanned ? "default" : "destructive" });
    }
  };

  const handleCancelEvent = async (tournament: Tournament) => {
    if (!firestore || !window.confirm(`Initiate Automatic Asset Refund Protocol for ${tournament.name}?`)) return;
    
    setIsProcessingEvent(tournament.id);
    try {
      const regQuery = query(collection(firestore, 'registrations'), where('tournamentId', '==', tournament.id));
      const regSnap = await getDocs(regQuery);
      const registrations = regSnap.docs.map(d => d.data() as Registration);

      const batch = writeBatch(firestore);
      
      for (const reg of registrations) {
        const userRef = doc(firestore, 'users', reg.userId);
        batch.update(userRef, {
          depositBalance: increment(tournament.entryFee),
          coins: increment(tournament.entryFee)
        });

        const ledgerRef = doc(collection(firestore, 'users', reg.userId, 'ledger'));
        batch.set(ledgerRef, {
          type: 'refund',
          amount: tournament.entryFee,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Analytical Refund: ${tournament.name} Operation Cancellation`
        });

        const specificRegQuery = query(collection(firestore, 'registrations'), where('userId', '==', reg.userId), where('tournamentId', '==', tournament.id));
        const specificRegSnap = await getDocs(specificRegQuery);
        specificRegSnap.docs.forEach(d => batch.delete(d.ref));
      }

      batch.update(doc(firestore, 'tournaments', tournament.id), { status: 'cancelled' });
      await batch.commit();
      
      toast({ title: "Asset Restoration Successful", description: `${registrations.length} profiles reimbursed.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Protocol Integrity Failure" });
    } finally {
      setIsProcessingEvent(null);
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

  // Chart Data Preparation
  const chartData = [
    { name: 'Jan', revenue: 4000, users: 2400 },
    { name: 'Feb', revenue: 3000, users: 1398 },
    { name: 'Mar', revenue: 2000, users: 9800 },
    { name: 'Apr', revenue: 2780, users: 3908 },
    { name: 'May', revenue: 1890, users: 4800 },
    { name: 'Jun', revenue: 2390, users: 3800 },
    { name: 'Jul', revenue: 3490, users: 4300 },
  ];

  if (isUserLoading) return <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Synchronizing Executive Credentials...</p></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black uppercase tracking-[0.5em] italic">Access Denied: Administrative Clearance Required</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white selection:bg-primary selection:text-white">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      <aside className="w-[300px] flex flex-col fixed inset-y-0 z-50 bg-[#0a0a0f] border-r border-white/5">
        <div className="p-10 border-b border-white/5 flex items-center gap-5">
          <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3">
             <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-black text-xl italic tracking-tighter block uppercase">EXECUTIVE<span className="text-primary">HUB</span></span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Operational Core</span>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar pt-8">
          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-4 px-4">Primary Navigation</p>
          <SideLink active={activeTab === 'overview'} icon={<LayoutDashboard />} label="SYSTEM DASHBOARD" onClick={() => setActiveTab('overview')} />
          <SideLink active={activeTab === 'users'} icon={<UsersIcon />} label="USER DIRECTORY" onClick={() => setActiveTab('users')} />
          <SideLink active={activeTab === 'events'} icon={<Trophy />} label="ARENA MANAGEMENT" onClick={() => setActiveTab('events')} />
          <SideLink active={activeTab === 'payouts'} icon={<TrendingUp />} label="PAYMENT GATEWAY" onClick={() => setActiveTab('payouts')} />
          
          <div className="pt-6">
            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em] mb-4 px-4">Integrity & Security</p>
            <SideLink active={activeTab === 'security'} icon={<ShieldAlert />} label="SECURITY CENTER" onClick={() => setActiveTab('security')} />
            <SideLink active={activeTab === 'adhub'} icon={<Zap />} label="AD & REVENUE HUB" onClick={() => setActiveTab('adhub')} />
            <SideLink active={activeTab === 'referral'} icon={<CreditCard />} label="REFERRAL NETWORK" onClick={() => setActiveTab('referral')} />
            <SideLink active={activeTab === 'system'} icon={<Settings />} label="APPLICATION SETTINGS" onClick={() => setActiveTab('system')} />
          </div>
          
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-[11px] font-black uppercase tracking-widest mt-10">
             <Power className="h-4 w-4" /> TERMINATE SESSION
          </button>
        </nav>
      </aside>

      <main className="flex-1 ml-[300px]">
        <header className="h-24 bg-[#0a0a0f]/80 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-12 sticky top-0 z-40">
          <div className="flex items-center gap-8">
             <div className="relative w-[500px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                  placeholder="SCAN GLOBAL USER DATABASE (UID, EMAIL, PHONE)..." 
                  className="bg-white/5 border-white/10 rounded-2xl pl-14 h-14 text-xs font-black uppercase tracking-widest focus:ring-primary w-full"
                />
             </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="text-right">
                <p className="text-[9px] font-black text-muted-foreground uppercase">Executive Node</p>
                <p className="text-xs font-black text-white italic">{ADMIN_EMAIL}</p>
             </div>
             <Avatar className="h-12 w-12 border-2 border-primary shadow-2xl shadow-primary/20">
                <AvatarImage src={`https://picsum.photos/seed/admin/100/100`} />
                <AvatarFallback>AD</AvatarFallback>
             </Avatar>
          </div>
        </header>

        <div className="p-12 space-y-12">
          {activeTab === 'overview' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <AnalyticCard label="Global User Population" value={usersData?.length || '0'} sub="+12% Retention" icon={<UsersIcon />} />
                <AnalyticCard label="Total Platform Yield" value="₹1,84,210" sub="Verified Distributions" icon={<TrendingUp />} />
                <AnalyticCard label="Liability Reserves" value="₹3,44,000" sub="Asset Liquidity" icon={<Shield />} />
                <AnalyticCard label="Active Operations" value={tournamentsData?.filter(t => t.status === 'active').length || '0'} sub="Live Deployments" icon={<Trophy />} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
                   <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-black uppercase italic italic">Revenue Matrix</h3>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">Real-time Financial Telemetry</p>
                      </div>
                      <Badge className="bg-primary/10 text-primary uppercase font-black px-4 py-1 text-[10px]">Monthly Audit</Badge>
                   </div>
                   <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a0a0f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '10px', fontWeight: 'bold' }}
                            itemStyle={{ color: 'hsl(var(--primary))' }}
                          />
                          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </Card>

                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-8 shadow-2xl overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Zap className="h-40 w-40 text-primary" />
                   </div>
                   <div className="relative z-10 space-y-8">
                      <h3 className="text-2xl font-black uppercase italic">User Engagement</h3>
                      <div className="space-y-6">
                        <EngagementRow label="Analytical Missions" value="84%" color="primary" />
                        <EngagementRow label="Asset Extraction" value="12%" color="blue" />
                        <EngagementRow label="Account Referrals" value="44%" color="green" />
                        <EngagementRow label="Daily Retention" value="68%" color="orange" />
                      </div>
                   </div>
                   <div className="pt-10 border-t border-white/5 text-center">
                      <Button className="w-full h-14 bg-white/5 border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all">VIEW FULL TELEMETRY</Button>
                   </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl animate-in fade-in duration-500">
               <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <div>
                    <h3 className="text-3xl font-black uppercase italic">User Directory</h3>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] mt-1">Profile Inventory & Compliance Monitoring</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button variant="outline" className="h-12 rounded-xl border-white/10 font-black uppercase text-[10px]"><Share2 className="h-4 w-4 mr-2" /> EXPORT DATA</Button>
                    <Button className="h-12 bg-primary rounded-xl font-black uppercase text-[10px] px-8">NEW ACCOUNT</Button>
                  </div>
               </div>
               <Table>
                  <TableHeader className="bg-white/[0.03]">
                     <TableRow className="border-white/5 hover:bg-transparent h-20">
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-10">Analytical ID</TableHead>
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Professional Profile</TableHead>
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Asset Composition</TableHead>
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Compliance</TableHead>
                        <TableHead className="text-[11px] font-black uppercase tracking-widest text-muted-foreground text-right px-10">Executive Commands</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredUsers.map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] h-28 group">
                           <TableCell className="px-10"><code className="text-[11px] font-black text-primary bg-primary/10 px-4 py-2 rounded-xl border border-primary/20 shadow-lg">#{u.id.slice(0,8).toUpperCase()}</code></TableCell>
                           <TableCell>
                              <div className="flex items-center gap-5">
                                 <Avatar className="h-12 w-12 border-2 border-white/10 shadow-xl group-hover:scale-110 transition-transform"><AvatarImage src={`https://picsum.photos/seed/${u.id}/100/100`} /></Avatar>
                                 <div>
                                    <p className="text-sm font-black uppercase italic text-white">{u.email?.split('@')[0] || 'Unidentified'}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{u.email || u.mobile}</p>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="space-y-1.5 text-[10px] font-black tracking-widest">
                                 <p className="text-blue-400">PORTFOLIO: ₹{u.depositBalance?.toFixed(1) || '0.0'}</p>
                                 <p className="text-green-400">LIQUIDITY: ₹{u.winningBalance?.toFixed(1) || '0.0'}</p>
                                 <p className="text-amber-400">INCENTIVE: ₹{u.taskBalance?.toFixed(1) || '0.0'}</p>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="flex flex-col gap-2">
                                <Badge className={cn("text-[9px] font-black px-4 py-1 justify-center tracking-widest border-none shadow-lg", u.isBanned ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500")}>
                                   {u.isBanned ? 'SUSPENDED' : 'COMPLIANT'}
                                </Badge>
                                {u.isVpnActive && <Badge className="bg-amber-500/20 text-amber-500 text-[8px] font-black px-3 py-1 justify-center tracking-widest border-none">VPN SIGNAL</Badge>}
                              </div>
                           </TableCell>
                           <TableCell className="text-right px-10 space-x-3">
                              <Button onClick={() => setBalanceAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} variant="outline" className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest border-white/10 hover:bg-white/5 transition-all">CREDIT / DEBIT</Button>
                              <Button onClick={() => handleComplianceLock(u)} variant={u.isBanned ? "outline" : "destructive"} className="h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                                 {u.isBanned ? 'REINSTATE' : 'SUSPEND ACCOUNT'}
                              </Button>
                           </TableCell>
                        </TableRow>
                     ))}
                  </TableBody>
               </Table>
            </Card>
          )}

          {activeTab === 'events' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter">Arena Management</h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em]">Event Deployment & Result Verification</p>
                  </div>
                  <Button className="h-16 bg-primary rounded-2xl font-black uppercase tracking-widest px-10 shadow-2xl shadow-primary/20 text-lg italic transition-all hover:scale-105">
                     EXECUTE EVENT LAUNCH <Plus className="ml-3 h-6 w-6" />
                  </Button>
               </div>

               <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                  {tournamentsData?.map(t => (
                    <Card key={t.id} className="bg-[#0a0a0f] border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative group hover:border-primary/40 transition-all duration-500">
                       <div className="h-48 relative">
                          <img src={t.banner} className="h-full w-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
                          <div className="absolute top-6 left-6 flex items-center gap-3">
                             <Badge className="bg-primary text-white font-black px-4 py-1.5 uppercase text-[10px] tracking-widest rounded-xl shadow-xl">{t.gameType}</Badge>
                             <Badge variant={t.status === 'active' ? 'destructive' : 'secondary'} className="px-4 py-1.5 uppercase text-[10px] font-black tracking-widest rounded-xl shadow-xl">{t.status}</Badge>
                          </div>
                       </div>
                       <div className="p-10 space-y-8">
                          <div className="flex justify-between items-end">
                             <div className="space-y-1">
                                <h3 className="text-3xl font-black uppercase italic text-white tracking-tighter">{t.name}</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Event Deployment: {new Date(t.startDate).toLocaleString()}</p>
                             </div>
                             <div className="text-right">
                                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Entry Fee</p>
                                <p className="text-2xl font-black text-primary italic">₹{t.entryFee}</p>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-6 bg-white/5 p-8 rounded-[2rem] border border-white/5">
                             <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Secure Session ID</Label>
                                <Input placeholder="Access ID..." className="h-12 bg-black/40 border-white/10 rounded-xl" defaultValue={t.roomCredentials?.roomId} />
                             </div>
                             <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Security Cipher</Label>
                                <Input placeholder="Cipher..." className="h-12 bg-black/40 border-white/10 rounded-xl" defaultValue={t.roomCredentials?.roomPassword} />
                             </div>
                          </div>

                          <div className="flex items-center gap-4">
                             <Button className="flex-1 h-16 bg-white/5 hover:bg-primary rounded-2xl border border-white/10 font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl italic">PUBLISH CREDENTIALS</Button>
                             <Button className="h-16 w-16 bg-white/5 hover:bg-destructive rounded-2xl border border-white/10 flex items-center justify-center transition-all group/btn" onClick={() => handleCancelEvent(t)}>
                                <AlertTriangle className="h-6 w-6 text-muted-foreground group-hover/btn:text-white transition-colors" />
                             </Button>
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="max-w-4xl space-y-12 animate-in fade-in duration-500">
               <div className="space-y-2">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Application Settings</h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em]">Global Infrastructure & API Configuration</p>
               </div>

               <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                     <Database className="h-64 w-64 text-primary" />
                  </div>
                  
                  <div className="grid gap-10 relative z-10">
                    <div className="space-y-6">
                       <h4 className="text-xl font-black uppercase italic flex items-center gap-4 text-primary"><ShieldCheck className="h-6 w-6" /> Security Protocols</h4>
                       <ProtocolItem label="Activate Maintenance Protocol" desc="Instant service suspension for all end-users" checked={sysConfig.maintenanceMode} onChange={c => setSysConfig({...sysConfig, maintenanceMode: c})} />
                       <ProtocolItem label="Hard-Device Ban (Global)" desc="Execute hardware-level deactivation for violators" checked={true} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                       <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Conversion Extraction Fee (%)</Label>
                          <div className="relative">
                            <Input type="number" value={sysConfig.withdrawalFeePercent || 8} onChange={e => setSysConfig({...sysConfig, withdrawalFeePercent: Number(e.target.value)})} className="h-14 bg-white/5 border-white/10 rounded-xl pl-12 text-lg font-black" />
                            <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40" />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Referral Affiliate Yield (Credits)</Label>
                          <div className="relative">
                             <Input type="number" value={sysConfig.referralRewardCoins || 10} onChange={e => setSysConfig({...sysConfig, referralRewardCoins: Number(e.target.value)})} className="h-14 bg-white/5 border-white/10 rounded-xl pl-12 text-lg font-black" />
                             <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary opacity-40" />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 pt-10">
                       <Button onClick={async () => {
                          await setDoc(doc(firestore!, 'settings', 'global'), sysConfig, { merge: true });
                          toast({ title: "System API Synchronized", description: "Global infrastructure parameters updated successfully." });
                       }} className="w-full h-20 bg-primary hover:bg-primary/90 rounded-[1.5rem] font-black uppercase tracking-[0.3em] text-xl italic shadow-2xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95">SYNC SYSTEM API</Button>
                       <p className="text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest italic">Analytical System Version 4.2.0 • Security Patch Active</p>
                    </div>
                  </div>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* Advanced Capital Adjustment Dialog */}
      {balanceAdjustment && (
        <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
          <DialogContent className="bg-[#0a0a0f] border-white/10 rounded-[3rem] p-12 max-w-md text-white shadow-2xl">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic text-center tracking-tighter">Capital Allocation</DialogTitle></DialogHeader>
            <div className="space-y-10 pt-10">
              <div className="space-y-4">
                 <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center block">Target Portfolio Sector</Label>
                 <Select value={balanceAdjustment.bucket} onValueChange={(val: any) => setBalanceAdjustment({...balanceAdjustment, bucket: val})}>
                    <SelectTrigger className="h-16 bg-white/5 border-white/10 rounded-2xl font-black uppercase tracking-widest text-xs">
                       <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121216] border-white/10 text-white">
                        <SelectItem value="deposit" className="font-bold py-3">INVESTMENT PORTFOLIO</SelectItem>
                        <SelectItem value="winning" className="font-bold py-3">WITHDRAWABLE ASSETS</SelectItem>
                        <SelectItem value="task" className="font-bold py-3">INCENTIVE ACCRUALS</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              <div className="space-y-4">
                 <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground text-center block">Volume Adjustment (Credits)</Label>
                 <div className="relative">
                    <Input type="number" value={balanceAdjustment.amount} onChange={e => setBalanceAdjustment({...balanceAdjustment, amount: Number(e.target.value)})} className="h-24 bg-white/5 border-white/10 rounded-[1.5rem] text-5xl font-black text-center tabular-nums focus:ring-primary shadow-inner" />
                    <Coins className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 text-primary opacity-20" />
                 </div>
              </div>

              <Button onClick={async () => {
                 const { userId, bucket, amount } = balanceAdjustment;
                 const payload: any = { coins: increment(amount) };
                 if (bucket === 'deposit') payload.depositBalance = increment(amount);
                 if (bucket === 'winning') payload.winningBalance = increment(amount);
                 if (bucket === 'task') payload.taskBalance = increment(amount);
                 
                 await updateDoc(doc(firestore!, 'users', userId), payload);
                 await addDoc(collection(firestore!, 'users', userId, 'ledger'), { 
                    type: 'income', 
                    amount, 
                    date: new Date().toISOString().split('T')[0], 
                    status: 'completed', 
                    description: `Executive Wealth Override: ${bucket} adjustment` 
                 });
                 setBalanceAdjustment(null);
                 toast({ title: "Analytical Ledger Updated", description: `Capital successfully allocated to user portfolio.` });
              }} className="w-full h-20 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase tracking-[0.2em] text-lg italic shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95">EXECUTE CREDIT / DEBIT</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SideLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-5 px-6 py-5 rounded-2xl transition-all text-[11px] font-black uppercase tracking-[0.2em] relative group", active ? "bg-primary text-white italic shadow-2xl shadow-primary/30" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      <span className={cn("transition-all duration-300", active ? "scale-125 text-white" : "opacity-40 group-hover:opacity-100")}>{icon}</span>
      <span>{label}</span>
      {active && <div className="absolute left-3 h-5 w-1 bg-white rounded-full shadow-[0_0_15px_#fff]" />}
    </button>
  );
}

function AnalyticCard({ label, value, sub, icon }: any) {
  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.2rem] p-8 flex items-center justify-between shadow-2xl hover:border-primary/20 transition-all group overflow-hidden relative">
       <div className="absolute -bottom-5 -right-5 opacity-5 group-hover:scale-150 transition-transform duration-1000 group-hover:rotate-12">
          {icon}
       </div>
       <div className="space-y-2 relative z-10">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">{label}</p>
          <h4 className="text-3xl font-black text-white italic tracking-tighter tabular-nums">{value}</h4>
          <p className="text-[9px] font-black text-primary uppercase tracking-widest">{sub}</p>
       </div>
       <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-white/5 text-primary border border-white/10 shadow-xl group-hover:rotate-6 transition-transform relative z-10">{icon}</div>
    </Card>
  );
}

function EngagementRow({ label, value, color }: any) {
   const colors = {
      primary: "bg-primary shadow-[0_0_10px_rgba(255,123,0,0.5)]",
      blue: "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]",
      green: "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]",
      orange: "bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.5)]"
   };

   return (
      <div className="space-y-2">
         <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-white">{value}</span>
         </div>
         <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
            <div className={cn("h-full rounded-full transition-all duration-1000", colors[color as keyof typeof colors])} style={{ width: value }} />
         </div>
      </div>
   );
}

function ProtocolItem({ label, desc, checked, onChange }: any) {
   return (
      <div className="flex items-center justify-between p-6 bg-white/5 rounded-[1.5rem] border border-white/5 hover:border-white/10 transition-all group">
         <div className="space-y-1">
            <p className="text-xs font-black uppercase italic group-hover:text-primary transition-colors">{label}</p>
            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">{desc}</p>
         </div>
         <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-primary" />
      </div>
   );
}

function Percent(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="5" x2="5" y2="19" />
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="17.5" r="2.5" />
    </svg>
  );
}
