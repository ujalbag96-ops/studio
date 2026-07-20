
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, limit, where, increment } from 'firebase/firestore';
import { 
  ShieldCheck, 
  Loader2, 
  Wallet, 
  BarChart3,
  Zap,
  ShieldAlert,
  Settings,
  ShieldX,
  Globe,
  Monitor,
  Database,
  Activity,
  Power,
  Link2,
  Lock,
  LayoutGrid,
  TrendingUp,
  Percent
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AppSettings, PlatformRevenue } from '../lib/types';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'monitor' | 'apis' | 'finance' | 'settings'>('monitor');
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);

  const fraudQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), where('isSuspended', '==', true), limit(50)) : null, [firestore, isAdminUser]);
  const { data: fraudData } = useCollection<UserProfile>(fraudQuery);

  const toggleSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(true);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL UPDATED", description: `${key.toUpperCase().replace('NODE_', '')} sync successful.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(false);
    }
  };

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
          <AdminLink active={activeTab === 'finance'} icon={<BarChart3 />} label="Profit Node" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'settings'} icon={<Settings />} label="System Config" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-80 p-12 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-5xl font-black uppercase italic tracking-tighter">Admin <span className="text-primary">Command</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.5em] italic">Industrial Infrastructure Dashboard</p>
           </div>
        </header>

        {activeTab === 'finance' && (
           <div className="space-y-10 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] p-10 space-y-4 shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-primary">Platform Total Revenue</p>
                    <h3 className="text-5xl font-black italic text-white">${(stats?.totalDailyRevenueUSD || 0).toFixed(2)}</h3>
                    <div className="flex items-center gap-2">
                       <TrendingUp className="h-4 w-4 text-green-500" />
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">Real-time S2S Feed</span>
                    </div>
                 </Card>

                 <Card className="bg-green-500/5 border-green-500/20 rounded-[2.5rem] p-10 space-y-4 shadow-2xl">
                    <p className="text-[10px] font-black uppercase text-green-500">User Share Distributed</p>
                    <h3 className="text-5xl font-black italic text-white">${(stats?.totalDistributedToUsersUSD || 0).toFixed(2)}</h3>
                    <Badge className="bg-green-500/20 text-green-500 border-none text-[8px] font-black">{settings?.userRevenueSharePercent || 30}% Allocated</Badge>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-10 space-y-6 shadow-2xl">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Percent className="h-5 w-5 text-primary" />
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase text-muted-foreground">Override Share %</p>
                          <p className="text-xs font-bold text-white uppercase italic">Distribution Engine</p>
                       </div>
                    </div>
                    <div className="flex gap-4">
                       <Input 
                        type="number" 
                        value={settings?.userRevenueSharePercent || 30} 
                        onChange={(e) => toggleSetting('userRevenueSharePercent', parseInt(e.target.value))}
                        className="bg-black border-white/10 h-12 rounded-xl font-black text-lg text-primary w-24"
                       />
                       <p className="text-[8px] text-muted-foreground leading-relaxed uppercase font-medium">
                          Current logic ensures {100 - (settings?.userRevenueSharePercent || 30)}% Admin Profit Lock.
                       </p>
                    </div>
                 </Card>
              </div>
           </div>
        )}

        {activeTab === 'monitor' && (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Activity className="h-6 w-6" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black uppercase italic tracking-widest">Node <span className="text-primary">Monitor</span></h3>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">System Signal Integrity</p>
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <StatusPulse label="EDU NODE" active={settings?.node_scholar_dividend} />
                    <StatusPulse label="CPA HUB" active={settings?.node_global_cpa} />
                    <StatusPulse label="AD STREAM" active={settings?.node_ad_stream} />
                    <StatusPulse label="DAILY BOX" active={settings?.node_daily_checkin} />
                 </div>
              </Card>

              <Card className="bg-red-500/5 border-red-500/20 border-2 rounded-[3rem] p-10 space-y-6">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                       <ShieldX className="h-5 w-5 text-red-500" /> Fraud Shield
                    </h3>
                    <Badge className="bg-red-500 text-white border-none text-[9px] animate-pulse">ALERTS ACTIVE</Badge>
                 </div>
                 <p className="text-5xl font-black text-white italic">{fraudData?.length || 0}</p>
                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest italic">Accounts Locked via VPN detection</p>
              </Card>
           </div>
        )}
      </main>
    </div>
  );
}

function StatusPulse({ label, active }: any) {
   return (
      <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
         <span className="text-[10px] font-black uppercase text-white/60">{label}</span>
         <div className={cn("h-2 w-2 rounded-full", active ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
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
