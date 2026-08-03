'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy, increment, where, setDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, Zap, LayoutGrid, Search, CheckCircle2, TrendingUp, Users as UsersIcon, UserCheck, 
  Globe, ShieldX, Terminal, CreditCard, Settings, UserPlus, UserMinus, Check, X, ShieldAlert, 
  Fingerprint, Palette, Image as ImageIcon, Type, Calendar, Layers, DollarSign, Activity,
  Volume2, Music, BellRing, Radio, Cpu, Lock, Smartphone, Video, PlayCircle, Coins,
  History, ShieldCheck, Mail, Database, RefreshCw, AlertCircle
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
import { AppSettings, UserProfile, PayoutRequest, UserLedgerEntry } from '../lib/types';
import { MODULE_REGISTRY } from '../lib/module-registry';
import { MONETIZATION_REGISTRY } from '../lib/monetization-registry';
import { MASTER_THEMES } from '../lib/themes';
import { MASTER_SOUNDS } from '../lib/sounds';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'modules' | 'monetization' | 'warriors' | 'withdrawals' | 'branding' | 'sounds' | 'signals'>('monetization');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // User Management State
  const [targetUserId, setTargetUserId] = useState('');
  const [adjAmount, setTargetAmount] = useState('');

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
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
      toast({ title: "WALLET ADJUSTED", description: `Updated balance by ${change} coins.` });
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
            <p className="text-sm font-black uppercase italic">Industrial <span className="text-primary">Admin Node</span></p>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
               <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[9px] font-black uppercase text-green-500 tracking-widest">⚡ REAL-TIME SIGNAL ACTIVE</span>
            </div>
            <Badge variant="outline" className="border-white/10 text-white text-[8px] font-black uppercase">Industrial v62.0 Stable</Badge>
         </div>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-7xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 sticky top-20 z-50 bg-background/80 backdrop-blur-md pt-2">
            <NavPill active={activeTab === 'monetization'} label="Monetization (100+)" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('monetization')} />
            <NavPill active={activeTab === 'warriors'} label="Warrior Registry" icon={<UsersIcon className="h-3 w-3" />} onClick={() => setActiveTab('warriors')} />
            <NavPill active={activeTab === 'withdrawals'} label="Settlement" icon={<CreditCard className="h-3 w-3" />} onClick={() => setActiveTab('withdrawals')} />
            <NavPill active={activeTab === 'branding'} label="Branding Control" icon={<Palette className="h-3 w-3" />} onClick={() => setActiveTab('branding')} />
            <NavPill active={activeTab === 'sounds'} label="Audio Engine" icon={<Volume2 className="h-3 w-3" />} onClick={() => setActiveTab('sounds')} />
            <NavPill active={activeTab === 'signals'} label="API Signals" icon={<Radio className="h-3 w-3" />} onClick={() => setActiveTab('signals')} />
         </div>

         {/* 1. DYNAMIC EARNING MODULES HUB (100+ MODULES) */}
         {activeTab === 'monetization' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex items-center justify-between px-2">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                     <Database className="text-primary" /> Earning Signal Discovery
                  </h3>
                  <Badge className="bg-primary/20 text-primary uppercase font-black text-[10px]">Found {MONETIZATION_REGISTRY.length} Active Nodes</Badge>
               </div>
               
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
                       <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="space-y-1">
                             <Label className="text-[7px] font-black uppercase text-muted-foreground">Rev Share %</Label>
                             <Input 
                               type="number" 
                               defaultValue={10} 
                               className="h-10 bg-black border-white/10 rounded-xl text-xs font-black text-primary"
                             />
                          </div>
                          <div className="space-y-1">
                             <Label className="text-[7px] font-black uppercase text-muted-foreground">Daily Cap</Label>
                             <Input 
                               type="number" 
                               defaultValue={20} 
                               className="h-10 bg-black border-white/10 rounded-xl text-xs font-black text-white"
                             />
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
         )}

         {/* 2. WARRIOR REGISTRY & MANUAL OVERRIDES */}
         {activeTab === 'warriors' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] space-y-8">
                  <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Fingerprint className="text-primary" /> Wallet Override Node</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Target UID / Email</Label>
                        <Input value={targetUserId} onChange={e => setTargetUserId(e.target.value)} placeholder="ENTER WARRIOR IDENTITY..." className="h-14 bg-black border-white/10 rounded-2xl font-mono text-xs" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Amount (Coins)</Label>
                        <Input value={adjAmount} onChange={e => setTargetAmount(e.target.value)} type="number" placeholder="E.G. 500" className="h-14 bg-black border-white/10 rounded-2xl font-black text-primary" />
                     </div>
                     <div className="flex gap-2 items-end pb-1">
                        <Button onClick={() => handleWalletAdjust('add')} className="flex-1 h-14 bg-green-600 hover:bg-green-500 font-black uppercase rounded-2xl italic text-[10px]">ADD FUNDS</Button>
                        <Button onClick={() => handleWalletAdjust('subtract')} className="flex-1 h-14 bg-red-600 hover:bg-red-500 font-black uppercase rounded-2xl italic text-[10px]">DEDUCT</Button>
                     </div>
                  </div>
               </Card>

               <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden">
                  <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                     <h3 className="text-sm font-black uppercase tracking-widest italic">Live Warrior Registry</h3>
                     <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase">Recent 50 Enlistments</Badge>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto no-scrollbar">
                     {warriorsLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div> : warriors?.map(w => (
                        <div key={w.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.02] transition-all">
                           <div className="flex items-center gap-6">
                              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center font-black text-primary text-xl shadow-xl">{w.email?.[0].toUpperCase() || 'U'}</div>
                              <div className="space-y-1">
                                 <p className="text-sm font-black text-white uppercase italic">{w.email || w.id}</p>
                                 <div className="flex flex-wrap gap-3">
                                    <Badge className="bg-black/60 border-white/10 text-[7px] font-black uppercase">{w.id.substring(0, 10)}...</Badge>
                                    <Badge className="bg-black/60 border-white/10 text-[7px] font-black uppercase flex items-center gap-1"><MapPin className="h-2 w-2" /> {w.lastIp || 'NO_IP'}</Badge>
                                    <Badge className="bg-black/60 border-white/10 text-[7px] font-black uppercase flex items-center gap-1"><Smartphone className="h-2 w-2" /> {w.deviceId?.substring(0, 8) || 'NO_HWID'}</Badge>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-10">
                              <div className="text-right">
                                 <p className="text-[8px] font-black uppercase text-muted-foreground">Portfolio</p>
                                 <p className="text-lg font-black text-primary italic">{(w.coins || 0).toLocaleString()} 🪙</p>
                              </div>
                              <Button variant="ghost" size="icon" className={cn("rounded-full h-10 w-10", w.isSuspended ? "text-red-500 bg-red-500/10" : "text-muted-foreground")}>
                                 {w.isSuspended ? <ShieldX /> : <UserCheck />}
                              </Button>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
         )}

         {/* 3. WITHDRAWAL SETTLEMENT TERMINAL */}
         {activeTab === 'withdrawals' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid gap-6">
                  {payoutsLoading ? <div className="p-20 flex justify-center"><Loader2 className="animate-spin" /></div> : pendingPayouts?.length === 0 ? (
                     <div className="py-40 text-center border-2 border-dashed border-white/5 rounded-[3rem] opacity-30">
                        <History className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-sm font-black uppercase tracking-widest italic">Settlement Queue Clear</p>
                     </div>
                  ) : pendingPayouts?.map(p => (
                     <Card key={p.id} className="bg-[#0a0a0f] border-white/10 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 border-2 shadow-2xl group">
                        <div className="flex items-center gap-6">
                           <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl"><CreditCard className="h-8 w-8" /></div>
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                 <h4 className="text-xl font-black uppercase italic text-white">{p.method}</h4>
                                 <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase">{p.geo || 'GLOBAL'}</Badge>
                              </div>
                              <p className="text-xs font-mono text-muted-foreground">{p.destination}</p>
                              <p className="text-[9px] font-bold text-white/40 uppercase mt-1">Warrior: {p.userEmail || p.userId}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-12">
                           <div className="text-right">
                              <p className="text-[8px] font-black uppercase text-muted-foreground">Volume</p>
                              <p className="text-3xl font-black text-amber-500 italic tabular-nums">₹{p.amount.toLocaleString()}</p>
                           </div>
                           <div className="flex gap-3">
                              <Button onClick={() => handleProcessPayout(p.id, 'completed')} className="h-14 px-8 bg-green-600 hover:bg-green-500 font-black uppercase italic text-[10px] rounded-xl shadow-lg">APPROVE</Button>
                              <Button onClick={() => handleProcessPayout(p.id, 'rejected')} variant="outline" className="h-14 px-8 border-white/10 hover:bg-red-600 hover:text-white font-black uppercase italic text-[10px] rounded-xl transition-all">REJECT</Button>
                           </div>
                        </div>
                     </Card>
                  ))}
               </div>
            </div>
         )}

         {/* 4. SOUND & AUDIO ENGINE CONTROL */}
         {activeTab === 'sounds' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid md:grid-cols-2 gap-8">
                  <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 shadow-2xl border-2">
                     <h3 className="text-xl font-black uppercase italic text-primary flex items-center gap-3"><Music className="h-5 w-5" /> Sonic Asset Node</h3>
                     <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                           <div className="space-y-1">
                              <p className="text-sm font-black uppercase italic">Master Sound FX</p>
                              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Global In-App SFX Sync</p>
                           </div>
                           <Switch checked={settings?.sfxEnabled} onCheckedChange={(v) => updateSetting('sfxEnabled', v)} />
                        </div>
                        <div className="space-y-4">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Live Audio Provider</Label>
                           <Select value={settings?.rewardSoundId || 'coin-standard'} onValueChange={v => updateSetting('rewardSoundId', v)}>
                              <SelectTrigger className="h-14 bg-black border-white/10 rounded-xl font-black text-xs uppercase">
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-background border-white/10 text-white max-h-60 overflow-y-auto">
                                 {MASTER_SOUNDS.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.category})</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center gap-3">
                           <Info className="h-4 w-4 text-primary" />
                           <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed italic">Changes are instantly cached to warrior devices on next signal sync.</p>
                        </div>
                     </div>
                  </Card>

                  <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] space-y-8 border-2 shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-5"><BellRing className="h-40 w-40 text-primary" /></div>
                     <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3"><BellRing className="h-5 w-5" /> Audio Broadcast System</h3>
                     <div className="space-y-6 relative z-10">
                        <textarea 
                          placeholder="ENTER ALERT MESSAGE TO BROADCAST GLOBALLY..." 
                          className="w-full h-40 bg-black border border-white/10 rounded-[2rem] p-6 text-[11px] font-bold uppercase tracking-widest text-white outline-none focus:border-primary/40 resize-none shadow-inner"
                        />
                        <Button className="w-full h-20 bg-primary hover:bg-primary/90 rounded-2xl font-black text-xl uppercase italic shadow-2xl shadow-primary/20">
                           <Zap className="mr-3 h-6 w-6 fill-white animate-pulse" /> DISPATCH AUDIO ALERT
                        </Button>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase text-center italic leading-relaxed">
                           Sends instant push notification with high-priority chime to all connected users.
                        </p>
                     </div>
                  </Card>
               </div>
            </div>
         )}

         {/* 5. GLOBAL API SIGNALS & AUDIT */}
         {activeTab === 'signals' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 border-2 shadow-2xl">
                     <h3 className="text-xl font-black uppercase italic text-amber-500 flex items-center gap-3"><Cpu className="h-5 w-5" /> Core API Signals</h3>
                     <div className="space-y-5">
                        <ApiInput label="AdMob App ID" value={settings?.admobAppId} onSave={(v) => updateSetting('admobAppId', v)} />
                        <ApiInput label="Rewarded Unit ID" value={settings?.admobRewardedUnitId} onSave={(v) => updateSetting('admobRewardedUnitId', v)} />
                        <ApiInput label="VAST AdTag URL" value={settings?.vastAdTagUrl} onSave={(v) => updateSetting('vastAdTagUrl', v)} />
                        <ApiInput label="YouTube Data API Key" value={settings?.youtubeApiKey} onSave={(v) => updateSetting('youtubeApiKey', v)} />
                        <ApiInput label="CPA Lead Postback Auth" value={settings?.cpaLeadApiKey} onSave={(v) => updateSetting('cpaLeadApiKey', v)} />
                     </div>
                  </Card>

                  <Card className="bg-black border border-dashed border-white/20 p-10 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-10 shadow-inner">
                     <div className="h-40 w-40 rounded-full border-8 border-white/5 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-t-8 border-primary animate-spin" style={{ animationDuration: '3s' }} />
                        <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
                     </div>
                     <div className="space-y-3">
                        <h4 className="text-3xl font-black uppercase italic tracking-tighter text-white leading-none">Signal Audit Matrix</h4>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.4em] max-w-xs mx-auto italic">
                           ENCRYPTED GLOBAL TELEMETRY v12.0
                        </p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 w-full">
                        <HealthStat label="Firestore Hub" health="CONNECTED" color="text-green-500" />
                        <HealthStat label="Ad Network S2S" health="OPTIMAL" color="text-green-500" />
                        <HealthStat label="Push Broadcaster" health="READY" color="text-green-500" />
                        <HealthStat label="Audit Integrity" health="SECURE" color="text-green-500" />
                     </div>
                  </Card>
               </div>
            </div>
         )}

         {/* 6. BRANDING HUB */}
         {activeTab === 'branding' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid md:grid-cols-2 gap-10">
                 <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 shadow-2xl border-2">
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                             <Type className="h-3 w-3" /> App Identity (Title)
                          </Label>
                          <Input 
                            value={settings?.customAppName}
                            onChange={e => updateSetting('customAppName', e.target.value)}
                            placeholder="CampusHub"
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-white uppercase italic text-lg"
                          />
                       </div>

                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                             <ImageIcon className="h-3 w-3" /> Industrial Logo URL
                          </Label>
                          <Input 
                            value={settings?.customLogoUrl}
                            onChange={e => updateSetting('customLogoUrl', e.target.value)}
                            placeholder="https://..."
                            className="h-14 bg-black border-white/10 rounded-xl font-bold text-primary text-xs"
                          />
                       </div>

                       <div className="space-y-3">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                             <Layers className="h-3 w-3" /> Visual Theme Node (12 Presets)
                          </Label>
                          <Select 
                            value={settings?.currentThemeId || 'dark-default'} 
                            onValueChange={(v) => updateSetting('currentThemeId', v)}
                          >
                            <SelectTrigger className="h-14 bg-black border-white/10 rounded-xl font-black text-[10px] uppercase">
                               <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-white/10 text-white">
                               {MASTER_THEMES.map(theme => (
                                 <SelectItem key={theme.id} value={theme.id}>{theme.name} ({theme.category})</SelectItem>
                               ))}
                            </SelectContent>
                          </Select>
                       </div>
                    </div>
                 </Card>

                 <Card className="bg-primary/5 border-primary/20 rounded-[3rem] p-10 flex flex-col justify-center items-center text-center space-y-8 border-2 shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 animate-pulse-slow" />
                    <div className="h-32 w-32 rounded-[2.5rem] bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 group">
                       {settings?.customLogoUrl ? (
                         <img src={settings.customLogoUrl} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700" alt="Preview" />
                       ) : (
                         <Zap className="h-16 w-16 text-primary" />
                       )}
                    </div>
                    <div className="space-y-2 relative z-10">
                       <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.4em] mb-1 italic">Active Visual Identity</p>
                       <h3 className="text-4xl font-black uppercase italic text-white tracking-tighter">{settings?.customAppName || "CampusHub"}</h3>
                    </div>
                    <Badge variant="outline" className="border-green-500/20 text-green-500 text-[8px] font-black uppercase px-4 py-1 relative z-10">REAL-TIME SYNC ACTIVE</Badge>
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

function ApiInput({ label, value, onSave }: any) {
  const [val, setVal] = useState(value || '');
  return (
    <div className="space-y-2">
       <Label className="text-[8px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
       <div className="flex gap-2">
          <Input 
            value={val} 
            onChange={(e) => setVal(e.target.value)} 
            className="h-11 bg-black border-white/10 rounded-xl text-[10px] font-mono text-white/70" 
          />
          <Button onClick={() => onSave(val)} className="h-11 px-6 bg-white/5 border border-white/10 hover:bg-primary text-[9px] font-black uppercase italic rounded-xl transition-all">SAVE</Button>
       </div>
    </div>
  );
}

function HealthStat({ label, health, color }: any) {
   return (
      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
         <p className="text-[7px] font-black uppercase text-muted-foreground mb-1 tracking-widest">{label}</p>
         <p className={cn("text-[11px] font-black italic", color)}>{health}</p>
      </div>
   );
}

