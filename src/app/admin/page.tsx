'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy, getDoc } from 'firebase/firestore';
import { 
  Loader2, Zap, DollarSign, TrendingUp, Users as UsersIcon, 
  Palette, Radio, Activity, BarChart3, Settings, Gauge, CreditCard,
  ShieldAlert, ShieldCheck, Fingerprint, Search, Ban, CheckCircle2,
  Volume2, LayoutDashboard, Globe, Wallet,
  Menu, Check, Edit3, AlertCircle, X, Download, Smartphone,
  Layers, Package, Monitor, Signal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, UserProfile, PlatformRevenue } from '../lib/types';
import { MONETIZATION_REGISTRY } from '../lib/monetization-registry';
import { MASTER_THEMES } from '../lib/themes';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'overview' | 'earning' | 'directory' | 'financials' | 'signals' | 'system' | 'branding';

export default function AdminDashboardV5() {
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
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard /> },
    { id: 'earning', label: 'Earning Sectors', icon: <DollarSign /> },
    { id: 'directory', label: 'Member Registry', icon: <UsersIcon /> },
    { id: 'financials', label: 'Financials', icon: <Wallet /> },
    { id: 'signals', label: 'Global Signals', icon: <Radio /> },
    { id: 'system', label: 'System Control', icon: <Settings /> },
    { id: 'branding', label: 'Identity Hub', icon: <Palette /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white">
      <div className="p-8 border-b border-slate-100 flex items-center gap-3">
        <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
        <span className="text-sm font-black uppercase italic text-slate-800">Campus<span className="text-primary">Hub</span> Master</span>
      </div>
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => { setActiveTab(item.id as AdminTab); setIsMobileNavOpen(false); }} 
            className={cn(
              "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest italic", 
              activeTab === item.id ? "bg-primary text-white shadow-xl" : "text-slate-400 hover:bg-slate-50"
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
            <span className="text-[8px] font-bold uppercase tracking-widest">Industrial Build v5.0.2</span>
         </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 selection:bg-primary/20">
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col fixed inset-y-0 left-0 z-[100] shadow-sm">{sidebarContent}</aside>

      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col relative">
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 px-8 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4">
              <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden"><Menu /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-none">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Admin Navigation</SheetTitle>
                    <SheetDescription>Access dashboard sectors</SheetDescription>
                  </SheetHeader>
                  {sidebarContent}
                </SheetContent>
              </Sheet>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">{navItems.find(n => n.id === activeTab)?.label}</h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-500/10 border border-green-500/20 shadow-inner">
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase text-green-600 italic">⚡ REAL-TIME SIGNAL ACTIVE</span>
              </div>
           </div>
        </header>

        <div className="p-8 space-y-10">
           {activeTab === 'overview' && (
              <div className="space-y-10 animate-in fade-in duration-700">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PanzeStatCard label="Member Registry" value={members?.length || 0} icon={<UsersIcon />} trend="Live Feed" color="bg-indigo-500" />
                    <PanzeStatCard label="Gross Ad Revenue" value={`₹${(stats?.totalGrossRevenueINR || 0).toFixed(2)}`} icon={<DollarSign />} trend="S2S Logic" color="bg-emerald-500" />
                    <PanzeStatCard label="User Dividends" value={`₹${(stats?.totalUserPayoutsINR || 0).toFixed(2)}`} icon={<Zap />} trend="10% Distributed" color="bg-primary" />
                    <PanzeStatCard label="Admin Net Profit" value={`₹${(stats?.totalAdminProfitINR || 0).toFixed(2)}`} icon={<TrendingUp />} trend="High Yield" color="bg-amber-500" />
                 </div>

                 <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 bg-white border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                       <h3 className="text-sm font-black uppercase italic mb-6">Video Retention Analytics</h3>
                       <div className="h-64 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                          <BarChart3 className="h-12 w-12 opacity-10" />
                          <p className="text-[10px] font-bold uppercase ml-4">Waiting for daily batch signals...</p>
                       </div>
                    </Card>
                    <Card className="bg-white border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                       <h3 className="text-sm font-black uppercase italic mb-6">Geo Distribution</h3>
                       <div className="space-y-4">
                          <GeoRow label="India Node" value="84%" pct={84} />
                          <GeoRow label="Global North" value="12%" pct={12} />
                          <GeoRow label="Rest of World" value="4%" pct={4} />
                       </div>
                    </Card>
                 </div>
              </div>
           )}

           {activeTab === 'earning' && (
              <div className="space-y-8 animate-in fade-in duration-700">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                   {MONETIZATION_REGISTRY.slice(0, 100).map(mon => (
                     <Card key={mon.id} className="bg-white border-slate-100 p-8 rounded-[2.5rem] space-y-6 border hover:shadow-xl transition-all group">
                        <div className="flex items-center justify-between">
                           <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><mon.icon size={20} /></div>
                           <Switch checked={!!(settings as any)?.[mon.visibilityKey]} onCheckedChange={v => updateSetting(mon.visibilityKey, v)} />
                        </div>
                        <div>
                           <h4 className="text-lg font-black uppercase italic truncate">{mon.label}</h4>
                           <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{mon.provider}</p>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-slate-50">
                           <div className="flex items-center justify-between">
                              <span className="text-[7px] font-black uppercase text-slate-400">User Share %</span>
                              <input 
                                defaultValue={(settings as any)?.[`${mon.id}_share`] || 10}
                                onBlur={e => updateSetting(`${mon.id}_share`, parseFloat(e.target.value))}
                                className="w-12 bg-slate-50 border-none text-right font-black text-primary text-[10px]"
                              />
                           </div>
                           <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black px-2 py-0.5">{mon.category}</Badge>
                        </div>
                     </Card>
                   ))}
                 </div>
              </div>
           )}

           {activeTab === 'signals' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Global Ad Engine" icon={<Layers />}>
                    <div className="space-y-6">
                       <PanzeField label="AdMob App ID" value={settings?.admobAppId} onUpdate={v => updateSetting('admobAppId', v)} />
                       <PanzeField label="Rewarded Unit ID" value={settings?.admobRewardedUnitId} onUpdate={v => updateSetting('admobRewardedUnitId', v)} />
                       <PanzeField label="VAST AdTag URL" value={settings?.vastAdTagUrl} onUpdate={v => updateSetting('vastAdTagUrl', v)} />
                    </div>
                 </PanzeConfigCard>

                 <PanzeConfigCard title="Master Signals" icon={<Signal />}>
                    <div className="space-y-6">
                       <PanzeField label="YouTube Data API Key" value={settings?.youtubeApiKey} onUpdate={v => updateSetting('youtubeApiKey', v)} />
                       <PanzeField label="Global YouTube Hub URL" value={settings?.globalYoutubeStreamUrl} onUpdate={v => updateSetting('globalYoutubeStreamUrl', v)} />
                       <PanzeField label="CPA Lead Postback Key" value={settings?.cpaLeadApiKey} onUpdate={v => updateSetting('cpaLeadApiKey', v)} />
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'system' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Version Control" icon={<Smartphone />}>
                    <div className="space-y-6">
                       <PanzeField label="App Version (e.g. 1.0.5)" value={settings?.appVersion} onUpdate={v => updateSetting('appVersion', v)} />
                       <PanzeField label="APK Download URL" value={settings?.apkDownloadUrl} onUpdate={v => updateSetting('apkDownloadUrl', v)} />
                       <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                             <p className="text-sm font-black uppercase italic">Maintenance Shield</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase">Lock app for all users</p>
                          </div>
                          <Switch checked={!!settings?.maintenanceMode} onCheckedChange={v => updateSetting('maintenanceMode', v)} />
                       </div>
                    </div>
                 </PanzeConfigCard>

                 <PanzeConfigCard title="Audio & Notifications" icon={<Volume2 />}>
                    <div className="space-y-6">
                       <PanzeField label="Reward Sound URL" value={settings?.globalRewardSoundUrl} onUpdate={v => updateSetting('globalRewardSoundUrl', v)} />
                       <PanzeField label="Notification Sound URL" value={settings?.notifSoundUrl} onUpdate={v => updateSetting('notifSoundUrl', v)} />
                       <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                             <p className="text-sm font-black uppercase italic">Broadcast Center</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase">Enable global notification banner</p>
                          </div>
                          <Switch checked={!!settings?.broadcastActive} onCheckedChange={v => updateSetting('broadcastActive', v)} />
                       </div>
                       <PanzeField label="Broadcast Content" value={settings?.broadcastMessage} onUpdate={v => updateSetting('broadcastMessage', v)} />
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'directory' && (
              <Card className="bg-white border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                 <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-black uppercase italic">Member Registry</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Real-Time IP & Identity Audit</p>
                 </div>
                 <div className="divide-y divide-slate-50">
                    {members?.map(w => (
                       <div key={w.id} className="p-8 flex items-center justify-between hover:bg-slate-50/30 transition-all">
                          <div className="flex items-center gap-6">
                             <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-primary text-xl shadow-inner">{w.email?.[0].toUpperCase()}</div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                   <p className="text-sm font-black uppercase italic">{w.email || 'Anonymous'}</p>
                                   <Badge variant="outline" className={cn("text-[7px] px-2 h-4 font-black uppercase", w.isSuspended ? "text-red-500 border-red-100 bg-red-50" : "text-emerald-500")}>
                                      {w.isSuspended ? 'SUSPENDED' : 'SIGNAL CLEAR'}
                                   </Badge>
                                </div>
                                <div className="flex gap-2">
                                   <Badge className="bg-slate-100 text-slate-500 border-none text-[7px] font-black px-2 h-4">IP: {w.lastIp || 'N/A'}</Badge>
                                   <Badge className="bg-slate-100 text-slate-500 border-none text-[7px] font-black px-2 h-4">INTENT: {w.primaryIntent || 'N/A'}</Badge>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-6">
                             <div className="text-right">
                                <p className="text-xl font-black text-primary italic tabular-nums">{(w.coins || 0).toLocaleString()} 🪙</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">UID: {w.id.substring(0, 12)}...</p>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </Card>
           )}

           {activeTab === 'branding' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Identity Node" icon={<Palette />}>
                    <div className="space-y-6">
                       <PanzeField label="App Title (Industrial)" value={settings?.customAppName} onUpdate={v => updateSetting('customAppName', v)} />
                       <PanzeField label="Logo Asset URL" value={settings?.customLogoUrl} onUpdate={v => updateSetting('customLogoUrl', v)} />
                    </div>
                 </PanzeConfigCard>

                 <PanzeConfigCard title="12-Preset Theme Selector" icon={<Layers />}>
                    <div className="grid grid-cols-2 gap-4">
                       {MASTER_THEMES.map(theme => (
                         <button 
                           key={theme.id} 
                           onClick={() => updateSetting('currentThemeId', theme.id)}
                           className={cn(
                             "p-4 rounded-xl border-2 flex items-center justify-between transition-all",
                             settings?.currentThemeId === theme.id ? "border-primary bg-primary/5" : "border-slate-100 hover:border-slate-200"
                           )}
                         >
                            <span className="text-[10px] font-black uppercase italic">{theme.name}</span>
                            <div className="h-3 w-3 rounded-full" style={{ background: `hsl(${theme.primary})` }} />
                         </button>
                       ))}
                    </div>
                 </PanzeConfigCard>
              </div>
           )}
        </div>
      </main>
    </div>
  );
}

function PanzeStatCard({ label, value, icon, trend, color }: any) {
  return (
    <Card className="bg-white border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm group hover:shadow-xl transition-all duration-500 overflow-hidden relative border">
       <div className="relative z-10 flex flex-col gap-6">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>{icon}</div>
          <div>
             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">{label}</p>
             <h4 className="text-3xl font-black text-slate-800 italic tracking-tighter tabular-nums">{value}</h4>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/50 w-fit">
             <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[8px] font-bold text-slate-500 uppercase italic">{trend}</span>
          </div>
       </div>
    </Card>
  );
}

function GeoRow({ label, value, pct }: any) {
   return (
      <div className="space-y-2">
         <div className="flex justify-between items-center text-[10px] font-black uppercase">
            <span>{label}</span>
            <span className="text-primary italic">{value}</span>
         </div>
         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
         </div>
      </div>
   );
}

function PanzeConfigCard({ title, icon, children }: any) {
  return (
    <Card className="bg-white border-slate-200 rounded-[3rem] p-8 space-y-8 shadow-sm border h-full">
       <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">{icon}</div>
          <h3 className="text-lg font-black uppercase italic tracking-tighter">{title}</h3>
       </div>
       {children}
    </Card>
  );
}

function PanzeField({ label, value, onUpdate }: any) {
  return (
    <div className="space-y-2">
       <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 italic">{label}</Label>
       <Input 
         defaultValue={value} 
         onBlur={e => onUpdate(e.target.value)} 
         className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-bold text-xs text-primary px-6 focus:ring-primary/20" 
       />
    </div>
  );
}
