
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, setDoc, addDoc, query, orderBy, deleteDoc, limit, where } from 'firebase/firestore';
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
  FileText,
  Download,
  Layout,
  ExternalLink,
  Save,
  Megaphone,
  LifeBuoy,
  Gavel,
  CloudRain,
  Smartphone,
  CheckCircle2,
  AlertCircle
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
import { PayoutRequest, StudyMaterial } from '../lib/types';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'inventory' | 'movies' | 'weather'>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Material Form State
  const [matForm, setMatForm] = useState({ title: '', dept: 'engineering', sem: '1', type: 'Notes', url: '' });

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const matsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'study_materials'), orderBy('createdAt', 'desc'), limit(100)) : null, [firestore, isAdminUser]);
  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore, isAdminUser]);

  const { data: materialsData } = useCollection<StudyMaterial>(matsQuery);
  const { data: payoutsData } = useCollection<PayoutRequest>(payoutsQuery);

  const handleAddMaterial = async () => {
    if (!firestore || !matForm.title || !matForm.url) {
      toast({ variant: "destructive", title: "FIELDS REQUIRED" });
      return;
    }
    setIsProcessing('add_mat');
    try {
      await addDoc(collection(firestore, 'study_materials'), {
        title: matForm.title,
        department: matForm.dept,
        semester: parseInt(matForm.sem),
        type: matForm.type,
        url: matForm.url,
        createdAt: new Date().toISOString()
      });
      toast({ title: "MATERIAL DEPLOYED", description: `${matForm.title} is now active.` });
      setMatForm({ ...matForm, title: '', url: '' });
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
      toast({ title: "PAYOUT VERIFIED" });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
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
          <span className="font-black text-xl italic uppercase tracking-tighter">ARENA <span className="text-primary">MASTER</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Terminal" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'inventory'} icon={<FileText />} label="Resource Hub" onClick={() => setActiveTab('inventory')} />
          <AdminLink active={activeTab === 'movies'} icon={<Film />} label="Movie Intel" onClick={() => setActiveTab('movies')} />
          <AdminLink active={activeTab === 'weather'} icon={<CloudRain />} label="Weather Station" onClick={() => setActiveTab('weather')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
        </header>

        {activeTab === 'inventory' && (
          <div className="space-y-12 animate-in fade-in duration-500">
             <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex items-center gap-3 mb-8">
                   <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"><Plus className="text-primary" /></div>
                   <h3 className="text-2xl font-black uppercase italic text-white">Deploy Study Material</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Title</Label>
                      <Input value={matForm.title} onChange={e => setMatForm({...matForm, title: e.target.value})} className="h-14 bg-black border-white/10 rounded-xl" placeholder="e.g. Maths-I Notes" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Dept</Label>
                      <select value={matForm.dept} onChange={e => setMatForm({...matForm, dept: e.target.value})} className="w-full h-14 bg-black border-white/10 rounded-xl px-4 text-sm font-bold">
                         <option value="engineering">Engineering</option>
                         <option value="science">Science</option>
                         <option value="arts">Arts</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Semester</Label>
                      <Input type="number" min="1" max="8" value={matForm.sem} onChange={e => setMatForm({...matForm, sem: e.target.value})} className="h-14 bg-black border-white/10 rounded-xl" />
                   </div>
                   <div className="space-y-2 lg:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">URL (Drive/Direct)</Label>
                      <Input value={matForm.url} onChange={e => setMatForm({...matForm, url: e.target.value})} className="h-14 bg-black border-white/10 rounded-xl" placeholder="https://..." />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Type</Label>
                      <select value={matForm.type} onChange={e => setMatForm({...matForm, type: e.target.value as any})} className="w-full h-14 bg-black border-white/10 rounded-xl px-4 text-sm font-bold">
                         <option value="Notes">Notes</option>
                         <option value="PYQ">PYQ</option>
                         <option value="Syllabus">Syllabus</option>
                      </select>
                   </div>
                </div>

                <Button onClick={handleAddMaterial} disabled={isProcessing === 'add_mat'} className="w-full h-16 mt-8 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic text-lg shadow-xl">
                   {isProcessing === 'add_mat' ? <Loader2 className="animate-spin" /> : "DEPLOY RESOURCE SIGNAL"}
                </Button>
             </Card>

             <div className="space-y-6">
                <h3 className="text-xl font-black uppercase italic">Active Resource <span className="text-primary">Inventory</span></h3>
                <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden">
                   <Table>
                      <TableHeader className="bg-white/5">
                         <TableRow className="border-white/5">
                            <TableHead className="text-[9px] font-black uppercase">Title</TableHead>
                            <TableHead className="text-[9px] font-black uppercase">Dept/Sem</TableHead>
                            <TableHead className="text-[9px] font-black uppercase text-right">Actions</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {materialsData?.map(m => (
                            <TableRow key={m.id} className="border-white/5 hover:bg-white/5">
                               <TableCell className="font-black uppercase italic text-sm">{m.title}</TableCell>
                               <TableCell>
                                  <Badge className="bg-white/5 text-muted-foreground border-none text-[8px] uppercase">{m.department} - S{m.semester}</Badge>
                               </TableCell>
                               <TableCell className="text-right flex justify-end gap-3">
                                  <Button asChild variant="ghost" size="icon" className="text-primary hover:bg-primary/10 h-10 w-10 rounded-xl">
                                     <a href={m.url} target="_blank"><Download className="h-4 w-4" /></a>
                                  </Button>
                                  <Button onClick={() => deleteDoc(doc(firestore, 'study_materials', m.id))} variant="ghost" size="icon" className="text-red-500 hover:bg-red-500/10 h-10 w-10 rounded-xl">
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

        {/* Existing tabs follow... */}
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
