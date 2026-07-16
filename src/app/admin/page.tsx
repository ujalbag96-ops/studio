
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, addDoc, increment, query, orderBy, deleteDoc, writeBatch, getDocs, where, limit, onSnapshot, runTransaction } from 'firebase/firestore';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  ShieldCheck,
  Wallet,
  Zap,
  Smartphone,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  Flag,
  Target,
  Monitor,
  Layout,
  Disc,
  ShieldAlert,
  Power,
  Gamepad2,
  Server,
  Lock,
  ExternalLink,
  CreditCard,
  Image as ImageIcon,
  Video,
  Fingerprint,
  CheckCircle2,
  Activity,
  Search,
  Megaphone,
  Mail,
  Copy,
  Ticket,
  Send,
  MessageSquare,
  LifeBuoy,
  AlertTriangle,
  Gavel,
  Trophy,
  Dices
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'support' | 'settlements' | 'broadcast' | 'settings' | 'lottery'>('settlements');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Support State
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyInput, setReplyInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const ticketsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'support_tickets'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const settlementsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'cricket_over_pools'), where('status', '==', 'pending'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const lotteryResultsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'lottery_results'), orderBy('timestamp', 'desc'), limit(10)) : null, [firestore, isAdminUser]);
  
  const { data: payoutsData } = useCollection<any>(payoutsQuery);
  const { data: ticketsData } = useCollection<any>(ticketsQuery);
  const { data: settlementsData } = useCollection<any>(settlementsQuery);
  const { data: lotteryResults } = useCollection<any>(lotteryResultsQuery);

  const handleRunLotteryDraw = async () => {
    setIsProcessing('lottery');
    try {
      const res = await fetch('/api/lottery/draw', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast({ title: "JACKPOT DRAWN", description: `Winning Number: ${data.winningNumber}. Prize: ₹${data.prizeDistributed}` });
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Draw Failed", description: e.message });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSettleOver = async (poolId: string, result: 'YES' | 'NO') => {
    if (!firestore || isProcessing) return;
    setIsProcessing(poolId);

    try {
      await runTransaction(firestore, async (transaction) => {
        const poolRef = doc(firestore, 'cricket_over_pools', poolId);
        const poolSnap = await transaction.get(poolRef);
        if (!poolSnap.exists()) throw "Pool Missing";
        const pool = poolSnap.data();

        if (pool.status !== 'pending') throw "Already Settled";

        const entriesQuery = query(collection(firestore, 'cricket_over_pools', poolId, 'entries'));
        const entriesSnap = await getDocs(entriesQuery);

        const totalPool = pool.totalPool;
        const winnerPool = result === 'YES' ? pool.yesPool : pool.noPool;
        const platformRake = 0.15;
        const netPool = totalPool * (1 - platformRake);

        if (winnerPool > 0) {
          for (const entryDoc of entriesSnap.docs) {
            const entry = entryDoc.data();
            if (entry.choice === result) {
              const winAmount = (entry.amount / winnerPool) * netPool;
              const userRef = doc(firestore, 'users', entry.userId);
              
              transaction.update(userRef, {
                winningBalance: increment(winAmount),
                coins: increment(winAmount)
              });

              const ledgerRef = doc(collection(firestore, 'users', entry.userId, 'ledger'));
              transaction.set(ledgerRef, {
                type: 'prediction_win',
                amount: winAmount,
                date: new Date().toISOString().split('T')[0],
                status: 'completed',
                description: `Cricket Over Win: Over #${pool.overNumber}`
              });
            }
          }
        }

        transaction.update(poolRef, { 
          status: 'settled', 
          result: result,
          settledAt: new Date().toISOString()
        });
      });

      toast({ title: "POOL SETTLED", description: `Result ${result} distributed with 15% platform rake.` });
    } catch (e) {
      toast({ variant: "destructive", title: "Settlement Error", description: String(e) });
    } finally {
      setIsProcessing(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black p-10 uppercase italic">Access Denied: Master Authorization Required</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 flex items-center gap-4 border-b border-white/5 bg-primary/5">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-black text-xl italic uppercase tracking-tighter">ARENA <span className="text-primary">ADMIN</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          <AdminLink active={activeTab === 'settlements'} icon={<Gavel />} label="Live Over Sync" onClick={() => setActiveTab('settlements')} />
          <AdminLink active={activeTab === 'lottery'} icon={<Dices />} label="Jackpot Draw" onClick={() => setActiveTab('lottery')} />
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout & Shop" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'support'} icon={<LifeBuoy />} label="Support Node" onClick={() => setActiveTab('support')} />
          <AdminLink active={activeTab === 'broadcast'} icon={<Megaphone />} label="Broadcast News" onClick={() => setActiveTab('broadcast')} />
          <AdminLink active={activeTab === 'settings'} icon={<Settings />} label="Global System" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] mt-1">Operational Control Active</p>
           </div>
        </header>

        {activeTab === 'lottery' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <Card className="bg-[#0a0a0f] border-amber-500/20 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border-2">
                 <div className="space-y-4">
                    <h3 className="text-3xl font-black uppercase italic">Lottery <span className="text-amber-500">Adjudicator</span></h3>
                    <p className="text-sm text-muted-foreground font-medium max-w-md">
                       Manually trigger the midnight jackpot draw. This will generate a winning number and distribute pool share.
                    </p>
                 </div>
                 <Button 
                   onClick={handleRunLotteryDraw} 
                   disabled={isProcessing === 'lottery'}
                   className="h-20 px-12 bg-amber-600 hover:bg-amber-500 text-white font-black uppercase italic text-lg rounded-2xl shadow-xl shadow-amber-600/20"
                 >
                    {isProcessing === 'lottery' ? <Loader2 className="animate-spin" /> : <><Trophy className="mr-3" /> EXECUTE DRAW</>}
                 </Button>
              </Card>

              <div className="space-y-6">
                 <h4 className="text-xl font-black uppercase italic tracking-tighter">Recent Draw <span className="text-primary">Archives</span></h4>
                 <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden">
                    <Table>
                       <TableHeader className="bg-white/5">
                          <TableRow className="border-white/5">
                             <TableHead className="text-[9px] font-black uppercase">Draw Date</TableHead>
                             <TableHead className="text-[9px] font-black uppercase text-center">Winning #</TableHead>
                             <TableHead className="text-[9px] font-black uppercase text-center">Participants</TableHead>
                             <TableHead className="text-[9px] font-black uppercase text-right">Pool Paid</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {lotteryResults?.map(res => (
                             <TableRow key={res.id} className="border-white/5 hover:bg-white/5">
                                <TableCell className="text-xs font-bold">{new Date(res.timestamp).toLocaleDateString()}</TableCell>
                                <TableCell className="text-center font-black text-amber-500 text-lg">{res.winningNumber}</TableCell>
                                <TableCell className="text-center text-xs">{res.participants}</TableCell>
                                <TableCell className="text-right font-black text-green-500">₹{res.poolAmount}</TableCell>
                             </TableRow>
                          ))}
                       </TableBody>
                    </Table>
                 </Card>
              </div>
           </div>
        )}

        {activeTab === 'settlements' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
                <Badge className="bg-blue-600 text-white font-black italic px-4 py-1.5 rounded-lg animate-pulse">LIVE DATA FEED</Badge>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Over-by-over verification active</p>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {settlementsData?.map(pool => (
                   <Card key={pool.id} className="bg-[#0a0a0f] border-white/10 rounded-[2.5rem] overflow-hidden group shadow-2xl transition-all hover:border-primary/40">
                      <div className="p-8 space-y-6">
                         <div className="flex justify-between items-start">
                            <div>
                               <h3 className="text-2xl font-black uppercase italic text-white">Over #{pool.overNumber}</h3>
                               <p className="text-xs font-bold text-muted-foreground uppercase">{pool.question}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-muted-foreground uppercase">Pool Volume</p>
                               <p className="text-2xl font-black text-primary italic">{pool.totalPool} 🪙</p>
                            </div>
                         </div>
                         {/* ... Action buttons same as before ... */}
                         <div className="grid grid-cols-2 gap-4 pt-4">
                            <Button onClick={() => handleSettleOver(pool.id, 'YES')} disabled={!!isProcessing} className="h-16 bg-green-600 hover:bg-green-500 text-white font-black uppercase italic rounded-2xl shadow-xl">
                               APPROVE YES
                            </Button>
                            <Button onClick={() => handleSettleOver(pool.id, 'NO')} disabled={!!isProcessing} className="h-16 bg-red-600 hover:bg-red-500 text-white font-black uppercase italic rounded-2xl shadow-xl">
                               APPROVE NO
                            </Button>
                         </div>
                      </div>
                   </Card>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all text-[12px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-2xl italic border border-white/10" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      {icon} <span>{label}</span>
    </button>
  );
}
