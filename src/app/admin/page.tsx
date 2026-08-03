'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy, where, increment } from 'firebase/firestore';
import { 
  Loader2, Zap, DollarSign, TrendingUp, Users as UsersIcon, 
  Palette, Radio, Activity, BarChart3, Settings, CreditCard,
  ShieldCheck, Globe, Wallet, Menu, Volume2, Layers, Signal,
  Smartphone, Monitor, Package, Target, ArrowRight, CheckCircle2,
  AlertCircle, Layout, PieChart, PlayCircle, Eye, ChevronRight,
  Filter, Ban, UserCheck, BarChart, Youtube, ClipboardList, Coins,
  Book, GraduationCap, Mail, RefreshCw, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, UserProfile, PlatformRevenue } from '../lib/types';
import { MONETIZATION_REGISTRY } from '../lib/monetization-registry';
import { MASTER_THEMES } from '../lib/themes';
import Link from 'next/link';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

type AdminTab = 'overview' | 'main_control' | 'members' | 'financials' | 'signals' | 'system' | 'branding';

export default function AdminMasterHubV10() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedUser, setSelectedVote] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('0');

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);
  
  const usersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'users'), orderBy('joinedAt', 'desc'), limit(100)) : null, [firestore]);
  const { data: members } = useCollection<UserProfile>(usersQuery);

  const withdrawalsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'payouts'), where('status', '==', 'pending'), limit(20)) : null, [firestore]);
  const { data: pendingWithdrawals } = useCollection<any>(withdrawalsQuery);

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

  const handleAdjustBalance = async () => {
    if (!selectedUser || !firestore) return;
    try {
       const uRef = doc(firestore, 'users', selectedUser.id);
       await updateDoc(uRef, {
          coins: increment(parseInt(adjustAmount)),
          winningBalance: increment(parseInt(adjustAmount))
       });
       toast({ title: "BALANCE ADJUSTED", description: `Credited ${adjustAmount} to ${selectedUser.email}` });
       setSelectedVote(null);
    } catch (e) {
       toast({ variant: "destructive", title: "ADJUSTMENT FAILED" });
    }
  };

  const handleWithdrawalStatus = async (id: string, status: 'completed' | 'failed') => {
    if (!firestore) return;
    try {
      const pRef = doc(firestore, 'payouts', id);
      await updateDoc(pRef, { status });
      toast({ title: "SETTLEMENT UPDATED", description: `Withdrawal signal marked as ${status}.` });
    } catch (e) {
      toast({ variant: "destructive", title: "UPDATE FAILED" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black uppercase tracking-[0.5em]">UNAUTHORIZED INDUSTRIAL ACCESS</div>;

  const navItems = [
    { id: 'overview', label: 'Hub Intelligence', icon: <Layout /> },
    { id: 'main_control', label: 'Main Control Panel', icon: <Zap /> },
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
           <p className="text-[7px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-0.5">Industrial Hub v10.0</p>
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
            <span className="text-[8px] font-bold uppercase tracking-widest">Industrial Protocol v10</span>
         </div>
         <Button variant="outline" className="w-full h-10 rounded-xl text-[9px] font-black border-slate-200" asChild>
            <Link href="/" target="_blank">PREVIEW HUB</Link>
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
                <SheetContent side="left" className="p-0 w-72 border-none">
                  <SheetTitle className="sr-only">Hub Navigation</SheetTitle>
                  <SheetDescription className="sr-only">Access app controls and hub analytics</SheetDescription>
                  {sidebarContent}
                </SheetContent>
              </Sheet>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">{navItems.find(n => n.id === activeTab)?.label}</h2>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-5 py-2 rounded-full bg-green-500/10 border border-green-500/20 shadow-inner">
                 <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase text-green-600 italic tracking-widest">⚡ HUB SIGNAL ACTIVE</span>
              </div>
              <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-primary italic">A</div>
           </div>
        </header>

        <div className="p-8 space-y-10">
           {activeTab === 'overview' && (
              <div className="space-y-10 animate-in fade-in duration-700">
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PanzeStatCard label="Active Members" value={members?.length || 0} icon={<UsersIcon />} trend="Real-Time Nodes" color="bg-indigo-500" />
                    <PanzeStatCard label="Gross Ad Revenue" value={`₹${(stats?.totalGrossRevenueINR || 0).toFixed(2)}`} icon={<DollarSign />} trend="Signal Inflow" color="bg-emerald-500" />
                    <PanzeStatCard label="Member Payouts" value={`₹${(stats?.totalUserPayoutsINR || 0).toFixed(2)}`} icon={<Zap />} trend="Distributed Dividend" color="bg-primary" />
                    <PanzeStatCard label="Admin Net Profit" value={`₹${(stats?.totalAdminProfitINR || 0).toFixed(2)}`} icon={<TrendingUp />} trend="High Yield Margin" color="bg-amber-500" />
                 </div>

                 <Card className="bg-white border-slate-200 rounded-[3rem] p-10 shadow-sm border group">
                    <div className="flex items-center justify-between mb-8">
                       <div className="space-y-1">
                          <h3 className="text-sm font-black uppercase italic tracking-widest text-slate-400">Member Performance Audit</h3>
                          <p className="text-[9px] font-bold text-slate-300 uppercase">Live Individual Revenue Log</p>
                       </div>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="border-b border-slate-50 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                                <th className="pb-4">Member Node</th>
                                <th className="pb-4">Revenue (USD)</th>
                                <th className="pb-4">Share (USD)</th>
                                <th className="pb-4 text-right">Net Profit</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                             {members?.slice(0, 8).map(m => (
                                <tr key={m.id} className="text-[10px] font-bold">
                                   <td className="py-4 text-slate-800 truncate max-w-[150px]">{m.email || m.id.substring(0, 12)}</td>
                                   <td className="py-4 text-indigo-500 tabular-nums">${m.totalRevenueGenerated?.toFixed(2) || '0.00'}</td>
                                   <td className="py-4 text-primary tabular-nums">${m.pendingRevenueShare?.toFixed(2) || '0.00'}</td>
                                   <td className="py-4 text-right text-emerald-600 font-black italic tabular-nums">
                                      +₹{((m.totalRevenueGenerated || 0) * 80 * 0.7).toFixed(2)}
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </Card>
              </div>
           )}

           {activeTab === 'main_control' && (
              <div className="space-y-10 animate-in fade-in duration-700">
                 <div className="space-y-1 px-2">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-800">Main Control Panel</h3>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Unified Hub Sector Toggles & Manual Calibration</p>
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
                              <h4 className="text-sm font-black uppercase italic truncate tracking-tight text-slate-800">{mon.label}</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">{mon.provider}</p>
                           </div>
                        </div>

                        <div className="space-y-5 pt-6 border-t border-slate-50 relative z-10">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                 <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Member %</Label>
                                 <Input 
                                   type="number"
                                   defaultValue={(settings as any)?.[`${mon.id}_share`] || 30}
                                   onBlur={e => updateSetting(`${mon.id}_share`, parseFloat(e.target.value))}
                                   className="h-10 bg-slate-50 border-none font-black text-primary text-sm rounded-xl text-center"
                                 />
                              </div>
                              <div className="space-y-1.5">
                                 <Label className="text-[8px] font-black uppercase text-slate-400 ml-1">Daily Cap</Label>
                                 <Input 
                                   type="number"
                                   defaultValue={(settings as any)?.[`${mon.id}_limit`] || 100}
                                   onBlur={e => updateSetting(`${mon.id}_limit`, parseInt(e.target.value))}
                                   className="h-10 bg-slate-50 border-none font-black text-slate-700 text-sm rounded-xl text-center"
                                 />
                              </div>
                           </div>
                           <div className="flex items-center justify-between">
                              <Badge className="bg-primary/5 text-primary border-none text-[7px] font-black px-2 py-1 uppercase tracking-widest">{mon.category}</Badge>
                              <Link href={mon.route} target="_blank" className="text-[7px] font-black text-slate-300 hover:text-primary transition-colors uppercase tracking-widest flex items-center gap-1">Check Signal <ArrowRight size={8} /></Link>
                           </div>
                        </div>
                     </Card>
                   ))}
                 </div>
              </div>
           )}

           {activeTab === 'members' && (
              <Card className="bg-white border-slate-200 rounded-[3rem] overflow-hidden shadow-sm border animate-in slide-in-from-bottom-4 duration-700">
                 <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter">Member Registry</h3>
                       <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.3em]">Industrial Identity Audit Feed</p>
                    </div>
                 </div>
                 <div className="divide-y divide-slate-50 overflow-x-auto">
                    {members?.map(w => (
                       <div key={w.id} className="p-8 flex items-center justify-between hover:bg-slate-50/30 transition-all group min-w-[800px]">
                          <div className="flex items-center gap-10">
                             <div className="relative">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-100 flex items-center justify-center font-black text-primary text-2xl shadow-inner border border-slate-100">
                                  {w.email?.[0].toUpperCase() || 'U'}
                                </div>
                                {w.isSuspended && <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 border-2 border-white shadow-lg"><Ban size={10} /></div>}
                             </div>
                             <div className="space-y-2">
                                <p className="text-sm font-black uppercase italic text-slate-800 tracking-tight">{w.email || 'Anonymous_Node'}</p>
                                <div className="flex flex-wrap gap-4 items-center text-[8px] font-black uppercase text-slate-400 tracking-widest">
                                   <div className="flex items-center gap-2"><Globe size={10} /> IP: {w.lastIp || 'Unknown'}</div>
                                   <div className="flex items-center gap-2"><Monitor size={10} /> UID: {w.id.substring(0, 16)}...</div>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-8">
                             <div className="text-right">
                                <p className="text-2xl font-black text-primary italic tabular-nums leading-none">{(w.coins || 0).toLocaleString()} <span className="text-xs opacity-40 uppercase tracking-widest ml-1 italic">Coins</span></p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 italic">Yield Wallet Balance</p>
                             </div>
                             <Button size="icon" variant="outline" onClick={() => setSelectedVote(w)} className="rounded-xl border-slate-200"><Edit3 size={16} /></Button>
                          </div>
                       </div>
                    ))}
                 </div>
              </Card>
           )}

           {activeTab === 'financials' && (
             <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-1">
                   <h3 className="text-xl font-black uppercase italic tracking-tighter">Settlement Queue</h3>
                   <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Awaiting Industrial Approval</p>
                </div>

                <div className="grid gap-6">
                   {pendingWithdrawals && pendingWithdrawals.length > 0 ? pendingWithdrawals.map((p: any) => (
                     <Card key={p.id} className="bg-white border-slate-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 border shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                           <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-primary">
                              {p.method === 'UPI' ? <Smartphone size={24} /> : <Wallet size={24} />}
                           </div>
                           <div className="space-y-1">
                              <p className="text-sm font-black uppercase text-slate-800">{p.userEmail}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                 {p.method} • {p.destination}
                              </p>
                           </div>
                        </div>
                        <div className="text-center md:text-right">
                           <p className="text-3xl font-black text-slate-800 italic tabular-nums">₹{p.localAmount || (p.coinAmount / 100).toFixed(2)}</p>
                           <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mt-1">VOL: {p.coinAmount?.toLocaleString()} 🪙</p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                           <Button onClick={() => handleWithdrawalStatus(p.id, 'completed')} className="flex-1 md:w-32 h-12 bg-green-600 hover:bg-green-500 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-green-600/20">APPROVE</Button>
                           <Button onClick={() => handleWithdrawalStatus(p.id, 'failed')} variant="outline" className="flex-1 md:w-32 h-12 border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest">REJECT</Button>
                        </div>
                     </Card>
                   )) : (
                     <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem] opacity-40">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Settlement Queue Empty</p>
                     </div>
                   )}
                </div>
             </div>
           )}

           {activeTab === 'signals' && (
              <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
                 <PanzeConfigCard title="Industrial Ad Hub" icon={<Smartphone />}>
                    <div className="space-y-8">
                       <PanzeField label="AdMob App ID" value={settings?.admobAppId} onUpdate={(v: string) => updateSetting('admobAppId', v)} />
                       <PanzeField label="Rewarded Unit ID" value={settings?.admobRewardedUnitId} onUpdate={(v: string) => updateSetting('admobRewardedUnitId', v)} />
                       <PanzeField label="VAST Multi-Ad Tag URL" value={settings?.vastAdTagUrl} onUpdate={(v: string) => updateSetting('vastAdTagUrl', v)} />
                    </div>
                 </PanzeConfigCard>

                 <PanzeConfigCard title="Master Signal Nodes" icon={<Signal />}>
                    <div className="space-y-8">
                       <PanzeField label="Master YouTube URL" value={settings?.globalYoutubeStreamUrl} onUpdate={(v: string) => updateSetting('globalYoutubeStreamUrl', v)} />
                       <PanzeField label="YouTube Data API Key" value={settings?.youtubeApiKey} onUpdate={(v: string) => updateSetting('youtubeApiKey', v)} />
                       <PanzeField label="Push Notification Key" value={settings?.pushNotificationKey} onUpdate={(v: string) => updateSetting('pushNotificationKey', v)} />
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'system' && (
              <div className="max-w-2xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-700">
                 <PanzeConfigCard title="Hub Control" icon={<Settings />}>
                    <div className="space-y-8">
                       <PanzeField label="Hub Version" value={settings?.appVersion} onUpdate={(v: string) => updateSetting('appVersion', v)} />
                       <PanzeField label="APK Download URL" value={settings?.apkDownloadUrl} onUpdate={(v: string) => updateSetting('apkDownloadUrl', v)} />
                       <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                          <div className="space-y-1">
                             <p className="text-sm font-black uppercase italic text-slate-800">Industrial Maintenance</p>
                             <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Global Sector Lock Protocol</p>
                          </div>
                          <Switch 
                            checked={settings?.maintenanceMode} 
                            onCheckedChange={v => updateSetting('maintenanceMode', v)} 
                          />
                       </div>
                    </div>
                 </PanzeConfigCard>
              </div>
           )}

           {activeTab === 'branding' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4 duration-700">
                 <div className="grid md:grid-cols-2 gap-8">
                    <PanzeConfigCard title="Hub Identity" icon={<Palette />}>
                       <div className="space-y-8">
                          <PanzeField label="Custom Hub Name" value={settings?.customAppName} onUpdate={(v: string) => updateSetting('customAppName', v)} />
                          <PanzeField label="Master Logo URL" value={settings?.customLogoUrl} onUpdate={(v: string) => updateSetting('customLogoUrl', v)} />
                       </div>
                    </PanzeConfigCard>

                    <PanzeConfigCard title="Theme Engine" icon={<Layers />}>
                       <div className="grid grid-cols-2 gap-4">
                          {MASTER_THEMES.map(theme => (
                            <button 
                              key={theme.id}
                              onClick={() => updateSetting('currentThemeId', theme.id)}
                              className={cn(
                                "p-4 rounded-2xl border-2 text-[8px] font-black uppercase tracking-widest transition-all",
                                settings?.currentThemeId === theme.id ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-slate-400 border-slate-100"
                              )}
                            >
                               {theme.name}
                            </button>
                          ))}
                       </div>
                    </PanzeConfigCard>
                 </div>
              </div>
           )}
        </div>
      </main>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedVote(null)}>
         <DialogContent className="bg-white border-none rounded-[2.5rem] p-10 max-w-sm" title="Adjust Wallet">
            <DialogHeader className="text-center space-y-2">
               <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary border border-primary/10 mb-2">
                  <Wallet size={32} />
               </div>
               <DialogTitle className="text-xl font-black uppercase italic">Adjust Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
               <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Member Email</p>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 p-4 rounded-xl">{selectedUser?.email}</p>
               </div>
               <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">Coins to Adjust (+/-)</Label>
                  <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} className="h-14 bg-slate-50 border-none rounded-xl text-center font-black text-xl text-primary" />
               </div>
            </div>
            <DialogFooter>
               <Button onClick={handleAdjustBalance} className="w-full h-14 bg-primary hover:bg-primary/90 rounded-xl font-black uppercase italic shadow-xl shadow-primary/20">FINALIZE SIGNAL</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}

function PanzeStatCard({ label, value, icon, trend, color }: any) {
  return (
    <Card className="bg-white border-slate-200 p-10 rounded-[3rem] shadow-sm group hover:shadow-xl transition-all duration-500 overflow-hidden relative border">
       <div className="relative z-10 flex flex-col gap-10">
          <div className={cn("h-14 w-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl", color)}>{icon}</div>
          <div className="space-y-3">
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] italic leading-none">{label}</p>
             <h4 className="text-4xl font-black text-slate-800 italic tracking-tighter tabular-nums leading-none">{value}</h4>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 w-fit">
             <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{trend}</span>
          </div>
       </div>
       <div className={cn("absolute -bottom-10 -right-10 h-48 w-48 rounded-full opacity-5 blur-3xl", color)} />
    </Card>
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
         className="h-14 bg-slate-50 border-slate-100 rounded-2xl font-bold text-xs text-primary px-8 focus:ring-1 focus:ring-primary/20 focus:border-primary/40 shadow-inner" 
         placeholder={`Enter ${label}...`}
       />
    </div>
  );
}
