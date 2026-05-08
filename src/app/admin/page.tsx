
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
  Filter,
  Briefcase,
  FileBarChart
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
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, GameType, SupportMessage, Registration } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import TransactionReceipt from '@/components/TransactionReceipt';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'overview' | 'users' | 'events' | 'payouts' | 'compliance' | 'system' | 'marketing' | 'support';

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
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [sysConfig, setSysConfig] = useState<Partial<AppSettings>>({});
  const [isProcessingEvent, setIsProcessingEvent] = useState<string | null>(null);
  const [broadcast, setBroadcast] = useState({ title: 'Analytical Update', body: '', imageUrl: '', audience: 'all' });

  const [newEvent, setNewEvent] = useState({
    name: '',
    game: '',
    gameType: 'BGMI' as GameType,
    prizePool: '₹500',
    entryFee: 10,
    startDate: '',
    banner: 'https://picsum.photos/seed/event/800/400',
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

  const handleRestrictAccess = (u: UserProfile) => {
    if (!firestore) return;
    const confirmMsg = u.isBanned ? "Reinstate account access?" : "Initiate Compliance Lockdown?";
    if (confirm(confirmMsg)) {
      updateDoc(doc(firestore, 'users', u.id), { isBanned: !u.isBanned });
      toast({ title: u.isBanned ? "Access Restored" : "Access Restricted", variant: u.isBanned ? "default" : "destructive" });
    }
  };

  const handleCancelEvent = async (tournament: Tournament) => {
    if (!firestore || !window.confirm(`Initiate Automatic Refund Protocol for ${tournament.name}?`)) return;
    
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
          description: `Automatic Refund: ${tournament.name} Event Cancellation`
        });

        const specificRegQuery = query(collection(firestore, 'registrations'), where('userId', '==', reg.userId), where('tournamentId', '==', tournament.id));
        const specificRegSnap = await getDocs(specificRegQuery);
        specificRegSnap.docs.forEach(d => batch.delete(d.ref));
      }

      batch.update(doc(firestore, 'tournaments', tournament.id), { status: 'cancelled' });
      await batch.commit();
      
      toast({ title: "Refund Engine Completed", description: `${registrations.length} participants reimbursed.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Protocol Failure" });
    } finally {
      setIsProcessingEvent(null);
    }
  };

  const handleBroadcast = async () => {
    if (!firestore) return;
    const id = 'notif_' + Date.now();
    await setDoc(doc(firestore, 'notifications', id), {
      ...broadcast,
      id,
      timestamp: new Date().toISOString()
    });
    toast({ title: "Strategic Alert Transmitted", description: `Broadcast deployed to ${broadcast.audience} segment.` });
    setBroadcast({ title: 'Analytical Update', body: '', imageUrl: '', audience: 'all' });
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

  if (isUserLoading) return <div className="flex flex-col items-center justify-center min-h-screen bg-black gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Analyzing System Matrix...</p></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black uppercase tracking-[0.5em] italic">Access Denied: Executive Credentials Required</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <TransactionReceipt transaction={selectedTx} onClose={() => setSelectedTx(null)} />
      
      <aside className="w-[280px] flex flex-col fixed inset-y-0 z-50 bg-[#0a0a0f] border-r border-white/5">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
             <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-black text-lg italic tracking-tighter block uppercase">EXECUTIVE<span className="text-primary">HUB</span></span>
            <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Operational Console</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto no-scrollbar pt-6">
          <SideLink active={activeTab === 'overview'} icon={<LayoutDashboard />} label="SYSTEM DASHBOARD" onClick={() => setActiveTab('overview')} />
          <SideLink active={activeTab === 'users'} icon={<UsersIcon />} label="USER DIRECTORY" onClick={() => setActiveTab('users')} />
          <SideLink active={activeTab === 'events'} icon={<Trophy />} label="ARENA MANAGEMENT" onClick={() => setActiveTab('events')} />
          <SideLink active={activeTab === 'payouts'} icon={<TrendingUp />} label="PAYMENT GATEWAY" onClick={() => setActiveTab('payouts')} />
          <SideLink active={activeTab === 'marketing'} icon={<Bell />} label="BROADCAST CENTER" onClick={() => setActiveTab('marketing')} />
          <SideLink active={activeTab === 'support'} icon={<MessageSquare />} label="HELP DESK" onClick={() => setActiveTab('support')} />
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
                  placeholder="SEARCH SYSTEM DATA (ID, EMAIL, PHONE)..." 
                  className="bg-white/5 border-white/5 rounded-xl pl-12 h-12 text-[10px] font-black uppercase focus:ring-primary w-full"
                />
             </div>
          </div>
        </header>

        <div className="p-10 space-y-10">
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnalyticCard label="Global User Segments" value={usersData?.length || '0'} sub="+14 Momentum" icon={<UsersIcon />} color="blue" />
                <AnalyticCard label="Platform Yield" value="₹84,210" sub="Analytical Growth" icon={<TrendingUp />} color="orange" />
                <AnalyticCard label="Aggregate Liabilities" value="₹1,24,000" sub="Obligations" icon={<Shield />} color="green" />
                <AnalyticCard label="Operational Surplus" value="₹24,500" sub="Post-Disbursement" icon={<Trophy />} color="red" />
              </div>
            </>
          )}

          {activeTab === 'users' && (
            <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
               <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black uppercase italic">User Directory</h3>
                    <p className="text-[9px] text-muted-foreground font-bold uppercase mt-1">Identity Inventory & Compliance</p>
                  </div>
               </div>
               <Table>
                  <TableHeader className="bg-white/[0.03]">
                     <TableRow className="border-white/5 hover:bg-transparent h-16">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-8">System ID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity Profile</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Capital Portfolio</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Compliance Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right px-8">Actions</TableHead>
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {filteredUsers.map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/[0.02] h-24">
                           <TableCell className="px-8"><code className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg">#{u.id.slice(0,6).toUpperCase()}</code></TableCell>
                           <TableCell>
                              <div className="flex items-center gap-4">
                                 <Avatar className="h-10 w-10 border border-white/10"><AvatarImage src={`https://picsum.photos/seed/${u.id}/100/100`} /></Avatar>
                                 <div>
                                    <p className="text-xs font-black uppercase italic">{u.email?.split('@')[0] || 'Unknown User'}</p>
                                    <p className="text-[9px] text-muted-foreground uppercase">{u.email || u.mobile}</p>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell>
                              <div className="space-y-1 text-[9px] font-bold">
                                 <p className="text-blue-400">DEP: ₹{u.depositBalance?.toFixed(1) || '0.0'}</p>
                                 <p className="text-green-400">WIN: ₹{u.winningBalance?.toFixed(1) || '0.0'}</p>
                              </div>
                           </TableCell>
                           <TableCell>
                              <Badge className={cn("text-[8px] font-black px-3", u.isBanned ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500")}>
                                 {u.isBanned ? 'SUSPENDED' : 'COMPLIANT'}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right px-8 space-x-2">
                              <Button onClick={() => setBalanceAdjustment({ userId: u.id, bucket: 'winning', amount: 0 })} variant="outline" className="h-9 rounded-lg text-[9px] font-black uppercase">CREDIT / DEBIT</Button>
                              <Button onClick={() => handleRestrictAccess(u)} variant={u.isBanned ? "outline" : "destructive"} className="h-9 rounded-lg text-[9px] font-black uppercase">
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
            <div className="space-y-10">
               <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter">Arena Management</h3>
                  <Button onClick={() => setIsCreatingEvent(true)} className="bg-primary hover:bg-primary/90 h-14 rounded-xl px-10 font-black uppercase italic text-xs">
                    <Plus className="h-5 w-5 mr-3" /> LAUNCH NEW EVENT
                  </Button>
               </div>
               
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {tournamentsData?.map(tour => (
                    <Card key={tour.id} className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-primary/40 transition-all flex flex-col">
                       <div className="h-44 relative">
                          <img src={tour.banner} className="w-full h-full object-cover opacity-60" />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                          <div className="absolute top-4 left-4 flex gap-2">
                             <Badge className="bg-primary/20 text-primary uppercase font-black text-[9px] italic">{tour.gameType}</Badge>
                             <Badge className={cn("uppercase font-black text-[9px] italic", tour.status === 'cancelled' ? "bg-red-500" : "bg-blue-500")}>{tour.status}</Badge>
                          </div>
                          <div className="absolute bottom-4 left-6">
                             <h4 className="text-xl font-black uppercase italic tracking-tighter">{tour.name}</h4>
                             <p className="text-[10px] font-bold text-amber-500 uppercase">Pool: {tour.prizePool}</p>
                          </div>
                       </div>
                       <CardContent className="p-8 space-y-6 flex-1">
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <Label className="text-[8px] font-black uppercase text-muted-foreground">Session Protocol</Label>
                                <Input value={tour.roomCredentials?.roomId || ''} placeholder="Enter ID" className="h-10 bg-black/40 border-none text-[11px]" readOnly />
                             </div>
                             <div className="space-y-1">
                                <Label className="text-[8px] font-black uppercase text-muted-foreground">Access Cipher</Label>
                                <Input value={tour.roomCredentials?.roomPassword || ''} placeholder="Enter Key" className="h-10 bg-black/40 border-none text-[11px]" readOnly />
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <Button onClick={() => handleCancelEvent(tour)} disabled={tour.status === 'cancelled' || isProcessingEvent === tour.id} variant="destructive" className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase">
                               {isProcessingEvent === tour.id ? <Loader2 className="animate-spin h-4 w-4" /> : 'CANCEL & REFUND'}
                             </Button>
                          </div>
                       </CardContent>
                    </Card>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="max-w-2xl space-y-8">
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] p-8 space-y-6">
                  <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Bell className="text-primary" /> Strategic Broadcast Hub</h3>
                  <div className="space-y-4">
                     <Input value={broadcast.title} onChange={e => setBroadcast({...broadcast, title: e.target.value})} placeholder="Notification Subject Title" className="h-12 bg-white/5" />
                     <Textarea value={broadcast.body} onChange={e => setBroadcast({...broadcast, body: e.target.value})} placeholder="Message Analytical Content..." className="h-24 bg-white/5" />
                     <Input value={broadcast.imageUrl} onChange={e => setBroadcast({...broadcast, imageUrl: e.target.value})} placeholder="Strategic Poster URL (Optional)" className="h-12 bg-white/5" />
                     <Select value={broadcast.audience} onValueChange={(val: any) => setBroadcast({...broadcast, audience: val})}>
                        <SelectTrigger className="h-12 bg-white/5"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-black text-white">
                           <SelectItem value="all">ALL REGISTERED USERS</SelectItem>
                           <SelectItem value="paid">PREMIUM PARTICIPANTS</SelectItem>
                           <SelectItem value="inactive">INACTIVE SEGMENTS</SelectItem>
                        </SelectContent>
                     </Select>
                     <Button onClick={handleBroadcast} className="w-full h-14 bg-primary font-black uppercase italic text-sm">TRANSMIT ANNOUNCEMENT</Button>
                  </div>
               </Card>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="max-w-2xl space-y-10">
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] p-8 space-y-8">
                  <h4 className="text-lg font-black uppercase italic flex items-center gap-3"><Settings className="text-primary" /> System Core Configuration</h4>
                  <ProtocolItem label="Activate Maintenance Protocol" desc="Global service interruption for infrastructure updates" checked={sysConfig.maintenanceMode} onChange={c => setSysConfig({...sysConfig, maintenanceMode: c})} />
                  <ProtocolItem label="Enable Video Incentives" desc="Allow users to accumulate coins via media interaction" checked={sysConfig.videoWallEnabled} onChange={c => setSysConfig({...sysConfig, videoWallEnabled: c})} />
                  <ProtocolItem label="Enable Analytical Missions" desc="Allow users to access CPA Lead Offer Walls" checked={sysConfig.offerWallEnabled} onChange={c => setSysConfig({...sysConfig, offerWallEnabled: c})} />
                  
                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground">CPA Lead Analytical URL</Label>
                       <Input value={sysConfig.cpaLeadUrl || ''} onChange={e => setSysConfig({...sysConfig, cpaLeadUrl: e.target.value})} className="h-12 bg-white/5 font-mono text-[10px]" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground">Incentive Ratio (Coins per $1)</Label>
                       <Input type="number" value={sysConfig.coinValuePerDollar || 800} onChange={e => setSysConfig({...sysConfig, coinValuePerDollar: Number(e.target.value)})} className="h-12 bg-white/5" />
                    </div>
                  </div>

                  <Button onClick={async () => {
                     await setDoc(doc(firestore!, 'settings', 'global'), sysConfig, { merge: true });
                     toast({ title: "Core Configuration Synchronized" });
                  }} className="w-full h-14 bg-primary font-black uppercase italic">SYNC SYSTEM API</Button>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* Manual Wealth Adjustment Dialog */}
      {balanceAdjustment && (
        <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
          <DialogContent className="bg-[#0a0a0f] border-white/10 rounded-[2rem] p-10 max-w-sm text-white">
            <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic">Capital Allocation</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-6">
              <Select value={balanceAdjustment.bucket} onValueChange={(val: any) => setBalanceAdjustment({...balanceAdjustment, bucket: val})}>
                <SelectTrigger className="h-14 bg-white/5 font-black uppercase text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-black text-white"><SelectItem value="deposit">DEPOSIT ASSETS</SelectItem><SelectItem value="winning">WINNING DISBURSEMENT</SelectItem><SelectItem value="task">INCENTIVE CREDITS</SelectItem></SelectContent>
              </Select>
              <Input type="number" value={balanceAdjustment.amount} onChange={e => setBalanceAdjustment({...balanceAdjustment, amount: Number(e.target.value)})} className="h-16 bg-white/5 text-3xl font-black text-center" />
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
                    description: `Manual Capital Allocation: ${bucket}` 
                 });
                 setBalanceAdjustment(null);
                 toast({ title: "Asset Synchronization Complete" });
              }} className="w-full h-14 bg-primary font-black uppercase italic">EXECUTE ADJUSTMENT</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SideLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest", active ? "bg-primary text-white italic" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      <span className={active ? "text-white" : "opacity-40"}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function AnalyticCard({ label, value, sub, icon, color }: any) {
  return (
    <Card className="bg-[#0a0a0f] border-white/5 rounded-[1.5rem] p-6 flex items-center justify-between shadow-xl">
       <div className="space-y-1">
          <p className="text-[9px] font-black text-muted-foreground uppercase">{label}</p>
          <h4 className="text-2xl font-black text-white italic">{value}</h4>
          <p className="text-[8px] font-black text-primary uppercase">{sub}</p>
       </div>
       <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white/5 text-primary border border-white/5">{icon}</div>
    </Card>
  );
}

function ProtocolItem({ label, desc, checked, onChange }: any) {
   return (
      <div className="flex items-center justify-between p-5 bg-white/5 rounded-xl border border-white/5">
         <div className="space-y-1">
            <p className="text-[10px] font-black uppercase italic">{label}</p>
            <p className="text-[8px] text-muted-foreground font-bold uppercase">{desc}</p>
         </div>
         <Switch checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-primary" />
      </div>
   );
}
