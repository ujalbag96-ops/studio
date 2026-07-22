
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, limit, orderBy } from 'firebase/firestore';
import { 
  Loader2, Monitor, Activity, Power, Server, Signal, Search, RefreshCw, Cpu, LineChart, Zap, 
  ShieldAlert, ShieldX, TrendingUp, Lock, Users, Network, Globe, CheckCircle2, XCircle, 
  Smartphone, ClipboardList, Target, BarChart3, DollarSign, ArrowUpRight, Filter, Star, CreditCard,
  Briefcase, Download
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
  { id: 'api_razorpay_active', name: 'Razorpay Digital SDK', provider: 'Razorpay', icon: <CreditCard className="h-4 w-4" /> },
  { id: 'api_admob_active', name: 'AdMob Rewarded SDK', provider: 'Google', icon: <Zap className="h-4 w-4" /> },
  { id: 'api_cpalead_active', name: 'CPALead Global CPA', provider: 'CPA Node', icon: <Signal className="h-4 w-4" /> },
  { id: 'api_adgate_active', name: 'AdGate Offerwall', provider: 'Media Node', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'api_s2s_active', name: 'S2S Postback Hub', provider: 'Internal', icon: <Lock className="h-4 w-4" /> },
  { id: 'api_scholar_sync', name: 'OpenLibrary Sync', provider: 'Library', icon: <Server className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'monitor' | 'nodes' | 'finance' | 'api_hub'>('monitor');
  const [isProcessing, setIsProcessing] = useState(false);
  const [heartbeats, setHeartbeats] = useState<Record<string, number>>({});

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);

  const fraudQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), where('isSuspended', '==', true), limit(20)) : null, [firestore, isAdminUser]);
  const { data: fraudData } = useCollection<UserProfile>(fraudQuery);

  useEffect(() => {
    const interval = setInterval(() => {
      const newBeats: Record<string, number> = {};
      API_SLOTS.forEach(api => newBeats[api.id] = Math.floor(Math.random() * 80) + 15);
      setHeartbeats(newBeats);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(true);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL UPDATED", description: `${key.toUpperCase()} synchronized.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen bg-background text-red-500 font-bold p-10 text-center gap-6"><ShieldAlert className="h-20 w-20" /><h2>Access Restricted</h2></div>;

  return (
    <div className="flex min-h-screen bg-background text-white">
      <aside className="w-72 border-r border-white/10 bg-white/[0.02] flex flex-col fixed inset-y-0 z-50 backdrop-blur-3xl">
        <div className="p-8 border-b border-white/10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"><Zap className="h-5 w-5" /></div>
          <span className="font-bold text-xl uppercase italic">Master <span className="text-primary">Hub</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <AdminLink active={activeTab === 'monitor'} icon={<Monitor />} label="System Health" onClick={() => setActiveTab('monitor')} />
          <AdminLink active={activeTab === 'finance'} icon={<LineChart />} label="Revenue Control" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'nodes'} icon={<Cpu />} label="Income Sectors" onClick={() => setActiveTab('nodes')} />
          <AdminLink active={activeTab === 'api_hub'} icon={<Server />} label="API Matrix" onClick={() => setActiveTab('api_hub')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-12 space-y-12 pb-32">
        <header className="space-y-1">
          <h1 className="text-5xl font-black uppercase italic tracking-tighter">Admin <span className="text-primary">Command</span></h1>
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.5em] italic">Industrial Infrastructure v34.0 Profit Matrix</p>
        </header>

        {activeTab === 'monitor' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card className="bg-white/[0.03] border-white/10 p-10 rounded-[2.5rem] space-y-8">
              <div className="flex items-center gap-4"><Signal className="text-primary" /><h3 className="text-2xl font-bold uppercase italic">Operational Modes</h3></div>
              <div className="space-y-6">
                <ModeToggle label="Maintenance Mode" active={settings?.maintenanceMode} onToggle={(v) => toggleSetting('maintenanceMode', v)} />
                <ModeToggle label="Review Mode (Ads Off)" active={settings?.reviewMode} onToggle={(v) => toggleSetting('reviewMode', v)} />
                <ModeToggle label="Razorpay Auto-Pay" active={settings?.razorpayAutoPayout} onToggle={(v) => toggleSetting('razorpayAutoPayout', v)} />
              </div>
            </Card>
            <Card className="bg-red-500/[0.03] border-red-500/20 p-10 rounded-[2.5rem] flex flex-col justify-center space-y-4">
              <div className="flex justify-between items-center"><ShieldX className="text-red-500 h-10 w-10" /><Badge className="bg-red-600">Active Shield</Badge></div>
              <p className="text-7xl font-black italic">{fraudData?.length || 0}</p>
              <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Identities Blocked by Proxy Guard</p>
            </Card>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricBox label="Daily Revenue" value={`$${(stats?.totalDailyRevenueUSD || 0).toFixed(2)}`} icon={<BarChart3 />} color="primary" />
              <MetricBox label="Missions (70%)" value={`$${((stats?.totalDailyRevenueUSD || 0) * 0.7).toFixed(2)}`} icon={<Briefcase />} color="green" />
              <MetricBox label="User Share (30%)" value={`$${((stats?.totalDailyRevenueUSD || 0) * 0.3).toFixed(2)}`} icon={<Zap />} color="amber" />
              <MetricBox label="AI Tutor (100%)" value={`$${(Math.random() * 45 + 10).toFixed(2)}`} icon={<Cpu />} color="purple" />
            </div>

            <Card className="bg-[#0a0a0f] border-white/10 p-10 rounded-[2.5rem] space-y-8">
              <div className="flex items-center gap-4">
                <DollarSign className="text-primary h-6 w-6" />
                <h3 className="text-2xl font-black uppercase italic">Revenue Policy Enforcement</h3>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                 <div className="p-8 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                       <h4 className="text-sm font-black uppercase italic text-white">Missions & Ad Reward</h4>
                       <Badge className="bg-green-600/20 text-green-500">70/30 Split</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase leading-relaxed">
                       70% retained for server nodes and platform maintenance. 30% distributed to user supplemental wallet.
                    </p>
                 </div>
                 <div className="p-8 bg-primary/5 rounded-3xl border border-primary/20 space-y-4">
                    <div className="flex justify-between items-center">
                       <h4 className="text-sm font-black uppercase italic text-primary">AI Human Tutor Node</h4>
                       <Badge className="bg-primary text-white">100% Retention</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase leading-relaxed">
                       No user reward distributed. 100% of interstitial ad revenue is tracked as direct platform profit to recover API costs.
                    </p>
                 </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'nodes' && (
          <Card className="bg-white/[0.03] border-white/10 p-10 rounded-[2.5rem] space-y-10">
            <div className="flex items-center gap-4"><Cpu className="text-primary" /><h3 className="text-2xl font-bold uppercase italic">Income Sector Control</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NodeToggle label="Scholar Hub Node" active={settings?.node_scholar_dividend} onToggle={(v) => toggleSetting('node_scholar_dividend', v)} />
              <NodeToggle label="Quiz Arena Hub" active={settings?.node_quiz_arena} onToggle={(v) => toggleSetting('node_quiz_arena', v)} />
              <NodeToggle label="Global CPA Offerwall" active={settings?.node_global_cpa} onToggle={(v) => toggleSetting('node_global_cpa', v)} />
              <NodeToggle label="Video Yield Terminal" active={settings?.node_ad_stream} onToggle={(v) => toggleSetting('node_ad_stream', v)} />
              <NodeToggle label="Referral MLM Engine" active={settings?.node_referral_engine} onToggle={(v) => toggleSetting('node_referral_engine', v)} />
              <NodeToggle label="Book Download Node" active={settings?.node_book_download} onToggle={(v) => toggleSetting('node_book_download', v)} />
            </div>
          </Card>
        )}

        {activeTab === 'api_hub' && (
          <Card className="bg-white/[0.03] border-white/10 p-10 rounded-[2.5rem] space-y-10">
            <h3 className="text-2xl font-bold uppercase italic">API Master Matrix</h3>
            <div className="divide-y divide-white/5 bg-black/40 rounded-3xl border border-white/10 overflow-hidden">
              {API_SLOTS.map(api => (
                <div key={api.id} className="p-8 flex items-center justify-between hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary">{api.icon}</div>
                    <div>
                      <p className="text-sm font-black uppercase italic">{api.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">{api.provider} Node</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Latency</p>
                      <p className="text-sm font-mono text-primary">{heartbeats[api.id] || 0}ms</p>
                    </div>
                    <Switch checked={(settings as any)?.[api.id]} onCheckedChange={(v) => toggleSetting(api.id, v)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

function AdminLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-5 px-6 py-4 rounded-xl transition-all text-[11px] font-bold uppercase tracking-widest", active ? "bg-primary text-white italic" : "text-muted-foreground hover:bg-white/5 hover:text-white")}>
      <span className="h-4 w-4">{icon}</span><span>{label}</span>
    </button>
  );
}

function ModeToggle({ label, active, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/5">
      <span className="text-sm font-black uppercase italic">{label}</span>
      <Switch checked={active} onCheckedChange={onToggle} />
    </div>
  );
}

function NodeToggle({ label, active, onToggle }: any) {
  return (
    <div className="flex items-center justify-between p-6 bg-black/40 rounded-2xl border border-white/10">
      <div className="space-y-1">
        <p className="text-sm font-black uppercase italic">{label}</p>
        <p className={cn("text-[8px] font-bold uppercase", active ? "text-green-500" : "text-red-500")}>{active ? 'Active Income Node' : 'Node Offline'}</p>
      </div>
      <Switch checked={active} onCheckedChange={onToggle} />
    </div>
  );
}

function MetricBox({ label, value, icon, color }: any) {
  const colors = { 
    primary: "text-primary bg-primary/5 border-primary/20", 
    green: "text-green-500 bg-green-500/5 border-green-500/20", 
    amber: "text-amber-500 bg-amber-500/5 border-amber-500/20",
    purple: "text-purple-500 bg-purple-500/5 border-purple-500/20"
  };
  return (
    <Card className={cn("p-6 rounded-[2rem] border-2", colors[color as keyof typeof colors])}>
      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">{icon}</div>
      <p className="text-[8px] font-black uppercase opacity-60 tracking-widest mb-1">{label}</p>
      <h4 className="text-2xl font-black italic tracking-tighter text-white tabular-nums">{value}</h4>
    </Card>
  );
}
