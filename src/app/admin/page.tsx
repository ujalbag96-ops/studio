
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, setDoc, addDoc, increment, query, orderBy, deleteDoc, writeBatch, getDocs, where, limit, runTransaction } from 'firebase/firestore';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  ShieldCheck,
  Wallet,
  Zap,
  Plus,
  Trash2,
  Trophy,
  Dices,
  Film,
  Video,
  ImageIcon,
  Layout,
  ExternalLink,
  Save,
  Megaphone,
  LifeBuoy,
  Gavel,
  CloudRain,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  CheckSquare
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PayoutRequest } from '../lib/types';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'movies' | 'settlements' | 'lottery' | 'weather'>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Movie Form State
  const [movieForm, setMovieForm] = useState({ title: '', poster: '', videoUrl: '', category: 'Action' });

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const moviesQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'movies'), orderBy('createdAt', 'desc')) : null, [firestore, isAdminUser]);
  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore, isAdminUser]);

  const { data: moviesData } = useCollection<any>(moviesQuery);
  const { data: payoutsData } = useCollection<PayoutRequest>(payoutsQuery);

  const handleAddMovie = async () => {
    if (!firestore || !movieForm.title || !movieForm.videoUrl) {
      toast({ variant: "destructive", title: "FIELDS REQUIRED" });
      return;
    }
    setIsProcessing('add_movie');
    try {
      await addDoc(collection(firestore, 'movies'), {
        ...movieForm,
        createdAt: new Date().toISOString()
      });
      toast({ title: "MOVIE SIGNAL DEPLOYED", description: `${movieForm.title} is now active.` });
      setMovieForm({ title: '', poster: '', videoUrl: '', category: 'Action' });
    } catch (e) {
      toast({ variant: "destructive", title: "Deployment Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleMarkPaid = async (payout: PayoutRequest) => {
    if (!firestore) return;
    setIsProcessing(payout.id);
    try {
      await updateDoc(doc(firestore, 'payouts', payout.id), {
        status: 'completed',
        processedAt: new Date().toISOString()
      });

      // Send Success Notification to User
      await addDoc(collection(firestore, 'notifications'), {
        userId: payout.userId,
        title: '💰 PAYMENT SUCCESSFUL',
        body: `Your payout of ₹${payout.netAmount.toFixed(2)} via ${payout.method} has been verified and sent. Check your account.`,
        timestamp: new Date().toISOString(),
        type: 'payout'
      });

      toast({ title: "PAYOUT VERIFIED", description: "Request marked as completed and notification sent." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const openQuickPay = (payout: PayoutRequest) => {
    if (payout.method !== 'UPI') {
      toast({ title: "Only UPI supports Deep-Linking" });
      return;
    }
    // Deep Link Logic: upi://pay?pa=[UPI_ID]&am=[AMOUNT]&tn=BracketBattlesPayout
    const upiLink = `upi://pay?pa=${payout.destination}&am=${payout.netAmount.toFixed(2)}&tn=BracketBattlesPayout`;
    window.open(upiLink, '_blank');
    toast({ title: "UPI App Triggered", description: "Processing fast payment link." });
  };

  const handleDeleteMovie = async (id: string) => {
    if (!firestore) return;
    if (!confirm("Are you sure? This will purge the stream signal from the arena.")) return;
    try {
      await deleteDoc(doc(firestore, 'movies', id));
      toast({ title: "SIGNAL PURGED" });
    } catch (e) {
      toast({ variant: "destructive", title: "Purge Failed" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black p-10 uppercase italic">Access Denied: Master Authorization Required</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 flex items-center gap-4 border-b border-white/5 bg-primary/5">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-black text-xl italic uppercase tracking-tighter">ARENA <span className="text-primary">MASTER</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Terminal" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'movies'} icon={<Film />} label="Movie Intelligence" onClick={() => setActiveTab('movies')} />
          <AdminLink active={activeTab === 'weather'} icon={<CloudRain />} label="Weather Station" onClick={() => setActiveTab('weather')} />
          <AdminLink active={activeTab === 'settlements'} icon={<Gavel />} label="Match Settlements" onClick={() => setActiveTab('settlements')} />
          <AdminLink active={activeTab === 'lottery'} icon={<Dices />} label="Jackpot Control" onClick={() => setActiveTab('lottery')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] mt-1">Industrial Operational Control</p>
           </div>
        </header>

        {activeTab === 'withdrawals' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Withdrawal <span className="text-primary">Requests</span></h3>
                <div className="flex gap-2">
                   <Badge className="bg-primary/20 text-primary border-none text-[9px] font-black uppercase px-4">Cycle: Sunday Audit</Badge>
                   <Badge className="bg-green-500/20 text-green-500 border-none text-[9px] font-black uppercase px-4">Express: Verified 24h</Badge>
                </div>
             </div>

             <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                         <TableHead className="text-[9px] font-black uppercase">User Info / Priority</TableHead>
                         <TableHead className="text-[9px] font-black uppercase">Method/Destination</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-center">Security Check</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-right">Net Amount</TableHead>
                         <TableHead className="text-[9px] font-black uppercase text-right">Actions</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {payoutsData?.map(p => (
                         <TableRow key={p.id} className={cn("border-white/5 hover:bg-white/5", p.isExpress && "bg-primary/5")}>
                            <TableCell>
                               <div className="space-y-1">
                                  <p className="text-sm font-black text-white">{p.userEmail?.split('@')[0]}</p>
                                  {p.isExpress ? (
                                     <Badge className="bg-primary text-white text-[7px] font-black uppercase italic px-2">⚡ EXPRESS SIGNAL</Badge>
                                  ) : (
                                     <Badge variant="outline" className="text-[7px] border-white/10 font-black uppercase px-2">STANDARD</Badge>
                                  )}
                               </div>
                            </TableCell>
                            <TableCell>
                               <Badge variant="outline" className="text-[9px] border-white/10 uppercase font-black mb-1">{p.method}</Badge>
                               <p className="text-[10px] font-bold text-primary truncate max-w-[150px]">{p.destination}</p>
                            </TableCell>
                            <TableCell className="text-center">
                               <div className="flex flex-col items-center gap-1">
                                  <Badge className={cn("text-[9px] border-none", (p.tasksCompleted || 0) >= 5 ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500")}>
                                     Tasks: {p.tasksCompleted || 0}
                                  </Badge>
                                  {(p.tasksCompleted || 0) < 5 && <p className="text-[8px] font-black text-red-400 uppercase italic">Revenue High Risk</p>}
                               </div>
                            </TableCell>
                            <TableCell className="text-right">
                               <p className="text-lg font-black text-white italic">₹{p.netAmount.toFixed(2)}</p>
                               <p className="text-[9px] text-muted-foreground uppercase">Fee: ₹{p.fee?.toFixed(2) || '0.00'}</p>
                            </TableCell>
                            <TableCell className="text-right">
                               {p.status === 'pending' ? (
                                  <div className="flex justify-end gap-2">
                                     {p.method === 'UPI' && (
                                        <Button 
                                          variant="outline"
                                          onClick={() => openQuickPay(p)}
                                          className="h-10 px-4 border-primary/20 text-primary hover:bg-primary/10 rounded-xl font-black text-[9px] uppercase"
                                        >
                                           <Smartphone className="h-3 w-3 mr-1.5" /> QUICK PAY
                                        </Button>
                                     )}
                                     <Button 
                                       onClick={() => handleMarkPaid(p)} 
                                       disabled={isProcessing === p.id}
                                       className="h-10 px-6 bg-primary hover:bg-primary/90 rounded-xl font-black text-[9px] uppercase"
                                     >
                                        {isProcessing === p.id ? <Loader2 className="animate-spin h-3 w-3" /> : "MARK PAID"}
                                     </Button>
                                  </div>
                               ) : (
                                  <div className="flex items-center justify-end gap-2 text-green-500">
                                     <CheckCircle2 className="h-4 w-4" />
                                     <span className="text-[9px] font-black uppercase">SETTLED</span>
                                  </div>
                               )}
                            </TableCell>
                         </TableRow>
                      ))}
                      {(!payoutsData || payoutsData.length === 0) && (
                        <TableRow>
                           <TableCell colSpan={5} className="py-20 text-center">
                              <AlertCircle className="h-12 w-12 text-muted-foreground opacity-10 mx-auto mb-4" />
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">No payout requests in current queue.</p>
                           </TableCell>
                        </TableRow>
                      )}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'movies' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                   <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Plus className="text-primary" /></div>
                   <h3 className="text-2xl font-black uppercase italic text-white">Add Movie Signal</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Signal Title</Label>
                      <Input value={movieForm.title} onChange={e => setMovieForm({...movieForm, title: e.target.value})} className="h-14 bg-black border-white/10 rounded-xl font-bold" placeholder="e.g. Inception 4K" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Strategic Category</Label>
                      <Input value={movieForm.category} onChange={e => setMovieForm({...movieForm, category: e.target.value})} className="h-14 bg-black border-white/10 rounded-xl font-bold" placeholder="e.g. Action, Sci-Fi" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Poster Signal URL</Label>
                      <Input value={movieForm.poster} onChange={e => setMovieForm({...movieForm, poster: e.target.value})} className="h-14 bg-black border-white/10 rounded-xl font-mono text-xs" placeholder="https://..." />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Stream Signal URL (.mp4/.m3u8)</Label>
                      <Input value={movieForm.videoUrl} onChange={e => setMovieForm({...movieForm, videoUrl: e.target.value})} className="h-14 bg-black border-white/10 rounded-xl font-mono text-xs" placeholder="https://..." />
                   </div>
                </div>

                <Button onClick={handleAddMovie} disabled={isProcessing === 'add_movie'} className="w-full h-16 mt-8 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic text-lg shadow-xl">
                   {isProcessing === 'add_movie' ? <Loader2 className="animate-spin" /> : "DEPLOY MOVIE SIGNAL"}
                </Button>
             </Card>

             <div className="space-y-6">
                <h3 className="text-xl font-black uppercase italic">Active Cinema <span className="text-primary">Inventory</span></h3>
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden">
                   <Table>
                      <TableHeader className="bg-white/5">
                         <TableRow className="border-white/5">
                            <TableHead className="text-[9px] font-black uppercase tracking-widest">Poster</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-widest">Title</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-widest">Category</TableHead>
                            <TableHead className="text-[9px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {moviesData?.map(m => (
                            <TableRow key={m.id} className="border-white/5 hover:bg-white/5">
                               <TableCell>
                                  <img src={m.poster} className="h-12 w-20 object-cover rounded-lg border border-white/10" alt="Poster" />
                               </TableCell>
                               <TableCell className="font-black uppercase italic text-sm">{m.title}</TableCell>
                               <TableCell><Badge className="bg-white/5 text-muted-foreground border-none text-[8px]">{m.category}</Badge></TableCell>
                               <TableCell className="text-right">
                                  <Button onClick={() => handleDeleteMovie(m.id)} variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10 h-10 w-10 rounded-xl">
                                     <Trash2 className="h-4 w-4" />
                                  </Button>
                               </TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </Card>
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
