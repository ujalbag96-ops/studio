
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, setDoc, addDoc, increment, query, orderBy, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  Search,
  Gamepad2,
  LogOut,
  Copy,
  Plus,
  Minus,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserProfile, Tournament, UserLedgerEntry } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceAdjustment, setBalanceAdjustment] = useState<{ user: UserProfile, mode: 'add' | 'deduct' } | null>(null);
  const [adjAmount, setAdjAmount] = useState('100');
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const withdrawalQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'withdrawals'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: withdrawals, isLoading: withdrawsLoading } = useCollection<any>(withdrawalQuery);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const executeAdjustment = async (targetId: string, amount: number, mode: 'add' | 'deduct') => {
    if (!firestore || !isAdminUser || isProcessing) return;
    setIsProcessing(true);
    
    const finalAmount = mode === 'add' ? amount : -amount;
    
    try {
      const userRef = doc(firestore, 'users', targetId);
      await setDoc(userRef, {
        winningBalance: increment(finalAmount),
        coins: increment(finalAmount),
        lastUpdated: new Date().toISOString()
      }, { merge: true });
      
      await addDoc(collection(firestore, 'users', targetId, 'ledger'), {
        userId: targetId,
        type: mode === 'add' ? 'income' : 'withdrawal',
        amount: Math.abs(finalAmount),
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Admin ${mode === 'add' ? 'Credit' : 'Debit'} Adjustment`
      });

      toast({ title: mode === 'add' ? "CREDITED" : "DEDUCTED", description: `${amount} coins processed for user.` });
      setBalanceAdjustment(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Action Failed", description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawAction = async (id: string, userId: string, amount: number, status: 'approved' | 'rejected') => {
    if (!firestore || isProcessing) return;
    setIsProcessing(true);
    try {
      await setDoc(doc(firestore, 'withdrawals', id), { status }, { merge: true });
      
      if (status === 'rejected') {
        // Refund the user if rejected
        await setDoc(doc(firestore, 'users', userId), {
          winningBalance: increment(amount),
          coins: increment(amount)
        }, { merge: true });
        
        await addDoc(collection(firestore, 'users', userId, 'ledger'), {
          type: 'income',
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: "Withdrawal Rejected - Funds Refunded"
        });
      }
      toast({ title: `Withdrawal ${status}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to process" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black">ACCESS DENIED</div>;

  const filteredUsers = usersData?.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-xl italic uppercase">ADMIN <span className="text-primary">HUB</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 pt-4">
          <SidebarLink active={activeTab === 'users'} icon={<UsersIcon />} label="Users List" onClick={() => setActiveTab('users')} />
          <SidebarLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Withdrawals" onClick={() => setActiveTab('withdrawals')} />
          <SidebarLink active={activeTab === 'tournaments'} icon={<Gamepad2 />} label="Games Hub" onClick={() => setActiveTab('tournaments')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black uppercase text-xs">
            <LogOut className="h-4 w-4" /> Logout Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-10">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-4xl font-black uppercase italic text-white">WinZO <span className="text-primary">Admin</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Industrial Wallet & User Management</p>
           </div>
           <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 text-xs uppercase">Authorized Session</Badge>
        </header>

        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 h-14">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by Email or User ID (UID)..." 
                  className="bg-transparent border-none outline-none flex-1 text-sm font-bold text-white placeholder:text-muted-foreground/50"
                />
             </div>

             <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-2xl shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">User Details</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Balances</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-8">Quick Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                      ) : filteredUsers.length > 0 ? filteredUsers.map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="px-8 py-6">
                              <p className="text-sm font-bold text-white">{u.email || 'Anonymous'}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <code className="text-[10px] font-mono text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">UID: {u.id}</code>
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-[9px] text-muted-foreground font-bold uppercase">
                                <Smartphone className="h-3 w-3" /> LAST IP: <span className="text-white">{u.lastIp || 'Unknown'}</span>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1.5">
                                 <Badge variant="outline" className="text-[9px] border-blue-500/20 text-blue-500 w-32 justify-between bg-blue-500/5 py-0.5 px-3">DEP: <span>{u.depositBalance?.toFixed(1) || 0}</span></Badge>
                                 <Badge variant="outline" className="text-[9px] border-green-500/20 text-green-500 w-32 justify-between bg-green-500/5 py-0.5 px-3">WIN: <span>{u.winningBalance?.toFixed(1) || 0}</span></Badge>
                                 <Badge variant="outline" className="text-[9px] border-amber-500/20 text-amber-500 w-32 justify-between bg-amber-500/5 py-0.5 px-3">BONUS: <span>{u.bonusBalance?.toFixed(1) || 0}</span></Badge>
                              </div>
                           </TableCell>
                           <TableCell className="text-right px-8 space-x-2">
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u, mode: 'add' })} className="h-9 text-[10px] font-black bg-green-600 hover:bg-green-700 rounded-xl px-4 text-white">
                                <Plus className="h-3 w-3 mr-1.5" /> ADD
                              </Button>
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u, mode: 'deduct' })} className="h-9 text-[10px] font-black bg-red-600 hover:bg-red-700 rounded-xl px-4 text-white">
                                <Minus className="h-3 w-3 mr-1.5" /> DEDUCT
                              </Button>
                           </TableCell>
                        </TableRow>
                      )) : (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center text-muted-foreground font-bold uppercase text-xs">No users found.</TableCell></TableRow>
                      )}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase italic">Pending Withdrawals</h2>
            <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-2xl">
              <Table>
                 <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                       <TableHead className="text-[10px] font-black uppercase tracking-widest px-8">Request Details</TableHead>
                       <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Amount</TableHead>
                       <TableHead className="text-[10px] font-black uppercase tracking-widest text-right px-8">Actions</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {withdrawsLoading ? (
                      <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                    ) : (withdrawals?.filter(w => w.status === 'pending') || []).length > 0 ? (withdrawals?.filter(w => w.status === 'pending') || []).map((w: any) => (
                      <TableRow key={w.id} className="border-white/5">
                         <TableCell className="px-8 py-6">
                            <p className="text-sm font-bold">{w.method}: {w.destination}</p>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">User: {w.userId}</p>
                         </TableCell>
                         <TableCell className="text-center">
                            <p className="text-lg font-black text-primary">₹{w.amount.toFixed(2)}</p>
                         </TableCell>
                         <TableCell className="text-right px-8 space-x-3">
                            <Button onClick={() => handleWithdrawAction(w.id, w.userId, w.amount, 'approved')} className="bg-green-500 hover:bg-green-600 h-10 px-4 rounded-xl font-black text-[10px]"><CheckCircle2 className="h-4 w-4 mr-2" /> APPROVE</Button>
                            <Button onClick={() => handleWithdrawAction(w.id, w.userId, w.amount, 'rejected')} className="bg-red-500 hover:bg-red-600 h-10 px-4 rounded-xl font-black text-[10px]"><XCircle className="h-4 w-4 mr-2" /> REJECT</Button>
                         </TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={3} className="py-20 text-center text-muted-foreground font-black uppercase">No pending requests.</TableCell></TableRow>
                    )}
                 </TableBody>
              </Table>
            </Card>
          </div>
        )}
      </main>

      {balanceAdjustment && (
        <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
           <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2.5rem] shadow-2xl p-0 overflow-hidden">
              <VisuallyHidden.Root><DialogTitle>Adjust Balance</DialogTitle></VisuallyHidden.Root>
              <div className={cn("p-8 border-b border-white/5", balanceAdjustment.mode === 'add' ? "bg-green-500/10" : "bg-red-500/10")}>
                <h3 className={cn("text-xl font-black italic uppercase", balanceAdjustment.mode === 'add' ? "text-green-500" : "text-red-500")}>
                  {balanceAdjustment.mode === 'add' ? "Add Coins" : "Deduct Coins"}
                </h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Target: {balanceAdjustment.user.email || balanceAdjustment.user.id}</p>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Coins Amount</Label>
                    <div className="relative">
                       <Input 
                        type="number" 
                        value={adjAmount} 
                        onChange={e => setAdjAmount(e.target.value)} 
                        className="h-16 bg-black/40 border-white/10 rounded-2xl text-4xl font-black text-primary pl-10" 
                       />
                    </div>
                 </div>
                 <Button 
                  onClick={() => executeAdjustment(balanceAdjustment.user.id, Number(adjAmount), balanceAdjustment.mode)} 
                  disabled={isProcessing} 
                  className={cn("w-full h-16 font-black uppercase italic text-xl rounded-2xl", balanceAdjustment.mode === 'add' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}
                 >
                   {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm Action"}
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
