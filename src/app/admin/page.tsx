
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
  Briefcase,
  Target,
  Terminal
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { AppSettings, UserProfile, Tournament, Registration } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'users' | 'overview' | 'events' | 'system';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const { auth } = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceAdjustment, setBalanceAdjustment] = useState<{ user: UserProfile; bucket: string } | null>(null);
  const [adjAmount, setAdjAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [quickUid, setQuickUid] = useState('');
  const [quickAmount, setQuickAmount] = useState('500');

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const tournamentsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'tournaments') : null, [firestore, isAdminUser]);
  const settingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'settings', 'global') : null, [firestore, isAdminUser]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: tournamentsData } = useCollection<Tournament>(tournamentsQuery);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      toast({ title: "ADMIN SESSION TERMINATED" });
      router.push('/login');
    }
  };

  const handleRefundTournament = async (t: Tournament) => {
    if (!firestore || !isAdminUser || isProcessing) return;
    setIsProcessing(true);
    
    try {
      const regQuery = query(collection(firestore, 'registrations'), where('tournamentId', '==', t.id));
      const regSnap = await getDocs(regQuery);
      
      let refundCount = 0;
      for (const regDoc of regSnap.docs) {
        const reg = regDoc.data() as Registration;
        const userRef = doc(firestore, 'users', reg.userId);
        const amount = t.entryFee;

        await updateDoc(userRef, {
          depositBalance: increment(amount),
          coins: increment(amount)
        });

        await addDoc(collection(firestore, 'users', reg.userId, 'ledger'), {
          type: 'refund',
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Refund for Tournament: ${t.name} (Arena Protocol)`
        });
        
        refundCount++;
      }

      await updateDoc(doc(firestore, 'tournaments', t.id), { status: 'cancelled', isRefunded: true });
      toast({ 
        title: "ARENA REFUND COMPLETE", 
        description: `SUCCESSFULLY REVERTED ${refundCount} PARTICIPANT BALANCES.` 
      });
    } catch (e) {
      toast({ variant: "destructive", title: "REFUND PROTOCOL FAILED" });
    } finally {
      setIsProcessing(false);
    }
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
        description: "Administrative Capital Injection"
      });

      toast({ 
        title: "INJECTION PROTOCOL SUCCESSFUL", 
        description: `CREDITED ${amount} COINS TO WARRIOR: ${targetId}` 
      });
      setQuickUid('');
    } catch (e) {
      toast({ variant: "destructive", title: "INJECTION SIGNAL FAILED" });
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
          <Briefcase className="h-8 w-8 text-primary" />
          <span className="font-black text-xl italic uppercase">ADMIN<span className="text-primary">CORE</span></span>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 pt-4">
          <SidebarLink active={activeTab === 'users'} icon={<UsersIcon />} label="WARRIOR DIRECTORY" onClick={() => setActiveTab('users')} />
          <SidebarLink active={activeTab === 'overview'} icon={<LayoutGrid />} label="INJECTION HUB" onClick={() => setActiveTab('overview')} />
          <SidebarLink active={activeTab === 'events'} icon={<Target />} label="ARENA CONTROL" onClick={() => setActiveTab('events')} />
          <SidebarLink active={activeTab === 'system'} icon={<Settings />} label="SYSTEM CONFIG" onClick={() => setActiveTab('system')} />
        </nav>

        <div className="p-6 border-t border-white/5">
          <Button onClick={handleLogout} variant="ghost" className="w-full text-red-500 font-black uppercase text-[10px]">
            TERMINATE SESSION
          </Button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-10">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
           <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] px-4 py-1.5">PROTOCOL 7.5 ACTIVE</Badge>
        </header>

        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 h-12">
                <Search className="h-4 w-4 text-muted-foreground mr-3" />
                <input 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="SCAN USER DATABASE..." 
                  className="bg-transparent border-none outline-none flex-1 text-xs font-black uppercase tracking-widest"
                />
             </div>

             <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-3xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[9px] font-black uppercase">Warrior Identity</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-center">Wallet Matrix</TableHead>
                        <TableHead className="text-[9px] font-black uppercase text-right">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                      ) : usersData?.filter(u => u.email?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5">
                           <TableCell>
                              <p className="text-xs font-black uppercase">{u.email || u.mobile}</p>
                              <p className="text-[8px] font-mono text-muted-foreground">{u.id}</p>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                 <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">{u.coins || 0} 🪙</Badge>
                                 <Badge variant="outline" className="text-[8px] border-green-500/20 text-green-500">W: {u.winningBalance || 0}</Badge>
                              </div>
                           </TableCell>
                           <TableCell className="text-right">
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u, bucket: 'winningBalance' })} className="h-7 text-[8px] font-black bg-primary">ADJUST</Button>
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="grid gap-6">
             <h3 className="text-xl font-black uppercase italic text-primary">Strategic Arena Control</h3>
             {tournamentsData?.map(t => (
               <Card key={t.id} className="bg-[#0a0a0f] border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
                  <div className="flex items-center gap-6">
                     <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/5">
                        <img src={t.banner} className="h-full w-full object-cover" />
                     </div>
                     <div>
                        <h4 className="text-lg font-black uppercase italic">{t.name}</h4>
                        <div className="flex gap-2 mt-1">
                           <Badge className="text-[8px] font-black uppercase">{t.status}</Badge>
                           <Badge variant="outline" className="text-[8px] font-black">{t.entryFee} 🪙</Badge>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-3">
                     {t.status !== 'cancelled' && (
                        <Button 
                          onClick={() => handleRefundTournament(t)} 
                          disabled={isProcessing}
                          variant="destructive" 
                          className="h-10 text-[9px] font-black uppercase px-6"
                        >
                          {isProcessing ? <Loader2 className="animate-spin" /> : "CRASH & REFUND"}
                        </Button>
                     )}
                     <Button variant="outline" className="h-10 text-[9px] font-black uppercase px-6">EDIT ROOM</Button>
                  </div>
               </Card>
             ))}
          </div>
        )}

        {activeTab === 'overview' && (
           <Card className="bg-[#0a0a0f] border-primary/20 p-10 rounded-[3rem] space-y-6 max-w-xl mx-auto shadow-2xl">
              <h3 className="text-2xl font-black uppercase italic flex items-center gap-3 text-primary"><Terminal /> Tactical Injection</h3>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground ml-1">TARGET WARRIOR ID</Label>
                    <Input value={quickUid} onChange={e => setQuickUid(e.target.value)} placeholder="PASTE UID..." className="h-14 bg-white/5 border-white/10 font-mono text-xs" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black text-muted-foreground ml-1">VOLUME</Label>
                       <Input type="number" value={quickAmount} onChange={e => setQuickAmount(e.target.value)} className="h-14 bg-white/5 border-white/10 text-xl font-black" />
                    </div>
                    <div className="flex items-end">
                       <Button onClick={() => executeInjection(quickUid.trim(), Number(quickAmount))} disabled={isProcessing || !quickUid} className="w-full h-14 bg-primary font-black uppercase italic">
                          {isProcessing ? <Loader2 className="animate-spin" /> : "RUN INJECTION"}
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
              <VisuallyHidden.Root><DialogTitle>Capital Allocation</DialogTitle></VisuallyHidden.Root>
              <DialogHeader><DialogTitle className="text-xl font-black italic uppercase">Capital Sync</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                 <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">WARRIOR</p>
                    <p className="text-xs font-bold">{balanceAdjustment.user.email}</p>
                 </div>
                 <Input type="number" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} placeholder="Volume (+/-)" className="h-14 bg-black/40 text-2xl font-black" />
              </div>
              <DialogFooter>
                 <Button onClick={() => {executeInjection(balanceAdjustment.user.id, Number(adjAmount)); setBalanceAdjustment(null);}} disabled={isProcessing} className="w-full h-14 bg-primary font-black uppercase italic">
                   {isProcessing ? <Loader2 className="animate-spin" /> : "EXECUTE SYNC"}
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
      "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-xl shadow-primary/20 italic" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
