
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, arrayUnion, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { 
  Loader2, Zap, Settings, Book, Database, RefreshCw, LayoutGrid, DollarSign, Wallet, 
  History, Globe, Info, Ban, Megaphone, Fingerprint, Activity, ClipboardCheck, 
  Smartphone, Target, ShieldCheck, CheckCircle2, PieChart, BarChart3, TrendingUp,
  Coins, ArrowRightLeft, Percent, Calculator, ListTodo, Search, User, CreditCard,
  PlusCircle, MinusCircle, AlertCircle, Palette, Image as ImageIcon, Sparkles, Star
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
import { AppSettings, PayoutRequest, PlatformRevenue, UserProfile } from '../lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '../lib/module-registry';
import { getCurrencyData, formatCurrency } from '@/lib/currency';
import { MASTER_THEMES, CampusTheme } from '@/app/lib/themes';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';
const APP_CATEGORIES: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'wallets' | 'revenue' | 'currency' | 'branding'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Branding States
  const [logoUrl, setLogoUrl] = useState('');
  const [themeSearch, setThemeSearch] = useState('');

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);
  
  const updateSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL SYNCED", description: "Settings updated successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleApplyTheme = async (themeId: string) => {
    await updateSetting('currentThemeId', themeId);
    toast({ title: "THEME DEPLOYED", description: `Theme signal locked to ${themeId}.` });
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black tracking-[0.5em]">ACCESS DENIED</div>;

  const filteredThemes = MASTER_THEMES.filter(t => 
    t.name.toLowerCase().includes(themeSearch.toLowerCase()) || 
    t.category.toLowerCase().includes(themeSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <header className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
            <div>
               <p className="text-sm font-black uppercase italic leading-none">Admin <span className="text-primary">Hub</span></p>
               <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Enterprise Command v160.0</p>
            </div>
         </div>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-6xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'branding'} label="Themes" icon={<Palette className="h-3 w-3" />} onClick={() => setActiveTab('branding')} />
            <NavPill active={activeTab === 'wallets'} label="Adjustment" icon={<Wallet className="h-3 w-3" />} onClick={() => setActiveTab('wallets')} />
            <NavPill active={activeTab === 'currency'} label="Economy" icon={<ArrowRightLeft className="h-3 w-3" />} onClick={() => setActiveTab('currency')} />
            <NavPill active={activeTab === 'revenue'} label="Revenue" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('revenue')} />
         </div>

         {activeTab === 'branding' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Theme <span className="text-primary">Terminal</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">100+ Programmable High-Fidelity Styles</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* LOGO CONFIG */}
                  <Card className="lg:col-span-1 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 border-2">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3">
                        <ImageIcon className="h-5 w-5 text-primary" /> Visual Assets
                     </h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground">Custom Logo URL</Label>
                           <Input 
                              value={logoUrl || settings?.customLogoUrl || ''} 
                              onChange={e => setLogoUrl(e.target.value)} 
                              onBlur={() => updateSetting('customLogoUrl', logoUrl)}
                              placeholder="https://..." 
                              className="bg-black border-white/10 h-12 rounded-xl text-xs" 
                           />
                        </div>
                        {settings?.customLogoUrl && (
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                              <img src={settings.customLogoUrl} className="h-10 w-auto" alt="Preview" />
                           </div>
                        )}
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20">
                           <div>
                              <p className="text-[10px] font-black uppercase">Festival Mode</p>
                              <p className="text-[8px] font-bold text-muted-foreground uppercase">Enable seasonal effects</p>
                           </div>
                           <Switch checked={!!settings?.festivalModeActive} onCheckedChange={(v) => updateSetting('festivalModeActive', v)} />
                        </div>
                     </div>
                  </Card>

                  {/* THEME GRID */}
                  <Card className="lg:col-span-2 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 border-2">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-xl font-black uppercase italic flex items-center gap-3">
                           <Sparkles className="h-5 w-5 text-amber-500" /> Presets Matrix
                        </h3>
                        <div className="relative w-full sm:w-64">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                           <Input 
                             value={themeSearch}
                             onChange={e => setThemeSearch(e.target.value)}
                             placeholder="Search 100+ themes..." 
                             className="h-10 bg-black border-white/10 pl-10 text-[10px] uppercase font-bold"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                        {filteredThemes.map((theme) => (
                           <button
                              key={theme.id}
                              onClick={() => handleApplyTheme(theme.id)}
                              className={cn(
                                 "p-4 rounded-2xl border-2 transition-all group relative overflow-hidden",
                                 settings?.currentThemeId === theme.id ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:border-white/20"
                              )}
                              style={{ borderLeftColor: `hsl(${theme.primary})`, borderLeftWidth: '8px' }}
                           >
                              <div className="space-y-2 text-left relative z-10">
                                 <p className="text-[10px] font-black uppercase italic truncate">{theme.name}</p>
                                 <div className="flex gap-1.5">
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${theme.primary})` }} />
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${theme.background})` }} />
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: `hsl(${theme.accent})` }} />
                                 </div>
                                 <Badge className="bg-black/40 text-[7px] font-black uppercase border-none px-2">{theme.category}</Badge>
                              </div>
                              {theme.isFestival && (
                                 <Star className="absolute top-2 right-2 h-3 w-3 text-amber-500 fill-amber-500 animate-pulse" />
                              )}
                           </button>
                        ))}
                     </div>
                  </Card>
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
