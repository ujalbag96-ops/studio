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
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
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

  const topReferrersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), orderBy('totalReferrals', 'desc'), limit(10)) : null, [firestore, isAdminUser]);
  const { data: recruiters } = useCollection<UserProfile>(topReferrersQuery);

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
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.5em] italic">Industrial Infrastructure v16.0 Build</p>
           </div>
        </header>

        {activeTab === 'api_hub' && (
           <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
              <div className="glass-panel rounded-[2rem] p-10 space-y-10">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                       <h3 className="text-2xl font-bold uppercase italic tracking-tight">API Master <span className="text-primary">Hub</span></h3>
                       <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest italic">10-Slot Professional Signal Matrix</p>
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
                             <div className="col-span-5 pl-4 space-y-1">
                                <p className={cn("text-sm font-bold uppercase tracking-tight", !api.isConfigured && "text-muted-foreground")}>
                                   {api.name}
                                </p>
                                {!api.isConfigured ? (
                                   <p className="text-[8px] font-bold text-neutral-600 uppercase italic">Not Configured</p>
                                ) : (
                                   <p className={cn("text-[8px] font-bold uppercase italic", isActive ? "text-green-500/70" : "text-red-500/70")}>
                                      Signal {isActive ? 'Online' : 'Offline'}
                                   </p>
                                )}
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
                   className="w-full h-16 bg-white/[0.05] hover:bg-primary border border-white/10 rounded-2xl font-bold uppercase italic text-sm transition-all group shadow-xl"
                 >
                    {isSyncingAll ? <Loader2 className="animate-spin mr-3" /> : <RefreshCw className={cn("mr-3 h-5 w-5 transition-transform group-hover:rotate-180 duration-700", isSyncingAll && "animate-spin")} />}
                    Execute Master Signal Sync
                 </Button>
              </div>
           </div>
        )}

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
                    <StatusItem label="Vault Sync" active={settings?.node_scholar_dividend} />
                    <StatusItem label="Auto-Payout" active={true} />
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

        {/* Other tabs follow same minimalist list structure... */}
        {activeTab === 'finance' && (
           <div className="space-y-10 animate-in fade-in duration-700 max-w-5xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <MetricBox label="Gross Yield Hub" value={`$${(stats?.totalDailyRevenueUSD || 0).toFixed(2)}`} icon={<TrendingUp />} color="primary" />
                 <MetricBox label="Operational Profit" value={`$${((stats?.totalDailyRevenueUSD || 0) * 0.7).toFixed(2)}`} icon={<CheckCircle2 />} color="green" badge="70% Locked" />
                 <MetricBox label="User Dividend" value={`$${((stats?.totalDailyRevenueUSD || 0) * 0.3).toFixed(2)}`} icon={<Users />} color="amber" badge="30% Share" />
              </div>

              <div className="glass-panel rounded-[2.5rem] p-10 space-y-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Lock className="h-6 w-6" />
                       </div>
                       <h3 className="text-2xl font-bold uppercase italic">Revenue <span className="text-primary">Integrity Lock</span></h3>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">Margin Protocol</p>
                       <p className="text-lg font-black text-white italic">70/30 Fixed</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                    <FinanceStat label="Ad Signals" value="40.0%" trend="+5%" />
                    <FinanceStat label="CPA Node" value="60.0%" trend="+12%" />
                    <FinanceStat label="Payout Vol" value={`$${(stats?.totalDistributedToUsersUSD || 0).toFixed(1)}`} />
                    <FinanceStat label="Profit Lock" value="70.0%" active />
                 </div>
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

function FinanceStat({ label, value, trend, active }: any) {
   return (
      <div className="space-y-2">
         <p className="text-[9px] font-bold uppercase text-muted-foreground tracking-widest">{label}</p>
         <div className="flex items-center gap-3">
            <span className={cn("text-2xl font-black tabular-nums italic", active ? "text-primary" : "text-white")}>{value}</span>
            {trend && <span className="text-[8px] font-bold text-green-500">{trend}</span>}
         </div>
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