
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, arrayUnion, where, getDocs, writeBatch, increment, getDoc } from 'firebase/firestore';
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

  // Search & Adjustment States
  const [searchQuery, setSearchTerm] = useState('');
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');
  const [adjustUnit, setAdjustUnit] = useState<'coin' | 'inr'>('coin');

  // Economy States
  const [coinsPerINR, setCoinsPerINR] = useState('');
  const [coinsPerUSD, setCoinsPerUSD] = useState('');
  const [revShare, setRevShare] = useState('');

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
      toast({ title: "SIGNAL SYNCED", description: `${key} updated successfully.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "SYNC FAILED", description: "Database rejected the signal." });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleUserSearch = async () => {
    if (!firestore || !searchQuery.trim()) return;
    setIsProcessing('search');
    setTargetUser(null);
    try {
      const q = query(collection(firestore, 'users'), where('email', '==', searchQuery.trim().toLowerCase()), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTargetUser({ id: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile);
      } else {
        toast({ variant: "destructive", title: "WARRIOR NOT FOUND", description: "No record matches this email node." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "SEARCH ERROR" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleWalletAdjustment = async (mode: 'credit' | 'debit') => {
    if (!firestore || !targetUser || !adjustAmount || !adjustRemark) {
      toast({ variant: "destructive", title: "VALIDATION FAILED", description: "Fill all mandatory adjustment fields." });
      return;
    }

    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({ variant: "destructive", title: "INVALID VOLUME", description: "Amount must be a positive signal." });
      return;
    }

    setIsProcessing('adjustment');
    try {
      const finalCoinAmount = adjustUnit === 'coin' ? amt : amt * (settings?.coinsPerINR || 100);
      const finalInrAmount = adjustUnit === 'inr' ? amt : amt / (settings?.coinsPerINR || 100);
      
      const multiplier = mode === 'credit' ? 1 : -1;
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', targetUser.id);
      
      batch.update(userRef, {
        coins: increment(finalCoinAmount * multiplier),
        winningBalance: increment(finalCoinAmount * multiplier),
        walletBalanceINR: increment(finalInrAmount * multiplier)
      });

      const auditRef = doc(collection(firestore, 'admin_adjustments'));
      batch.set(auditRef, {
        adminId: user?.uid,
        targetUserId: targetUser.id,
        amount: finalCoinAmount * multiplier,
        unit: adjustUnit,
        remark: adjustRemark,
        mode,
        timestamp: new Date().toISOString()
      });

      // User Ledger Node
      const ledgerRef = doc(collection(firestore, 'users', targetUser.id, 'ledger'));
      batch.set(ledgerRef, {
        type: mode === 'credit' ? 'admin_credit' : 'admin_debit',
        amount: finalCoinAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Manual Node Adjustment: ${adjustRemark}`
      });

      await batch.commit();
      
      toast({ title: "WALLET CALIBRATED", description: `Successfully ${mode}ed assets to warrior portfolio.` });
      
      // Reset Form Safely
      setAdjustAmount('');
      setAdjustRemark('');
      setTargetUser(null);
      setSearchTerm('');
    } catch (e) {
      toast({ variant: "destructive", title: "ADJUSTMENT FAILED" });
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
               <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Industrial Command v185.0</p>
            </div>
         </div>
         <Badge variant="outline" className="border-green-500/20 text-green-500 text-[8px] font-black uppercase flex items-center gap-1.5">
            <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" /> Persistence: Active
         </Badge>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-6xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'branding'} label="Themes" icon={<Palette className="h-3 w-3" />} onClick={() => setActiveTab('branding')} />
            <NavPill active={activeTab === 'wallets'} label="Adjustment" icon={<Wallet className="h-3 w-3" />} onClick={() => setActiveTab('wallets')} />
            <NavPill active={activeTab === 'currency'} label="Economy" icon={<ArrowRightLeft className="h-3 w-3" />} onClick={() => setActiveTab('currency')} />
            <NavPill active={activeTab === 'revenue'} label="Revenue" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('revenue')} />
         </div>

         {activeTab === 'currency' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Economy <span className="text-primary">Matrix</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Dynamic Exchange & Profit CALIBRATION</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <EconomyCard 
                    label="Coins per Rupee" 
                    value={coinsPerINR || settings?.coinsPerINR?.toString() || '100'} 
                    onChange={setCoinsPerINR} 
                    onSave={() => updateSetting('coinsPerINR', parseFloat(coinsPerINR))}
                    icon={<Coins />}
                    isSaving={isProcessing === 'coinsPerINR'}
                  />
                  <EconomyCard 
                    label="Coins per USD" 
                    value={coinsPerUSD || settings?.coinsPerUSD?.toString() || '1000'} 
                    onChange={setCoinsPerUSD} 
                    onSave={() => updateSetting('coinsPerUSD', parseFloat(coinsPerUSD))}
                    icon={<Globe />}
                    isSaving={isProcessing === 'coinsPerUSD'}
                  />
                  <EconomyCard 
                    label="Rev-Share User %" 
                    value={revShare || settings?.userRevenueSharePercent?.toString() || '20'} 
                    onChange={setRevShare} 
                    onSave={() => updateSetting('userRevenueSharePercent', parseFloat(revShare))}
                    icon={<Percent />}
                    isSaving={isProcessing === 'userRevenueSharePercent'}
                  />
               </div>
            </div>
         )}

         {activeTab === 'wallets' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Wallet <span className="text-primary">Mastery</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Manual Warrior Portfolio Intervention</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* SEARCH NODE */}
                  <Card className="lg:col-span-1 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 border-2">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Search className="text-primary" /> User Hub</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground">Warrior Email</Label>
                           <Input 
                              value={searchQuery} 
                              onChange={e => setSearchTerm(e.target.value)} 
                              placeholder="Enter email..." 
                              className="bg-black border-white/10 h-12 rounded-xl" 
                           />
                        </div>
                        <Button onClick={handleUserSearch} disabled={isProcessing === 'search'} className="w-full h-12 bg-primary font-black uppercase italic rounded-xl">
                           {isProcessing === 'search' ? <Loader2 className="animate-spin" /> : "INSPECT SIGNAL"}
                        </Button>
                     </div>

                     {targetUser && (
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4 animate-in slide-in-from-top-4">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-muted-foreground">Target Profile</p>
                              <p className="text-sm font-black text-white truncate">{targetUser.email}</p>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                 <p className="text-[8px] font-black text-muted-foreground uppercase">Coins</p>
                                 <p className="text-lg font-black text-primary italic">{targetUser.coins.toLocaleString()}</p>
                              </div>
                              <div className="text-center">
                                 <p className="text-[8px] font-black text-muted-foreground uppercase">Rev Share</p>
                                 <p className="text-lg font-black text-green-500 italic">${targetUser.pendingRevenueShare.toFixed(2)}</p>
                              </div>
                           </div>
                        </div>
                     )}
                  </Card>

                  {/* ADJUSTMENT TERMINAL */}
                  <Card className={cn(
                    "lg:col-span-2 bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-2 transition-all",
                    !targetUser && "opacity-30 grayscale pointer-events-none"
                  )}>
                     <h3 className="text-2xl font-black uppercase italic flex items-center gap-4"><Zap className="text-amber-500" /> Adjustment Terminal</h3>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase text-muted-foreground">Adjustment Volume</Label>
                              <div className="relative">
                                 <Input 
                                   type="number" 
                                   value={adjustAmount} 
                                   onChange={e => setAdjustAmount(e.target.value)} 
                                   placeholder="0.00" 
                                   className="h-16 bg-black border-white/10 rounded-2xl font-black text-2xl text-primary" 
                                 />
                                 <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <button onClick={() => setAdjustUnit('coin')} className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all", adjustUnit === 'coin' ? "bg-primary text-white" : "bg-white/5 text-muted-foreground")}>COIN</button>
                                    <button onClick={() => setAdjustUnit('inr')} className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all", adjustUnit === 'inr' ? "bg-green-500 text-white" : "bg-white/5 text-muted-foreground")}>INR</button>
                                 </div>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[9px] font-black uppercase text-muted-foreground">Audit Remark (Mandatory)</Label>
                              <Input 
                                value={adjustRemark} 
                                onChange={e => setAdjustRemark(e.target.value)} 
                                placeholder="E.G. COMPENSATION REWARD" 
                                className="h-12 bg-black border-white/10 rounded-xl font-bold uppercase text-[10px]" 
                              />
                           </div>
                        </div>

                        <div className="flex flex-col gap-4 justify-center">
                           <Button 
                             onClick={() => handleWalletAdjustment('credit')} 
                             disabled={isProcessing === 'adjustment'}
                             className="h-16 bg-green-600 hover:bg-green-500 font-black uppercase italic text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3"
                           >
                              {isProcessing === 'adjustment' ? <Loader2 className="animate-spin" /> : <><PlusCircle /> CREDIT FUNDS</>}
                           </Button>
                           <Button 
                             onClick={() => handleWalletAdjustment('debit')} 
                             disabled={isProcessing === 'adjustment'}
                             className="h-16 bg-red-600 hover:bg-red-500 font-black uppercase italic text-lg rounded-2xl shadow-xl flex items-center justify-center gap-3"
                           >
                              {isProcessing === 'adjustment' ? <Loader2 className="animate-spin" /> : <><MinusCircle /> DEBIT FUNDS</>}
                           </Button>
                        </div>
                     </div>

                     <div className="p-5 bg-white/5 border border-white/5 rounded-2xl flex items-start gap-4">
                        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest italic">
                           Each adjustment node generates a double-entry signal: One in the warrior's ledger and one in the encrypted admin audit hub. Signals are immutable once finalized.
                        </p>
                     </div>
                  </Card>
               </div>
            </div>
         )}

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

function EconomyCard({ label, value, onChange, onSave, icon, isSaving }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 border-2 hover:border-primary/20 transition-all group">
         <div className="flex items-center justify-between">
            <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
               {icon}
            </div>
            <Badge variant="outline" className="text-[7px] font-black uppercase tracking-widest border-white/10 opacity-40">Industrial Node</Badge>
         </div>
         <div className="space-y-2">
            <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
            <div className="flex gap-2">
               <Input 
                 type="number" 
                 value={value} 
                 onChange={e => onChange(e.target.value)} 
                 className="bg-black border-white/10 h-12 rounded-xl font-black text-xl text-primary text-center" 
               />
               <Button onClick={onSave} disabled={isSaving} className="h-12 w-12 bg-white/5 border border-white/10 rounded-xl hover:bg-primary transition-all">
                  {isSaving ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-5 w-5" />}
               </Button>
            </div>
         </div>
      </Card>
   );
}
