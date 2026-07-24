
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDocs, limit, writeBatch, increment, orderBy } from 'firebase/firestore';
import { 
  Loader2, Zap, Wallet, LayoutGrid, DollarSign, ArrowRightLeft, 
  Search, Palette, CheckCircle2, 
  Star, Volume2, Music, Play, Bell, Eye, EyeOff, BarChart3, TrendingUp,
  Users as UsersIcon, ShieldAlert, UserCheck, Globe, ShieldX, Terminal, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, UserProfile, PlatformRevenue } from '../lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '../lib/module-registry';
import { MONETIZATION_REGISTRY, MonCategory } from '../lib/monetization-registry';
import { MASTER_THEMES } from '@/app/lib/themes';
import { MASTER_SOUNDS } from '@/app/lib/sounds';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';
const APP_CATEGORIES: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];
const MON_CATEGORIES: MonCategory[] = ['Ads', 'CPA', 'Surveys', 'MicroTasks', 'Fintech', 'Gaming', 'Premium'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'apis' | 'warriors' | 'wallets' | 'revenue' | 'currency' | 'branding' | 'sounds'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // States for forms
  const [searchQuery, setSearchTerm] = useState('');
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');
  const [adjustUnit, setAdjustUnit] = useState<'coin' | 'inr'>('coin');
  const [soundSearch, setSoundSearch] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [apiSearchTerm, setApiSearchTerm] = useState('');

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);

  // Warriors List Query
  const warriorsQuery = useMemoFirebase(() => {
     if (!firestore) return null;
     return query(collection(firestore, 'users'), orderBy('joinedAt', 'desc'), limit(100));
  }, [firestore]);
  const { data: warriors, isLoading: warriorsLoading } = useCollection<UserProfile>(warriorsQuery);

  const updateSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL SYNCED", description: `${key} updated successfully.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
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
        toast({ variant: "destructive", title: "WARRIOR NOT FOUND" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "SEARCH ERROR" });
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
     if (!firestore) return;
     setIsProcessing(`suspend-${userId}`);
     try {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, { isSuspended: !currentStatus });
        toast({ 
           title: !currentStatus ? "WARRIOR SUSPENDED" : "SIGNAL RESTORED",
           description: !currentStatus ? "Access to payout terminal locked." : "Full node access granted."
        });
     } catch (e) {
        toast({ variant: "destructive", title: "LOCKDOWN FAILED" });
     } finally {
        setIsProcessing(null);
     }
  };

  const handleWalletAdjustment = async (mode: 'credit' | 'debit') => {
    if (!firestore || !targetUser || !adjustAmount || !adjustRemark) return;
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsProcessing('adjustment');
    try {
      const finalCoinAmount = adjustUnit === 'coin' ? amt : amt * (settings?.coinsPerINR || 100);
      const multiplier = mode === 'credit' ? 1 : -1;
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', targetUser.id);
      
      batch.update(userRef, {
        coins: increment(finalCoinAmount * multiplier),
        winningBalance: increment(finalCoinAmount * multiplier)
      });

      batch.set(doc(collection(firestore, 'users', targetUser.id, 'ledger')), {
        type: mode === 'credit' ? 'admin_credit' : 'admin_debit',
        amount: finalCoinAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Admin Adjustment: ${adjustRemark}`
      });

      await batch.commit();
      toast({ title: "WALLET CALIBRATED" });
      setTargetUser(null);
      setAdjustAmount('');
      setAdjustRemark('');
    } catch (e) {
      toast({ variant: "destructive", title: "ADJUSTMENT FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const previewSound = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

  const filteredSounds = MASTER_SOUNDS.filter(s => 
    s.name.toLowerCase().includes(soundSearch.toLowerCase()) || 
    s.category.toLowerCase().includes(soundSearch.toLowerCase())
  );

  const filteredWarriors = warriors?.filter(w => 
    w.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    w.referralCode?.toLowerCase().includes(userSearchTerm.toLowerCase())
  ) || [];

  const filteredApis = MONETIZATION_REGISTRY.filter(m => 
    m.label.toLowerCase().includes(apiSearchTerm.toLowerCase()) || 
    m.provider.toLowerCase().includes(apiSearchTerm.toLowerCase())
  );

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black">ACCESS DENIED</div>;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <header className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
            <p className="text-sm font-black uppercase italic">Admin <span className="text-primary">Hub</span></p>
         </div>
         <Badge variant="outline" className="border-green-500/20 text-green-500 text-[8px] font-black uppercase">v220.0 Active</Badge>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-6xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'apis'} label="APIs (100+)" icon={<Terminal className="h-3 w-3" />} onClick={() => setActiveTab('apis')} />
            <NavPill active={activeTab === 'warriors'} label="Warriors" icon={<UsersIcon className="h-3 w-3" />} onClick={() => setActiveTab('warriors')} />
            <NavPill active={activeTab === 'branding'} label="Themes" icon={<Palette className="h-3 w-3" />} onClick={() => setActiveTab('branding')} />
            <NavPill active={activeTab === 'sounds'} label="Sounds" icon={<Volume2 className="h-3 w-3" />} onClick={() => setActiveTab('sounds')} />
            <NavPill active={activeTab === 'revenue'} label="Revenue" icon={<BarChart3 className="h-3 w-3" />} onClick={() => setActiveTab('revenue')} />
            <NavPill active={activeTab === 'wallets'} label="Adjust" icon={<Wallet className="h-3 w-3" />} onClick={() => setActiveTab('wallets')} />
            <NavPill active={activeTab === 'currency'} label="Economy" icon={<ArrowRightLeft className="h-3 w-3" />} onClick={() => setActiveTab('currency')} />
         </div>

         {/* APIs TAB (100+) */}
         {activeTab === 'apis' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                     <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">API <span className="text-primary">Command Hub</span></h2>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">100+ Monetization & Postback Signal Control</p>
                  </div>
                  <div className="relative w-full md:w-80">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input 
                       value={apiSearchTerm}
                       onChange={e => setApiSearchTerm(e.target.value)}
                       placeholder="SEARCH 100+ APIs..." 
                       className="h-12 bg-black border-white/10 rounded-xl pl-12 font-black uppercase text-[10px] tracking-widest"
                     />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {MON_CATEGORIES.map(cat => {
                    const catApis = filteredApis.filter(m => m.category === cat);
                    if (catApis.length === 0) return null;
                    
                    return (
                      <Card key={cat} className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6">
                         <h3 className="text-lg font-black uppercase italic text-primary flex items-center gap-3">
                            <Terminal className="h-4 w-4" /> {cat} Networks
                         </h3>
                         <div className="grid gap-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                            {catApis.map(api => (
                              <div key={api.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-primary/20 transition-all">
                                 <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-white/5">
                                       <api.icon size={18} />
                                    </div>
                                    <div className="space-y-0.5">
                                       <p className="text-[10px] font-black uppercase tracking-widest text-white">{api.label}</p>
                                       <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-[6px] font-black uppercase border-white/10 opacity-60">{api.provider}</Badge>
                                          {api.eCPMTier === 'High' && <Badge className="bg-amber-500/20 text-amber-500 border-none text-[6px] font-black uppercase px-1.5 italic">ELITE</Badge>}
                                       </div>
                                    </div>
                                 </div>
                                 <Switch 
                                   checked={!!(settings as any)?.[api.visibilityKey]} 
                                   onCheckedChange={(v) => updateSetting(api.visibilityKey, v)} 
                                 />
                              </div>
                            ))}
                         </div>
                      </Card>
                    );
                  })}
               </div>
            </div>
         )}

         {/* WARRIORS LIST TAB */}
         {activeTab === 'warriors' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                     <h2 className="text-4xl font-black uppercase italic tracking-tighter">Warrior <span className="text-primary">Registry</span></h2>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Automated User Analytics & Monitoring</p>
                  </div>
                  <div className="relative w-full md:w-80">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input 
                       value={userSearchTerm}
                       onChange={e => setUserSearchTerm(e.target.value)}
                       placeholder="SEARCH WARRIOR GMAIL..." 
                       className="h-12 bg-black border-white/10 rounded-xl pl-12 font-black uppercase text-[10px] tracking-widest"
                     />
                  </div>
               </div>

               {warriorsLoading ? (
                 <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
               ) : (
                 <div className="grid gap-4">
                    {filteredWarriors.map((w) => (
                      <Card key={w.id} className={cn(
                        "bg-[#0a0a0f] border-white/5 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 transition-all",
                        w.isSuspended ? "opacity-50 grayscale border-red-500/20" : "hover:border-primary/20"
                      )}>
                         <div className="flex items-center gap-6 w-full md:w-auto">
                            <div className={cn(
                              "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl",
                              w.isSuspended ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                            )}>
                               {w.email?.[0].toUpperCase() || 'U'}
                            </div>
                            <div className="space-y-1">
                               <p className="text-sm font-black uppercase italic text-white truncate max-w-[200px]">{w.email || 'Anonymous'}</p>
                               <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[7px] font-black uppercase border-white/10">{w.rank || 'Bronze'}</Badge>
                                  <Badge className="bg-white/5 text-muted-foreground border-none text-[7px] font-black uppercase px-2 italic">{w.country || 'Global'}</Badge>
                               </div>
                            </div>
                         </div>

                         <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                            <UserHisaab label="Coin Pulse" value={w.coins?.toLocaleString()} unit="🪙" />
                            <UserHisaab label="Mission Yield" value={w.taskBalance?.toLocaleString()} unit="🪙" />
                            <UserHisaab label="Rev Share" value={`$${(w.pendingRevenueShare || 0).toFixed(2)}`} />
                            <UserHisaab label="Recruits" value={w.totalReferrals || 0} />
                         </div>

                         <div className="flex items-center gap-4 border-l border-white/5 pl-6 w-full md:w-auto justify-between md:justify-start">
                            <div className="text-right">
                               <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Node Status</p>
                               <Badge className={cn("px-4 py-1 text-[8px] font-black uppercase", w.isSuspended ? "bg-red-600" : "bg-green-600")}>
                                  {w.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                               </Badge>
                            </div>
                            <Button 
                              onClick={() => toggleSuspension(w.id, w.isSuspended || false)}
                              disabled={isProcessing === `suspend-${w.id}`}
                              variant="ghost" 
                              className={cn(
                                "h-12 w-12 rounded-xl border flex items-center justify-center transition-all",
                                w.isSuspended ? "border-green-500/20 text-green-500 hover:bg-green-500/10" : "border-red-500/20 text-red-500 hover:bg-red-500/10"
                              )}
                            >
                               {isProcessing === `suspend-${w.id}` ? <Loader2 className="animate-spin" /> : w.isSuspended ? <UserCheck /> : <ShieldX />}
                            </Button>
                         </div>
                      </Card>
                    ))}
                    {filteredWarriors.length === 0 && (
                      <div className="py-20 text-center space-y-4 border-2 border-dashed border-white/5 rounded-[2rem]">
                         <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto opacity-10" />
                         <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.4em] italic">No matching warrior nodes found</p>
                      </div>
                    )}
                 </div>
               )}
            </div>
         )}

         {/* VISIBILITY TAB */}
         {activeTab === 'visibility' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Module <span className="text-primary">Gate</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Global Sector Visibility Control</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {APP_CATEGORIES.map(cat => (
                    <Card key={cat} className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6">
                       <h3 className="text-lg font-black uppercase italic text-primary flex items-center gap-3">
                          <LayoutGrid className="h-4 w-4" /> {cat} Sector
                       </h3>
                       <div className="space-y-4">
                          {MODULE_REGISTRY.filter(m => m.category === cat).map(module => (
                            <div key={module.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-primary/20 transition-all">
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                     <module.icon size={16} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">{module.label}</span>
                               </div>
                               <Switch 
                                 checked={!!(settings as any)?.[module.visibilityKey]} 
                                 onCheckedChange={(v) => updateSetting(module.visibilityKey, v)} 
                               />
                            </div>
                          ))}
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
         )}

         {/* REVENUE TAB */}
         {activeTab === 'revenue' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Platform <span className="text-primary">Yield</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Industrial Revenue Analytics</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <RevenueStat label="Total Operational Revenue" value={`$${(stats?.totalOperationalRevenueUSD || 0).toFixed(2)}`} icon={<DollarSign />} color="text-white" />
                  <RevenueStat label="Admin Profit (80%)" value={`$${(stats?.totalAdminProfitUSD || 0).toFixed(2)}`} icon={<TrendingUp />} color="text-primary" />
                  <RevenueStat label="User Dividends (20%)" value={`$${(stats?.totalUserDividendUSD || 0).toFixed(2)}`} icon={<Zap />} color="text-green-500" />
               </div>

               <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6">
                  <h3 className="text-xl font-black uppercase italic flex items-center gap-3">Revenue Configuration</h3>
                  <div className="space-y-4 max-w-sm">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">User Share Percent (%)</Label>
                        <Input 
                          type="number" 
                          value={settings?.userRevenueSharePercent || 20} 
                          onChange={e => updateSetting('userRevenueSharePercent', parseFloat(e.target.value))} 
                          className="h-12 bg-black border-white/10 rounded-xl font-black text-primary"
                        />
                     </div>
                  </div>
               </Card>
            </div>
         )}

         {/* ECONOMY TAB */}
         {activeTab === 'currency' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Economy <span className="text-primary">Matrix</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Dynamic Currency & Profit Ratios</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6">
                     <h3 className="text-xl font-black uppercase italic">Coin Exchange Rates</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Coins per 1 INR (₹)</Label>
                           <Input 
                             type="number" 
                             value={settings?.coinsPerINR || 100} 
                             onChange={e => updateSetting('coinsPerINR', parseFloat(e.target.value))} 
                             className="h-12 bg-black border-white/10 rounded-xl"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Coins per 1 USD ($)</Label>
                           <Input 
                             type="number" 
                             value={settings?.coinsPerUSD || 1000} 
                             onChange={e => updateSetting('coinsPerUSD', parseFloat(e.target.value))} 
                             className="h-12 bg-black border-white/10 rounded-xl"
                           />
                        </div>
                     </div>
                  </Card>

                  <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6">
                     <h3 className="text-xl font-black uppercase italic">Reward Multipliers</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">CPA Multiplier</Label>
                           <Input 
                             type="number" 
                             step="0.1"
                             value={settings?.cpaRewardMultiplier || 1.0} 
                             onChange={e => updateSetting('cpaRewardMultiplier', parseFloat(e.target.value))} 
                             className="h-12 bg-black border-white/10 rounded-xl"
                           />
                        </div>
                     </div>
                  </Card>
               </div>
            </div>
         )}

         {/* SOUNDS TAB */}
         {activeTab === 'sounds' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Sonic <span className="text-primary">Terminal</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">120+ Industrial Audio Signals</p>
               </div>

               <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 border-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3">
                        <Music className="text-primary" /> Audio Matrix
                     </h3>
                     <Input 
                       value={soundSearch}
                       onChange={e => setSoundSearch(e.target.value)}
                       placeholder="Search 120+ sounds..." 
                       className="h-10 bg-black border-white/10 w-full sm:w-64 text-[10px] uppercase font-bold"
                     />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                     {filteredSounds.map((sound) => {
                        const isCurrentReward = settings?.globalRewardSoundUrl === sound.url;
                        return (
                          <div key={sound.id} className={cn(
                             "p-4 rounded-2xl border-2 transition-all group flex items-center justify-between",
                             isCurrentReward ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:border-white/20"
                          )}>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase italic truncate max-w-[120px]">{sound.name}</p>
                                <Badge className="bg-black/40 text-[7px] font-black uppercase px-2">{sound.category}</Badge>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => previewSound(sound.url)} className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary transition-all">
                                   <Play className="h-3 w-3 fill-white" />
                                </button>
                                <button 
                                  onClick={() => updateSetting('globalRewardSoundUrl', sound.url)}
                                  className={cn("h-8 px-3 rounded-lg text-[8px] font-black uppercase transition-all", isCurrentReward ? "bg-green-600" : "bg-white/10 hover:bg-primary")}
                                >
                                   {isCurrentReward ? "ACTIVE" : "SET GLOBAL"}
                                </button>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </Card>
            </div>
         )}

         {/* THEMES TAB */}
         {activeTab === 'branding' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Theme <span className="text-primary">Terminal</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">100+ Programmable High-Fidelity Styles</p>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-1 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 border-2">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3">Visual Assets</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground">Custom Logo URL</Label>
                           <Input value={settings?.customLogoUrl || ''} onChange={e => updateSetting('customLogoUrl', e.target.value)} className="bg-black border-white/10 h-12 rounded-xl text-xs" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20">
                           <p className="text-[10px] font-black uppercase">Festival Mode</p>
                           <Switch checked={!!settings?.festivalModeActive} onCheckedChange={(v) => updateSetting('festivalModeActive', v)} />
                        </div>
                     </div>
                  </Card>
                  <Card className="lg:col-span-2 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 border-2">
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                        {MASTER_THEMES.map((theme) => (
                           <button
                              key={theme.id}
                              onClick={() => updateSetting('currentThemeId', theme.id)}
                              className={cn(
                                 "p-4 rounded-2xl border-2 transition-all relative overflow-hidden",
                                 settings?.currentThemeId === theme.id ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"
                              )}
                              style={{ borderLeftColor: `hsl(${theme.primary})`, borderLeftWidth: '8px' }}
                           >
                              <div className="space-y-2 text-left">
                                 <p className="text-[10px] font-black uppercase italic truncate">{theme.name}</p>
                                 <Badge className="bg-black/40 text-[7px] font-black uppercase px-2">{theme.category}</Badge>
                              </div>
                           </button>
                        ))}
                     </div>
                  </Card>
               </div>
            </div>
         )}

         {/* WALLET ADJUST TAB */}
         {activeTab === 'wallets' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Wallet <span className="text-primary">Mastery</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Manual Warrior Portfolio Intervention</p>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-1 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 border-2">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Search className="text-primary" /> User Hub</h3>
                     <div className="space-y-4">
                        <Input value={searchQuery} onChange={e => setSearchTerm(e.target.value)} placeholder="Warrior email..." className="bg-black border-white/10 h-12 rounded-xl" />
                        <Button onClick={handleUserSearch} disabled={isProcessing === 'search'} className="w-full h-12 bg-primary font-black uppercase italic rounded-xl">
                           {isProcessing === 'search' ? <Loader2 className="animate-spin" /> : "INSPECT SIGNAL"}
                        </Button>
                     </div>
                     {targetUser && (
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                           <p className="text-[10px] font-black uppercase text-muted-foreground">Target: {targetUser.email}</p>
                           <p className="text-lg font-black text-primary italic">{targetUser.coins.toLocaleString()} 🪙</p>
                        </div>
                     )}
                  </Card>
                  <Card className={cn("lg:col-span-2 bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-2", !targetUser && "opacity-30 grayscale pointer-events-none")}>
                     <h3 className="text-2xl font-black uppercase italic"><Zap className="text-amber-500" /> Adjustment Terminal</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="0.00" className="h-16 bg-black border-white/10 rounded-2xl font-black text-2xl text-primary" />
                           <Input value={adjustRemark} onChange={e => setAdjustRemark(e.target.value)} placeholder="Remark..." className="h-12 bg-black border-white/10 rounded-xl uppercase text-[10px]" />
                        </div>
                        <div className="flex flex-col gap-4">
                           <Button onClick={() => handleWalletAdjustment('credit')} className="h-16 bg-green-600 font-black uppercase italic rounded-2xl shadow-xl">CREDIT FUNDS</Button>
                           <Button onClick={() => handleWalletAdjustment('debit')} className="h-16 bg-red-600 font-black uppercase italic rounded-2xl shadow-xl">DEBIT FUNDS</Button>
                        </div>
                     </div>
                  </Card>
               </div>
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

function RevenueStat({ label, value, icon, color }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2rem] space-y-4 shadow-xl border-2">
         <div className={cn("h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center", color)}>{icon}</div>
         <div>
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1 italic">{label}</p>
            <h4 className={cn("text-3xl font-black italic", color)}>{value}</h4>
         </div>
      </Card>
   );
}

function UserHisaab({ label, value, unit }: any) {
   return (
      <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-center">
         <p className="text-[7px] font-black uppercase text-muted-foreground tracking-tighter mb-0.5">{label}</p>
         <p className="text-xs font-black text-white italic tabular-nums">{value} <span className="text-[8px] opacity-40">{unit}</span></p>
      </div>
   );
}
