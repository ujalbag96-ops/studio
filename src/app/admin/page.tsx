
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth } from '@/firebase';
import { collection, doc, setDoc, addDoc, increment, query, orderBy, where, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  Search,
  Gamepad2,
  LogOut,
  Plus,
  Minus,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  XCircle,
  Wallet,
  Target,
  Trophy,
  Trash2,
  Table as TableIcon,
  Flag,
  Radio,
  Zap
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { UserProfile, PredictionPoll, CricketMatch, ESportsMatch, ESportsPoll } from '@/app/lib/types';
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

  // E-Sports Form State
  const [esMatchTitle, setEsMatchTitle] = useState('');
  const [esGame, setEsGame] = useState('BGMI');
  const [esTeamA, setEsMatchTeamA] = useState('');
  const [esTeamB, setEsMatchTeamB] = useState('');

  // Poll State
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollFee, setPollFee] = useState('10');

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const esportsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'esports_matches'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  
  const { data: usersData, isLoading: usersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: esMatches } = useCollection<ESportsMatch>(esportsQuery);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  const createESportsMatch = async () => {
    if (!firestore || !esMatchTitle || !esTeamA) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(firestore, 'esports_matches'), {
        title: esMatchTitle,
        game: esGame,
        teamA: esTeamA,
        teamB: esTeamB,
        status: 'live',
        timestamp: new Date().toISOString()
      });
      setEsMatchTitle('');
      setEsMatchTeamA('');
      setEsMatchTeamB('');
      toast({ title: "E-SPORTS SIGNAL DEPLOYED" });
    } catch (e) {
      toast({ variant: "destructive", title: "DEPLOYMENT FAILED" });
    } finally {
      setIsProcessing(false);
    }
  };

  const createLivePoll = async () => {
    if (!firestore || !selectedMatchId || !pollQuestion) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(firestore, 'esports_polls'), {
        matchId: selectedMatchId,
        question: pollQuestion,
        optionA: 'YES',
        optionB: 'NO',
        entryFee: Number(pollFee),
        totalPool: 0,
        status: 'open',
        timestamp: new Date().toISOString()
      });
      setPollQuestion('');
      toast({ title: "LIVE POLL DEPLOYED" });
    } catch (e) {
      toast({ variant: "destructive", title: "POLL FAILED" });
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
          <SidebarLink active={activeTab === 'esports'} icon={<Radio />} label="E-Sports Control" onClick={() => setActiveTab('esports')} />
          <SidebarLink active={activeTab === 'cricket'} icon={<Flag />} label="Cricket Arena" onClick={() => setActiveTab('cricket')} />
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-6 py-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-all font-black uppercase text-xs">
            <LogOut className="h-4 w-4" /> Logout Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-10">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic">WinZO <span className="text-primary">Admin</span></h1>
           <Badge className="bg-primary/20 text-primary border-none font-bold px-4 py-1.5 text-xs uppercase">Authorized Session</Badge>
        </header>

        {activeTab === 'users' && (
          <div className="space-y-6">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 h-14">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by Email or UID..." className="bg-transparent border-none outline-none flex-1 text-sm font-bold text-white" />
             </div>
             <Card className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="text-[10px] font-black uppercase px-8">User Details</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-center">Balances</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-right px-8">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {usersLoading ? (
                        <TableRow><TableCell colSpan={3} className="py-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" /></TableCell></TableRow>
                      ) : filteredUsers.map(u => (
                        <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="px-8 py-6">
                              <p className="text-sm font-bold text-white">{u.email || 'Anonymous'}</p>
                              <code className="text-[9px] font-mono text-primary/60">UID: {u.id}</code>
                              <div className="text-[9px] text-muted-foreground font-bold mt-1">IP: {u.lastIp || 'N/A'}</div>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-1">
                                 <Badge variant="outline" className="text-[8px] border-blue-500/20 text-blue-500 w-24 justify-between">DEP: {u.depositBalance?.toFixed(0)}</Badge>
                                 <Badge variant="outline" className="text-[8px] border-green-500/20 text-green-500 w-24 justify-between">WIN: {u.winningBalance?.toFixed(0)}</Badge>
                              </div>
                           </TableCell>
                           <TableCell className="text-right px-8 space-x-2">
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u, mode: 'add' })} className="h-8 text-[9px] font-black bg-green-600 rounded-lg px-3">ADD</Button>
                              <Button size="sm" onClick={() => setBalanceAdjustment({ user: u, mode: 'deduct' })} className="h-8 text-[9px] font-black bg-red-600 rounded-lg px-3">DEDUCT</Button>
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'esports' && (
          <div className="grid lg:grid-cols-2 gap-10">
            <Card className="bg-[#0a0a0f] border-primary/20 rounded-2xl p-8 space-y-6">
               <h3 className="text-xl font-black uppercase italic text-primary flex items-center gap-2"><Radio className="h-5 w-5" /> Deploy E-Sports Match</h3>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase">Match Title</Label>
                     <Input value={esMatchTitle} onChange={e => setEsMatchTitle(e.target.value)} placeholder="e.g. BGMI Pro Scrims Finals" className="bg-black border-white/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase">Game Sector</Label>
                       <Select value={esGame} onValueChange={setEsGame}>
                          <SelectTrigger className="bg-black border-white/10 h-12">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#121216] border-white/10 text-white">
                             <SelectItem value="BGMI">BGMI</SelectItem>
                             <SelectItem value="Free Fire">FREE FIRE</SelectItem>
                             <SelectItem value="Valorant">VALORANT</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase">Team A</Label>
                       <Input value={esTeamA} onChange={e => setEsMatchTeamA(e.target.value)} placeholder="Team Alpha" className="bg-black border-white/10" />
                    </div>
                  </div>
                  <Button onClick={createESportsMatch} disabled={isProcessing} className="w-full bg-primary font-black uppercase h-14 rounded-xl">
                    {isProcessing ? <Loader2 className="animate-spin" /> : "LAUNCH LIVE FEED"}
                  </Button>
               </div>
            </Card>

            <Card className="bg-[#0a0a0f] border-amber-500/20 rounded-2xl p-8 space-y-6">
               <h3 className="text-xl font-black uppercase italic text-amber-500 flex items-center gap-2"><Zap className="h-5 w-5" /> Deploy Live Poll</h3>
               <div className="space-y-4">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase">Select Active Match</Label>
                     <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                        <SelectTrigger className="bg-black border-white/10 h-12">
                           <SelectValue placeholder="Select Match" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#121216] border-white/10 text-white">
                           {esMatches?.map(m => (
                             <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase">Poll Question</Label>
                     <Input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="e.g. Will Team A wipe the next squad?" className="bg-black border-white/10" />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase">Entry Fee (Coins)</Label>
                     <Input type="number" value={pollFee} onChange={e => setPollFee(e.target.value)} className="bg-black border-white/10" />
                  </div>
                  <Button onClick={createLivePoll} disabled={isProcessing || !selectedMatchId} className="w-full bg-amber-500 text-black font-black uppercase h-14 rounded-xl">
                    {isProcessing ? <Loader2 className="animate-spin" /> : "PUSH LIVE POLL"}
                  </Button>
               </div>
            </Card>
          </div>
        )}
      </main>

      {balanceAdjustment && (
        <Dialog open={!!balanceAdjustment} onOpenChange={() => setBalanceAdjustment(null)}>
           <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2rem]">
              <VisuallyHidden.Root><DialogTitle>Adjust Balance</DialogTitle></VisuallyHidden.Root>
              <div className="p-4 text-center space-y-6">
                <h3 className={cn("text-xl font-black uppercase", balanceAdjustment.mode === 'add' ? "text-green-500" : "text-red-500")}>
                  {balanceAdjustment.mode === 'add' ? "Credit Coins" : "Debit Coins"}
                </h3>
                <Input type="number" value={adjAmount} onChange={e => setAdjAmount(e.target.value)} className="h-16 bg-black border-white/10 rounded-xl text-3xl font-black text-center" />
                <Button onClick={() => executeAdjustment(balanceAdjustment.user.id, Number(adjAmount), balanceAdjustment.mode)} disabled={isProcessing} className="w-full h-14 bg-primary font-black">
                   {isProcessing ? <Loader2 className="animate-spin" /> : "CONFIRM ACTION"}
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
      "w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all text-[10px] font-black uppercase",
      active ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:bg-white/5"
    )}>
      {icon} <span>{label}</span>
    </button>
  );
}
