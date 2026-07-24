
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Loader2, Monitor, Activity, Power, Signal, Cpu, LineChart, Zap, 
  ShieldAlert, ShieldX, Lock, Users, Globe, Smartphone, ClipboardList, Target, 
  Eye, EyeOff, LayoutGrid, LayoutList, CheckCircle2, ChevronRight, Menu,
  Settings, Briefcase, GraduationCap, DollarSign, Wallet, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AppSettings } from '../lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '../lib/module-registry';
import { MONETIZATION_REGISTRY, MonCategory } from '../lib/monetization-registry';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';
const APP_CATEGORIES: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];
const MON_CATEGORIES: MonCategory[] = ['CPA', 'Ads', 'Surveys', 'MicroTasks', 'Fintech'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'monetization' | 'monitor' | 'finance'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<any>(statsRef);
  
  const toggleSetting = async (key: string, value: boolean) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL SYNCED", description: `${key.toUpperCase()} state updated.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
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
               <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Enterprise Command v60.0</p>
            </div>
         </div>
         <Badge className="bg-green-600/20 text-green-500 border-none text-[8px] font-black uppercase px-3 italic">Global Sync Active</Badge>
      </header>

      <main className="pt-28 px-6 space-y-10 max-w-5xl mx-auto">
         
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<Eye className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'monetization'} label="Monetization" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('monetization')} />
            <NavPill active={activeTab === 'monitor'} label="Operational" icon={<Monitor className="h-3 w-3" />} onClick={() => setActiveTab('monitor')} />
            <NavPill active={activeTab === 'finance'} label="Profit" icon={<LineChart className="h-3 w-3" />} onClick={() => setActiveTab('finance')} />
         </div>

         {activeTab === 'visibility' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2 text-center md:text-left">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">Feature <span className="text-primary">Controller</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">50+ Modular Academic Nodes</p>
              </div>

              <Tabs defaultValue="Learning" className="w-full">
                 <TabsList className="w-full h-14 bg-white/5 p-1 rounded-2xl border border-white/10 flex overflow-x-auto no-scrollbar">
                    {APP_CATEGORIES.map(cat => (
                       <TabsTrigger key={cat} value={cat} className="flex-1 font-black text-[9px] uppercase data-[state=active]:bg-primary rounded-xl">
                          {cat}
                       </TabsTrigger>
                    ))}
                 </TabsList>

                 {APP_CATEGORIES.map(cat => (
                    <TabsContent key={cat} value={cat} className="mt-8 space-y-4">
                       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {MODULE_REGISTRY.filter(m => m.category === cat).map((module) => {
                             const isActive = (settings as any)?.[module.visibilityKey];
                             return (
                                <Card key={module.id} className="bg-[#0a0a0f] border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-primary/20 transition-all">
                                   <div className="flex items-center gap-4">
                                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-all", isActive ? "bg-primary/10 text-primary border border-primary/20 shadow-lg" : "bg-white/5 text-muted-foreground border border-white/10")}>
                                         <module.icon className="h-4 w-4" />
                                      </div>
                                      <div>
                                         <p className={cn("text-[10px] font-black uppercase italic", isActive ? "text-white" : "text-muted-foreground opacity-50")}>{module.label}</p>
                                         <p className="text-[7px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">
                                            {isActive ? "LIVE" : "DORMANT"}
                                         </p>
                                      </div>
                                   </div>
                                   <Switch 
                                     checked={!!isActive} 
                                     onCheckedChange={(v) => toggleSetting(module.visibilityKey, v)}
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
               <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">Monetization <span className="text-primary">Hub</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">50+ Global Income Streams & Ad Waterfalls</p>
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
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                             {mon.eCPMTier === 'High' && <Badge className="bg-amber-500/10 text-amber-500 text-[6px] font-black uppercase px-1 border-none">$$$</Badge>}
                                          </div>
                                          <p className="text-[7px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">
                                             {mon.provider}
                                          </p>
                                       </div>
                                    </div>
                                    <Switch 
                                      checked={!!isActive} 
                                      onCheckedChange={(v) => toggleSetting(mon.visibilityKey, v)}
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

         {activeTab === 'monitor' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Operational <span className="text-primary">Node</span></h2>
              <div className="grid gap-4 sm:grid-cols-2">
                 <ModeRow label="Maintenance Mode" active={settings?.maintenanceMode} onToggle={(v) => toggleSetting('maintenanceMode', v)} icon={<Power />} />
                 <ModeRow label="Review Mode (Ads Off)" active={settings?.reviewMode} onToggle={(v) => toggleSetting('reviewMode', v)} icon={<Signal />} />
                 <ModeRow label="Razorpay Auto-Pay" active={settings?.razorpayAutoPayout} onToggle={(v) => toggleSetting('razorpayAutoPayout', v)} icon={<Cpu />} />
                 <ModeRow label="Offline Download" active={settings?.node_book_download} onToggle={(v) => toggleSetting('node_book_download', v)} icon={<Globe />} />
              </div>
              <Card className="bg-red-500/5 border-red-500/20 p-8 rounded-3xl space-y-4">
                 <div className="flex justify-between items-center">
                    <ShieldX className="text-red-500 h-6 w-6" />
                    <Badge className="bg-red-600 text-[8px] font-black uppercase px-2 py-1">IDENTITY LOCK ACTIVE</Badge>
                 </div>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
                   VPN/Proxy detection enabled. High-risk signals will trigger automated account suspension logic.
                 </p>
              </Card>
           </div>
         )}

         {activeTab === 'finance' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Revenue <span className="text-primary">Intelligence</span></h2>
              <div className="grid grid-cols-2 gap-4">
                 <MiniMetric label="Operational Revenue" value={`$${(stats?.totalOperationalRevenueUSD || 0).toFixed(2)}`} color="primary" />
                 <MiniMetric label="Admin Profit (70%)" value={`$${(stats?.totalAdminProfitUSD || 0).toFixed(2)}`} color="green" />
                 <MiniMetric label="User Dividend (30%)" value={`$${(stats?.totalUserDividendUSD || 0).toFixed(2)}`} color="amber" />
                 <MiniMetric label="Waterfall Margin" value="100%" color="purple" />
              </div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase text-center opacity-40 italic tracking-widest leading-relaxed">
                 All calculations follow the established 70/30 Profit Lock policy. Global user dividends are distributed as Scholarship Coins.
              </p>
           </div>
         )}
      </main>

      <footer className="fixed bottom-0 inset-x-0 p-8 flex justify-center pointer-events-none">
         <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-white tracking-[0.4em] italic">CampusHub Global Sync Active</span>
         </div>
      </footer>
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

function ModeRow({ label, active, onToggle, icon }: any) {
   return (
      <Card className="bg-white/5 border-white/5 p-6 flex items-center justify-between rounded-3xl">
         <div className="flex items-center gap-4">
            <div className="text-primary">{icon}</div>
            <span className="text-xs font-black uppercase italic text-white">{label}</span>
         </div>
         <Switch checked={active} onCheckedChange={onToggle} className="data-[state=checked]:bg-primary" />
      </Card>
   );
}

function MiniMetric({ label, value, color }: any) {
   const colors = { primary: "text-primary bg-primary/5 border-primary/20", green: "text-green-500 bg-green-500/5 border-green-500/20", amber: "text-amber-500 bg-amber-500/5 border-amber-500/20", purple: "text-purple-500 bg-purple-500/5 border-purple-500/20" };
   return (
      <Card className={cn("p-6 rounded-3xl border text-center", colors[color as keyof typeof colors])}>
         <p className="text-[8px] font-black uppercase opacity-60 mb-1">{label}</p>
         <p className="text-xl font-black italic">{value}</p>
      </Card>
   );
}
