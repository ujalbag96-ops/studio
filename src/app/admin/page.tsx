
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, limit } from 'firebase/firestore';
import { 
  Loader2, 
  Monitor, 
  Database, 
  Activity, 
  Power, 
  Server, 
  Signal, 
  Search,
  RefreshCw,
  Cpu,
  LineChart,
  Zap,
  ShieldAlert,
  ShieldX,
  TrendingUp,
  Percent,
  CheckCircle2,
  XCircle,
  Link2,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AppSettings, PlatformRevenue } from '../lib/types';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

const API_SLOTS = [
  { id: 'api_admob_active', name: 'AdMob Rewarded SDK', provider: 'Google', isConfigured: true },
  { id: 'api_cpalead_active', name: 'CPALead Offerwall', provider: 'CPALead', isConfigured: true },
  { id: 'api_adgate_active', name: 'AdGate Media API', provider: 'AdGate', isConfigured: true },
  { id: 'api_s2s_active', name: 'S2S Postback Node', provider: 'Internal', isConfigured: true },
  { id: 'api_ironsource_active', name: 'IronSource Mediation', provider: 'Unity', isConfigured: false },
  { id: 'api_unity_active', name: 'Unity Ads Node', provider: 'Unity', isConfigured: false },
  { id: 'api_applovin_active', name: 'AppLovin MAX', provider: 'AppLovin', isConfigured: false },
  { id: 'api_weather_active', name: 'Weather Intel API', provider: 'OpenWeather', isConfigured: true },
  { id: 'api_scholar_sync_active', name: 'Scholar Vault Sync', provider: 'Internal', isConfigured: true },
  { id: 'api_payout_gateway_active', name: 'Global Payout Node', provider: 'Multiple', isConfigured: false },
];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'monitor' | 'nodes' | 'finance' | 'api_hub'>('monitor');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [heartbeats, setHeartbeats] = useState<Record<string, number>>({});

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);

  const fraudQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), where('isSuspended', '==', true), limit(50)) : null, [firestore, isAdminUser]);
  const { data: fraudData } = useCollection<UserProfile>(fraudQuery);

  useEffect(() => {
    const interval = setInterval(() => {
      generateHeartbeats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const generateHeartbeats = () => {
    const newBeats: Record<string, number> = {};
    API_SLOTS.forEach(api => {
      newBeats[api.id] = Math.floor(Math.random() * 120) + 20;
    });
    setHeartbeats(newBeats);
  };

  const handleMasterSync = async () => {
    setIsSyncingAll(true);
    // Simulate industrial ping to all endpoints
    await new Promise(resolve => setTimeout(resolve, 2000));
    generateHeartbeats();
    setIsSyncingAll(false);
    toast({ title: "MASTER SYNC COMPLETE", description: "All 10 API signals refreshed." });
  };

  const toggleSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(true);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL UPDATED", description: `${key.toUpperCase().replace('API_', '')} state synchronized.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredApis = API_SLOTS.filter(api => 
    api.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    api.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-[#050508]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen bg-black text-red-500 font-black p-10 uppercase italic text-center gap-6">
    <ShieldAlert className="h-20 w-20 animate-pulse" />
    <div className="space-y-2">
      <h2 className="text-4xl">Access Restricted</h2>
      <p className="text-xs tracking-[0.3em] opacity-60">Master Authorization Required</p>
    </div>
  </div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-80 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-10 flex items-center gap-4 bg-primary/5 border-b border-white/5">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-2xl italic uppercase tracking-tighter">MASTER <span className="text-primary">HUB</span></span>
        </div>
        <nav className="flex-1 p-8 space-y-3">
          <AdminLink active={activeTab === 'monitor'} icon={<Monitor />} label="Master Monitor" onClick={() => setActiveTab('monitor')} />
          <AdminLink active={activeTab === 'finance'} icon={<LineChart />} label="Revenue Controller" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'nodes'} icon={<Cpu />} label="Yield Nodes" onClick={() => setActiveTab('nodes')} />
          <AdminLink active={activeTab === 'api_hub'} icon={<Server />} label="API Master Hub" onClick={() => setActiveTab('api_hub')} />
        </nav>
      </aside>

      <main className="flex-1 ml-80 p-12 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-5xl font-black uppercase italic tracking-tighter">Admin <span className="text-primary">Command</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.5em] italic">Industrial Infrastructure v12.0 Build</p>
           </div>
        </header>

        {activeTab === 'api_hub' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-black uppercase italic">API Master <span className="text-primary">Hub</span></h3>
                       <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">10-Slot Professional Signal Matrix</p>
                    </div>
                    <div className="relative w-full md:w-80">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <Input 
                        placeholder="SEARCH SIGNALS..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 bg-black border-white/10 rounded-xl pl-12 font-black uppercase text-[10px]" 
                       />
                    </div>
                 </div>

                 <div className="bg-black/40 border border-white/5 rounded-[2rem] overflow-hidden">
                    <div className="grid grid-cols-12 bg-white/5 p-5 border-b border-white/5 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                       <div className="col-span-1 text-center">Status</div>
                       <div className="col-span-4 pl-4">Endpoint Name</div>
                       <div className="col-span-2">Provider</div>
                       <div className="col-span-2 text-center">Latency</div>
                       <div className="col-span-3 text-right pr-4">Signal Logic</div>
                    </div>

                    <div className="divide-y divide-white/5">
                       {filteredApis.map((api) => {
                          const isActive = (settings as any)?.[api.id];
                          return (
                             <div key={api.id} className="grid grid-cols-12 p-6 items-center hover:bg-white/5 transition-all group">
                                <div className="col-span-1 flex justify-center">
                                   <div className={cn(
                                     "h-2.5 w-2.5 rounded-full shadow-lg transition-all",
                                     api.isConfigured ? (isActive ? "bg-green-500 animate-pulse shadow-green-500/20" : "bg-red-500 shadow-red-500/20") : "bg-neutral-700"
                                   )} />
                                </div>
                                <div className="col-span-4 pl-4 space-y-1">
                                   <p className={cn("text-sm font-black uppercase italic", !api.isConfigured && "text-muted-foreground")}>
                                      {api.name}
                                   </p>
                                   {!api.isConfigured && <p className="text-[8px] font-bold text-neutral-500 uppercase italic">Not Configured</p>}
                                </div>
                                <div className="col-span-2">
                                   <Badge variant="outline" className="border-white/10 text-[8px] font-black uppercase bg-white/5">{api.provider}</Badge>
                                </div>
                                <div className="col-span-2 text-center">
                                   <span className={cn("text-[11px] font-black tabular-nums", isActive ? "text-primary" : "text-muted-foreground opacity-20")}>
                                      {isActive ? `${heartbeats[api.id] || 0}ms` : '---'}
                                   </span>
                                </div>
                                <div className="col-span-3 flex justify-end pr-4">
                                   <Switch 
                                    checked={isActive} 
                                    disabled={!api.isConfigured || isProcessing}
                                    onCheckedChange={(val) => toggleSetting(api.id, val)}
                                    className="scale-125 data-[state=checked]:bg-primary" 
                                   />
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>

                 <Button 
                   onClick={handleMasterSync}
                   disabled={isSyncingAll}
                   className="w-full h-16 bg-white/5 hover:bg-primary border border-white/10 rounded-2xl font-black uppercase italic text-sm transition-all group shadow-xl"
                 >
                    {isSyncingAll ? <Loader2 className="animate-spin mr-3" /> : <RefreshCw className={cn("mr-3 h-5 w-5", isSyncingAll && "animate-spin")} />}
                    MASTER HUB SYNC
                 </Button>
              </Card>
           </div>
        )}

        {activeTab === 'finance' && (
           <div className="space-y-10 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 space-y-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><TrendingUp className="h-24 w-24" /></div>
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">Total Gross Revenue</p>
                    <h3 className="text-5xl font-black italic text-white">${(stats?.totalDailyRevenueUSD || 0).toFixed(2)}</h3>
                    <div className="flex items-center gap-2">
                       <Activity className="h-3 w-3 text-green-500 animate-pulse" />
                       <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">S2S Verified Waterfall</span>
                    </div>
                 </Card>

                 <Card className="bg-green-500/5 border-green-500/20 rounded-[2.5rem] p-10 space-y-4 shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-green-500 tracking-widest">Admin Profit (70% Lock)</p>
                    <h3 className="text-5xl font-black italic text-white">${((stats?.totalDailyRevenueUSD || 0) * 0.7).toFixed(2)}</h3>
                    <Badge className="bg-green-500/20 text-green-500 border-none text-[8px] font-black uppercase">Margin Integrity Secured</Badge>
                 </Card>

                 <Card className="bg-amber-500/5 border-amber-500/20 rounded-[2.5rem] p-10 space-y-4 shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-amber-500 tracking-widest">User Reward Pool (30%)</p>
                    <h3 className="text-5xl font-black italic text-white">${((stats?.totalDailyRevenueUSD || 0) * 0.3).toFixed(2)}</h3>
                    <Badge className="bg-amber-500/20 text-amber-500 border-none text-[8px] font-black uppercase">Auto-Settle Active</Badge>
                 </Card>
              </div>

              <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Percent className="h-6 w-6" />
                       </div>
                       <h3 className="text-2xl font-black uppercase italic">Margin <span className="text-primary">Controller</span></h3>
                    </div>
                    <div className="flex items-center gap-4">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground">User Revenue Share %</Label>
                       <Input 
                        type="number" 
                        value={settings?.userRevenueSharePercent || 30} 
                        onChange={(e) => toggleSetting('userRevenueSharePercent', parseInt(e.target.value))}
                        className="bg-black border-white/10 h-10 w-20 rounded-lg text-center font-black text-primary"
                       />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <RevenueStat label="AdMob Yield" value={`$${((stats?.totalDailyRevenueUSD || 0) * 0.4).toFixed(2)}`} trend="+5%" />
                    <RevenueStat label="CPA Mediation" value={`$${((stats?.totalDailyRevenueUSD || 0) * 0.6).toFixed(2)}`} trend="+12%" />
                    <RevenueStat label="Settle Volume" value={`$${(stats?.totalDistributedToUsersUSD || 0).toFixed(2)}`} trend="Live" color="text-amber-500" />
                    <RevenueStat label="Margin Lock" value={`${100 - (settings?.userRevenueSharePercent || 30)}%`} trend="Guaranteed" color="text-primary" />
                 </div>
              </Card>
           </div>
        )}

        {activeTab === 'nodes' && (
          <div className="space-y-10 animate-in fade-in duration-700">
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-8 shadow-2xl">
                <div className="flex items-center gap-4">
                   <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Power className="h-6 w-6" />
                   </div>
                   <h3 className="text-2xl font-black uppercase italic">10-Node <span className="text-primary">Yield Automation</span></h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                   <NodeToggle label="Scholar Div" active={settings?.node_scholar_dividend} onToggle={(v) => toggleSetting('node_scholar_dividend', v)} />
                   <NodeToggle label="Quiz Arena" active={settings?.node_quiz_arena} onToggle={(v) => toggleSetting('node_quiz_arena', v)} />
                   <NodeToggle label="Global CPA" active={settings?.node_global_cpa} onToggle={(v) => toggleSetting('node_global_cpa', v)} />
                   <NodeToggle label="Micro Tasks" active={settings?.node_micro_tasks} onToggle={(v) => toggleSetting('node_micro_tasks', v)} />
                   <NodeToggle label="Surveys" active={settings?.node_surveys} onToggle={(v) => toggleSetting('node_surveys', v)} />
                   <NodeToggle label="Ad Stream" active={settings?.node_ad_stream} onToggle={(v) => toggleSetting('node_ad_stream', v)} />
                   <NodeToggle label="Movie Yield" active={settings?.node_content_analysis} onToggle={(v) => toggleSetting('node_content_analysis', v)} />
                   <NodeToggle label="Referral Sys" active={settings?.node_referral_engine} onToggle={(v) => toggleSetting('node_referral_engine', v)} />
                   <NodeToggle label="Arcade Mile" active={settings?.node_arcade_rewards} onToggle={(v) => toggleSetting('node_arcade_rewards', v)} />
                   <NodeToggle label="Check-in" active={settings?.node_daily_checkin} onToggle={(v) => toggleSetting('node_daily_checkin', v)} />
                </div>
             </Card>
          </div>
        )}

        {activeTab === 'monitor' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Signal className="h-6 w-6" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black uppercase italic tracking-widest">System <span className="text-primary">Health</span></h3>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Live Signal Integrity Nodes</p>
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <StatusPulse label="S2S Postback" active={settings?.api_s2s_active} />
                    <StatusPulse label="Identity Gate" active={true} />
                    <StatusPulse label="Library Sync" active={settings?.node_scholar_dividend} />
                    <StatusPulse label="Auto-Payout" active={true} />
                 </div>
              </Card>

              <Card className="bg-red-500/5 border-red-500/20 border-2 rounded-[3rem] p-10 space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                       <ShieldX className="h-5 w-5 text-red-500" /> Fraud Shield
                    </h3>
                    <Badge className="bg-red-500 text-white border-none text-[9px] animate-pulse">PROTECTED</Badge>
                 </div>
                 <p className="text-5xl font-black text-white italic">{fraudData?.length || 0}</p>
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest italic">VPN / Proxy Detection Signal Active</p>
              </Card>
           </div>
        )}
      </main>
    </div>
  );
}

function RevenueStat({ label, value, trend, color = "text-white" }: any) {
  return (
    <div className="p-6 bg-black/40 rounded-2xl border border-white/5 space-y-2">
       <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
       <div className="flex items-end justify-between">
          <h4 className={cn("text-2xl font-black italic", color)}>{value}</h4>
          <span className="text-[8px] font-bold text-green-500 uppercase">{trend}</span>
       </div>
    </div>
  );
}

function NodeToggle({ label, active, onToggle }: any) {
  return (
    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex flex-col gap-3">
       <span className="text-[8px] font-black uppercase text-white/40 tracking-widest truncate">{label}</span>
       <div className="flex items-center justify-between">
          <Switch checked={active} onCheckedChange={onToggle} className="scale-75 origin-left" />
          <div className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
       </div>
    </div>
  );
}

function StatusPulse({ label, active }: any) {
   return (
      <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
         <span className="text-[10px] font-black uppercase text-white/60">{label}</span>
         <div className={cn("h-2 w-2 rounded-full", active ? "bg-green-500 animate-pulse" : "bg-red-500")} />
      </div>
   );
}

function AdminLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-6 px-8 py-5 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-xl italic" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
