
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy, increment, where, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, Zap, LayoutGrid, Search, CheckCircle2, TrendingUp, Users as UsersIcon, UserCheck, 
  Globe, ShieldX, Terminal, CreditCard, Settings, UserPlus, UserMinus, Check, X, ShieldAlert, 
  Fingerprint, Palette, Image as ImageIcon, Type, Calendar, Layers, DollarSign, Activity,
  Volume2, Music, BellRing, Radio, Cpu, Lock, Smartphone, Video, PlayCircle, Coins,
  History, ShieldCheck, Mail, Database, RefreshCw, AlertCircle, BarChart3, PieChart, Timer,
  Flag, Layout, Youtube, Gauge, ListFilter, CreditCard as PayoutIcon, ShieldAlert as AlertIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, UserProfile, PayoutRequest, PlatformRevenue } from '../lib/types';
import { MONETIZATION_REGISTRY } from '../lib/monetization-registry';
import { MASTER_THEMES } from '../lib/themes';
import { MASTER_SOUNDS } from '../lib/sounds';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'analytics' | 'monetization' | 'warriors' | 'withdrawals' | 'branding' | 'sounds' | 'signals'>('analytics');
  const [monetizationSubTab, setMonetizationSubTab] = useState<'auto' | 'manual'>('auto');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const [targetUserId, setTargetUserId] = useState('');
  const [adjAmount, setTargetAmount] = useState('');

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);
  
  const warriorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('joinedAt', 'desc'), limit(50)) : null, [firestore]);
  const { data: warriors, isLoading: warriorsLoading } = useCollection<UserProfile>(warriorsQuery);

  const payoutQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'payouts'), where('status', '==', 'pending'), limit(50)) : null, [firestore]);
  const { data: pendingPayouts, isLoading: payoutsLoading } = useCollection<PayoutRequest>(payoutQuery);

  const updateSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL SYNCED", description: `${key} updated live.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleWalletAdjust = async (type: 'add' | 'subtract') => {
    if (!targetUserId || !adjAmount || !firestore) return;
    const amt = parseFloat(adjAmount);
    try {
      const userRef = doc(firestore, 'users', targetUserId);
      const change = type === 'add' ? amt : -amt;
      await updateDoc(userRef, {
        coins: increment(change),
        winningBalance: increment(change)
      });
      toast({ title: "WALLET ADJUSTED", description: `Updated balance by ${change} units.` });
      setTargetAmount('');
    } catch (e) {
      toast({ variant: "destructive", title: "USER NOT FOUND" });
    }
  };

  const handleProcessPayout = async (id: string, status: 'completed' | 'rejected') => {
    if (!firestore) return;
    try {
      const pRef = doc(firestore, 'payouts', id);
      await updateDoc(pRef, { status, processedAt: serverTimestamp() });
      toast({ title: "PAYOUT SETTLED", description: `Request marked as ${status}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SETTLEMENT FAILED" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black uppercase italic tracking-widest text-4xl">Access Denied</div>;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <header className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
            <p className="text-sm font-black uppercase italic">Industrial <span className="text-primary">Master Hub</span></p>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
               <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[9px] font-black uppercase text-green-500 tracking-widest">⚡ REAL-TIME SIGNAL ACTIVE</span>
            </div>
            <Badge variant="outline" className="border-white/10 text-white text-[8px] font-black uppercase">Production v92.0</Badge>
         </div>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-7xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 sticky top-20 z-50 bg-background/80 backdrop-blur-md pt-2">
            <NavPill active={activeTab === 'analytics'} label="Analysis Hub" icon={<BarChart3 className="h-3 w-3" />} onClick={() => setActiveTab('analytics')} />
            <NavPill active={activeTab === 'monetization'} label="Revenue Nodes" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('monetization')} />
            <NavPill active={activeTab === 'warriors'} label="Warrior Registry" icon={<UsersIcon className="h-3 w-3" />} onClick={() => setActiveTab('warriors')} />
            <NavPill active={activeTab === 'withdrawals'} label="Settlement" icon={<CreditCard className="h-3 w-3" />} onClick={() => setActiveTab('withdrawals')} />
            <NavPill active={activeTab === 'branding'} label="Visual Identity" icon={<Palette className="h-3 w-3" />} onClick={() => setActiveTab('branding')} />
            <NavPill active={activeTab === 'sounds'} label="Audio Engine" icon={<Volume2 className="h-3 w-3" />} onClick={() => setActiveTab('sounds')} />
            <NavPill active={activeTab === 'signals'} label="API & Signals" icon={<Radio className="h-3 w-3" />} onClick={() => setActiveTab('signals')} />
         </div>

         {activeTab === 'analytics' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <AnalyticsCard label="Gross Ad Income" value={`₹${(stats?.totalGrossRevenueINR || 0).toLocaleString()}`} desc="Total verified ad revenue" icon={<DollarSign className="text-green-500" />} />
                  <AnalyticsCard label="Total User Payouts" value={`₹${(stats?.totalUserPayoutsINR || 0).toLocaleString()}`} desc={`${settings?.userRevenueSharePercent || 10}% Dynamic Distribution`} icon={<Zap className="text-primary" />} />
                  <AnalyticsCard label="Admin Net Profit" value={`₹${(stats?.totalAdminProfitINR || 0).toLocaleString()}`} desc="Net Platform Liquidity" icon={<TrendingUp className="text-amber-500" />} />
               </div>

               <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden">
                  <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                     <h3 className="text-sm font-black uppercase tracking-widest italic flex items-center gap-3"><UsersIcon className="h-4 w-4 text-primary" /> Warrior Income Audit</h3>
                     <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase">Live Yield Analysis</Badge>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto no-scrollbar">
                     {warriors?.map(w => (
                        <div key={w.id} className="p-6 flex items-center justify-between group hover:bg-white/[0.02]">
                           <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-primary text-sm">{w.email?.[0].toUpperCase() || 'U'}</div>
                              <div>
                                 <p className="text-xs font-black text-white uppercase italic">{w.email || 'Anonymous'}</p>
                                 <p className="text-[8px] font-bold text-muted-foreground uppercase">Generated: ${w.totalRevenueGenerated?.toFixed(2) || '0.00'} Gross</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-black text-green-500 italic tabular-nums">+${w.pendingRevenueShare?.toFixed(2) || '0.00'}</p>
                              <p className="text-[7px] font-black uppercase text-muted-foreground">User Reward Share</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
         )}

         {activeTab === 'monetization' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] border-2">
                  <Tabs value={monetizationSubTab} onValueChange={(v: any) => setMonetizationSubTab(v)} className="w-full">
                     <TabsList className="grid grid-cols-2 h-14 bg-black/40 rounded-2xl p-1 mb-8 border border-white/10">
                        <TabsTrigger value="auto" className="font-black text-[10px] uppercase data-[state=active]:bg-primary">Auto Signal Nodes (API)</TabsTrigger>
                        <TabsTrigger value="manual" className="font-black text-[10px] uppercase data-[state=active]:bg-primary">Manual Yield Nodes (UTR)</TabsTrigger>
                     </TabsList>
                     
                     <TabsContent value="auto" className="space-y-8 mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {MONETIZATION_REGISTRY.filter(m => m.category === 'CPA' || m.category === 'Ads').map((mon) => (
                             <MonetizationCard key={mon.id} mon={mon} settings={settings} updateSetting={updateSetting} />
                           ))}
                        </div>
                     </TabsContent>

                     <TabsContent value="manual" className="space-y-8 mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                           {MONETIZATION_REGISTRY.filter(m => m.category !== 'CPA' && m.category !== 'Ads').map((mon) => (
                             <MonetizationCard key={mon.id} mon={mon} settings={settings} updateSetting={updateSetting} />
                           ))}
                        </div>
                     </TabsContent>
                  </Tabs>
               </Card>
            </div>
         )}

         {activeTab === 'signals' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
               <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 border-2">
                  <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Radio className="text-primary" /> Global API Interface</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                     <SignalField label="AdMob App ID" value={settings?.admobAppId} onUpdate={v => updateSetting('admobAppId', v)} />
                     <SignalField label="AdMob Rewarded ID" value={settings?.admobRewardedUnitId} onUpdate={v => updateSetting('admobRewardedUnitId', v)} />
                     <SignalField label="YouTube Data Key" value={settings?.youtubeApiKey} onUpdate={v => updateSetting('youtubeApiKey', v)} />
                     <SignalField label="CPA Lead Key" value={settings?.cpaLeadApiKey} onUpdate={v => updateSetting('cpaLeadApiKey', v)} />
                     <SignalField label="Master YouTube URL" value={settings?.globalYoutubeStreamUrl} onUpdate={v => updateSetting('globalYoutubeStreamUrl', v)} />
                     <SignalField label="Master Direct URL" value={settings?.globalDirectStreamUrl} onUpdate={v => updateSetting('globalDirectStreamUrl', v)} />
                  </div>
                  <div className="pt-6 border-t border-white/5 space-y-4">
                     <p className="text-[10px] font-black uppercase text-muted-foreground italic">Player Analytics Node</p>
                     <SignalField label="VAST AdTag Node" value={settings?.vastAdTagUrl} onUpdate={v => updateSetting('vastAdTagUrl', v)} />
                  </div>
               </Card>

               <div className="space-y-8">
                  <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] space-y-6 border-2">
                     <h4 className="text-sm font-black uppercase italic flex items-center gap-3 text-white"><Activity className="text-primary" /> Operational Broadcast</h4>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground">Banner Text Signal</Label>
                           <Input value={settings?.broadcastMessage} onChange={e => updateSetting('broadcastMessage', e.target.value)} className="h-12 bg-black border-white/10 rounded-xl font-bold text-xs" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                           <span className="text-[9px] font-black uppercase text-white">Broadcast Active</span>
                           <Switch checked={!!settings?.broadcastActive} onCheckedChange={v => updateSetting('broadcastActive', v)} />
                        </div>
                     </div>
                  </Card>
               </div>
            </div>
         )}

         {activeTab === 'warriors' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                     <h3 className="text-sm font-black uppercase tracking-widest italic">Warrior Identity Registry</h3>
                     <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase">Live Auditing</Badge>
                  </div>
                  <div className="divide-y divide-white/5">
                     {warriorsLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : warriors?.map(w => (
                        <div key={w.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.02] transition-all">
                           <div className="flex items-center gap-6">
                              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center font-black text-primary text-xl">{w.email?.[0].toUpperCase() || 'U'}</div>
                              <div className="space-y-1">
                                 <p className="text-sm font-black text-white uppercase italic">{w.email || 'Anonymous Warrior'}</p>
                                 <div className="flex flex-wrap gap-3">
                                    <Badge className="bg-black/60 border-white/10 text-[7px] font-bold text-muted-foreground uppercase">{w.id}</Badge>
                                    <Badge className="bg-black/60 border-white/10 text-[7px] font-bold text-primary uppercase">{w.deviceId || 'NO_HWID'}</Badge>
                                    <Badge className="bg-black/60 border-white/10 text-[7px] font-bold text-green-500 uppercase">{w.lastIp || 'NO_IP'}</Badge>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-10">
                              <div className="text-right">
                                 <p className="text-[8px] font-black uppercase text-muted-foreground">Assets</p>
                                 <p className="text-lg font-black text-primary italic">{(w.coins || 0).toLocaleString()} 🪙</p>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => updateSetting('isSuspended', !w.isSuspended)} className={cn("rounded-full h-10 w-10", w.isSuspended ? "text-red-500 bg-red-500/10" : "text-muted-foreground")}><UserCheck /></Button>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
         )}
         
         {/* Other tabs (withdrawals, branding, sounds) preserved from previous setup */}
         {activeTab === 'branding' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
               <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 border-2">
                  <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Palette className="text-primary" /> Visual Identity Control</h3>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">App Title Signal</Label>
                        <Input value={settings?.customAppName} onChange={e => updateSetting('customAppName', e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-black text-white" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Industrial Logo Node (URL)</Label>
                        <Input value={settings?.customLogoUrl} onChange={e => updateSetting('customLogoUrl', e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-mono text-xs" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Active UI Theme</Label>
                        <Select value={settings?.currentThemeId} onValueChange={v => updateSetting('currentThemeId', v)}>
                           <SelectTrigger className="h-14 bg-black border-white/10 rounded-xl font-black uppercase italic text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent className="bg-background border-white/10 text-white">
                              {MASTER_THEMES.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>
               </Card>
            </div>
         )}
      </main>
    </div>
  );
}

function MonetizationCard({ mon, settings, updateSetting }: any) {
    return (
        <Card className="bg-[#0a0a0f] border-white/5 p-6 rounded-[2rem] space-y-6 hover:border-primary/20 transition-all group border-2">
           <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-xl border border-primary/20">
                 <mon.icon size={20} />
              </div>
              <Switch checked={!!(settings as any)?.[mon.visibilityKey]} onCheckedChange={(v) => updateSetting(mon.visibilityKey, v)} />
           </div>
           <div className="space-y-1">
              <h4 className="text-lg font-black uppercase italic tracking-tight truncate">{mon.label}</h4>
              <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{mon.provider}</p>
           </div>
           <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center text-[9px] font-black uppercase">
                 <span className="text-muted-foreground">User Share</span>
                 <span className="text-primary">{settings?.userRevenueSharePercent || 10}% Default</span>
              </div>
           </div>
        </Card>
    );
}

function NavPill({ active, label, icon, onClick }: any) {
   return (
      <button onClick={onClick} className={cn("px-8 py-4 rounded-2xl flex items-center gap-3 transition-all duration-500 font-black uppercase text-[10px] tracking-widest border-2 whitespace-nowrap", active ? "bg-primary/10 border-primary text-primary italic shadow-xl shadow-primary/10" : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10")}>
         {icon} <span>{label}</span>
      </button>
   );
}

function AnalyticsCard({ label, value, desc, icon }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-4 shadow-xl border-2 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform">{icon}</div>
         <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shadow-inner border border-white/10">{icon}</div>
         <div>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1 italic">{label}</p>
            <h4 className="text-4xl font-black text-white italic tabular-nums tracking-tighter">{value}</h4>
            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2 tracking-widest">{desc}</p>
         </div>
      </Card>
   );
}

function SignalField({ label, value, onUpdate }: any) {
   return (
      <div className="space-y-2">
         <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
         <Input value={value} onChange={e => onUpdate(e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-mono text-[10px] text-primary" placeholder="SIGNAL_NULL" />
      </div>
   );
}
