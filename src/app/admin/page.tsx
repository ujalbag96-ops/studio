
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, collectionGroup, addDoc, orderBy, limit, deleteDoc, increment, where } from 'firebase/firestore';
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
  CheckCircle2
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
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, UserLedgerEntry, Tournament, GameType, SupportMessage } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'warriors' | 'security' | 'support' | 'campaigns' | 'control'>('overview');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [coinAdjustment, setCoinAdjustment] = useState<{ userId: string; bucket: 'deposit' | 'winning' | 'task'; amount: number } | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdminUser) return null;
    if (countryFilter === 'All') return collection(firestore, 'users');
    return query(collection(firestore, 'users'), where('country', '==', countryFilter));
  }, [firestore, isAdminUser, countryFilter]);

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
  const { data: flaggedTxs } = useCollection<UserLedgerEntry>(flaggedTxsQuery);
  const { data: supportTickets } = useCollection<SupportMessage>(supportQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const [config, setConfig] = useState<Partial<AppSettings>>({});
  const [isTournamentDialogOpen, setIsTournamentDialogOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState<Partial<Tournament> | null>(null);

  useEffect(() => {
    if (settings) setConfig(settings);
  }, [settings]);

  const handleUpdateSettings = async (updates: Partial<AppSettings>) => {
    if (!firestore || !settingsRef) return;
    await setDoc(settingsRef, updates, { merge: true });
    toast({ title: "Configuration Synced" });
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
        description: `Admin correction: ${bucket}`
      });
      toast({ title: "Transfer Successful" });
      setCoinAdjustment(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    }
  };

  const resolveTicket = async (ticketId: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'support', ticketId), { status: 'resolved' });
    toast({ title: "Ticket Archived" });
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black">ACCESS DENIED</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      {/* Eagle Eye Sidebar */}
      <aside className="w-64 bg-[#0a0a0f] border-r border-white/5 hidden lg:flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-black uppercase tracking-tighter text-lg italic">EAGLE<span className="text-primary">EYE</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavItem active={activeTab === 'overview'} icon={<LayoutDashboard />} label="COMMAND" onClick={() => setActiveTab('overview')} />
          <NavItem active={activeTab === 'warriors'} icon={<UsersIcon />} label="WARRIORS" onClick={() => setActiveTab('warriors')} />
          <NavItem active={activeTab === 'security'} icon={<ShieldAlert />} label="SECURITY" onClick={() => setActiveTab('security')} count={flaggedTxs?.length} />
          <NavItem active={activeTab === 'support'} icon={<MessageSquare />} label="SUPPORT" onClick={() => setActiveTab('support')} count={supportTickets?.length} />
          <NavItem active={activeTab === 'campaigns'} icon={<Trophy />} label="CAMPAIGNS" onClick={() => setActiveTab('campaigns')} />
          <NavItem active={activeTab === 'control'} icon={<Settings />} label="ECONOMIC" onClick={() => setActiveTab('control')} />
        </nav>
      </aside>

      <main className="flex-1 lg:ml-64 pb-20">
        <header className="h-16 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40 px-8 flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{activeTab} Sector</h2>
          <Badge className="bg-primary/20 text-primary border-primary/20 text-[9px] font-black uppercase">ADMIN TERMINAL ACTIVE</Badge>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Total Recruits" value={usersData?.length || 0} icon={<UsersIcon />} color="blue" />
              <StatCard title="Flagged Events" value={flaggedTxs?.length || 0} icon={<AlertTriangle />} color="red" />
              <StatCard title="Active Campaigns" value={tournamentsData?.length || 0} icon={<Trophy />} color="orange" />
              <StatCard title="Open Tickets" value={supportTickets?.length || 0} icon={<MessageSquare />} color="amber" />
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
               <Card className="bg-[#0a0a0f] border-red-500/20 rounded-3xl overflow-hidden shadow-2xl">
                  <Table>
                    <TableHeader className="bg-red-500/5">
                      <TableRow className="border-white/5">
                        <TableHead className="px-8 font-black uppercase text-[9px] tracking-widest text-red-500">Suspicious Event</TableHead>
                        <TableHead className="font-black uppercase text-[9px] tracking-widest">Volume</TableHead>
                        <TableHead className="font-black uppercase text-[9px] tracking-widest">Protocol</TableHead>
                        <TableHead className="text-right px-8 font-black uppercase text-[9px] tracking-widest">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flaggedTxs?.map(tx => (
                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 transition-all">
                          <TableCell className="px-8 py-6">
                            <p className="font-black text-xs uppercase italic">{tx.description}</p>
                            <p className="text-[8px] text-muted-foreground font-bold">{tx.date}</p>
                          </TableCell>
                          <TableCell className="font-black text-white">₹{tx.amount}</TableCell>
                          <TableCell><Badge variant="outline" className="text-[9px] border-red-500/20 text-red-500">FLAGGED</Badge></TableCell>
                          <TableCell className="text-right px-8 space-x-2">
                             <Button size="sm" onClick={() => updateDoc(doc(firestore!, 'ledger', tx.id), { status: 'completed' })} className="h-8 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border-none text-[8px] font-black">RELEASE</Button>
                             <Button size="sm" variant="destructive" onClick={() => deleteDoc(doc(firestore!, 'ledger', tx.id))} className="h-8 text-[8px] font-black">VOID</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </Card>
            </div>
          )}

          {activeTab === 'support' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {supportTickets?.map(ticket => (
                   <Card key={ticket.id} className="bg-[#121216] border-white/5 rounded-3xl p-6 space-y-4">
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><UserPlus className="h-5 w-5" /></div>
                            <div>
                               <p className="text-[10px] font-black text-muted-foreground uppercase">{ticket.userId.substring(0,10)}</p>
                               <p className="text-xs font-bold">{new Date(ticket.timestamp).toLocaleString()}</p>
                            </div>
                         </div>
                         <Badge className="bg-amber-500/10 text-amber-500 text-[8px] uppercase">OPEN TICKET</Badge>
                      </div>
                      <p className="text-sm font-medium leading-relaxed bg-black/40 p-4 rounded-2xl italic border border-white/5">"{ticket.message}"</p>
                      <Button onClick={() => resolveTicket(ticket.id)} className="w-full h-11 bg-green-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl">MARK AS RESOLVED</Button>
                   </Card>
                ))}
             </div>
          )}

          {activeTab === 'warriors' && (
            <div className="space-y-6">
              <Card className="bg-white/5 border-white/5 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Filter className="h-4 w-4 text-primary" />
                  <Select value={countryFilter} onValueChange={setCountryFilter}>
                    <SelectTrigger className="w-48 bg-black/40 border-white/10 h-10 rounded-xl">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121216] border-white/10 text-white">
                      <SelectItem value="All">Global Sector</SelectItem>
                      <SelectItem value="India">India Sector</SelectItem>
                      <SelectItem value="USA">USA Sector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="bg-[#0a0a0f] border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="px-8 font-black uppercase text-[9px] tracking-widest text-muted-foreground">Identity</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Balances (D/W/T)</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground">Rank/Status</TableHead>
                      <TableHead className="font-black uppercase text-[9px] tracking-widest text-muted-foreground text-right px-8">Access</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData?.map(u => (
                      <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                        <TableCell className="px-8 py-6">
                          <p className="font-black text-xs uppercase italic">{u.email || u.id.substring(0,10)}</p>
                          {u.isVpnActive && <Badge className="bg-red-500/10 text-red-500 text-[7px] border-none">VPN DETECTED</Badge>}
                        </TableCell>
                        <TableCell>
                           <div className="flex gap-2">
                              <Badge className="bg-white/5 text-white border-none text-[8px]">{u.depositBalance || 0}</Badge>
                              <Badge className="bg-green-500/10 text-green-500 border-none text-[8px]">{u.winningBalance || 0}</Badge>
                              <Badge className="bg-amber-500/10 text-amber-500 border-none text-[8px]">{u.taskBalance || 0}</Badge>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="space-y-1">
                              <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">{u.rank || 'Bronze'}</Badge>
                              <p className="text-[7px] font-black text-muted-foreground uppercase">{u.country || 'Global'}</p>
                           </div>
                        </TableCell>
                        <TableCell className="text-right px-8 space-x-2">
                           <Button 
                             onClick={() => setCoinAdjustment({ userId: u.id, bucket: 'winning', amount: 100 })}
                             className="h-8 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border-none text-[8px] font-black uppercase"
                           >
                             +100 WIN
                           </Button>
                           <Button 
                             variant={u.isBanned ? "outline" : "destructive"} 
                             size="sm" 
                             className="h-8 px-4 font-black text-[9px] uppercase"
                             onClick={() => updateDoc(doc(firestore!, 'users', u.id), { isBanned: !u.isBanned })}
                           >
                             {u.isBanned ? "UNBAN" : "BAN"}
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          )}

          {activeTab === 'control' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="bg-[#1a1a1a] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                  <h3 className="text-lg font-black italic flex items-center gap-3"><DollarSign className="text-primary" /> Economy</h3>
                  <div className="space-y-4">
                     <div>
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Referral Bounty (Coins)</Label>
                        <Input type="number" value={config.referralRewardCoins} onChange={e => setConfig({...config, referralRewardCoins: Number(e.target.value)})} className="bg-black/40 border-white/10 h-12 rounded-xl mt-1" />
                     </div>
                     <div>
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Passive Referral % (Task Comm.)</Label>
                        <Input type="number" value={config.passiveReferralPercent} onChange={e => setConfig({...config, passiveReferralPercent: Number(e.target.value)})} className="bg-black/40 border-white/10 h-12 rounded-xl mt-1" />
                     </div>
                     <Button onClick={() => handleUpdateSettings({ referralRewardCoins: config.referralRewardCoins, passiveReferralPercent: config.passiveReferralPercent })} className="w-full h-14 bg-primary font-black uppercase italic shadow-xl">SYNC GLOBAL ECONOMY</Button>
                  </div>
               </Card>

               <Card className="bg-[#1a1a1a] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                  <h3 className="text-lg font-black italic flex items-center gap-3"><ShieldCheck className="text-amber-500" /> API / Toggles</h3>
                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                           <span className="text-[9px] font-black">Offer Wall</span>
                           <Switch checked={config.offerWallEnabled} onCheckedChange={val => handleUpdateSettings({ offerWallEnabled: val })} />
                        </div>
                        <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                           <span className="text-[9px] font-black">Video Ads</span>
                           <Switch checked={config.videoWallEnabled} onCheckedChange={val => handleUpdateSettings({ videoWallEnabled: val })} />
                        </div>
                     </div>
                     <Button variant="outline" className="w-full h-14 border-white/10 text-[10px] font-black uppercase tracking-widest">RESET ALL CONNECTIONS</Button>
                  </div>
               </Card>
            </div>
          )}
        </div>
      </main>

      {/* Manual Adjustment Dialog */}
      {coinAdjustment && (
        <Dialog open={!!coinAdjustment} onOpenChange={() => setCoinAdjustment(null)}>
          <DialogContent className="bg-[#121216] border-white/10 text-white rounded-[2rem]">
            <DialogHeader><DialogTitle className="font-black italic uppercase">Adjust: {coinAdjustment.bucket}</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Coins to Credit (Use negative for debit)</Label>
                <Input type="number" value={coinAdjustment.amount} onChange={e => setCoinAdjustment({...coinAdjustment, amount: Number(e.target.value)})} className="bg-black/40 h-14 rounded-xl text-xl font-black text-primary" />
              </div>
              <Button onClick={handleAdjustBalance} className="w-full h-14 bg-primary font-black uppercase italic rounded-xl">EXECUTE TRANSFER</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function NavItem({ active, icon, label, onClick, count }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all duration-300 group relative", active ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      <div className="flex items-center gap-4">
        <span className={cn("h-5 w-5", active ? "scale-110" : "group-hover:scale-110")}>{icon}</span>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{label}</span>
      </div>
      {count > 0 && <Badge className="bg-red-500 text-white border-none text-[8px] h-4 min-w-4 flex items-center justify-center p-0">{count}</Badge>}
      {active && <div className="absolute left-2 h-6 w-1 bg-white rounded-full opacity-60" />}
    </button>
  );
}

function StatCard({ title, value, icon, color }: any) {
  const colorMap = { blue: "bg-blue-600", orange: "bg-primary", red: "bg-destructive", amber: "bg-amber-500 text-black" };
  return (
    <Card className="bg-[#1a1a1a] border-white/5 p-8 rounded-[2rem] flex items-center justify-between group hover:scale-[1.02] transition-all">
       <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{title}</p>
          <h4 className="text-3xl font-black italic tracking-tighter">{value.toLocaleString()}</h4>
       </div>
       <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12", colorMap[color as keyof typeof colorMap])}>
          {icon}
       </div>
    </Card>
  );
}
