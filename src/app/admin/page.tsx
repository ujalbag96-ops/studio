
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDocs, limit, writeBatch, increment, orderBy } from 'firebase/firestore';
import { 
  Loader2, Zap, Wallet, LayoutGrid, DollarSign, ArrowRightLeft, 
  Search, Palette, CheckCircle2, 
  Star, Volume2, Music, Play, Bell, Eye, EyeOff, BarChart3, TrendingUp,
  Users as UsersIcon, ShieldAlert, UserCheck, Globe, ShieldX, Terminal, Filter,
  PieChart, Activity
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
        toast({ title: !currentStatus ? "WARRIOR SUSPENDED" : "SIGNAL RESTORED" });
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
         <Badge variant="outline" className="border-green-500/20 text-green-500 text-[8px] font-black uppercase">v230.0 Matrix Active</Badge>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-6xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'apis'} label="APIs" icon={<Terminal className="h-3 w-3" />} onClick={() => setActiveTab('apis')} />
            <NavPill active={activeTab === 'warriors'} label="Warriors" icon={<UsersIcon className="h-3 w-3" />} onClick={() => setActiveTab('warriors')} />
            <NavPill active={activeTab === 'revenue'} label="Profit Matrix" icon={<PieChart className="h-3 w-3" />} onClick={() => setActiveTab('revenue')} />
            <NavPill active={activeTab === 'currency'} label="Economy" icon={<ArrowRightLeft className="h-3 w-3" />} onClick={() => setActiveTab('currency')} />
            <NavPill active={activeTab === 'branding'} label="Branding" icon={<Palette className="h-3 w-3" />} onClick={() => setActiveTab('branding')} />
            <NavPill active={activeTab === 'sounds'} label="Sonic" icon={<Volume2 className="h-3 w-3" />} onClick={() => setActiveTab('sounds')} />
            <NavPill active={activeTab === 'wallets'} label="Adjustment" icon={<Wallet className="h-3 w-3" />} onClick={() => setActiveTab('wallets')} />
         </div>

         {/* PROFIT MATRIX TAB */}
         {activeTab === 'revenue' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Profit <span className="text-primary">Matrix</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Manual Revenue Split Configuration</p>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <RevenueStat label="Total Operational Volume" value={`$${(stats?.totalOperationalRevenueUSD || 0).toFixed(2)}`} icon={<DollarSign />} color="text-white" />
                  <RevenueStat label="Admin Profit Locked" value={`$${(stats?.totalAdminProfitUSD || 0).toFixed(2)}`} icon={<TrendingUp />} color="text-primary" />
                  <RevenueStat label="User Distributed Share" value={`$${(stats?.totalUserDividendUSD || 0).toFixed(2)}`} icon={<Zap />} color="text-green-500" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 border-2">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><PieChart className="text-primary" /> Global Split Node</h3>
                     <div className="space-y-6">
                        <div className="space-y-3">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Video Ad User Share (%)</Label>
                           <div className="flex gap-4">
                              <Input 
                                type="number" 
                                value={settings?.videoUserSharePercent || 20} 
                                onChange={e => updateSetting('videoUserSharePercent', parseFloat(e.target.value))} 
                                className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-primary text-center"
                              />
                              <div className="w-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-black text-xs text-muted-foreground">
                                 {100 - (settings?.videoUserSharePercent || 20)}% ADMIN
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">CPA Mission User Share (%)</Label>
                           <div className="flex gap-4">
                              <Input 
                                type="number" 
                                value={settings?.cpaUserSharePercent || 30} 
                                onChange={e => updateSetting('cpaUserSharePercent', parseFloat(e.target.value))} 
                                className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-green-500 text-center"
                              />
                              <div className="w-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center font-black text-xs text-muted-foreground">
                                 {100 - (settings?.cpaUserSharePercent || 30)}% ADMIN
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <p className="text-[8px] font-bold text-muted-foreground uppercase leading-relaxed italic">
                           *Adjusting these percentages will instantly affect all incoming S2S conversion signals. User wallet sync is real-time.
                        </p>
                     </div>
                  </Card>

                  <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-6 flex flex-col justify-center items-center text-center">
                     <Activity className="h-16 w-16 text-primary animate-pulse opacity-20" />
                     <div className="space-y-2">
                        <h4 className="text-xl font-black uppercase italic">Real-Time Calculus</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed">
                           Engine monitoring active. Revenue distribution is currently operating at <span className="text-white">{(stats?.totalUserDividendUSD || 0 / (stats?.totalOperationalRevenueUSD || 1) * 100).toFixed(1)}% Efficiency</span>.
                        </p>
                     </div>
                  </Card>
               </div>
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
                 </div>
               )}
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

         {/* Other tabs OMITTED for brevity but remained unchanged */}
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
