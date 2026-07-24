
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, writeBatch, getDocs } from 'firebase/firestore';
import { 
  Loader2, Zap, Settings, Book, Database, RefreshCw, LayoutGrid, DollarSign, Wallet, 
  History, Globe, Info, Ban, Megaphone, Fingerprint, Activity, ClipboardCheck, 
  Smartphone, Target, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, PayoutRequest, CpaConversion } from '../lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '../lib/module-registry';
import { MONETIZATION_REGISTRY, MonCategory } from '../lib/monetization-registry';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';
const APP_CATEGORIES: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];
const MON_CATEGORIES: MonCategory[] = ['CPA', 'Ads', 'Surveys', 'MicroTasks', 'Fintech'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'monetization' | 'ops' | 'payouts' | 'book-api' | 'leads'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const payoutQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore]);
  const leadsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'cpa_conversions'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: payouts, isLoading: payoutsLoading } = useCollection<PayoutRequest>(payoutQuery);
  const { data: leads, isLoading: leadsLoading } = useCollection<CpaConversion>(leadsQuery);
  
  const updateSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL SYNCED", description: `${key.toUpperCase()} updated.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSyncBooks = async () => {
    if (!settings?.bookApiUrl || !firestore) {
       toast({ variant: "destructive", title: "Config Missing" });
       return;
    }
    setIsSyncing(true);
    try {
      const res = await fetch(settings.bookApiUrl);
      const data = await res.json();
      const booksToSync = (Array.isArray(data) ? data : data.docs || []).slice(0, 50);
      const batch = writeBatch(firestore);
      const customBooksCol = collection(firestore, 'custom_books');
      const existing = await getDocs(customBooksCol);
      existing.forEach(d => batch.delete(d.ref));
      booksToSync.forEach((b: any) => {
         const ref = doc(customBooksCol);
         batch.set(ref, { title: b.title || "Untitled", subject: settings.bookApiCategory || "General", source: "Admin-API", coverUrl: b.coverUrl || `https://picsum.photos/seed/${Math.random()}/200/300`, timestamp: new Date().toISOString() });
      });
      await batch.commit();
      toast({ title: "SYNC SUCCESS", description: `${booksToSync.length} nodes synced.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILURE" });
    } finally {
      setIsSyncing(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black">ACCESS DENIED</div>;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <header className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
            <div>
               <p className="text-sm font-black uppercase italic leading-none">Admin <span className="text-primary">Hub</span></p>
               <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Industrial Monitor v90.0</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <Badge className="bg-green-600/20 text-green-500 border-none text-[8px] font-black uppercase px-3 italic">Live S2S Sync Active</Badge>
         </div>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-6xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'monetization'} label="Earnings" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('monetization')} />
            <NavPill active={activeTab === 'leads'} label="Live Leads" icon={<ClipboardCheck className="h-3 w-3" />} onClick={() => setActiveTab('leads')} />
            <NavPill active={activeTab === 'book-api'} label="Book API" icon={<Book className="h-3 w-3" />} onClick={() => setActiveTab('book-api')} />
            <NavPill active={activeTab === 'ops'} label="Systems" icon={<Settings className="h-3 w-3" />} onClick={() => setActiveTab('ops')} />
            <NavPill active={activeTab === 'payouts'} label="Payouts" icon={<Wallet className="h-3 w-3" />} onClick={() => setActiveTab('payouts')} />
         </div>

         {activeTab === 'leads' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">CPA <span className="text-primary">Conversions</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Real-Time S2S Postback Audit Trail</p>
               </div>

               <div className="grid gap-4">
                  {leadsLoading ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : leads?.map(lead => (
                    <Card key={lead.id} className="bg-[#0a0a0f] border-white/5 p-6 rounded-3xl group border-2 flex flex-col md:flex-row justify-between items-center gap-6">
                       <div className="flex items-center gap-6 flex-1">
                          <div className="h-14 w-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                             <Target size={24} />
                          </div>
                          <div>
                             <p className="text-lg font-black uppercase italic text-white">{lead.offerName}</p>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                <Globe size={12} /> {lead.userEmail} • {new Date(lead.timestamp).toLocaleTimeString()}
                             </p>
                          </div>
                       </div>
                       <div className="flex items-center gap-10">
                          <div className="text-center">
                             <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Total Payout</p>
                             <p className="text-xl font-black text-white italic tabular-nums">${lead.payoutUSD.toFixed(2)}</p>
                          </div>
                          <div className="text-center">
                             <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">User Share</p>
                             <p className="text-xl font-black text-primary italic tabular-nums">{lead.userShareCoins} 🪙</p>
                          </div>
                          <Badge className="bg-green-600/20 text-green-500 border-none font-black text-[8px] px-3">{lead.status}</Badge>
                       </div>
                    </Card>
                  ))}
                  {(!leads || leads.length === 0) && (
                    <div className="py-32 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-20">
                       <ClipboardCheck className="h-16 w-16 mx-auto mb-4" />
                       <p className="text-xs font-black uppercase tracking-widest italic">Awaiting Conversion Signals...</p>
                    </div>
                  )}
               </div>
            </div>
         )}

         {activeTab === 'visibility' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Feature <span className="text-primary">Controller</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">50+ Modular Learning & Earning Nodes</p>
              </div>
              <Tabs defaultValue="Learning" className="w-full">
                 <TabsList className="w-full h-14 bg-white/5 p-1 rounded-2xl border border-white/10 flex overflow-x-auto no-scrollbar">
                    {APP_CATEGORIES.map(cat => (
                       <TabsTrigger key={cat} value={cat} className="flex-1 font-black text-[9px] uppercase data-[state=active]:bg-primary rounded-xl px-6">
                          {cat}
                       </TabsTrigger>
                    ))}
                 </TabsList>
                 {APP_CATEGORIES.map(cat => (
                    <TabsContent key={cat} value={cat} className="mt-8">
                       <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {MODULE_REGISTRY.filter(m => m.category === cat).map((module) => {
                             const isActive = (settings as any)?.[module.visibilityKey];
                             return (
                                <Card key={module.id} className="bg-[#0a0a0f] border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-primary/20 transition-all border-2">
                                   <div className="flex items-center gap-4">
                                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isActive ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground")}>
                                         <module.icon className="h-4 w-4" />
                                      </div>
                                      <p className={cn("text-[10px] font-black uppercase italic", isActive ? "text-white" : "text-muted-foreground opacity-50")}>{module.label}</p>
                                   </div>
                                   <Switch checked={!!isActive} onCheckedChange={(v) => updateSetting(module.visibilityKey, v)} className="data-[state=checked]:bg-primary" />
                                </Card>
                             );
                          })}
                       </div>
                    </TabsContent>
                 ))}
              </Tabs>
           </div>
         )}

         {activeTab === 'monetization' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Monetization <span className="text-primary">Hub</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">50+ Global Ad Networks & Income Modules</p>
               </div>
               <Tabs defaultValue="CPA" className="w-full">
                  <TabsList className="w-full h-14 bg-white/5 p-1 rounded-2xl border border-white/10 flex overflow-x-auto no-scrollbar">
                     {MON_CATEGORIES.map(cat => (
                        <TabsTrigger key={cat} value={cat} className="flex-1 font-black text-[9px] uppercase data-[state=active]:bg-primary rounded-xl px-6">{cat}</TabsTrigger>
                     ))}
                  </TabsList>
                  {MON_CATEGORIES.map(cat => (
                     <TabsContent key={cat} value={cat} className="mt-8">
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                           {MONETIZATION_REGISTRY.filter(m => m.category === cat).map((mon) => {
                              const isActive = (settings as any)?.[mon.visibilityKey];
                              return (
                                 <Card key={mon.id} className="bg-[#0a0a0f] border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-primary/30 transition-all border-2">
                                    <div className="flex items-center gap-4">
                                       <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isActive ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground")}>
                                          <mon.icon className="h-4 w-4" />
                                       </div>
                                       <p className={cn("text-[10px] font-black uppercase italic", isActive ? "text-white" : "text-muted-foreground opacity-50")}>{mon.label}</p>
                                    </div>
                                    <Switch checked={!!isActive} onCheckedChange={(v) => updateSetting(mon.visibilityKey, v)} className="data-[state=checked]:bg-primary" />
                                 </Card>
                              );
                           })}
                        </div>
                     </TabsContent>
                  ))}
               </Tabs>
            </div>
         )}
      </main>
    </div>
  );
}

function NavPill({ active, label, icon, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className={cn(
          "px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[9px] tracking-widest whitespace-nowrap border-2",
          active ? "bg-primary/10 border-primary text-primary italic shadow-lg" : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
        )}
      >
         {icon} <span>{label}</span>
      </button>
   );
}
