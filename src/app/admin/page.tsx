
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, updateDoc, setDoc, addDoc, increment } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  Search,
  CreditCard,
  Gamepad2,
  LogOut,
  Copy,
  Plus,
  ShieldCheck,
  Globe,
  RefreshCcw,
  AlertTriangle,
  Wallet
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserProfile, Tournament } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'users' | 'add-money' | 'tournaments' | 'settings';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceAdjustment, setBalanceAdjustment] = useState<{ user: UserProfile } | null>(null);
  const [adjAmount, setAdjAmount] = useState('100');
  const [isProcessing, setIsProcessing] = useState(false);

  const [quickUid, setQuickUid] = useState('');
  const [quickAmount, setQuickAmount] = useState('100');

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast({ title: "Admin Logged Out" });
      router.push('/login');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "User ID Copied!" });
  };

  const executeAddMoney = async (targetId: string, amount: number) => {
    if (!firestore || !isAdminUser || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const userRef = doc(firestore, 'users', targetId);
      const updates = {
        winningBalance: increment(amount),
        withdrawableCoins: increment(amount),
        coins: increment(amount),
        lastUpdated: new Date().toISOString()
      };

      await setDoc(userRef, updates, { merge: true });
      
      await addDoc(collection(firestore, 'users', targetId, 'ledger'), {
        type: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: "Direct Credit by Admin"
      });

      toast({ 
        title: "COINS ADDED", 
        description: `Successfully added ${amount} coins to User: ${targetId.substring(0,8)}...` 
      });
      setQuickUid('');
      setBalanceAdjustment(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black">ACCESS DENIED</div>;

  const filteredUsers = usersData?.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastIp?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-xl italic uppercase">ADMIN <span className="text-primary">PANEL</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 pt-4">
          <SidebarLink active={activeTab === 'users'} icon={<UsersIcon />} label="Users Directory" onClick={() => setActiveTab('users')} />
          <SidebarLink active={activeTab === 'add-money'} icon={<Plus />} label="Quick Add Coins" onClick={() => setActiveTab('add-money')} />
          <SidebarLink active={activeTab === 'tournaments'} icon={<Gamepad2 />} label="Game Management" onClick={() => setActiveTab('tournaments')} />
          <SidebarLink active={activeTab === 'settings'} icon={<Settings />} label="System Settings" onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black uppercase text-xs">
            <LogOut className="h-4 w-4" /> Logout Admin
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-10 space-y-10">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-4xl font-black uppercase italic text-white">Admin <span className="text-primary">Dashboard</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Control users, balances, and game sectors</p>
           </div>
           <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 text-xs">ADMIN MODE ACTIVE</Badge>
        </header>

        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 h-14">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by Email, User ID (UID), or IP Address..." 
                  className="bg-transparent border-none outline-none flex-1 text-sm font-bold text-white placeholder:text-muted-foreground/50"
                />
             </div>

             <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-2xl shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">User Information</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Wallet Status</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-8">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                      ) : filteredUsers.length > 0 ? filteredUsers.map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="px-8 py-6">
                              <p className="text-sm font-bold text-white">{u.email || 'Phone User'}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <code className="text-[10px] font-mono text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">UID: {u.id}</code>
                                <button onClick={() => copyToClipboard(u.id)} className="text-muted-foreground hover:text-white p-1 rounded-md hover:bg-white/5"><Copy className="h-3 w-3" /></button>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-[9px] text-muted-foreground font-bold uppercase">
                                <Globe className="h-3 w-3" /> Last IP: <span className="text-white">{u.lastIp || 'N/A'}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <Badge variant="outline" className="text-[10px] border-primary/20 text-primary w-36 justify-center bg-primary/5 py-1">Total: {u.coins?.toLocaleString() || 0} 🪙</Badge>
                                 <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-500 w-36 justify-center bg-green-500/5 py-1">Winnings: {u.winningBalance?.toLocaleString() || 0}</Badge>
                              </div>
                           </TableCell>
                           <TableCell className="text-right px-8">
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u })} className="h-10 text-[10px] font-black bg-primary hover:bg-primary/90 rounded-xl px-6 text-white">
                                <Plus className="h-3 w-3 mr-2" /> ADD MONEY
                              </Button>
                           </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center text-muted-foreground font-bold uppercase text-xs">No users found in directory.</TableCell></TableRow>
                      )}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'add-money' && (
           <Card className="bg-[#0a0a0f] border-primary/20 p-10 rounded-[2.5rem] space-y-8 max-w-xl mx-auto shadow-2xl">
              <div className="flex items-center gap-4">
                 <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <CreditCard className="text-primary h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black uppercase italic text-white">Direct Cash Credit</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Enter User ID and coin amount</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Paste User ID (UID)</Label>
                    <Input 
                      value={quickUid} 
                      onChange={e => setQuickUid(e.target.value)} 
                      placeholder="e.g. 5hz9N..." 
                      className="h-16 bg-white/5 border-white/10 font-mono text-sm tracking-widest focus:ring-primary rounded-2xl text-white" 
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Amount to Add</Label>
                       <Input 
                        type="number" 
                        value={quickAmount} 
                        onChange={e => setQuickAmount(e.target.value)} 
                        className="h-16 bg-white/5 border-white/10 text-3xl font-black text-primary focus:ring-primary rounded-2xl" 
                       />
                    </div>
                    <div className="flex items-end">
                       <Button 
                        onClick={() => executeAddMoney(quickUid.trim(), Number(quickAmount))} 
                        disabled={isProcessing || !quickUid} 
                        className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-lg rounded-2xl shadow-xl shadow-primary/20 text-white"
                       >
                          {isProcessing ? <Loader2 className="animate-spin" /> : "CREDIT WALLET"}
                       </Button>
                    </div>
                 </div>
              </div>
           </Card>
        )}

        {activeTab === 'tournaments' && (
           <div className="grid gap-6">
              <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-black uppercase italic text-white">Arena Management</h2>
                 <Button className="bg-primary hover:bg-primary/90 text-white text-[10px] font-black uppercase h-10 px-6 rounded-xl">Create Tournament</Button>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                 {tournamentsData?.map(t => (
                    <Card key={t.id} className="bg-[#0a0a0f] border-white/5 p-6 rounded-2xl space-y-4">
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="text-lg font-black uppercase text-white">{t.name}</h4>
                             <Badge variant="outline" className="text-[9px] uppercase border-white/10 mt-1 text-muted-foreground">{t.gameType}</Badge>
                          </div>
                          <Badge className={cn(
                             "uppercase font-black text-[9px] px-3",
                             t.status === 'active' ? "bg-green-500 text-black" : "bg-red-500 text-white"
                          )}>{t.status}</Badge>
                       </div>
                       <div className="pt-4 border-t border-white/5 flex gap-3">
                          <Button disabled={isProcessing} variant="destructive" size="sm" className="flex-1 font-black text-[10px] h-10 rounded-lg">
                             <RefreshCcw className="h-3 w-3 mr-2" /> CANCEL & REFUND
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 font-black text-[10px] h-10 rounded-lg border-white/10 text-white">EDIT SECTOR</Button>
                       </div>
                    </Card>
                 ))}
              </div>
           </div>
        )}
      </main>

      {balanceAdjustment && (
        <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
           <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
              <VisuallyHidden.Root><DialogTitle>Add Coins to Wallet</DialogTitle></VisuallyHidden.Root>
              <div className="bg-primary/10 p-8 border-b border-white/5">
                <h3 className="text-xl font-black italic uppercase text-primary">Add Money</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Direct wallet adjustment</p>
              </div>
              <div className="p-8 space-y-6">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Target Account</p>
                    <p className="text-xs font-bold truncate text-white">{balanceAdjustment.user.email || balanceAdjustment.user.id}</p>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Enter Coin Amount</Label>
                    <div className="relative">
                       <Input 
                        type="number" 
                        value={adjAmount} 
                        onChange={e => setAdjAmount(e.target.value)} 
                        placeholder="0" 
                        className="h-16 bg-black/40 border-white/10 rounded-2xl text-4xl font-black text-primary pl-10 focus:ring-primary" 
                       />
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black opacity-20">🪙</span>
                    </div>
                 </div>
                 <Button 
                  onClick={() => executeAddMoney(balanceAdjustment.user.id, Number(adjAmount))} 
                  disabled={isProcessing} 
                  className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-xl shadow-2xl shadow-primary/20 rounded-2xl text-white"
                 >
                   {isProcessing ? <Loader2 className="animate-spin" /> : "CONFIRM & ADD"}
                 </Button>
              </div>
           </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SidebarLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white italic shadow-lg shadow-primary/10" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      <span className={cn("h-4 w-4 transition-transform", active && "scale-110")}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
