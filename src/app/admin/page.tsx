'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy } from 'firebase/firestore';
import { 
  Loader2, Zap, DollarSign, TrendingUp, Users as UsersIcon, 
  Palette, Radio, Activity, BarChart3, Settings, CreditCard,
  ShieldCheck, Globe, Wallet, Menu, Volume2, Layers, Signal,
  Smartphone, Monitor, Package, Target, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, UserProfile, PlatformRevenue } from '../lib/types';
import { MONETIZATION_REGISTRY } from '../lib/monetization-registry';
import { MASTER_THEMES } from '../lib/themes';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'overview' | 'earning' | 'members' | 'financials' | 'signals' | 'system' | 'branding';

export default function AdminDashboardV6() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Data fetching
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);
  
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('joinedAt', 'desc'), limit(100)) : null, [firestore]);
  const { data: members } = useCollection<UserProfile>(usersQuery);

  const updateSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL SYNCED", description: `${key} updated.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-white"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black">UNAUTHORIZED ACCESS</div>;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Activity /> },
    { id: 'earning', label: 'Earning Sectors', icon: <DollarSign /> },
    { id: 'members', label: 'Member Registry', icon: <UsersIcon /> },
    { id: 'financials', label: 'Financials', icon: <Wallet /> },
    { id: 'signals', label: 'Global Signals', icon: <Signal /> },
    { id: 'system', label: 'System Control', icon: <Settings /> },
    { id: 'branding', label: 'Branding Hub', icon: <Palette /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-8 border-b border-slate-100 flex items-center gap-3">
        <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"><Zap className="h-5 w-5 text-white" /></div>
        <span className="text-sm font-black uppercase italic text-slate-800">Campus<span className="text-primary">Hub</span> Control</span>
      </div>
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => { setActiveTab(item.id as AdminTab); setIsMobileNavOpen(false); }} 
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest italic", 
              activeTab === item.id ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            <span className="h-4 w-4">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-8 border-t border-slate-50 bg-slate-50/50">
         <div className="flex items-center gap-3 text-slate-400">
            <ShieldCheck className="h-3 w-3" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Industrial Protocol v6.0.0</span>
         </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 selection:bg-primary/20 font-sans">
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col fixed inset-y-0 left-0 z-[100] shadow-sm">{sidebarContent}</aside>

      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col relative">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[150] px-8 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4">
              <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden hover:bg-slate-100 rounded-xl"><Menu /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-none" title="Admin Navigation" description="Main control menu for industrial app management">
                  {sidebarContent}
                </SheetContent>
              </Sheet>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">{navItems.find(n => n.id === activeTab)?.label}</h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-500/10 border border-green-500/20 shadow-inner">
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase text-green-600 italic tracking-widest">⚡ REAL-TIME SIGNAL ACTIVE</span>
              </div>
           </div>
        </header>

        <div className="p-8 space-y-10">
           {activeTab === 'overview' && (
              <div className="space-y-10 animate-in fade-in duration-700">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PanzeStatCard label="Member Registry" value={members?.length || 0} icon={<UsersIcon />} trend="Live Traffic" color="bg-indigo-500" />
                    <PanzeStatCard label="Gross Ad Income" value={`₹${(stats?.totalGrossRevenueINR || 0).toFixed(2)}`} icon={<DollarSign />} trend="S2S Logic" color="bg-emerald-500" />
                    <PanzeStatCard label="Member Share" value={`₹${(stats?.totalUserPayoutsINR || 0).toFixed(2)}`} icon={<Zap />} trend="Distributed" color="bg-primary" />
                    <PanzeStatCard label="Admin Net Profit" value={`₹${(stats?.totalAdminProfitINR || 0).toFixed(2)}`} icon={<TrendingUp />} trend="High Yield" color="bg-amber-500" />
                 </div>

                 <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 bg-white border-slate-200 rounded-[2.5rem] p-10 shadow-sm border group">
                       <div className="flex items-center justify-between mb-8">
                          <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-400">Retention Analytics</h3>
                          <Badge variant="outline" className="border-slate-100 uppercase font-black text-[8px]">Real-Time Signal</Badge>
                       </div>
                       <div className="h-64 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-4 group-hover:border-primary/20 transition-all">
                          <BarChart3 className="h-12 w-12 opacity-20" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em] ml-4">Decrypting Daily Batch Signals...</p>
                       </div>
                    </Card>
                    <Card className="bg-white border-slate-200 rounded-[2.5rem] p-10 shadow-sm border">
                       <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-400 mb-8">Geo Nodes</h3>
                       <div className="space-y-6">
                          <GeoRow label="India Hub" value="84%" pct={84} />
                          <GeoRow label="Global North" value="12%" pct={12} />
                          <GeoRow label="Rest of World" value="4%" pct={4} />
                       </div>
                    </Card>
                 </div>
              </div>
           )}

           {activeTab === 'earning' && (
              <div className="space-y-8 animate-in fade-in duration-700">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {MONETIZATION_REGISTRY.map(mon => (
                     <Card key={mon.id} className="bg-white border-slate-100 p-8 rounded-[2.5rem] space-y-6 border hover:shadow-xl hover:border-primary/20 transition-all group relative overflow-hidden">
                        <div className="flex items-center justify-between relative z-10">
                           <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-slate-100"><mon.icon size={22} /></div>
                           <Switch 
                             checked={!!(settings as any)?.[mon.visibilityKey]} 
                             onCheckedChange={v => updateSetting(mon.visibilityKey, v)} 
                             disabled={isProcessing === mon.visibilityKey}
                           />
                        </div>
                        <div className="relative z-10">
                           <h4 className="text-lg font-black uppercase italic truncate tracking-tight text-slate-800">{mon.label}</h4>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{mon.provider}</p>
                        </div>
                        <div className="space-y-5 pt-5 border-t border-slate-50 relative z-10">
                           <div className="space-y-1">
                              <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Member Share (%)</Label>
                              <Input 
                                type="number"
                                defaultValue={(settings as any)?.[`${mon.id}_share`] || 10}
                                onBlur={e => updateSetting(`${mon.id}_share`, parseFloat(e.target.value))}
                                className="h-10 bg-slate-50 border-none font-black text-primary text-sm rounded-xl focus:ring-1 focus:ring-primary/20"
                              />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Daily Limit</Label>
                              <Input 
                                type="number"
                                defaultValue={(settings as any)?.[`${mon.id}_limit`] || 100}
                                onBlur={e => updateSetting(`${mon.id}_limit`, parseInt(e.target.value))}
                                className="h-10 bg-slate-50 border-none font-black text-slate-700 text-sm rounded-xl focus:ring-1 focus:ring-primary/20"
                              />
                           </div>
                           <Badge className="bg-primary/5 text-primary border-none text-[7px] font-black px-2 py-0.5 uppercase tracking-widest">{mon.category}</Badge>
                        </div>
                        <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                           <mon.icon size={100} />
                        </div>
                     </Card>
                   ))}
                 </div>
              </div>
           )}

           {activeTab === 'signals' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="AdMob & Video Hub" icon={<Smartphone />}>
                    <div className="space-y-8">
                       <PanzeField label="AdMob App ID" value={settings?.admobAppId} onUpdate={v => updateSetting('admobAppId', v)} />
                       <PanzeField label="Rewarded Unit ID" value={settings?.admobRewardedUnitId} onUpdate={v => updateSetting('admobRewardedUnitId', v)} />
                       <PanzeField label="VAST Tag Signal" value={settings?.vastAdTagUrl} onUpdate={v => updateSetting('vastAdTagUrl', v)} />
                    </div>
                 </PanzeConfigCard>

                 <PanzeConfigCard title="Master Signals" icon={<Signal />}>
                    <div className="space-y-8">
                       <PanzeField label="YouTube Hub URL" value={settings?.globalYoutubeStreamUrl} onUpdate={v => updateSetting('globalYoutubeStreamUrl', v)} />
                       <PanzeField label="Direct Stream Node" value={settings?.globalDirectStreamUrl} onUpdate={v => updateSetting('globalDirectStreamUrl', v)} />
                       <PanzeField label="YouTube API Key" value={settings?.youtubeApiKey} onUpdate={v => updateSetting('youtubeApiKey', v)} />
                       <PanzeField label="Push Signal Key" value={settings?.pushNotificationKey} onUpdate={v => updateSetting('pushNotificationKey', v)} />
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'system' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Global Audio Hub" icon={<Volume2 />}>
                    <div className="space-y-8">
                       <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <div>
                             <p className="text-sm font-black uppercase italic text-slate-800">App SFX Engine</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enable/Disable interface chimes</p>
                          </div>
                          <Switch checked={!!settings?.sfxEnabled} onCheckedChange={v => updateSetting('sfxEnabled', v)} />
                       </div>
                       <PanzeField label="Reward Claim Sound (URL)" value={settings?.rewardSoundUrl} onUpdate={v => updateSetting('rewardSoundUrl', v)} />
                       <PanzeField label="Payout Alert Sound (URL)" value={settings?.payoutSoundUrl} onUpdate={v => updateSetting('payoutSoundUrl', v)} />
                    </div>
                 </PanzeConfigCard>

                 <PanzeConfigCard title="Version Control" icon={<Package />}>
                    <div className="space-y-8">
                       <PanzeField label="Current Version (APK)" value={settings?.appVersion} onUpdate={v => updateSetting('appVersion', v)} />
                       <PanzeField label="APK Download Link" value={settings?.apkDownloadUrl} onUpdate={v => updateSetting('apkDownloadUrl', v)} />
                       <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                          <div>
                             <p className="text-sm font-black uppercase italic text-slate-800">Maintenance Protocol</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lock entire arena for maintenance</p>
                          </div>
                          <Switch checked={!!settings?.maintenanceMode} onCheckedChange={v => updateSetting('maintenanceMode', v)} />
                       </div>
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'branding' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Identity Node" icon={<Palette />}>
                    <div className="space-y-8">
                       <PanzeField label="Industrial App Name" value={settings?.customAppName} onUpdate={v => updateSetting('customAppName', v)} />
                       <PanzeField label="Logo Asset Hub URL" value={settings?.customLogoUrl} onUpdate={v => updateSetting('customLogoUrl', v)} />
                    </div>
                 </PanzeConfigCard>

                 <PanzeConfigCard title="12-Preset Theme Hub" icon={<Layers />}>
                    <div className="grid grid-cols-2 gap-4">
                       {MASTER_THEMES.map(theme => (
                         <button 
                           key={theme.id} 
                           onClick={() => updateSetting('currentThemeId', theme.id)}
                           className={cn(
                             "p-5 rounded-2xl border-2 flex items-center justify-between transition-all group",
                             settings?.currentThemeId === theme.id ? "border-primary bg-primary/5 shadow-inner shadow-primary/10" : "border-slate-50 hover:border-slate-200"
                           )}
                         >
                            <span className="text-[10px] font-black uppercase italic tracking-tighter text-slate-700 group-hover:text-primary transition-colors">{theme.name}</span>
                            <div className="h-4 w-4 rounded-full shadow-lg" style={{ background: `hsl(${theme.primary})` }} />
                         </button>
                       ))}
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'members' && (
              <Card className="bg-white border-slate-200 rounded-[3rem] overflow-hidden shadow-sm border">
                 <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div>
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">Member Registry</h3>
                       <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] mt-1">Industrial Identity Audit Feed</p>
                    </div>
                    <Button variant="outline" className="rounded-xl font-black text-[9px] uppercase px-6 border-slate-200">Export Signals</Button>
                 </div>
                 <div className="divide-y divide-slate-50">
                    {members?.map(w => (
                       <div key={w.id} className="p-8 flex items-center justify-between hover:bg-slate-50/30 transition-all group">
                          <div className="flex items-center gap-8">
                             <div className="h-16 w-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center font-black text-primary text-2xl shadow-inner group-hover:bg-white group-hover:shadow-md transition-all border border-slate-100">
                               {w.email?.[0].toUpperCase() || 'U'}
                             </div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                   <p className="text-sm font-black uppercase italic text-slate-800">{w.email || 'Anonymous'}</p>
                                   <Badge variant="outline" className={cn("text-[8px] px-3 h-5 font-black uppercase tracking-widest", w.isSuspended ? "text-red-500 border-red-100 bg-red-50" : "text-emerald-500 border-emerald-100 bg-emerald-50")}>
                                      {w.isSuspended ? 'SIGNAL BLOCKED' : 'CLEAN IDENTITY'}
                                   </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                   <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black px-3 h-5 uppercase">IP: {w.lastIp || 'N/A'}</Badge>
                                   <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black px-3 h-5 uppercase">HWID: {w.deviceId?.substring(0, 10) || 'N/A'}</Badge>
                                   <Badge className="bg-slate-50 text-slate-400 border-none text-[8px] font-black px-3 h-5 uppercase">Node: {w.primaryIntent || 'Earner'}</Badge>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className="text-right">
                                <p className="text-2xl font-black text-primary italic tabular-nums">{(w.coins || 0).toLocaleString()} 🪙</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Industrial Assets</p>
                             </div>
                             <button className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-primary hover:bg-primary/5 transition-all">
                                <ArrowRight className="h-5 w-5" />
                             </button>
                          </div>
                       </div>
                    ))}
                 </div>
              </Card>
           )}
        </div>
      </main>
    </div>
  );
}

function PanzeStatCard({ label, value, icon, trend, color }: any) {
  return (
    <Card className="bg-white border-slate-200 p-10 rounded-[3rem] shadow-sm group hover:shadow-xl hover:scale-[1.02] transition-all duration-500 overflow-hidden relative border">
       <div className="relative z-10 flex flex-col gap-8">
          <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-opacity-20", color)}>{icon}</div>
          <div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-2 italic">{label}</p>
             <h4 className="text-4xl font-black text-slate-800 italic tracking-tighter tabular-nums leading-none">{value}</h4>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 w-fit">
             <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">{trend}</span>
          </div>
       </div>
       <div className={cn("absolute -bottom-8 -right-8 h-40 w-40 rounded-full opacity-5 blur-3xl", color)} />
    </Card>
  );
}

function GeoRow({ label, value, pct }: any) {
   return (
      <div className="space-y-3">
         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-slate-500">{label}</span>
            <span className="text-primary italic">{value}</span>
         </div>
         <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
            <div className="h-full bg-primary shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${pct}%` }} />
         </div>
      </div>
   );
}

function PanzeConfigCard({ title, icon, children }: any) {
  return (
    <Card className="bg-white border-slate-200 rounded-[3.5rem] p-10 space-y-10 shadow-sm border h-full transition-all hover:shadow-md">
       <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
          <div className="h-12 w-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/10">{icon}</div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">{title}</h3>
       </div>
       {children}
    </Card>
  );
}

function PanzeField({ label, value, onUpdate }: any) {
  return (
    <div className="space-y-3">
       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest">{label}</Label>
       <Input 
         defaultValue={value} 
         onBlur={e => onUpdate(e.target.value)} 
         className="h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold text-xs text-primary px-8 focus:ring-primary/20 focus:border-primary/40 shadow-inner" 
         placeholder={`Enter ${label}...`}
       />
    </div>
  );
}

