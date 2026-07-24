
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, arrayUnion } from 'firebase/firestore';
import { 
  Loader2, Zap, Settings, Book, Database, RefreshCw, LayoutGrid, DollarSign, Wallet, 
  History, Globe, Info, Ban, Megaphone, Fingerprint, Activity, ClipboardCheck, 
  Smartphone, Target, ShieldCheck, CheckCircle2, PieChart, BarChart3, TrendingUp,
  Coins, ArrowRightLeft, Percent, Calculator, ListTodo
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
import { AppSettings, PayoutRequest, PlatformRevenue } from '../lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '../lib/module-registry';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';
const APP_CATEGORIES: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'monetization' | 'revenue' | 'currency' | 'payouts' | 'leads'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  const payoutQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(50)) : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);
  const { data: payouts } = useCollection<PayoutRequest>(payoutQuery);
  
  const updateSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      const oldVal = (settings as any)?.[key];
      await updateDoc(settingsRef, { 
        [key]: value,
        rateHistory: arrayUnion({
          timestamp: new Date().toISOString(),
          type: key,
          oldValue: oldVal ?? 0,
          newValue: value
        })
      });
      toast({ title: "SIGNAL SYNCED", description: `${key.toUpperCase()} updated.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(null);
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
               <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Economy Manager v140.0</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <Badge className="bg-green-600/20 text-green-500 border-none text-[8px] font-black uppercase px-3 italic">Economy Live</Badge>
         </div>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-6xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'currency'} label="Economy" icon={<ArrowRightLeft className="h-3 w-3" />} onClick={() => setActiveTab('currency')} />
            <NavPill active={activeTab === 'revenue'} label="Revenue" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('revenue')} />
            <NavPill active={activeTab === 'payouts'} label="Payouts" icon={<Wallet className="h-3 w-3" />} onClick={() => setActiveTab('payouts')} />
         </div>

         {activeTab === 'currency' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Currency <span className="text-primary">Terminal</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Dynamic Coin-to-Cash Calibration</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl border-2">
                    <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                       <Calculator className="h-5 w-5 text-primary" /> Exchange Rates
                    </h3>
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Coins Per 1 INR (₹)</Label>
                          <Input 
                            type="number" 
                            defaultValue={settings?.coinsPerINR || 100} 
                            onBlur={(e) => updateSetting('coinsPerINR', parseInt(e.target.value))}
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-primary text-center" 
                          />
                          <p className="text-[8px] font-bold text-muted-foreground uppercase text-center italic">"Default: 100 Coins = ₹1"</p>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Coins Per 1 USD ($)</Label>
                          <Input 
                            type="number" 
                            defaultValue={settings?.coinsPerUSD || 1000} 
                            onBlur={(e) => updateSetting('coinsPerUSD', parseInt(e.target.value))}
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-white text-center" 
                          />
                          <p className="text-[8px] font-bold text-muted-foreground uppercase text-center italic">"Default: 1000 Coins = $1"</p>
                       </div>
                    </div>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl border-2">
                    <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                       <Percent className="h-5 w-5 text-amber-500" /> Profit Margins
                    </h3>
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">User Revenue Share (%)</Label>
                          <Input 
                            type="number" 
                            defaultValue={settings?.userRevenueSharePercent || 20} 
                            onBlur={(e) => updateSetting('userRevenueSharePercent', parseInt(e.target.value))}
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-amber-500 text-center" 
                          />
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">CPA Reward Multiplier</Label>
                          <Input 
                            type="number" 
                            step="0.1"
                            defaultValue={settings?.cpaRewardMultiplier || 1.0} 
                            onBlur={(e) => updateSetting('cpaRewardMultiplier', parseFloat(e.target.value))}
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-white text-center" 
                          />
                       </div>
                    </div>
                 </Card>
              </div>

              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="bg-white/5 p-6 border-b border-white/5">
                    <h4 className="text-[10px] font-black uppercase italic flex items-center gap-2">
                       <History className="h-4 w-4 text-muted-foreground" /> Rate Audit History
                    </h4>
                 </div>
                 <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                    {settings?.rateHistory?.slice().reverse().map((log, i) => (
                      <div key={i} className="p-4 flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-white">{log.type.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-[9px] font-bold text-muted-foreground line-through">{log.oldValue}</span>
                            <span className="text-sm font-black text-primary italic">{log.newValue}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </Card>
           </div>
         )}

         {activeTab === 'revenue' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Profit <span className="text-primary">Analytics</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Global Revenue Share Model</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AnalyticsCard label="Total Ad Revenue" value={`$${(stats?.totalDailyRevenueUSD || 0).toFixed(2)}`} icon={<BarChart3 />} color="text-white" />
                  <AnalyticsCard label="Admin Profit" value={`$${(stats?.totalAdminProfitUSD || 0).toFixed(2)}`} icon={<ShieldCheck />} color="text-primary" />
                  <AnalyticsCard label="User Dividend" value={`$${(stats?.totalUserDividendUSD || 0).toFixed(2)}`} icon={<TrendingUp />} color="text-green-500" />
               </div>
            </div>
         )}

         {activeTab === 'visibility' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Feature <span className="text-primary">Controller</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Modular Node Management</p>
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
      </main>
    </div>
  );
}

function AnalyticsCard({ label, value, icon, color }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2rem] flex flex-col justify-between h-40 border-2">
         <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">{icon}</div>
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
         </div>
         <h3 className={cn("text-4xl font-black italic tabular-nums", color)}>{value}</h3>
      </Card>
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
