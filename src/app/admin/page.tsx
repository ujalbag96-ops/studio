
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy, increment, where, serverTimestamp } from 'firebase/firestore';
import { 
  Loader2, Zap, DollarSign, TrendingUp, Users as UsersIcon, UserCheck, 
  Palette, Radio, Activity, Layout, BarChart3, Settings, Gauge, CreditCard, Video, Youtube
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
import { AppSettings, UserProfile, PlatformRevenue } from '../lib/types';
import { MONETIZATION_REGISTRY } from '../lib/monetization-registry';
import { MASTER_THEMES } from '../lib/themes';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'analytics' | 'monetization' | 'warriors' | 'branding' | 'signals'>('analytics');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);
  
  const warriorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('joinedAt', 'desc'), limit(50)) : null, [firestore]);
  const { data: warriors } = useCollection<UserProfile>(warriorsQuery);

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
         </div>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-7xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 sticky top-20 z-50 bg-background/80 backdrop-blur-md pt-2">
            <NavPill active={activeTab === 'analytics'} label="Analysis Hub" icon={<BarChart3 className="h-3 w-3" />} onClick={() => setActiveTab('analytics')} />
            <NavPill active={activeTab === 'monetization'} label="Revenue Nodes" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('monetization')} />
            <NavPill active={activeTab === 'warriors'} label="Warrior Registry" icon={<UsersIcon className="h-3 w-3" />} onClick={() => setActiveTab('warriors')} />
            <NavPill active={activeTab === 'branding'} label="Visual Identity" icon={<Palette className="h-3 w-3" />} onClick={() => setActiveTab('branding')} />
            <NavPill active={activeTab === 'signals'} label="API & Signals" icon={<Radio className="h-3 w-3" />} onClick={() => setActiveTab('signals')} />
         </div>

         {activeTab === 'analytics' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <AnalyticsCard label="Gross Income" value={`₹${(stats?.totalGrossRevenueINR || 0).toLocaleString()}`} desc="Verified platform ad revenue" icon={<DollarSign className="text-green-500" />} />
                  <AnalyticsCard label="User Share" value={`₹${(stats?.totalUserPayoutsINR || 0).toLocaleString()}`} desc="Dynamic Distribution Active" icon={<Zap className="text-primary" />} />
                  <AnalyticsCard label="Net Profit" value={`₹${(stats?.totalAdminProfitINR || 0).toLocaleString()}`} desc="Industrial Retention Node" icon={<TrendingUp className="text-amber-500" />} />
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
                              <div className="space-y-1">
                                 <p className="text-xs font-black text-white uppercase italic">{w.email || 'Anonymous'}</p>
                                 <p className="text-[7px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                                    <Badge variant="outline" className="text-[6px] py-0 border-white/5">{w.id.substring(0,8)}</Badge>
                                    <span>IP: {w.lastIp || 'NO_IP'}</span>
                                 </p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-sm font-black text-green-500 italic tabular-nums">+₹{((w.pendingRevenueShare || 0) * 80).toFixed(2)}</p>
                              <p className="text-[7px] font-black uppercase text-muted-foreground">User Reward INR</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
         )}

         {activeTab === 'monetization' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               {/* DYNAMIC ECONOMY SECTION */}
               <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] border-2 space-y-8">
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                        <Gauge size={28} />
                     </div>
                     <div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Economy <span className="text-primary">Control Hub</span></h3>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Multi-Node Revenue Share Calibration</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     <EconomyInput 
                        label="CPA Share %" 
                        value={settings?.cpaUserSharePercent || 30} 
                        icon={<DollarSign className="h-4 w-4" />}
                        onUpdate={v => updateSetting('cpaUserSharePercent', v)} 
                     />
                     <EconomyInput 
                        label="Video Ads %" 
                        value={settings?.videoUserSharePercent || 10} 
                        icon={<Video className="h-4 w-4" />}
                        onUpdate={v => updateSetting('videoUserSharePercent', v)} 
                     />
                     <EconomyInput 
                        label="YouTube Hub %" 
                        value={settings?.youtubeUserSharePercent || 10} 
                        icon={<Youtube className="h-4 w-4" />}
                        onUpdate={v => updateSetting('youtubeUserSharePercent', v)} 
                     />
                     <EconomyInput 
                        label="Global Default %" 
                        value={settings?.userRevenueSharePercent || 10} 
                        icon={<Zap className="h-4 w-4" />}
                        onUpdate={v => updateSetting('userRevenueSharePercent', v)} 
                     />
                  </div>
                  
                  <p className="text-[9px] font-bold text-muted-foreground uppercase text-center italic opacity-60">
                     *Changes reflect instantly in ad-reward and cpa-callback nodes. Default Fallback: 10%.
                  </p>
               </Card>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {MONETIZATION_REGISTRY.map((mon) => (
                    <MonetizationCard key={mon.id} mon={mon} settings={settings} updateSetting={updateSetting} />
                  ))}
               </div>
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
               </Card>
            </div>
         )}

         {activeTab === 'branding' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
               <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[3rem] space-y-8 border-2">
                  <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Palette className="text-primary" /> Visual Identity</h3>
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">App Title Signal</Label>
                        <Input value={settings?.customAppName} onChange={e => updateSetting('customAppName', e.target.value)} className="h-14 bg-black border-white/10 rounded-xl font-black text-white" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Logo Node (URL)</Label>
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

         {activeTab === 'warriors' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl">
                  <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                     <h3 className="text-sm font-black uppercase tracking-widest italic">Warrior Technical Registry</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                     {warriors?.map(w => (
                        <div key={w.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-white/[0.02]">
                           <div className="flex items-center gap-6">
                              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center font-black text-primary text-xl">{w.email?.[0].toUpperCase() || 'U'}</div>
                              <div className="space-y-2">
                                 <p className="text-sm font-black text-white uppercase italic">{w.email || 'Anonymous'}</p>
                                 <div className="flex flex-wrap gap-2">
                                    <Badge className="bg-black/60 border-white/10 text-[7px] font-bold text-muted-foreground uppercase">{w.id}</Badge>
                                    <Badge className="bg-black/60 border-white/10 text-[7px] font-bold text-primary uppercase">HWID: {w.deviceId || 'NO_HWID'}</Badge>
                                    <Badge className="bg-black/60 border-white/10 text-[7px] font-bold text-green-500 uppercase">IP: {w.lastIp || 'NO_IP'}</Badge>
                                 </div>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-lg font-black text-primary italic">{(w.coins || 0).toLocaleString()} 🪙</p>
                              <p className="text-[7px] font-bold text-muted-foreground uppercase italic mt-1">Joined: {new Date(w.joinedAt || '').toLocaleDateString()}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </Card>
            </div>
         )}
      </main>
    </div>
  );
}

function EconomyInput({ label, value, icon, onUpdate }: any) {
   return (
      <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all">
         <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
            {icon} {label}
         </Label>
         <div className="flex items-center gap-2">
            <Input 
              type="number" 
              value={value} 
              onChange={e => onUpdate(parseFloat(e.target.value))}
              className="h-12 bg-black border-white/10 rounded-xl font-black text-lg text-primary text-center" 
            />
            <span className="text-xs font-black opacity-40">%</span>
         </div>
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
