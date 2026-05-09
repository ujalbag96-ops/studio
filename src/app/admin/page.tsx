'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc, useAuth } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, addDoc, increment, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  Search,
  LayoutGrid,
  CreditCard,
  Gamepad2,
  Terminal,
  LogOut,
  Copy,
  Plus
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, Tournament, Registration } from '@/app/lib/types';
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
    toast({ title: "Copied!", description: "User ID copied to clipboard." });
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
        title: "Money Added Successfully!", 
        description: `Added ${amount} coins to User: ${targetId}` 
      });
      setQuickUid('');
      setBalanceAdjustment(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add money." });
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
            <UsersIcon className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-xl italic uppercase">ADMIN <span className="text-primary">PANEL</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 pt-4">
          <SidebarLink active={activeTab === 'users'} icon={<UsersIcon />} label="Users List" onClick={() => setActiveTab('users')} />
          <SidebarLink active={activeTab === 'add-money'} icon={<Plus />} label="Add Money (UID)" onClick={() => setActiveTab('add-money')} />
          <SidebarLink active={activeTab === 'tournaments'} icon={<Gamepad2 />} label="Tournaments" onClick={() => setActiveTab('tournaments')} />
          <SidebarLink active={activeTab === 'settings'} icon={<Settings />} label="Settings" onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <Button onClick={handleLogout} variant="ghost" className="w-full text-red-500 font-bold uppercase text-xs">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-10">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic">Admin <span className="text-primary">Dashboard</span></h1>
           <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 text-xs">Admin Mode Active</Badge>
        </header>

        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 h-14">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by Email or Mobile..." 
                  className="bg-transparent border-none outline-none flex-1 text-sm font-bold"
                />
             </div>

             <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] font-black uppercase">User Info & ID</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-center">Balances</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-right">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                      ) : usersData?.filter(u => 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.mobile?.includes(searchQuery) ||
                          u.id?.includes(searchQuery)
                        ).map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                           <TableCell>
                              <p className="text-sm font-bold">{u.email || u.mobile || 'No Contact'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <code className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">ID: {u.id}</code>
                                <button onClick={() => copyToClipboard(u.id)} className="text-muted-foreground hover:text-white"><Copy className="h-3 w-3" /></button>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                 <Badge variant="outline" className="text-[10px] border-primary/20 text-primary w-24 justify-center">Total: {u.coins || 0} 🪙</Badge>
                                 <Badge variant="outline" className="text-[10px] border-green-500/20 text-green-500 w-24 justify-center">Win: {u.winningBalance || 0}</Badge>
                              </div>
                           </TableCell>
                           <TableCell className="text-right">
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u })} className="h-9 text-[10px] font-black bg-primary">
                                <Plus className="h-3 w-3 mr-1" /> Add Money
                              </Button>
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'add-money' && (
           <Card className="bg-[#0a0a0f] border-primary/20 p-10 rounded-[2rem] space-y-6 max-w-xl mx-auto shadow-2xl">
              <h3 className="text-2xl font-black uppercase italic flex items-center gap-3 text-primary"><CreditCard /> Add Money by UID</h3>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground ml-1">Paste User ID (UID)</Label>
                    <Input value={quickUid} onChange={e => setQuickUid(e.target.value)} placeholder="Enter or paste UID here..." className="h-14 bg-white/5 border-white/10 font-mono text-sm" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-xs font-bold text-muted-foreground ml-1">Amount to Add</Label>
                       <Input type="number" value={quickAmount} onChange={e => setQuickAmount(e.target.value)} className="h-14 bg-white/5 border-white/10 text-2xl font-black" />
                    </div>
                    <div className="flex items-end">
                       <Button onClick={() => executeInjection(quickUid.trim(), Number(quickAmount))} disabled={isProcessing || !quickUid} className="w-full h-14 bg-primary font-black uppercase italic">
                          {isProcessing ? <Loader2 className="animate-spin" /> : "Add Money"}
                       </Button>
                    </div>
                 </div>
              </div>
           </Card>
        )}
      </main>

      {balanceAdjustment && (
        <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
           <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2rem]">
              <VisuallyHidden.Root><DialogTitle>Add Balance to User</DialogTitle></VisuallyHidden.Root>
              <DialogHeader><DialogTitle className="text-xl font-black italic uppercase text-primary">Add Money</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Target User</p>
                    <p className="text-xs font-bold truncate">{balanceAdjustment.user.email || balanceAdjustment.user.id}</p>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Enter Amount</Label>
                    <Input type="number" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} placeholder="Amount..." className="h-14 bg-black/40 text-2xl font-black" />
                 </div>
              </div>
              <DialogFooter>
                 <Button onClick={() => executeInjection(balanceAdjustment.user.id, Number(adjAmount))} disabled={isProcessing} className="w-full h-16 bg-primary font-black uppercase italic text-lg">
                   {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm & Add"}
                 </Button>
              </DialogFooter>
           </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SidebarLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all text-xs font-bold uppercase",
      active ? "bg-primary text-white italic" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
