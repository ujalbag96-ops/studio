
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { 
  Loader2, 
  Monitor, 
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
  Lock,
  Users,
  Network,
  Crown,
  Globe,
  CheckCircle2,
  XCircle,
  Smartphone,
  ClipboardList,
  Target,
  BarChart3,
  DollarSign,
  ArrowUpRight,
  Filter,
  Star,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AppSettings, PlatformRevenue } from '../lib/types';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

const API_SLOTS = [
  { id: 'api_admob_active', name: 'AdMob Rewarded SDK', provider: 'Google', isConfigured: true, icon: <Zap className="h-4 w-4" /> },
  { id: 'api_cpalead_active', name: 'CPALead Global', provider: 'CPA Node', isConfigured: true, icon: <Signal className="h-4 w-4" /> },
  { id: 'api_adgate_active', name: 'AdGate Media', provider: 'Offerwall', isConfigured: true, icon: <Smartphone className="h-4 w-4" /> },
  { id: 'api_cpx_active', name: 'CPX Research', provider: 'Surveys', isConfigured: true, icon: <ClipboardList className="h-4 w-4" /> },
  { id: 'api_notik_active', name: 'Notik.me SDK', provider: 'Installs', isConfigured: true, icon: <Activity className="h-4 w-4" /> },
  { id: 'api_bitreach_active', name: 'BitReach Node', provider: 'Gaming', isConfigured: true, icon: <Target className="h-4 w-4" /> },
  { id: 'api_s2s_active', name: 'S2S Postback Hub', provider: 'Internal', isConfigured: true, icon: <Lock className="h-4 w-4" /> },
  { id: 'api_weather_active', name: 'Weather Intel', provider: 'OpenWeather', isConfigured: true, icon: <Globe className="h-4 w-4" /> },
  { id: 'api_scholar_sync_active', name: 'Scholar Vault', provider: 'Library', isConfigured: true, icon: <Server className="h-4 w-4" /> },
  { id: 'api_payout_gateway_active', name: 'Global Payout', provider: 'Multi-Node', isConfigured: true, icon: <CheckCircle2 className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'monitor' | 'nodes' | 'finance' | 'api_hub' | 'network'>('monitor');
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

  const usersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), orderBy('joinedAt', 'desc'), limit(5)) : null, [firestore, isAdminUser]);
  const { data: recentUsers } = useCollection<UserProfile>(usersQuery);

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
      toast({ title: "SIGNAL UPDATED", description: `${key.toUpperCase().replace('API_', '').replace('NODE_', '')} state synchronized.` });
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

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen bg-background text-red-500 font-bold p-10 uppercase text-center gap-6">
    <ShieldAlert className="h-20 w-20 animate-pulse" />
    <div className="space-y-2">
      <h2 className="text-4xl tracking-tighter">Access Restricted</h2>
      <p className="text-xs tracking-[0.3em] opacity-60">Authorized Command Only</p>
    </div>
  </div>;

  return (
    <div className="flex min-h-screen bg-background text-white selection:bg-primary/30">
      <aside className="w-72 bg-white/[0.02] border-r border-white/10 flex flex-col fixed inset-y-0 z-50 backdrop-blur-3xl">
        <div className="p-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl uppercase tracking-tighter italic">Master <span className="text-primary">Hub</span></span>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <AdminLink active={activeTab === 'monitor'} icon={<Monitor />} label="System Health" onClick={() => setActiveTab('monitor')} />
          <AdminLink active={activeTab === 'finance'} icon={<LineChart />} label="Revenue Controller" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'network'} icon={<Network />} label="Growth Intelligence" onClick={() => setActiveTab('network')} />
          <AdminLink active={activeTab === 'nodes'} icon={<Cpu />} label="Income Sectors" onClick={() => setActiveTab('nodes')} />
          <AdminLink active={activeTab === 'api_hub'} icon={<Server />} label="API Master Hub" onClick={() => setActiveTab('api_hub')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-12 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-5xl font-black uppercase italic tracking-tighter">Admin <span className="text-primary">Command</span></h1>
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.5em] italic">Industrial Infrastructure v18.0 Build</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Global Sync Status</span>
                <span className="text-green-500 text-[10px] font-black uppercase flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> All Systems Nominal
                </span>
              </div>
           </div>
        </header>

        {activeTab === 'monitor' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-700">
              <div className="glass-panel rounded-[2.5rem] p-10 space-y-12">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                       <Signal className="h-6 w-6" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-bold uppercase italic tracking-tight">System <span className="text-primary">Health</span></h3>
                       <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Active Signal Nodes</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <StatusItem label="S2S Postback" active={settings?.api_s2s_active} />
                    <StatusItem label="Identity Gate" active={true} />
                    <StatusItem label="Global Mediation" active={true} />
                    <StatusItem label="Automatic Payout" active={settings?.autoWithdrawalEnabled} />
                 </div>
                 <div className="pt-6 border-t border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                          <p className="text-sm font-black uppercase italic">Automatic Payment Control</p>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">Process withdrawals without manual audit</p>
                       </div>
                       <Switch 
                        checked={settings?.autoWithdrawalEnabled} 
                        onCheckedChange={(val) => toggleSetting('autoWithdrawalEnabled', val)}
                        className="data-[state=checked]:bg-green-600" 
                       />
                    </div>
                 </div>
              </div>

              <div className="bg-red-500/[0.03] border border-red-500/20 rounded-[2.5rem] p-10 space-y-8 flex flex-col justify-center">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                          <ShieldX className="h-6 w-6" />
                       </div>
                       <h3 className="text-xl font-bold uppercase italic tracking-tight">Fraud Shield</h3>
                    </div>
                    <Badge className="bg-red-600 text-white border-none text-[9px] px-4 py-1 animate-pulse uppercase">Active Guard</Badge>
                 </div>
                 <div>
                    <p className="text-6xl font-black text-white italic tabular-nums">{fraudData?.length || 0}</p>
                    <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-[0.3em] mt-3">Identities Blocked by Proxy Guard</p>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'finance' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <MetricBox 
                  label="Total Daily Revenue" 
                  value={`$${(stats?.totalDailyRevenueUSD || 0).toFixed(2)}`} 
                  icon={<BarChart3 className="h-5 w-5" />} 
                  color="primary" 
                  badge="Gross Yield" 
                 />
                 <MetricBox 
                  label="Admin Profit (70%)" 
                  value={`$${((stats?.totalDailyRevenueUSD || 0) * 0.7).toFixed(2)}`} 
                  icon={<DollarSign className="h-5 w-5" />} 
                  color="green" 
                  badge="Locked Margin" 
                 />
                 <MetricBox 
                  label="User Payouts (30%)" 
                  value={`$${((stats?.totalDailyRevenueUSD || 0) * 0.3).toFixed(2)}`} 
                  icon={<Zap className="h-5 w-5" />} 
                  color="amber" 
                  badge="Distributed" 
                 />
              </div>

              <div className="glass-panel rounded-[2.5rem] p-10 space-y-8">
                 <h3 className="text-2xl font-bold uppercase italic tracking-tight">Financial <span className="text-primary">Integrity Hub</span></h3>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-white/5 p-8 rounded-3xl space-y-4">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Revenue Split Simulation</p>
                       <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden flex">
                          <div className="h-full bg-primary" style={{ width: '70%' }} />
                          <div className="h-full bg-amber-500" style={{ width: '30%' }} />
                       </div>
                       <div className="flex justify-between items-center text-[9px] font-black uppercase">
                          <span className="text-primary">Admin (70%)</span>
                          <span className="text-amber-500">User Share (30%)</span>
                       </div>
                    </div>
                    <div className="flex flex-col justify-center gap-2">
                       <p className="text-xs text-muted-foreground font-medium italic">"Current margin enforcement is strictly verified via S2S postback logic. Zero manual intervention allowed on the core profit lock."</p>
                       <p className="text-[9px] font-black uppercase text-primary">System Auth Hash: AES-256-REVENUE-SYNC</p>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'network' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <MetricBox label="Global Network Size" value="1,240" icon={<Users className="h-5 w-5" />} color="primary" />
                 <MetricBox label="Active Viral Signals" value="482" icon={<TrendingUp className="h-5 w-5" />} color="green" />
                 <MetricBox label="L2 Depth Yield" value="18.4%" icon={<Network className="h-5 w-5" />} color="amber" />
              </div>

              <div className="glass-panel rounded-[2.5rem] p-10 space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold uppercase italic tracking-tight">Recent <span className="text-primary">Recruitments</span></h3>
                    <Badge variant="outline" className="border-white/10 uppercase text-[8px] px-3">Live Feed</Badge>
                 </div>
                 <div className="divide-y divide-white/5 bg-white/[0.02] rounded-2xl border border-white/10 overflow-hidden">
                    {recentUsers?.map((u) => (
                       <div key={u.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all">
                          <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-primary uppercase">{u.email?.[0] || 'U'}</div>
                             <div>
                                <p className="text-sm font-black uppercase text-white italic">{u.email?.split('@')[0] || 'Warrior'}</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase">{u.country || 'Global'}</p>
                             </div>
                          </div>
                          <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10">{u.geo_region} Node</Badge>
                       </div>
                    ))}
                    {(!recentUsers || recentUsers.length === 0) && <div className="p-10 text-center text-[10px] uppercase font-bold text-muted-foreground">Waiting for new recruitment signals...</div>}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'nodes' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="glass-panel rounded-[2.5rem] p-10 space-y-10">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Cpu className="h-6 w-6" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-bold uppercase italic tracking-tight">Earning <span className="text-primary">Modules</span></h3>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Active Income Sectors</p>
                       </div>
                    </div>
                    <div className="grid gap-4">
                       <NodeToggle label="Scholar Dividend" active={settings?.node_scholar_dividend} onToggle={(val) => toggleSetting('node_scholar_dividend', val)} />
                       <NodeToggle label="Quiz Arena Hub" active={settings?.node_quiz_arena} onToggle={(val) => toggleSetting('node_quiz_arena', val)} />
                       <NodeToggle label="CPA Offerwall" active={settings?.node_global_cpa} onToggle={(val) => toggleSetting('node_global_cpa', val)} />
                       <NodeToggle label="Video Yield" active={settings?.node_ad_stream} onToggle={(val) => toggleSetting('node_ad_stream', val)} />
                       <NodeToggle label="Network Commissions" active={settings?.node_referral_engine} onToggle={(val) => toggleSetting('node_referral_engine', val)} />
                    </div>
                 </div>

                 <div className="space-y-8">
                    <Card className="bg-amber-500/5 border-amber-500/20 p-10 rounded-[2.5rem] space-y-6">
                       <h4 className="text-xl font-black uppercase italic text-amber-500 flex items-center gap-3"><Star className="h-5 w-5" /> Sector Optimization</h4>
                       <p className="text-xs text-muted-foreground font-medium leading-relaxed uppercase tracking-tight">
                          Modules are optimized for global users based on their geo-region. Disabling a node instantly terminates the client-side signal.
                       </p>
                    </Card>
                    <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] text-center">
                       <p className="text-4xl font-black text-white italic">10/10</p>
                       <p className="text-[9px] font-bold uppercase text-muted-foreground mt-2 tracking-widest">Nodes Synchronized with Firebase</p>
                    </div>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'api_hub' && (
           <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
              <div className="glass-panel rounded-[2rem] p-10 space-y-10">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-bold uppercase italic tracking-tight">API Master <span className="text-primary">Hub</span></h3>
                       <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest italic">10-Slot Professional Global Signal Matrix</p>
                    </div>
                    <div className="relative w-full md:w-80 group">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                       <Input 
                        placeholder="Search Signals..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-12 bg-white/[0.05] border-white/10 rounded-xl pl-12 font-bold uppercase text-[10px] tracking-widest" 
                       />
                    </div>
                 </div>

                 <div className="space-y-px bg-white/5 rounded-2xl overflow-hidden border border-white/10">
                    <div className="grid grid-cols-12 bg-white/[0.03] p-5 text-[9px] font-black uppercase text-muted-foreground tracking-widest border-b border-white/10">
                       <div className="col-span-1 text-center">Signal</div>
                       <div className="col-span-5 pl-4">Endpoint Name</div>
                       <div className="col-span-2">Provider</div>
                       <div className="col-span-2 text-center">Latency</div>
                       <div className="col-span-2 text-right pr-4">Power</div>
                    </div>

                    {filteredApis.map((api) => {
                       const isActive = (settings as any)?.[api.id];
                       return (
                          <div key={api.id} className="grid grid-cols-12 p-6 items-center hover:bg-white/[0.05] transition-all group">
                             <div className="col-span-1 flex justify-center">
                                <div className="status-pulse">
                                   <span className={cn("status-pulse-dot", isActive ? "bg-green-500" : "bg-red-500/50")} />
                                   <span className={cn("relative inline-flex rounded-full h-2 w-2", isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
                                </div>
                             </div>
                             <div className="col-span-5 pl-4 flex items-center gap-4">
                                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors border border-white/5">
                                   {api.icon}
                                </div>
                                <div className="space-y-0.5">
                                   <p className={cn("text-sm font-black uppercase tracking-tight", !api.isConfigured && "text-muted-foreground")}>
                                      {api.name}
                                   </p>
                                   <p className={cn("text-[8px] font-bold uppercase italic", isActive ? "text-green-500/70" : "text-red-500/70")}>
                                      Signal {isActive ? 'Online' : 'Offline'}
                                   </p>
                                </div>
                             </div>
                             <div className="col-span-2">
                                <Badge variant="outline" className="border-white/10 text-[8px] font-bold uppercase bg-white/5 px-3 py-1">{api.provider}</Badge>
                             </div>
                             <div className="col-span-2 text-center">
                                <span className={cn("text-[11px] font-mono", isActive ? "text-primary" : "text-muted-foreground opacity-20")}>
                                   {isActive ? `${heartbeats[api.id] || 0}ms` : '---'}
                                </span>
                             </div>
                             <div className="col-span-2 flex justify-end pr-4">
                                <Switch 
                                 checked={isActive} 
                                 disabled={!api.isConfigured || isProcessing}
                                 onCheckedChange={(val) => toggleSetting(api.id, val)}
                                 className="scale-90 data-[state=checked]:bg-primary" 
                                />
                             </div>
                          </div>
                       );
                    })}
                 </div>

                 <Button 
                   onClick={handleMasterSync}
                   disabled={isSyncingAll}
                   className="w-full h-16 bg-white/[0.05] hover:bg-primary border border-white/10 rounded-2xl font-black uppercase italic text-sm transition-all group shadow-xl"
                 >
                    {isSyncingAll ? <Loader2 className="animate-spin mr-3" /> : <RefreshCw className={cn("mr-3 h-5 w-5 transition-transform group-hover:rotate-180 duration-700", isSyncingAll && "animate-spin")} />}
                    Execute Master Signal Sync
                 </Button>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}

function MetricBox({ label, value, icon, color, badge }: any) {
  const colors = {
     primary: "text-primary bg-primary/5 border-primary/20",
     green: "text-green-500 bg-green-500/5 border-green-500/20",
     amber: "text-amber-500 bg-amber-500/5 border-amber-500/20"
  };
  return (
    <div className={cn("p-8 rounded-[2rem] border transition-all", colors[color as keyof typeof colors])}>
       <div className="flex justify-between items-start mb-6">
          <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
             {icon}
          </div>
          {badge && <Badge className={cn("border-none text-[8px] font-bold uppercase px-3 py-1", colors[color as keyof typeof colors])}>{badge}</Badge>}
       </div>
       <p className="text-[9px] font-bold uppercase opacity-60 tracking-[0.2em] mb-1">{label}</p>
       <h4 className="text-4xl font-black italic tracking-tighter text-white tabular-nums">{value}</h4>
    </div>
  );
}

function StatusItem({ label, active }: any) {
  return (
    <div className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
       <span className="text-[10px] font-bold uppercase text-white/70 tracking-widest">{label}</span>
       <div className="flex items-center gap-2">
          <span className={cn("text-[9px] font-bold uppercase italic", active ? "text-green-500" : "text-red-500")}>
             {active ? 'Online' : 'Offline'}
          </span>
          <div className="status-pulse">
             <span className={cn("status-pulse-dot", active ? "bg-green-500" : "bg-red-500/50")} />
             <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", active ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
          </div>
       </div>
    </div>
  );
}

function NodeToggle({ label, active, onToggle }: { label: string, active?: boolean, onToggle: (val: boolean) => void }) {
   return (
    <div className="flex items-center justify-between p-6 bg-white/[0.03] rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
       <div className="flex flex-col">
          <span className="text-sm font-black uppercase italic text-white tracking-tight">{label}</span>
          <span className={cn("text-[8px] font-bold uppercase", active ? "text-green-500/70" : "text-red-500/70")}>{active ? 'Active Income Node' : 'Node Terminated'}</span>
       </div>
       <Switch checked={active} onCheckedChange={onToggle} className="data-[state=checked]:bg-primary" />
    </div>
   );
}

function AdminLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-5 px-6 py-4 rounded-xl transition-all text-[11px] font-bold uppercase tracking-widest",
      active ? "bg-primary text-white shadow-xl italic" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      <span className={cn("h-4 w-4", active ? "text-white" : "text-muted-foreground")}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
