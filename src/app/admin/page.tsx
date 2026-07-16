
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
  AlertTriangle
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
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'support' | 'ads' | 'settings' | 'broadcast'>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Support State
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyInput, setReplyInput] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const ticketsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'support_tickets'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const disputesQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payment_disputes'), where('status', '==', 'pending')) : null, [firestore, isAdminUser]);
  
  const { data: payoutsData } = useCollection<any>(payoutsQuery);
  const { data: ticketsData } = useCollection<any>(ticketsQuery);
  const { data: disputesData } = useCollection<any>(disputesQuery);

  // Real-time chat listener for selected ticket
  useEffect(() => {
    if (!firestore || !selectedTicket) return;
    const q = query(collection(firestore, 'support_tickets', selectedTicket.id, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
    return () => unsubscribe();
  }, [firestore, selectedTicket]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selectedTicket || !replyInput.trim()) return;
    try {
      await addDoc(collection(firestore, 'support_tickets', selectedTicket.id, 'messages'), {
        senderId: 'admin',
        text: replyInput,
        timestamp: new Date().toISOString()
      });
      await updateDoc(doc(firestore, 'support_tickets', selectedTicket.id), { status: 'open' });
      setReplyInput('');
    } catch (e) {
      toast({ variant: "destructive", title: "Send Failed" });
    }
  };

  const handleResolveTicket = async (id: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'support_tickets', id), { status: 'resolved' });
    toast({ title: "TICKET RESOLVED" });
  };

  const handleManualCreditDispute = async (dispute: any) => {
     if (!firestore || !dispute || isProcessing) return;
     setIsProcessing(dispute.id);
     
     try {
        await runTransaction(firestore, async (transaction) => {
           const userRef = doc(firestore, 'users', dispute.userId);
           const userSnap = await transaction.get(userRef);
           if (!userSnap.exists()) throw "User Missing";

           const coinAmount = dispute.amount * 10;
           
           // 1. Update Wallet
           transaction.update(userRef, {
              depositBalance: increment(coinAmount),
              coins: increment(coinAmount)
           });

           // 2. Log Ledger
           const ledgerRef = doc(collection(firestore, 'users', dispute.userId, 'ledger'));
           transaction.set(ledgerRef, {
              type: 'deposit',
              amount: coinAmount,
              date: new Date().toISOString().split('T')[0],
              status: 'completed',
              description: `Admin Verified Dispute: UTR ${dispute.utrId}`
           });

           // 3. Resolve Dispute Status
           const disputeRef = doc(firestore, 'payment_disputes', dispute.id);
           transaction.update(disputeRef, { status: 'approved' });

           // 4. Update linked ticket if any
           if (selectedTicket && selectedTicket.userId === dispute.userId) {
              const ticketRef = doc(firestore, 'support_tickets', selectedTicket.id);
              transaction.update(ticketRef, { status: 'resolved' });
           }
        });

        toast({ title: "BALANCE CREDITED", description: "Transaction verified and assets synced." });
     } catch (e) {
        toast({ variant: "destructive", title: "Sync Failure", description: String(e) });
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

        {activeTab === 'support' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500 h-[70vh]">
              <div className="flex flex-col gap-6">
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-1/2">
                   <div className="p-6 bg-white/5 border-b border-white/5">
                      <h3 className="text-sm font-black uppercase italic flex items-center gap-2"><LifeBuoy className="h-4 w-4 text-primary" /> Active Tickets</h3>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {ticketsData?.map(t => (
                         <button 
                          key={t.id} 
                          onClick={() => setSelectedTicket(t)}
                          className={cn(
                            "w-full text-left p-4 rounded-xl border transition-all space-y-2",
                            selectedTicket?.id === t.id ? "bg-primary/10 border-primary/40 shadow-lg" : "bg-black/40 border-white/5 hover:bg-white/5"
                          )}
                         >
                            <div className="flex justify-between items-start">
                               <Badge className={cn("text-[8px] font-black uppercase", t.status === 'open' ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground")}>{t.status}</Badge>
                               <span className="text-[8px] font-bold text-muted-foreground">{new Date(t.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <p className="text-[10px] font-black text-white truncate uppercase">{t.userContact || 'Anonymous Warrior'}</p>
                            <p className="text-[9px] text-muted-foreground line-clamp-1">{t.description}</p>
                         </button>
                      ))}
                   </div>
                </Card>

                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-1/2">
                   <div className="p-6 bg-amber-500/10 border-b border-white/5">
                      <h3 className="text-sm font-black uppercase italic flex items-center gap-2 text-amber-500"><AlertTriangle className="h-4 w-4" /> UPI Disputes</h3>
                   </div>
                   <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {disputesData?.map(d => (
                         <div key={d.id} className="w-full text-left p-4 rounded-xl border border-white/5 bg-black/40 space-y-3">
                            <div className="flex justify-between items-start">
                               <p className="text-[10px] font-black text-white uppercase italic">₹{d.amount}</p>
                               <button onClick={() => setShowReceiptModal(d.receiptDataUri)} className="text-[8px] font-black text-primary uppercase hover:underline">View Receipt</button>
                            </div>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase">UTR: {d.utrId}</p>
                            <Button onClick={() => handleManualCreditDispute(d)} disabled={!!isProcessing} className="w-full h-8 bg-amber-500 hover:bg-amber-600 text-black font-black text-[8px] uppercase rounded-lg">
                               {isProcessing === d.id ? <Loader2 className="animate-spin h-3 w-3" /> : 'MANUALLY CREDIT BALANCE'}
                            </Button>
                         </div>
                      ))}
                   </div>
                </Card>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-6">
                 {selectedTicket ? (
                    <Card className="flex-1 bg-[#0a0a0f] border-white/5 rounded-[2rem] flex flex-col overflow-hidden">
                       <div className="p-6 bg-white/5 border-b border-white/5 flex items-center justify-between">
                          <div>
                             <h4 className="text-sm font-black uppercase italic text-white">{selectedTicket.userContact}</h4>
                             <p className="text-[9px] font-bold text-muted-foreground uppercase">{selectedTicket.type === 'recovery' ? 'IDENTITY RECOVERY' : 'DISPUTE RESOLUTION'}</p>
                          </div>
                          <div className="flex gap-2">
                             <Button onClick={() => handleResolveTicket(selectedTicket.id)} variant="ghost" className="h-10 text-green-500 hover:bg-green-500/10 font-black text-[10px] uppercase">Mark Resolved</Button>
                          </div>
                       </div>
                       <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
                          <div className="bg-white/5 p-5 rounded-2xl border border-white/5 max-w-[80%] space-y-2">
                             <p className="text-[10px] font-black text-primary uppercase">Initial Signal</p>
                             <p className="text-xs font-medium leading-relaxed">{selectedTicket.description}</p>
                          </div>
                          {messages.map(m => (
                             <div key={m.id} className={cn("flex", m.senderId === 'admin' ? "justify-end" : "justify-start")}>
                                <div className={cn("p-4 rounded-2xl max-w-[70%] text-xs font-medium shadow-xl", m.senderId === 'admin' ? "bg-primary text-white rounded-tr-none" : "bg-black/60 border border-white/10 rounded-tl-none")}>
                                   {m.text}
                                </div>
                             </div>
                          ))}
                       </div>
                       <form onSubmit={handleSendReply} className="p-6 border-t border-white/5 flex gap-3">
                          <Input value={replyInput} onChange={e => setReplyInput(e.target.value)} placeholder="Type tactical response..." className="h-12 bg-black border-white/10 rounded-xl" />
                          <Button type="submit" className="h-12 w-12 rounded-xl bg-primary"><Send className="h-4 w-4" /></Button>
                       </form>
                    </Card>
                 ) : (
                    <div className="flex-1 border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-4">
                       <MessageSquare className="h-12 w-12 text-muted-foreground opacity-20" />
                       <p className="text-[10px] font-black uppercase text-muted-foreground italic">Select a signal to begin interception</p>
                    </div>
                 )}
              </div>
           </div>
        )}

        <Dialog open={!!showReceiptModal} onOpenChange={() => setShowReceiptModal(null)}>
           <DialogContent className="bg-black border-white/10 max-w-2xl">
              <DialogHeader>
                 <DialogTitle className="text-white uppercase italic font-black">Digital Receipt Evidence</DialogTitle>
              </DialogHeader>
              <div className="p-4 flex items-center justify-center">
                 {showReceiptModal && <img src={showReceiptModal} className="max-h-[70vh] w-auto rounded-xl shadow-2xl" alt="Receipt" />}
              </div>
           </DialogContent>
        </Dialog>

        {/* ... Other Tabs remain same as before ... */}
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
