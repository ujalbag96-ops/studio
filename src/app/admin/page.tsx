'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy, increment, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, Zap, LayoutGrid, Search, CheckCircle2, TrendingUp, Users as UsersIcon, UserCheck, 
  Globe, ShieldX, Terminal, CreditCard, Settings, UserPlus, UserMinus, Check, X, ShieldAlert, 
  Fingerprint, Palette, Image as ImageIcon, Type, Calendar, Layers, DollarSign, Activity,
  Volume2, Music, BellRing, Radio, Cpu, Lock, Smartphone, Video, PlayCircle, Coins,
  History, ShieldCheck, Mail, Database, RefreshCw, AlertCircle, BarChart3, PieChart, Timer,
  Flag, Layout, Youtube, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';
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
      // Find user by ID or Email
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
            <Badge variant="outline" className="border-white/10 text-white text-[8px] font-black uppercase">v88.0 Final Sync</Badge>
         </div>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-7xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 sticky top-20 z-50 bg-background/80 backdrop-blur-md pt-2">
            <NavPill active={activeTab === 'analytics'} label="Analytics Hub" icon={<BarChart3 className="h-3 w-3" />} onClick={() => setActiveTab('analytics')} />
            <NavPill active={activeTab === 'monetization'} label="Monetization" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('monetization')} />
            <NavPill active={activeTab === 'warriors'} label="Warrior Identity" icon={<UsersIcon className="h-3 w-3" />} onClick={() => setActiveTab('warriors')} />
            <NavPill active={activeTab === 'withdrawals'} label="Settlement" icon={<CreditCard className="h-3 w-3" />} onClick={() => setActiveTab('withdrawals')} />
            <NavPill active={activeTab === 'branding'} label="Visual Node" icon={<Palette className="h-3 w-3" />} onClick={() => setActiveTab('branding')} />
            <NavPill active={activeTab === 'sounds'} label="Audio Engine" icon={<Volume2 className="h-3 w-3" />} onClick={() => setActiveTab('sounds')} />
            <NavPill active={activeTab === 'signals'} label="API Node" icon={<Radio className="h-3 w-3" />} onClick={() => setActiveTab('signals')} />
         </div>

         {/* 1. ANALYTICS & PROFIT ENGINE */}
         {activeTab === 'analytics' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <AnalyticsCard 
                    label="Gross Ad Income" 
                    value={`₹${(stats?.totalGrossRevenueINR || 0).toLocaleString()}`} 
                    desc="Estimated from total verified signals"
                    icon={<DollarSign className="text-green-500" />}
                  />
                  <AnalyticsCard 
                    label="Total User Payouts" 
                    value={`₹${(stats?.totalUserPayoutsINR || 0).toLocaleString()}`} 
                    desc={`${settings?.userRevenueSharePercent || 10}% Dynamic Distribution`}
                    icon={<Zap className="text-primary" />}
                  />
                  <AnalyticsCard 
                    label="Admin Net Profit" 
                    value={`₹${(stats?.totalAdminProfitINR || 0).toLocaleString()}`} 
                    desc="Industrial Platform Liquidity"
                    icon={<TrendingUp className="text-amber-500" />}
                  />
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl border-2">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Video className="text-primary" /> Retention Signals</h3>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase text-muted-foreground">Total Views</p>
                           <p className="text-3xl font-black italic">{stats?.totalViews?.toLocaleString() || 0}</p>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase text-muted-foreground">Watch Time</p>
                           <p className="text-3xl font-black italic">{( (stats?.totalWatchTimeSec || 0) / 3600 ).toFixed(1)} <span className="text-xs opacity-40">HRS</span></p>
                        </div>
                     </div>
                  </Card>

                  <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 shadow-2xl border-2 overflow-hidden">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Globe className="text-primary" /> Geo-Signals</h3>
                     <div className="space-y-4 max-h-40 overflow-y-auto no-scrollbar">
                        {stats?.countryBreakdown ? Object.entries(stats.countryBreakdown).sort((a,b) => b[1] - a[1]).map(([country, count]) => (
                           <div key={country} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                              <span className="text-[10px] font-black uppercase">{country}</span>
                              <Badge className="bg-primary/20 text-primary border-none text-[10px]">{count} Signals</Badge>
                           </div>
                        )) : (
                           <p className="text-xs text-muted-foreground italic">Awaiting global node signals...</p>
                        )}
                     </div>
                  </Card>
               </div>
            </div>
         )}

         {/* 2. DYNAMIC 100+ MODULES HUB */}
         {activeTab === 'monetization' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <Card className="bg-primary/5 border-primary/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border-2">
                  <div className="space-y-2 text-center md:text-left">
                     <h3 className="text-2xl font-black uppercase italic tracking-tighter">Global Profit Split</h3>
                     <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest italic">Default share % applied to all active nodes.</p>
                  </div>
                  <div className="flex items-center gap-4 w-full md:w-auto">
                     <div className="space-y-1 flex-1 md:w-40">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground ml-1">User Share %</Label>
                        <Input 
                          type="number" 
                          value={settings?.userRevenueSharePercent} 
                          onChange={e => updateSetting('userRevenueSharePercent', parseFloat(e.target.value))} 
                          className="h-12 bg-black border-white/10 rounded-xl font-black text-primary text-center" 
                        />
                     </div>
                     <div className="space-y-1 flex-1 md:w-40">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Daily Cap</Label>
                        <Input 
                          type="number" 
                          value={settings?.maxDailyVideosPerUser} 
                          onChange={e => updateSetting('maxDailyVideosPerUser', parseInt(e.target.value))} 
                          className="h-12 bg-black border-white/10 rounded-xl font-black text-white text-center" 
                        />
                     </div>
                  </div>
               </Card>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {MONETIZATION_REGISTRY.map((mon) => (
                    <Card key={mon.id} className="bg-[#0a0a0f] border-white/5 p-6 rounded-[2rem] space-y-6 hover:border-primary/20 transition-all group border-2">
                       <div className="flex items-center justify-between">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-xl border border-primary/20">
                             <mon.icon size={20} />
                          </div>
                          <Switch 
                            checked={!!(settings as any)?.[mon.visibilityKey]} 
                            onCheckedChange={(v) => updateSetting(mon.visibilityKey, v)} 
                          />
                       </div>
                       <div className="space-y-1">
                          <h4 className="text-lg font-black uppercase italic tracking-tight truncate">{mon.label}</h4>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{mon.provider}</p>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
         )}

         {/* 3. WARRIOR IDENTITY AUDIT */}
         {activeTab === 'warriors' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] space-y-8">
                  <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Fingerprint className="text-primary" /> Wallet Override</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Target UID / Email</Label>
                        <Input value={targetUserId} onChange={e => setTargetUserId(e.target.value)} placeholder="ENTER WARRIOR IDENTITY..." className="h-14 bg-black border-white/10 rounded-2xl font-mono text-xs" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Amount Units</Label>
                        <Input value={adjAmount} onChange={e => setTargetAmount(e.target.value)} type="number" placeholder="E.G. 500" className="h-14 bg-black border-white/10 rounded-2xl font-black text-primary text-center" />
                     </div>
                     <div className="flex gap-2 items-end pb-1">
                        <Button onClick={() => handleWalletAdjust('add')} className="flex-1 h-14 bg-green-600 hover:bg-green-500 font-black uppercase rounded-2xl italic text-[10px]">ADD FUNDS</Button>
                        <Button onClick={() => handleWalletAdjust('subtract')} className="flex-1 h-14 bg-red-600 hover:bg-red-500 font-black uppercase rounded-2xl italic text-[10px]">DEDUCT</Button>
                     </div>
                  </div>
               </Card>

               <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                     <h3 className="text-sm font-black uppercase tracking-widest italic">Identity Registry</h3>
                     <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase">Live Auditing</Badge>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto no-scrollbar">
                     {warriorsLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : warriors?.map(w => (
                        <div key={w.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.02] transition-all">
                           <div className="flex items-center gap-6">
                              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center font-black text-primary text-xl shadow-xl">{w.email?.[0].toUpperCase() || 'U'}</div>
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
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => updateSetting('isSuspended', !w.isSuspended)}
                                className={cn("rounded-full h-10 w-10", w.isSuspended ? "text-red-500 bg-red-500/10" : "text-muted-foreground")}
                              >
                                 {w.isSuspended ? <ShieldX /> : <UserCheck />}
                              </Button>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
         )}

         {/* 4. SETTLEMENT QUEUE */}
         {activeTab === 'withdrawals' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                  <div className="p-8 bg-primary/10 border-b border-white/5 flex items-center justify-between">
                     <h3 className="text-lg font-black uppercase italic tracking-tighter">Settlement Queue</h3>
                     <Badge className="bg-amber-500 text-black border-none text-[8px] font-black uppercase px-3 italic">Pending Audit</Badge>
                  </div>
                  <div className="divide-y divide-white/5">
                     {payoutsLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : pendingPayouts?.map(p => (
                        <div key={p.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 group">
                           <div className="flex items-center gap-6">
                              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                                 <CreditCard className="h-8 w-8" />
                              </div>
                              <div className="space-y-1">
                                 <p className="text-lg font-black uppercase italic text-white">{p.method}</p>
                                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">DEST: {p.destination}</p>
                                 <p className="text-[8px] font-black text-primary uppercase italic">User: {p.userEmail}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-10">
                              <div className="text-right">
                                 <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Volume</p>
                                 <h4 className="text-3xl font-black text-green-500 italic tabular-nums">₹{p.amount?.toLocaleString()}</h4>
                              </div>
                              <div className="flex gap-2">
                                 <Button onClick={() => handleProcessPayout(p.id, 'completed')} className="h-12 w-12 rounded-xl bg-green-600 hover:bg-green-500 text-white p-0 shadow-lg shadow-green-600/20"><Check className="h-5 w-5" /></Button>
                                 <Button onClick={() => handleProcessPayout(p.id, 'rejected')} className="h-12 w-12 rounded-xl bg-red-600 hover:bg-red-500 text-white p-0 shadow-lg shadow-red-600/20"><X className="h-5 w-5" /></Button>
                              </div>
                           </div>
                        </div>
                     ))}
                     {(!pendingPayouts || pendingPayouts.length === 0) && (
                        <div className="py-32 text-center space-y-4">
                           <ShieldCheck className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
                           <p className="text-sm font-black uppercase text-muted-foreground tracking-widest italic">All signals settled for this cycle.</p>
                        </div>
                     )}
                  </div>
               </Card>
            </div>
         )}

         {/* 5. VISUAL NODE (BRANDING) */}
         {activeTab === 'branding' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
               <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 border-2">
                  <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Palette className="text-primary" /> Visual Identity Control</h3>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">App Title Signal</Label>
                        <Input 
                          value={settings?.customAppName} 
                          onChange={e => updateSetting('customAppName', e.target.value)} 
                          className="h-14 bg-black border-white/10 rounded-xl font-black text-white" 
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Industrial Logo Node (URL)</Label>
                        <Input 
                          value={settings?.customLogoUrl} 
                          onChange={e => updateSetting('customLogoUrl', e.target.value)} 
                          className="h-14 bg-black border-white/10 rounded-xl font-mono text-xs" 
                        />
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
               <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] flex flex-col justify-center items-center text-center space-y-6 border-2">
                  <div className="h-24 w-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-inner group">
                     {settings?.customLogoUrl ? <img src={settings.customLogoUrl} className="h-12 w-auto" /> : <Zap className="h-10 w-10 text-primary" />}
                  </div>
                  <h4 className="text-2xl font-black uppercase italic">{settings?.customAppName || 'CampusHub'}</h4>
                  <Badge variant="outline" className="border-primary/20 text-primary uppercase font-black px-4 py-1 text-[9px]">{settings?.currentThemeId || 'Default'}</Badge>
               </Card>
            </div>
         )}

         {/* 6. AUDIO ENGINE (SOUNDS) */}
         {activeTab === 'sounds' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 border-2">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Volume2 className="text-primary" /> Audio Signal Configuration</h3>
                     <div className="flex items-center gap-4">
                        <span className="text-[9px] font-black uppercase text-muted-foreground">App SFX</span>
                        <Switch checked={!!settings?.sfxEnabled} onCheckedChange={v => updateSetting('sfxEnabled', v)} />
                     </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                     <SoundField label="Reward Credit Chime" value={settings?.rewardSoundUrl} onUpdate={v => updateSetting('rewardSoundUrl', v)} />
                     <SoundField label="Notification Pulse" value={settings?.notifSoundUrl} onUpdate={v => updateSetting('notifSoundUrl', v)} />
                  </div>

                  <div className="pt-8 border-t border-white/5">
                     <p className="text-[9px] font-black uppercase text-muted-foreground mb-4 italic tracking-widest">Master Sound Library (120+ Signals)</p>
                     <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                        {MASTER_SOUNDS.slice(0, 24).map(s => (
                           <button 
                             key={s.id} 
                             onClick={() => new Audio(s.url).play()}
                             className="p-3 bg-white/5 border border-white/5 rounded-xl text-center hover:bg-primary/20 hover:border-primary/40 transition-all group"
                           >
                              <Music className="h-4 w-4 mx-auto mb-1 text-muted-foreground group-hover:text-primary" />
                              <p className="text-[7px] font-black uppercase text-muted-foreground group-hover:text-white truncate">{s.name}</p>
                           </button>
                        ))}
                     </div>
                  </div>
               </Card>
            </div>
         )}

         {/* 7. API NODE (SIGNALS) */}
         {activeTab === 'signals' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
               <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 border-2">
                  <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Radio className="text-primary" /> Global API Interface</h3>
                  <div className="space-y-6">
                     <SignalField label="AdMob App ID" value={settings?.admobAppId} onUpdate={v => updateSetting('admobAppId', v)} />
                     <SignalField label="VAST AdTag Node" value={settings?.vastAdTagUrl} onUpdate={v => updateSetting('vastAdTagUrl', v)} />
                     <SignalField label="YouTube Data Key" value={settings?.youtubeApiKey} onUpdate={v => updateSetting('youtubeApiKey', v)} />
                     <SignalField label="CPA Lead Signal Key" value={settings?.cpaLeadApiKey} onUpdate={v => updateSetting('cpaLeadApiKey', v)} />
                  </div>
               </Card>
               <div className="space-y-8">
                  <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] space-y-6 border-2">
                     <h4 className="text-sm font-black uppercase italic flex items-center gap-3 text-white"><Activity className="text-primary" /> Operational Broadcast</h4>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground">Banner Signal Text</Label>
                           <Input 
                             value={settings?.broadcastMessage} 
                             onChange={e => updateSetting('broadcastMessage', e.target.value)} 
                             className="h-12 bg-black border-white/10 rounded-xl font-bold text-xs" 
                           />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                           <span className="text-[9px] font-black uppercase text-white">Broadcast Status</span>
                           <Switch checked={!!settings?.broadcastActive} onCheckedChange={v => updateSetting('broadcastActive', v)} />
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
          "px-8 py-4 rounded-2xl flex items-center gap-3 transition-all duration-500 font-black uppercase text-[10px] tracking-widest border-2 whitespace-nowrap",
          active ? "bg-primary/10 border-primary text-primary italic shadow-xl shadow-primary/10" : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
        )}
      >
         {icon} <span>{label}</span>
      </button>
   );
}

function AnalyticsCard({ label, value, desc, icon }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-4 shadow-xl border-2 relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">{icon}</div>
         <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center shadow-inner border border-white/10">{icon}</div>
         <div>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1 italic">{label}</p>
            <h4 className="text-4xl font-black text-white italic tabular-nums tracking-tighter">{value}</h4>
            <p className="text-[8px] font-bold text-muted-foreground uppercase mt-2 tracking-widest">{desc}</p>
         </div>
      </Card>
   );
}

function SoundField({ label, value, onUpdate }: any) {
   return (
      <div className="space-y-2">
         <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
         <div className="flex gap-2">
            <Input value={value} onChange={e => onUpdate(e.target.value)} className="h-12 bg-black border-white/10 rounded-xl font-mono text-[10px] flex-1" />
            <Button onClick={() => new Audio(value).play()} variant="outline" className="h-12 w-12 rounded-xl border-white/10"><Music className="h-4 w-4" /></Button>
         </div>
      </div>
   );
}

function SignalField({ label, value, onUpdate }: any) {
   return (
      <div className="space-y-2">
         <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
         <Input 
           value={value} 
           onChange={e => onUpdate(e.target.value)} 
           className="h-14 bg-black border-white/10 rounded-xl font-mono text-[10px] text-primary" 
           placeholder="SIGNAL_KEY_NULL"
         />
      </div>
   );
}
