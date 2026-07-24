
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, writeBatch, deleteDoc, getDocs } from 'firebase/firestore';
import { 
  Loader2, Monitor, Activity, Power, Signal, Cpu, LineChart, Zap, 
  ShieldAlert, ShieldX, Lock, Users, Globe, Smartphone, ClipboardList, Target, 
  Eye, EyeOff, LayoutGrid, LayoutList, CheckCircle2, ChevronRight, Menu,
  Settings, Briefcase, GraduationCap, DollarSign, Wallet, Star, Mail, Megaphone,
  AlertCircle, History, Clock, Fingerprint, Ban, CheckCircle, Book, Database, RefreshCw
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
import { UserProfile, AppSettings, PayoutRequest, BookMetadata } from '../lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '../lib/module-registry';
import { MONETIZATION_REGISTRY, MonCategory } from '../lib/monetization-registry';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';
const APP_CATEGORIES: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];
const MON_CATEGORIES: MonCategory[] = ['CPA', 'Ads', 'Surveys', 'MicroTasks', 'Fintech'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'monetization' | 'ops' | 'payouts' | 'book-api'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const payoutQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: payouts, isLoading: payoutsLoading } = useCollection<PayoutRequest>(payoutQuery);
  
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
       toast({ variant: "destructive", title: "Config Missing", description: "Set API URL before sync." });
       return;
    }
    
    setIsSyncing(true);
    try {
      const res = await fetch(settings.bookApiUrl);
      const data = await res.json();
      
      // Industrial Mapping for standard APIs (assuming array of books)
      const booksToSync = (Array.isArray(data) ? data : data.docs || data.books || []).slice(0, 50);
      
      const batch = writeBatch(firestore);
      const customBooksCol = collection(firestore, 'custom_books');
      
      // Clear old signals first (Simplified for prototype)
      const existing = await getDocs(customBooksCol);
      existing.forEach(d => batch.delete(d.ref));
      
      booksToSync.forEach((b: any) => {
         const newBookRef = doc(customBooksCol);
         batch.set(newBookRef, {
            id: b.id || b.key || newBookRef.id,
            title: b.title || "Untitled Lesson",
            subject: settings.bookApiCategory || b.subject || "Global Node",
            class: b.class || "University Hub",
            source: "Admin-API",
            lang: b.lang || "en",
            coverUrl: b.coverUrl || b.image || `https://picsum.photos/seed/${Math.random()}/200/300`,
            isCustom: true,
            timestamp: new Date().toISOString()
         });
      });

      await batch.commit();
      toast({ title: "GLOBAL SYNC SUCCESS", description: `${booksToSync.length} scholarly nodes synced.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILURE", description: "Check API Endpoint integrity." });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePayoutStatus = async (payoutId: string, status: 'completed' | 'failed') => {
    if (!firestore) return;
    setIsProcessing(payoutId);
    try {
      const pRef = doc(firestore, 'payouts', payoutId);
      await updateDoc(pRef, { status });
      toast({ title: "PAYOUT UPDATED", description: `Transaction marked as ${status}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "UPDATE FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] text-red-500 font-black p-10 text-center gap-6"><ShieldAlert className="h-20 w-20" /><h2 className="text-2xl uppercase italic tracking-tighter">Identity Not Verified</h2><Button asChild variant="outline" className="border-red-500/20 text-red-500 uppercase font-black"><a href="/login">Return to Gate</a></Button></div>;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <header className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
            <div>
               <p className="text-sm font-black uppercase italic leading-none">Master <span className="text-primary">Hub</span></p>
               <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Industrial Intelligence v80.0</p>
            </div>
         </div>
         <Badge className="bg-green-600/20 text-green-500 border-none text-[8px] font-black uppercase px-3 italic">Global Sync Active</Badge>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-6xl mx-auto">
         
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'book-api'} label="Book API" icon={<Book className="h-3 w-3" />} onClick={() => setActiveTab('book-api')} />
            <NavPill active={activeTab === 'monetization'} label="Monetization" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('monetization')} />
            <NavPill active={activeTab === 'ops'} label="Operations" icon={<Settings className="h-3 w-3" />} onClick={() => setActiveTab('ops')} />
            <NavPill active={activeTab === 'payouts'} label="Payouts" icon={<Wallet className="h-3 w-3" />} onClick={() => setActiveTab('payouts')} />
         </div>

         {activeTab === 'book-api' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Book API <span className="text-primary">Manager</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Configure Global Resource Signals</p>
               </div>

               <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-8 border-2 shadow-2xl">
                     <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Database className="text-primary" /> Configuration</h3>
                        <Switch 
                          checked={!!settings?.node_book_api_active} 
                          onCheckedChange={(v) => updateSetting('node_book_api_active', v)}
                          className="data-[state=checked]:bg-primary"
                        />
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Endpoint URL</Label>
                           <Input 
                             value={settings?.bookApiUrl || ''} 
                             onChange={e => updateSetting('bookApiUrl', e.target.value)} 
                             className="h-14 bg-black border-white/10 font-bold text-xs" 
                             placeholder="https://api.provider.com/v1/books" 
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Auth Header / Key</Label>
                           <Input 
                             value={settings?.bookApiKey || ''} 
                             onChange={e => updateSetting('bookApiKey', e.target.value)} 
                             type="password"
                             className="h-14 bg-black border-white/10 font-bold text-xs" 
                             placeholder="Bearer eyJhbGciOiJIUzI..." 
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Default Mapping Category</Label>
                           <Input 
                             value={settings?.bookApiCategory || ''} 
                             onChange={e => updateSetting('bookApiCategory', e.target.value)} 
                             className="h-14 bg-black border-white/10 font-black uppercase text-xs text-primary" 
                             placeholder="E.G. ENGINEERING CORE" 
                           />
                        </div>
                     </div>
                  </Card>

                  <div className="space-y-6">
                     <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 flex flex-col justify-center items-center text-center space-y-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><RefreshCw className="h-40 w-40 text-primary" /></div>
                        <div className="space-y-3 relative z-10">
                           <h4 className="text-2xl font-black uppercase italic">Master Sync</h4>
                           <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                              Push new scholarly signals from your configured API into the Global Vault instantly.
                           </p>
                        </div>
                        <Button 
                          onClick={handleSyncBooks}
                          disabled={isSyncing || !settings?.bookApiUrl}
                          className="w-full h-20 bg-primary hover:bg-primary/90 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all active:scale-95 group"
                        >
                           {isSyncing ? <Loader2 className="animate-spin h-8 w-8" /> : <><RefreshCw className="mr-3 h-6 w-6 group-hover:rotate-180 transition-transform duration-500" /> INITIALIZE GLOBAL SYNC</>}
                        </Button>
                     </Card>

                     <Card className="bg-[#121212] border-white/5 rounded-3xl p-8 flex items-start gap-4">
                        <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">
                           Signal verification active. Any books synced will inherit the "Admin-API" source label and be displayed in the Scholar Hub under the custom mapping category.
                        </p>
                     </Card>
                  </div>
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
                    <TabsContent key={cat} value={cat} className="mt-8 space-y-4">
                       <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {MODULE_REGISTRY.filter(m => m.category === cat).map((module) => {
                             const isActive = (settings as any)?.[module.visibilityKey];
                             return (
                                <Card key={module.id} className="bg-[#0a0a0f] border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-primary/20 transition-all border-2">
                                   <div className="flex items-center gap-4">
                                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", isActive ? "bg-primary/10 text-primary border border-primary/20 shadow-lg" : "bg-white/5 text-muted-foreground border border-white/10")}>
                                         <module.icon className="h-4 w-4" />
                                      </div>
                                      <div>
                                         <p className={cn("text-[10px] font-black uppercase italic", isActive ? "text-white" : "text-muted-foreground opacity-50")}>{module.label}</p>
                                         <p className="text-[7px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">
                                            {isActive ? "LIVE NODE" : "DORMANT"}
                                         </p>
                                      </div>
                                   </div>
                                   <Switch 
                                     checked={!!isActive} 
                                     onCheckedChange={(v) => updateSetting(module.visibilityKey, v)}
                                     disabled={isProcessing === module.visibilityKey}
                                     className="data-[state=checked]:bg-primary"
                                   />
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
                        <TabsTrigger key={cat} value={cat} className="flex-1 font-black text-[9px] uppercase data-[state=active]:bg-primary rounded-xl px-6">
                           {cat === 'MicroTasks' ? 'Tasks' : cat}
                        </TabsTrigger>
                     ))}
                  </TabsList>

                  {MON_CATEGORIES.map(cat => (
                     <TabsContent key={cat} value={cat} className="mt-8 space-y-4">
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                           {MONETIZATION_REGISTRY.filter(m => m.category === cat).map((mon) => {
                              const isActive = (settings as any)?.[mon.visibilityKey];
                              return (
                                 <Card key={mon.id} className="bg-[#0a0a0f] border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-primary/30 transition-all border-2">
                                    <div className="flex items-center gap-4">
                                       <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", isActive ? "bg-primary/10 text-primary border border-primary/20 shadow-lg" : "bg-white/5 text-muted-foreground border border-white/10")}>
                                          <mon.icon className="h-4 w-4" />
                                       </div>
                                       <div>
                                          <div className="flex items-center gap-2">
                                             <p className={cn("text-[10px] font-black uppercase italic", isActive ? "text-white" : "text-muted-foreground opacity-50")}>{mon.label}</p>
                                          </div>
                                          <p className="text-[7px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">
                                             {mon.provider}
                                          </p>
                                       </div>
                                    </div>
                                    <Switch 
                                      checked={!!isActive} 
                                      onCheckedChange={(v) => updateSetting(mon.visibilityKey, v)}
                                      disabled={isProcessing === mon.visibilityKey}
                                      className="data-[state=checked]:bg-primary"
                                    />
                                 </Card>
                              );
                           })}
                        </div>
                     </TabsContent>
                  ))}
               </Tabs>
            </div>
         )}

         {activeTab === 'ops' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Systems <span className="text-primary">Operations</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Emergency Overrides & Broadcast Center</p>
              </div>

              <div className="grid gap-6">
                 <Card className="bg-[#0a0a0f] border-white/5 rounded-3xl p-8 space-y-6 border-2">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", settings?.maintenanceMode ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500")}>
                             <Ban />
                          </div>
                          <div>
                             <h3 className="text-lg font-black uppercase italic">Maintenance Mode</h3>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase">Lock all user access signals</p>
                          </div>
                       </div>
                       <Switch 
                         checked={!!settings?.maintenanceMode} 
                         onCheckedChange={(v) => updateSetting('maintenanceMode', v)}
                         className="data-[state=checked]:bg-red-600"
                       />
                    </div>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 rounded-3xl p-8 space-y-6 border-2">
                    <div className="flex items-center gap-4 mb-4">
                       <Megaphone className="text-primary h-6 w-6" />
                       <h3 className="text-lg font-black uppercase italic">Global Broadcast</h3>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Banner Signal (Message)</Label>
                          <textarea 
                            value={settings?.broadcastMessage || ''}
                            onChange={(e) => updateSetting('broadcastMessage', e.target.value)}
                            className="w-full h-24 bg-black border border-white/10 rounded-2xl p-4 font-bold text-xs uppercase"
                            placeholder="SYSTEM UPDATE: NCERT LIBRARY SYNCED..."
                          />
                       </div>
                       <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                          <span className="text-[10px] font-black uppercase italic text-muted-foreground">Broadcast Status</span>
                          <Switch 
                            checked={!!settings?.broadcastActive}
                            onCheckedChange={(v) => updateSetting('broadcastActive', v)}
                          />
                       </div>
                    </div>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 rounded-3xl p-8 space-y-6 border-2">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <Fingerprint className="text-primary" />
                          <div>
                             <h3 className="text-lg font-black uppercase italic">App Version Control</h3>
                             <p className="text-[10px] text-muted-foreground font-bold uppercase">Current: v{settings?.minAppVersion || '1.0.0'}</p>
                          </div>
                       </div>
                       <Input 
                         value={settings?.minAppVersion || ''}
                         onChange={(e) => updateSetting('minAppVersion', e.target.value)}
                         className="w-24 bg-black border-white/10 rounded-xl font-black text-center"
                         placeholder="1.1.0"
                       />
                    </div>
                 </Card>
              </div>
           </div>
         )}

         {activeTab === 'payouts' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Audit <span className="text-primary">Queue</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Verified Scholar Withdrawal Signals</p>
              </div>

              {payoutsLoading ? (
                 <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
              ) : (
                 <div className="grid gap-4">
                    {payouts?.map((p) => (
                       <Card key={p.id} className="bg-[#0a0a0f] border-white/5 rounded-3xl p-6 overflow-hidden relative group border-2">
                          {p.status === 'pending' && <div className="absolute left-0 inset-y-0 w-1 bg-primary animate-pulse" />}
                          
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                             <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-3">
                                   <Badge className={cn("text-[8px] font-black uppercase border-none px-3 py-1", p.status === 'pending' ? "bg-amber-500/20 text-amber-500" : p.status === 'completed' ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500")}>
                                      {p.status}
                                   </Badge>
                                   <span className="text-[9px] font-bold text-muted-foreground uppercase">{new Date(p.timestamp).toLocaleString()}</span>
                                </div>
                                <div>
                                   <h4 className="text-lg font-black uppercase text-white italic">{p.userEmail}</h4>
                                   <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                      <Globe className="h-3 w-3" /> {p.geo || 'Global'} • {p.method} Protocol
                                   </p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5 font-mono text-xs text-primary truncate max-w-full">
                                   DEST: {p.destination}
                                </div>
                             </div>

                             <div className="text-right space-y-4 min-w-[120px]">
                                <div>
                                   <p className="text-[8px] font-black uppercase text-muted-foreground">Volume</p>
                                   <p className="text-2xl font-black text-green-500 italic tabular-nums">₹{p.localAmount}</p>
                                   <p className="text-[10px] font-bold text-muted-foreground">({p.coinAmount} 🪙)</p>
                                </div>
                                
                                {p.status === 'pending' && (
                                   <div className="flex gap-2 justify-end">
                                      <Button 
                                        onClick={() => handlePayoutStatus(p.id, 'failed')}
                                        disabled={isProcessing === p.id}
                                        variant="outline" 
                                        size="sm" 
                                        className="h-10 border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl"
                                      >
                                         REJECT
                                      </Button>
                                      <Button 
                                        onClick={() => handlePayoutStatus(p.id, 'completed')}
                                        disabled={isProcessing === p.id}
                                        size="sm" 
                                        className="h-10 bg-primary hover:bg-primary/90 rounded-xl font-black text-[10px]"
                                      >
                                         FINALIZE
                                      </Button>
                                   </div>
                                )}
                             </div>
                          </div>
                       </Card>
                    ))}
                    {(!payouts || payouts.length === 0) && (
                       <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                          <History className="h-16 w-16 mx-auto mb-4" />
                          <p className="text-xs font-black uppercase tracking-widest italic">No pending signals in audit queue</p>
                       </div>
                    )}
                 </div>
              )}
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
