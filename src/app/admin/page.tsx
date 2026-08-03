'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy, increment } from 'firebase/firestore';
import { 
  Loader2, Zap, DollarSign, TrendingUp, Users as UsersIcon, 
  Palette, Radio, Activity, BarChart3, Settings, CreditCard,
  ShieldCheck, Globe, Wallet, Menu, Volume2, Layers, Signal,
  Smartphone, Monitor, Package, Target, ArrowRight, CheckCircle2,
  AlertCircle, Layout, PieChart, PlayCircle, Eye, ChevronRight,
  Filter, Ban, UserCheck, BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, UserProfile, PlatformRevenue } from '../lib/types';
import { MONETIZATION_REGISTRY } from '../lib/monetization-registry';
import { MASTER_THEMES } from '../lib/themes';
import Link from 'next/link';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'overview' | 'earning' | 'members' | 'financials' | 'signals' | 'system' | 'branding';

export default function AdminCommandCenterV9() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [incomeFilter, setIncomeFilter] = useState<'auto' | 'manual'>('auto');

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
      toast({ title: "SIGNAL SYNCED", description: `${key} node updated in real-time.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const adjustUserBalance = async (uid: string, field: string, amount: number) => {
    if (!firestore) return;
    try {
      const uRef = doc(firestore, 'users', uid);
      await updateDoc(uRef, { [field]: increment(amount) });
      toast({ title: "BALANCE ADJUSTED", description: `Updated ${field} for user node.` });
    } catch (e) {
      toast({ variant: "destructive", title: "ADJUSTMENT FAILED" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black uppercase tracking-[0.5em]">UNAUTHORIZED INDUSTRIAL ACCESS</div>;

  const navItems = [
    { id: 'overview', label: 'Hub Intelligence', icon: <Layout /> },
    { id: 'earning', label: 'Earning Nodes (100+)', icon: <Zap /> },
    { id: 'members', label: 'Member Registry', icon: <UsersIcon /> },
    { id: 'financials', label: 'Financial Hub', icon: <Wallet /> },
    { id: 'signals', label: 'Master Signals', icon: <Signal /> },
    { id: 'system', label: 'System Control', icon: <Settings /> },
    { id: 'branding', label: 'Identity Hub', icon: <Palette /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-100">
      <div className="p-8 border-b border-slate-50 flex items-center gap-3 bg-slate-50/50">
        <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20"><Zap className="h-5 w-5 text-white" /></div>
        <div className="text-left">
           <span className="text-sm font-black uppercase italic text-slate-800">Campus<span className="text-primary">Hub</span></span>
           <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Control Hub v9.0</p>
        </div>
      </div>
      <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => { setActiveTab(item.id as AdminTab); setIsMobileNavOpen(false); }} 
            className={cn(
              "w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest italic group", 
              activeTab === item.id ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]" : "text-slate-400 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-4">
               <span className="h-4 w-4">{item.icon}</span>
               <span>{item.label}</span>
            </div>
            {activeTab === item.id && <ChevronRight className="h-3 w-3" />}
          </button>
        ))}
      </nav>
      <div className="p-8 border-t border-slate-50 bg-slate-50/50 space-y-4">
         <div className="flex items-center gap-3 text-slate-400">
            <ShieldCheck className="h-3 w-3" />
            <span className="text-[8px] font-bold uppercase tracking-widest">Industrial Protocol v9</span>
         </div>
         <Button variant="outline" className="w-full h-10 rounded-xl text-[9px] font-black border-slate-200" asChild>
            <Link href="/" target="_blank">PREVIEW APP</Link>
         </Button>
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
              <div className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full bg-green-500/10 border border-green-500/20 shadow-inner">
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase text-green-600 italic tracking-widest">⚡ SIGNAL ACTIVE</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-primary italic">A</div>
           </div>
        </header>

        <div className="p-8 space-y-10">
           {activeTab === 'overview' && (
              <div className="space-y-10 animate-in fade-in duration-700">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PanzeStatCard label="Active Warriors" value={members?.length || 0} icon={<UsersIcon />} trend="Network Nodes" color="bg-indigo-500" />
                    <PanzeStatCard label="Gross Signal Income" value={`₹${(stats?.totalGrossRevenueINR || 0).toFixed(2)}`} icon={<DollarSign />} trend="S2S Real-Time" color="bg-emerald-500" />
                    <PanzeStatCard label="User Dividends" value={`₹${(stats?.totalUserPayoutsINR || 0).toFixed(2)}`} icon={<Zap />} trend="10% Share Split" color="bg-primary" />
                    <PanzeStatCard label="Admin Net Margin" value={`₹${(stats?.totalAdminProfitINR || 0).toFixed(2)}`} icon={<TrendingUp />} trend="High Yield Node" color="bg-amber-500" />
                 </div>

                 <div className="grid lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-2 bg-white border-slate-200 rounded-[3rem] p-10 shadow-sm border group">
                       <div className="flex items-center justify-between mb-8">
                          <div className="space-y-1">
                             <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-400">Warrior Performance Audit</h3>
                             <p className="text-[9px] font-bold text-slate-300 uppercase">Live Individual Revenue Log</p>
                          </div>
                          <Badge variant="outline" className="border-slate-100 uppercase font-black text-[8px] bg-slate-50">Signal Live</Badge>
                       </div>
                       <div className="overflow-x-auto">
                          <table className="w-full text-left">
                             <thead>
                                <tr className="border-b border-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                   <th className="pb-4">Warrior Node</th>
                                   <th className="pb-4">Generated (USD)</th>
                                   <th className="pb-4">My Share %</th>
                                   <th className="pb-4 text-right">Profit Node</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-50">
                                {members?.slice(0, 5).map(m => (
                                   <tr key={m.id} className="text-[10px] font-bold">
                                      <td className="py-4 text-slate-800">{m.email || m.id.substring(0, 8)}</td>
                                      <td className="py-4 text-indigo-500">${m.totalRevenueGenerated?.toFixed(2) || '0.00'}</td>
                                      <td className="py-4 text-primary">${m.pendingRevenueShare?.toFixed(2) || '0.00'}</td>
                                      <td className="py-4 text-right text-emerald-600 font-black italic">
                                         +₹{((m.totalRevenueGenerated || 0) * 80 * 0.7).toFixed(2)}
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </Card>

                    <div className="space-y-8">
                       <Card className="bg-white border-slate-200 rounded-[3rem] p-10 shadow-sm border">
                          <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-400 mb-8">Geo Signals</h3>
                          <div className="space-y-8">
                             <GeoRow label="India Hub" value="84%" pct={84} />
                             <GeoRow label="Global North" value="12%" pct={12} />
                             <GeoRow label="Rest of World" value="4%" pct={4} />
                          </div>
                       </Card>
                       <Card className="bg-primary/5 border-primary/10 rounded-[2rem] p-8 space-y-4">
                          <div className="flex items-center gap-3">
                             <Activity className="h-4 w-4 text-primary" />
                             <span className="text-[10px] font-black uppercase italic text-primary">System Briefing</span>
                          </div>
                          <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight italic">
                             APK performance is optimal. Signal latency is &lt; 20ms. Fraud Shield has flagged 2 proxy users today.
                          </p>
                       </Card>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'earning' && (
              <div className="space-y-10 animate-in fade-in duration-700">
                 <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                       <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Earning Sector Terminal</h3>
                       <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Controlling 100+ Income Nodes</p>
                    </div>
                    <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-xl">
                       <button onClick={() => setIncomeFilter('auto')} className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", incomeFilter === 'auto' ? "bg-primary text-white" : "text-slate-400")}>Auto (API)</button>
                       <button onClick={() => setIncomeFilter('manual')} className={cn("px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all", incomeFilter === 'manual' ? "bg-primary text-white" : "text-slate-400")}>Manual Node</button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {MONETIZATION_REGISTRY.map(mon => (
                     <Card key={mon.id} className="bg-white border-slate-100 p-8 rounded-[2.5rem] space-y-8 border hover:shadow-2xl hover:border-primary/20 transition-all group relative overflow-hidden flex flex-col justify-between">
                        <div className="relative z-10">
                           <div className="flex items-center justify-between mb-6">
                              <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-slate-100"><mon.icon size={22} /></div>
                              <div className="flex flex-col items-end gap-2">
                                 <Switch 
                                   checked={!!(settings as any)?.[mon.visibilityKey]} 
                                   onCheckedChange={v => updateSetting(mon.visibilityKey, v)} 
                                   disabled={isProcessing === mon.visibilityKey}
                                 />
                                 <Badge className={cn("text-[7px] font-black px-2 py-0.5 uppercase tracking-widest border-none", (settings as any)?.[mon.visibilityKey] ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600")}>
                                    {(settings as any)?.[mon.visibilityKey] ? 'ONLINE' : 'LOCKED'}
                                 </Badge>
                              </div>
                           </div>
                           <div>
                              <h4 className="text-lg font-black uppercase italic truncate tracking-tight text-slate-800">{mon.label}</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{mon.provider} Sector</p>
                           </div>
                        </div>

                        <div className="space-y-5 pt-6 border-t border-slate-50 relative z-10">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">User Share %</Label>
                                 <Input 
                                   type="number"
                                   defaultValue={(settings as any)?.[`${mon.id}_share`] || 10}
                                   onBlur={e => updateSetting(`${mon.id}_share`, parseFloat(e.target.value))}
                                   className="h-10 bg-slate-50 border-none font-black text-primary text-sm rounded-xl focus:ring-1 focus:ring-primary/20 text-center"
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Daily Cap</Label>
                                 <Input 
                                   type="number"
                                   defaultValue={(settings as any)?.[`${mon.id}_limit`] || 100}
                                   onBlur={e => updateSetting(`${mon.id}_limit`, parseInt(e.target.value))}
                                   className="h-10 bg-slate-50 border-none font-black text-slate-700 text-sm rounded-xl focus:ring-1 focus:ring-primary/20 text-center"
                                 />
                              </div>
                           </div>
                           <div className="flex items-center justify-between">
                              <Badge className="bg-primary/5 text-primary border-none text-[7px] font-black px-2 py-1 uppercase tracking-widest">{mon.category}</Badge>
                              <Link href={mon.route} target="_blank" className="text-[7px] font-black text-slate-300 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1">Check Hub <ArrowRight size={8} /></Link>
                           </div>
                        </div>
                     </Card>
                   ))}
                 </div>
              </div>
           )}

           {activeTab === 'signals' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Industrial Ad Hub" icon={<Smartphone />}>
                    <div className="space-y-8">
                       <PanzeField label="Master AdMob App ID" value={settings?.admobAppId} onUpdate={(v: string) => updateSetting('admobAppId', v)} />
                       <PanzeField label="Rewarded Unit Node ID" value={settings?.admobRewardedUnitId} onUpdate={(v: string) => updateSetting('admobRewardedUnitId', v)} />
                       <PanzeField label="VAST Multi-Ad Tag URL" value={settings?.vastAdTagUrl} onUpdate={(v: string) => updateSetting('vastAdTagUrl', v)} />
                       <PanzeField label="CPA Lead API Signal" value={settings?.cpaLeadApiKey} onUpdate={(v: string) => updateSetting('cpaLeadApiKey', v)} />
                    </div>
                 </PanzeConfigCard>

                 <PanzeConfigCard title="Master Signal Nodes" icon={<Signal />}>
                    <div className="space-y-8">
                       <PanzeField label="Master YouTube Hub URL" value={settings?.globalYoutubeStreamUrl} onUpdate={(v: string) => updateSetting('globalYoutubeStreamUrl', v)} />
                       <PanzeField label="Direct Stream Node (MP4/HLS)" value={settings?.globalDirectStreamUrl} onUpdate={(v: string) => updateSetting('globalDirectStreamUrl', v)} />
                       <PanzeField label="YouTube Data API v3 Key" value={settings?.youtubeApiKey} onUpdate={(v: string) => updateSetting('youtubeApiKey', v)} />
                       <PanzeField label="OneSignal / Push Private Key" value={settings?.pushNotificationKey} onUpdate={(v: string) => updateSetting('pushNotificationKey', v)} />
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'members' && (
              <Card className="bg-white border-slate-200 rounded-[3rem] overflow-hidden shadow-sm border animate-in slide-in-from-bottom-4 duration-700">
                 <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Warrior Registry Hub</h3>
                       <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.3em]">Industrial Identity Audit Feed</p>
                    </div>
                    <div className="flex gap-4">
                       <Input placeholder="SEARCH GMAIL / UID..." className="h-11 bg-white border-slate-200 rounded-xl font-bold text-[9px] uppercase tracking-widest w-64" />
                       <Button variant="outline" className="rounded-xl font-black text-[9px] uppercase px-6 border-slate-200 h-11 bg-white shadow-sm">Audit All</Button>
                    </div>
                 </div>
                 <div className="divide-y divide-slate-50">
                    {members?.map(w => (
                       <div key={w.id} className="p-8 flex items-center justify-between hover:bg-slate-50/30 transition-all group">
                          <div className="flex items-center gap-10">
                             <div className="relative">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center font-black text-primary text-2xl shadow-inner group-hover:bg-white group-hover:shadow-md transition-all border border-slate-100">
                                  {w.email?.[0].toUpperCase() || 'U'}
                                </div>
                                {w.isSuspended && <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 border-2 border-white shadow-lg"><Ban size={10} /></div>}
                             </div>
                             <div className="space-y-2">
                                <div className="flex items-center gap-4">
                                   <p className="text-sm font-black uppercase italic text-slate-800 tracking-tight">{w.email || 'Anonymous_Node'}</p>
                                   <Badge variant="outline" className={cn("text-[8px] px-3 h-5 font-black uppercase tracking-widest border-2", w.isSuspended ? "text-red-500 border-red-100 bg-red-50" : "text-emerald-500 border-emerald-100 bg-emerald-50")}>
                                      {w.isSuspended ? 'SIGNAL BLOCKED' : 'CLEAN IDENTITY'}
                                   </Badge>
                                </div>
                                <div className="flex flex-wrap gap-4 items-center">
                                   <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                      <Globe size={10} className="text-slate-400" />
                                      <span className="text-[8px] font-black uppercase tracking-widest">IP: {w.lastIp || 'Analyzing...'}</span>
                                   </div>
                                   <div className="flex items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                      <Monitor size={10} className="text-slate-400" />
                                      <span className="text-[8px] font-black uppercase tracking-widest">UID: {w.id.substring(0, 12)}...</span>
                                   </div>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-10">
                             <div className="text-right">
                                <p className="text-2xl font-black text-primary italic tabular-nums leading-none">{(w.coins || 0).toLocaleString()} <span className="text-xs opacity-40 uppercase tracking-widest ml-1 italic">Coins</span></p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic">Yield Wallet Balance</p>
                             </div>
                             <button 
                              onClick={() => updateDoc(doc(firestore!, 'users', w.id), { isSuspended: !w.isSuspended })}
                              className="h-12 w-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-white hover:shadow-lg transition-all"
                             >
                                <Ban className="h-5 w-5" />
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
       <div className="relative z-10 flex flex-col gap-10">
          <div className={cn("h-14 w-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-6", color)}>{icon}</div>
          <div className="space-y-3">
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] italic leading-none">{label}</p>
             <h4 className="text-4xl font-black text-slate-800 italic tracking-tighter tabular-nums leading-none">{value}</h4>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 w-fit">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{trend}</span>
          </div>
       </div>
       <div className={cn("absolute -bottom-10 -right-10 h-48 w-48 rounded-full opacity-5 blur-3xl group-hover:opacity-10 transition-opacity", color)} />
    </Card>
  );
}

function GeoRow({ label, value, pct }: any) {
   return (
      <div className="space-y-4">
         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] italic">
            <span className="text-slate-500">{label}</span>
            <span className="text-primary">{value}</span>
         </div>
         <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
            <div className="h-full bg-primary shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${pct}%` }} />
         </div>
      </div>
   );
}

function PanzeConfigCard({ title, icon, children }: any) {
  return (
    <Card className="bg-white border-slate-200 rounded-[3.5rem] p-12 space-y-12 shadow-sm border h-full transition-all hover:shadow-md">
       <div className="flex items-center gap-6 border-b border-slate-50 pb-8">
          <div className="h-14 w-14 bg-primary/5 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner border border-primary/10">{icon}</div>
          <div>
             <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 leading-none">{title}</h3>
             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">Industrial Signal Control</p>
          </div>
       </div>
       <div className="space-y-10">
          {children}
       </div>
    </Card>
  );
}

function PanzeField({ label, value, onUpdate }: any) {
  const [val, setVal] = useState(value || '');
  return (
    <div className="space-y-3">
       <Label className="text-[10px] font-black uppercase text-slate-400 ml-1 italic tracking-widest">{label}</Label>
       <Input 
         value={val}
         onChange={e => setVal(e.target.value)}
         onBlur={() => onUpdate(val)} 
         className="h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold text-xs text-primary px-8 focus:ring-primary/20 focus:border-primary/40 shadow-inner transition-all placeholder:opacity-20" 
         placeholder={`Enter ${label}...`}
       />
    </div>
  );
}
