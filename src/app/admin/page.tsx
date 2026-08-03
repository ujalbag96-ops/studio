
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy, increment, where, getDoc } from 'firebase/firestore';
import { 
  Loader2, Zap, DollarSign, TrendingUp, Users as UsersIcon, UserCheck, 
  Palette, Radio, Activity, Layout, BarChart3, Settings, Gauge, CreditCard, Video, Youtube,
  ShieldAlert, ShieldCheck, Fingerprint, Search, Plus, Minus, Ban, CheckCircle2,
  Volume2, Bell, LayoutDashboard, ShoppingBag, Globe, ArrowUpRight, PieChart, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, UserProfile, PlatformRevenue } from '../lib/types';
import { MONETIZATION_REGISTRY } from '../lib/monetization-registry';
import { MASTER_THEMES } from '../lib/themes';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'overview' | 'earning' | 'warriors' | 'financials' | 'apis' | 'sounds' | 'branding';

export default function AdminDashboardV3() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Data fetching
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);
  
  const warriorsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('joinedAt', 'desc'), limit(100)) : null, [firestore]);
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

  if (isUserLoading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="mt-4 text-xs font-bold text-muted-foreground uppercase tracking-widest italic">Authenticating Hub Access...</p>
    </div>
  );

  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex flex-col items-center justify-center gap-6">
        <ShieldAlert size={80} className="animate-pulse" />
        <h1 className="font-black uppercase italic tracking-widest text-4xl">Security Breach Detected</h1>
        <p className="text-muted-foreground font-medium uppercase text-xs">Identity mismatched with Master Key.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans selection:bg-primary/20">
      {/* PANZE STYLE SIDEBAR */}
      <aside className="w-72 bg-white border-r border-slate-200/60 hidden lg:flex flex-col fixed inset-y-0 left-0 z-[100] shadow-[10px_0_40px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black uppercase italic leading-none">Campus<span className="text-primary">Hub</span></p>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Admin v3.0 Master</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 ml-4 italic">Core Terminal</p>
          <SidebarItem active={activeTab === 'overview'} label="Overview" icon={<LayoutDashboard />} onClick={() => setActiveTab('overview')} />
          <SidebarItem active={activeTab === 'earning'} label="Income Hub" icon={<DollarSign />} onClick={() => setActiveTab('earning')} />
          <SidebarItem active={activeTab === 'warriors'} label="Warrior List" icon={<UsersIcon />} onClick={() => setActiveTab('warriors')} />
          <SidebarItem active={activeTab === 'financials'} label="Financials" icon={<Wallet />} onClick={() => setActiveTab('financials')} />
          
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 mt-8 ml-4 italic">Infrastructure</p>
          <SidebarItem active={activeTab === 'apis'} label="API & Ad Engine" icon={<Radio />} onClick={() => setActiveTab('apis')} />
          <SidebarItem active={activeTab === 'sounds'} label="Audio Engine" icon={<Volume2 />} onClick={() => setActiveTab('sounds')} />
          <SidebarItem active={activeTab === 'branding'} label="Visual Identity" icon={<Palette />} onClick={() => setActiveTab('branding')} />
        </nav>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden">
                 <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Admin" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase italic truncate max-w-[120px]">{user.email?.split('@')[0]}</p>
                 <Badge className="bg-green-500 text-white border-none text-[6px] h-3 font-black px-1.5 uppercase italic">Master Root</Badge>
              </div>
           </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 px-8 flex items-center justify-between shadow-sm">
           <div className="flex items-center gap-4">
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">
                {activeTab === 'overview' ? 'Hub Overview' : 
                 activeTab === 'earning' ? 'Earning Sectors' : 
                 activeTab === 'warriors' ? 'Warrior Registry' : 
                 activeTab === 'financials' ? 'Financial Hub' :
                 activeTab === 'apis' ? 'Global API Node' :
                 activeTab === 'sounds' ? 'Sonic Hub' : 'Identity Hub'}
              </h2>
           </div>

           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-green-500/10 border border-green-500/20 shadow-sm">
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase text-green-600 tracking-widest italic">⚡ REAL-TIME SIGNAL ACTIVE</span>
              </div>
           </div>
        </header>

        <div className="p-8 space-y-10">
           {activeTab === 'overview' && (
              <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-2">
                 {/* TOP STAT CARDS */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PanzeStatCard label="Active Warriors" value={warriors?.length || 0} icon={<UsersIcon />} trend="+12% Pulse" color="bg-indigo-500" />
                    <PanzeStatCard label="Gross Ad Revenue" value={`₹${(stats?.totalGrossRevenueINR || 0).toLocaleString()}`} icon={<DollarSign />} trend="Stable Feed" color="bg-emerald-500" />
                    <PanzeStatCard label="User Share" value={`₹${(stats?.totalUserPayoutsINR || 0).toLocaleString()}`} icon={<Zap />} trend="10% Dist" color="bg-primary" />
                    <PanzeStatCard label="Admin Net Profit" value={`₹${(stats?.totalAdminProfitINR || 0).toLocaleString()}`} icon={<TrendingUp />} trend="High Yield" color="bg-amber-500" />
                 </div>

                 {/* ANALYTICS PREVIEW */}
                 <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 bg-white border-slate-200/60 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
                       <div className="flex items-center justify-between mb-8">
                          <div>
                             <h3 className="text-lg font-black uppercase italic text-slate-800">Video Retention Node</h3>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Global Watch Time Minutes</p>
                          </div>
                          <Badge variant="outline" className="border-slate-100 text-[8px] font-black uppercase">Live Graph</Badge>
                       </div>
                       <div className="h-[300px] w-full bg-slate-50/50 rounded-3xl flex items-center justify-center border border-dashed border-slate-200">
                          <BarChart3 className="h-10 w-10 text-slate-200" />
                       </div>
                    </Card>

                    <Card className="bg-white border-slate-200/60 rounded-[2.5rem] p-8 shadow-sm">
                       <h3 className="text-sm font-black uppercase italic mb-6 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-primary" /> Global Geolocation
                       </h3>
                       <div className="space-y-6">
                          <GeoRow label="India" percent={82} count={1240} />
                          <GeoRow label="United States" percent={12} count={142} />
                          <GeoRow label="Brazil" percent={4} count={89} />
                          <GeoRow label="Others" percent={2} count={50} />
                       </div>
                    </Card>
                 </div>
              </div>
           )}

           {activeTab === 'earning' && (
              <div className="space-y-10 animate-in fade-in duration-700">
                 <Card className="bg-primary/5 border-primary/20 p-10 rounded-[3rem] border-2 space-y-8 shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center shadow-lg text-primary border border-slate-100">
                          <Gauge size={28} />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-800">Economy <span className="text-primary">Calibration</span></h3>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic">Multi-Node User Reward Management</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       <PanzeEconomyInput label="CPA Share %" value={settings?.cpaUserSharePercent || 30} onUpdate={v => updateSetting('cpaUserSharePercent', v)} />
                       <PanzeEconomyInput label="Video Ads %" value={settings?.videoUserSharePercent || 10} onUpdate={v => updateSetting('videoUserSharePercent', v)} />
                       <PanzeEconomyInput label="YouTube %" value={settings?.youtubeUserSharePercent || 10} onUpdate={v => updateSetting('youtubeUserSharePercent', v)} />
                       <PanzeEconomyInput label="Global Default %" value={settings?.userRevenueSharePercent || 10} onUpdate={v => updateSetting('userRevenueSharePercent', v)} />
                    </div>
                 </Card>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {MONETIZATION_REGISTRY.map((mon) => (
                      <Card key={mon.id} className="bg-white border-slate-100 p-8 rounded-[2.5rem] space-y-6 hover:shadow-xl transition-all group relative border">
                         <div className="flex items-center justify-between">
                            <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                               <mon.icon size={24} />
                            </div>
                            <Switch checked={!!(settings as any)?.[mon.visibilityKey]} onCheckedChange={(v) => updateSetting(mon.visibilityKey, v)} />
                         </div>
                         <div>
                            <h4 className="text-lg font-black uppercase italic text-slate-800 truncate">{mon.label}</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">{mon.provider}</p>
                         </div>
                         <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <Badge className="bg-primary/10 text-primary border-none text-[7px] font-black px-2 py-0.5">{mon.category}</Badge>
                            {mon.eCPMTier === 'High' && <span className="text-[7px] font-black text-emerald-500">HIGH eCPM</span>}
                         </div>
                      </Card>
                    ))}
                 </div>
              </div>
           )}

           {activeTab === 'warriors' && (
              <div className="space-y-10 animate-in fade-in duration-700">
                 <Card className="bg-white border-slate-200/60 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                       <div>
                          <h3 className="text-lg font-black uppercase italic text-slate-800">Warrior Identity Archives</h3>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Encrypted User Registry Node</p>
                       </div>
                       <div className="relative w-full md:w-80">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                          <Input placeholder="SEARCH GMAIL / UID / IP..." className="h-12 bg-white border-slate-200 rounded-xl pl-12 text-xs font-bold uppercase tracking-tight" />
                       </div>
                    </div>
                    <div className="divide-y divide-slate-50">
                       {warriors?.map(w => (
                          <div key={w.id} className="p-8 flex flex-col md:flex-row items-center justify-between gap-8 hover:bg-slate-50/50 transition-all">
                             <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-primary text-xl shadow-inner">
                                   {w.email?.[0].toUpperCase() || 'U'}
                                </div>
                                <div className="space-y-2">
                                   <div className="flex items-center gap-3">
                                      <p className="text-sm font-black uppercase italic text-slate-800 leading-none">{w.email || 'Anonymous Warrior'}</p>
                                      <Badge variant="outline" className={cn("text-[6px] px-1.5 h-4 border-slate-200 font-black uppercase", w.isSuspended ? "text-red-500 border-red-100 bg-red-50" : "text-emerald-500")}>
                                         {w.isSuspended ? 'Suspended' : 'Verified Signal'}
                                      </Badge>
                                   </div>
                                   <div className="flex flex-wrap gap-2">
                                      <IdentityBadge label="UID" value={w.id} />
                                      <IdentityBadge label="HWID" value={w.deviceId || 'NO_HARDWARE'} />
                                      <IdentityBadge label="IP" value={w.lastIp || 'NO_IP'} />
                                   </div>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-xl font-black text-primary italic tabular-nums">{(w.coins || 0).toLocaleString()} <span className="text-[10px] opacity-40">🪙</span></p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Joined: {new Date(w.joinedAt || '').toLocaleDateString()}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </Card>
              </div>
           )}

           {activeTab === 'apis' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Ad Engine Configuration" icon={<ShieldCheck />}>
                    <div className="grid gap-6">
                       <PanzeField label="AdMob App ID" value={settings?.admobAppId} onUpdate={v => updateSetting('admobAppId', v)} />
                       <PanzeField label="Rewarded Unit ID" value={settings?.admobRewardedUnitId} onUpdate={v => updateSetting('admobRewardedUnitId', v)} />
                       <PanzeField label="VAST AdTag URL" value={settings?.vastAdTagUrl} onUpdate={v => updateSetting('vastAdTagUrl', v)} />
                    </div>
                 </PanzeConfigCard>

                 <PanzeConfigCard title="Global Signal Keys" icon={<Radio />}>
                    <div className="grid gap-6">
                       <PanzeField label="YouTube Data Key" value={settings?.youtubeApiKey} onUpdate={v => updateSetting('youtubeApiKey', v)} />
                       <PanzeField label="CPA Lead Signal Key" value={settings?.cpaLeadApiKey} onUpdate={v => updateSetting('cpaLeadApiKey', v)} />
                       <PanzeField label="Master YouTube URL" value={settings?.globalYoutubeStreamUrl} onUpdate={v => updateSetting('globalYoutubeStreamUrl', v)} />
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'sounds' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Platform Sound Engine" icon={<Volume2 />}>
                    <div className="space-y-6">
                       <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100">
                          <div>
                             <p className="text-sm font-black uppercase italic text-slate-800">SFX Master Switch</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Enable in-app audio feedback</p>
                          </div>
                          <Switch checked={!!settings?.sfxEnabled} onCheckedChange={v => updateSetting('sfxEnabled', v)} />
                       </div>
                       <PanzeField label="Reward Chime URL" value={settings?.rewardSoundUrl} onUpdate={v => updateSetting('rewardSoundUrl', v)} />
                       <PanzeField label="Notification Sound" value={settings?.notifSoundUrl} onUpdate={v => updateSetting('notifSoundUrl', v)} />
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'branding' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Visual Identity Hub" icon={<Palette />}>
                    <div className="space-y-6">
                       <PanzeField label="App Title Node" value={settings?.customAppName} onUpdate={v => updateSetting('customAppName', v)} />
                       <PanzeField label="Logo Node (URL)" value={settings?.customLogoUrl} onUpdate={v => updateSetting('customLogoUrl', v)} />
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 italic tracking-widest">Active Master Theme</Label>
                          <Select value={settings?.currentThemeId || 'dark-default'} onValueChange={v => updateSetting('currentThemeId', v)}>
                             <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl font-black text-xs uppercase italic">
                                <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="bg-white border-slate-200 text-slate-900">
                                {MASTER_THEMES.map(t => (
                                   <SelectItem key={t.id} value={t.id} className="font-bold uppercase text-[10px] py-3">{t.name}</SelectItem>
                                ))}
                             </SelectContent>
                          </Select>
                       </div>
                    </div>
                 </PanzeConfigCard>
              </div>
           )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ active, label, icon, onClick }: { active: boolean, label: string, icon: any, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all font-black uppercase text-[10px] tracking-widest italic",
        active ? "bg-primary text-white shadow-xl shadow-primary/20" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
      )}
    >
      <span className={cn("h-4.5 w-4.5", active ? "text-white" : "text-primary")}>{icon}</span>
      <span>{label}</span>
      {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white animate-pulse" />}
    </button>
  );
}

function PanzeStatCard({ label, value, icon, trend, color }: any) {
  return (
    <Card className="bg-white border-slate-200/60 p-8 rounded-[2.5rem] shadow-sm group hover:shadow-xl transition-all duration-500 overflow-hidden relative border">
       <div className="relative z-10 flex flex-col gap-6">
          <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg", color)}>
             {icon}
          </div>
          <div>
             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 italic">{label}</p>
             <h4 className="text-3xl font-black text-slate-800 italic tracking-tighter tabular-nums">{value}</h4>
          </div>
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200/50">
                <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-slate-500 uppercase italic">{trend}</span>
             </div>
          </div>
       </div>
       <div className={cn("absolute -bottom-4 -right-4 h-24 w-24 rounded-full opacity-5 group-hover:scale-150 transition-transform duration-700", color)} />
    </Card>
  );
}

function GeoRow({ label, percent, count }: any) {
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-center text-[10px] font-black uppercase italic text-slate-800">
          <span>{label}</span>
          <span className="text-primary">{percent}% <span className="text-slate-300 font-bold opacity-40 ml-1">({count})</span></span>
       </div>
       <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percent}%` }} />
       </div>
    </div>
  );
}

function PanzeEconomyInput({ label, value, onUpdate }: any) {
  return (
    <div className="space-y-3 bg-white p-6 rounded-3xl border border-slate-100 group hover:border-primary/40 transition-all shadow-sm">
       <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-[0.2em] italic">
          {label}
       </Label>
       <div className="flex items-center gap-3">
          <Input 
            type="number" 
            value={value} 
            onChange={e => onUpdate(parseFloat(e.target.value))}
            className="h-12 bg-slate-50 border-slate-200 rounded-xl font-black text-lg text-primary text-center focus:ring-primary/20" 
          />
          <span className="text-xs font-black text-slate-300">%</span>
       </div>
    </div>
  );
}

function PanzeConfigCard({ title, icon, children }: any) {
  return (
    <Card className="bg-white border-slate-200/60 rounded-[3rem] p-10 space-y-8 shadow-sm border">
       <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
          <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary border border-primary/10">
             {icon}
          </div>
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-800">{title}</h3>
       </div>
       {children}
    </Card>
  );
}

function PanzeField({ label, value, onUpdate }: any) {
  return (
    <div className="space-y-2">
       <Label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest italic">{label}</Label>
       <Input 
         value={value} 
         onChange={e => onUpdate(e.target.value)} 
         className="h-14 bg-slate-50 border-slate-200 rounded-2xl font-bold text-xs text-primary px-6" 
         placeholder="SIGNAL_NULL" 
       />
    </div>
  );
}

function IdentityBadge({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/50">
       <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
       <span className="text-[8px] font-bold text-slate-700 uppercase italic truncate max-w-[80px]">{value}</span>
    </div>
  );
}
