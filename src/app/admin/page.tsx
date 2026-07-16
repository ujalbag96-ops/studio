
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
  Gavel
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

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'movies' | 'settlements' | 'lottery'>('movies');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Movie Form State
  const [movieForm, setMovieForm] = useState({ title: '', poster: '', videoUrl: '', category: 'Action' });

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const moviesQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'movies'), orderBy('createdAt', 'desc')) : null, [firestore, isAdminUser]);
  const { data: moviesData } = useCollection<any>(moviesQuery);

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
          <AdminLink active={activeTab === 'movies'} icon={<Film />} label="Movie Intelligence" onClick={() => setActiveTab('movies')} />
          <AdminLink active={activeTab === 'settlements'} icon={<Gavel />} label="Match Settlements" onClick={() => setActiveTab('settlements')} />
          <AdminLink active={activeTab === 'lottery'} icon={<Dices />} label="Jackpot Control" onClick={() => setActiveTab('lottery')} />
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Terminal" onClick={() => setActiveTab('withdrawals')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] mt-1">Industrial Operational Control</p>
           </div>
        </header>

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
