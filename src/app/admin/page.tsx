'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, updateDoc, setDoc, addDoc, increment, query, where, getDocs } from 'firebase/firestore';
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
  ArrowUpRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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
  const [adjAmount, setAdjAmount] = useState('500');
  const [isProcessing, setIsProcessing] = useState(false);

  const [quickUid, setQuickUid] = useState('');
  const [quickAmount, setQuickAmount] = useState('500');

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: tourData, isLoading: toursLoading } = useCollection<Tournament>(tournamentsQuery);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast({ title: "Admin Logged Out" });
      router.push('/login');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "User ID Copied!", description: "You can now use this ID for injections." });
  };

  const executeInjection = async (targetId: string, amount: number) => {
    if (!firestore || !isAdminUser || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const userRef = doc(firestore, 'users', targetId);
      const updates = {
        winningBalance: increment(amount),
        withdrawableCoins: increment(amount),
        coins: increment(amount),
        id: targetId
      };

      await setDoc(userRef, updates, { merge: true });
      
      await addDoc(collection(firestore, 'users', targetId, 'ledger'), {
        type: 'income',
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: "Admin Added Cash"
      });

      toast({ 
        title: "Coins Added!", 
        description: `Successfully added ${amount} coins to User ${targetId}.` 
      });
      setQuickUid('');
      setBalanceAdjustment(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add coins." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefund = async (tournament: Tournament) => {
    if (!firestore || !isAdminUser || isProcessing) return;
    if (tournament.isRefunded) return;
    
    setIsProcessing(true);
    try {
      // Find all registrations for this tournament
      const regSnap = await getDocs(query(collection(firestore, 'registrations'), where('tournamentId', '==', tournament.id)));
      
      for (const regDoc of regSnap.docs) {
        const regData = regDoc.data();
        const userRef = doc(firestore, 'users', regData.userId);
        
        // Return fee to user's deposit balance
        await setDoc(userRef, {
          coins: increment(regData.feePaid),
          depositBalance: increment(regData.feePaid)
        }, { merge: true });

        // Add ledger entry for refund
        await addDoc(collection(firestore, 'users', regData.userId, 'ledger'), {
          type: 'refund',
          amount: regData.feePaid,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Refund: ${tournament.name}`
        });
      }

      // Mark tournament as cancelled and refunded
      await updateDoc(doc(firestore, 'tournaments', tournament.id), {
        status: 'cancelled',
        isRefunded: true
      });

      toast({ title: "Refund Complete", description: `Successfully refunded ${regSnap.size} participants.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Refund Failed", description: "Could not complete the refund protocol." });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black">ACCESS DENIED</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-xl italic uppercase">ADMIN <span className="text-primary">PANEL</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 pt-4">
          <SidebarLink active={activeTab === 'users'} icon={<UsersIcon />} label="Users List" onClick={() => setActiveTab('users')} />
          <SidebarLink active={activeTab === 'add-money'} icon={<Plus />} label="Add Money (By ID)" onClick={() => setActiveTab('add-money')} />
          <SidebarLink active={activeTab === 'tournaments'} icon={<Gamepad2 />} label="Tournaments" onClick={() => setActiveTab('tournaments')} />
          <SidebarLink active={activeTab === 'settings'} icon={<Settings />} label="Settings" onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black uppercase text-xs">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-10">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-4xl font-black uppercase italic">Admin <span className="text-primary">Dashboard</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Manage all users and transactions</p>
           </div>
           <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 text-xs">Admin Mode Active</Badge>
        </header>

        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 h-14">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by Email or User ID..." 
                  className="bg-transparent border-none outline-none flex-1 text-sm font-bold"
                />
             </div>

             <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-2xl shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">User Info</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Live Balances</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-8">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                      ) : usersData?.filter(u => 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.id?.includes(searchQuery)
                        ).map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="px-8 py-6">
                              <p className="text-sm font-bold">{u.email || 'Phone User'}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <code className="text-[10px] font-mono text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">ID: {u.id}</code>
                                <button onClick={() => copyToClipboard(u.id)} className="text-muted-foreground hover:text-white p-1 rounded-md hover:bg-white/5"><Copy className="h-3 w-3" /></button>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <Badge variant="outline" className="text-[10px] border-primary/20 text-primary w-28 justify-center bg-primary/5 py-1">Total: {u.coins || 0} 🪙</Badge>
                                 <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-500 w-28 justify-center bg-green-500/5 py-1">Win: {u.winningBalance || 0}</Badge>
                              </div>
                           </TableCell>
                           <TableCell className="text-right px-8">
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u })} className="h-10 text-[10px] font-black bg-primary hover:bg-primary/90 rounded-xl px-6">
                                <Plus className="h-3 w-3 mr-2" /> ADD MONEY
                              </Button>
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="grid gap-6">
             {tourData?.map(t => (
               <Card key={t.id} className="bg-[#0a0a0f] border-white/5 p-8 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold uppercase">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">Status: <span className={cn("font-bold uppercase", t.status === 'active' ? 'text-green-500' : 'text-red-500')}>{t.status}</span></p>
                  </div>
                  <div className="flex gap-4">
                     {t.status !== 'cancelled' ? (
                       <Button onClick={() => handleRefund(t)} variant="destructive" size="sm" disabled={isProcessing} className="font-black uppercase text-[10px]">
                          {isProcessing ? <Loader2 className="animate-spin" /> : "CANCEL & REFUND"}
                       </Button>
                     ) : (
                       <Badge className="bg-red-500/20 text-red-500 uppercase">Refunded & Closed</Badge>
                     )}
                  </div>
               </Card>
             ))}
          </div>
        )}

        {activeTab === 'add-money' && (
           <Card className="bg-[#0a0a0f] border-primary/20 p-10 rounded-[2.5rem] space-y-8 max-w-xl mx-auto shadow-2xl">
              <div className="flex items-center gap-4">
                 <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <CreditCard className="text-primary h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black uppercase italic">Add Money by User ID</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Copy User ID from list and paste here</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Paste User ID (UID)</Label>
                    <Input 
                      value={quickUid} 
                      onChange={e => setQuickUid(e.target.value)} 
                      placeholder="e.g. 5hz9N..." 
                      className="h-16 bg-white/5 border-white/10 font-mono text-sm tracking-widest focus:ring-primary rounded-2xl" 
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
                        onClick={() => executeInjection(quickUid.trim(), Number(quickAmount))} 
                        disabled={isProcessing || !quickUid} 
                        className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-lg rounded-2xl shadow-xl shadow-primary/20"
                       >
                          {isProcessing ? <Loader2 className="animate-spin" /> : "ADD MONEY"}
                       </Button>
                    </div>
                 </div>
              </div>
           </Card>
        )}
      </main>

      {balanceAdjustment && (
        <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
           <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
              <VisuallyHidden.Root><DialogTitle>Add Balance to User</DialogTitle></VisuallyHidden.Root>
              <div className="bg-primary/10 p-8 border-b border-white/5">
                <h3 className="text-xl font-black italic uppercase text-primary">Add Coins</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Direct Wallet Credit</p>
              </div>
              <div className="p-8 space-y-6">
                 <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Target Account</p>
                    <p className="text-xs font-bold truncate text-white">{balanceAdjustment.user.email || balanceAdjustment.user.id}</p>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Enter Amount</Label>
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
                  onClick={() => executeInjection(balanceAdjustment.user.id, Number(adjAmount))} 
                  disabled={isProcessing} 
                  className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-xl shadow-2xl shadow-primary/20 rounded-2xl"
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
