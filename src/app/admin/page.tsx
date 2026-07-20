
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
  CheckCircle2,
  XCircle,
  Database,
  Library,
  Cpu,
  Smartphone,
  Users,
  Activity,
  ArrowUpRight,
  Power,
  Link2,
  Lock,
  Wifi,
  Signal,
  LayoutGrid
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { PayoutRequest, UserProfile, AppSettings } from '../lib/types';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'monitor' | 'apis' | 'finance' | 'audit' | 'settings'>('monitor');
  const [isProcessing, setIsProcessing] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
  const fraudQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'users'), where('isSuspended', '==', true), limit(50)) : null, [firestore, isAdminUser]);
  const { data: fraudData } = useCollection<UserProfile>(fraudQuery);
  
  const allUsersQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'users') : null, [firestore, isAdminUser]);
  const { data: allUsers } = useCollection<UserProfile>(allUsersQuery);

  const toggleSetting = async (key: string, value: boolean) => {
    if (!settingsRef) return;
    setIsProcessing(true);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL UPDATED", description: `${key.toUpperCase().replace('NODE_', '')} is now ${value ? 'ACTIVE' : 'LOCKED'}` });
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
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <span className="font-black text-2xl italic uppercase tracking-tighter">MASTER <span className="text-primary">HUB</span></span>
        </div>
        <nav className="flex-1 p-8 space-y-3">
          <AdminLink active={activeTab === 'monitor'} icon={<Monitor />} label="Master Monitor" onClick={() => setActiveTab('monitor')} />
          <AdminLink active={activeTab === 'apis'} icon={<Link2 />} label="API Master Hub" onClick={() => setActiveTab('apis')} />
          <AdminLink active={activeTab === 'settings'} icon={<Settings />} label="System Config" onClick={() => setActiveTab('settings')} />
          <AdminLink active={activeTab === 'finance'} icon={<BarChart3 />} label="Financial Node" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'audit'} icon={<ShieldX />} label="Fraud Shield" onClick={() => setActiveTab('audit')} />
        </nav>
        <div className="p-10 border-t border-white/5">
           <div className="flex items-center gap-3 text-[10px] font-black uppercase text-muted-foreground italic">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Operational Integrity: 100%
           </div>
        </div>
      </aside>

      <main className="flex-1 ml-80 p-12 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div className="space-y-1">
              <h1 className="text-5xl font-black uppercase italic tracking-tighter">Admin <span className="text-primary">Command</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.5em] italic">Industrial Infrastructure Dashboard</p>
           </div>
           
           <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="text-right">
                 <p className="text-[8px] font-black uppercase text-muted-foreground">Auto-Withdrawal</p>
                 <p className={cn("text-xs font-black uppercase italic", settings?.autoWithdrawalEnabled ? "text-green-500" : "text-amber-500")}>
                    {settings?.autoWithdrawalEnabled ? 'ENABLED' : 'MANUAL AUDIT'}
                 </p>
              </div>
              <Switch checked={settings?.autoWithdrawalEnabled} onCheckedChange={(v) => toggleSetting('autoWithdrawalEnabled', v)} disabled={isProcessing} />
           </div>
        </header>

        {activeTab === 'settings' && (
           <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <LayoutGrid className="h-5 w-5 text-primary" />
                 </div>
                 <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">Yield Node <span className="text-primary">Configuration</span></h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Master Toggles for 10-Node Architecture</p>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 <NodeCategoryCard title="Academic Sector" icon={<Library className="text-blue-400" />}>
                    <NodeToggle label="Scholar Dividend" active={settings?.node_scholar_dividend} onToggle={(v) => toggleSetting('node_scholar_dividend', v)} />
                    <NodeToggle label="Quiz Arena" active={settings?.node_quiz_arena} onToggle={(v) => toggleSetting('node_quiz_arena', v)} />
                 </NodeCategoryCard>

                 <NodeCategoryCard title="Global Sector (USD)" icon={<Globe className="text-amber-500" />}>
                    <NodeToggle label="Global CPA Hub" active={settings?.node_global_cpa} onToggle={(v) => toggleSetting('node_global_cpa', v)} />
                    <NodeToggle label="Micro Tasks" active={settings?.node_micro_tasks} onToggle={(v) => toggleSetting('node_micro_tasks', v)} />
                    <NodeToggle label="Premium Surveys" active={settings?.node_surveys} onToggle={(v) => toggleSetting('node_surveys', v)} />
                 </NodeCategoryCard>

                 <NodeCategoryCard title="Universal Sector" icon={<Zap className="text-green-500" />}>
                    <NodeToggle label="Ad Stream" active={settings?.node_ad_stream} onToggle={(v) => toggleSetting('node_ad_stream', v)} />
                    <NodeToggle label="Content Analysis" active={settings?.node_content_analysis} onToggle={(v) => toggleSetting('node_content_analysis', v)} />
                    <NodeToggle label="Referral Engine" active={settings?.node_referral_engine} onToggle={(v) => toggleSetting('node_referral_engine', v)} />
                    <NodeToggle label="Arcade Rewards" active={settings?.node_arcade_rewards} onToggle={(v) => toggleSetting('node_arcade_rewards', v)} />
                    <NodeToggle label="Daily Check-in" active={settings?.node_daily_checkin} onToggle={(v) => toggleSetting('node_daily_checkin', v)} />
                 </NodeCategoryCard>
              </div>
           </div>
        )}

        {activeTab === 'monitor' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
              {/* STATUS OVERVIEW */}
              <Card className="lg:col-span-2 bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><Signal className="h-48 w-48 text-primary" /></div>
                 <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl">
                          <Activity className="h-6 w-6" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black uppercase italic tracking-widest">Node <span className="text-primary">Monitor</span></h3>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Real-time Signal Integrity</p>
                       </div>
                    </div>
                    <Badge variant="outline" className="border-white/10 uppercase font-black px-4 py-1 text-[9px]">10/10 Nodes Online</Badge>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 relative z-10">
                    <StatusPulse label="N1: EDU" active={settings?.node_scholar_dividend} />
                    <StatusPulse label="N2: QUIZ" active={settings?.node_quiz_arena} />
                    <StatusPulse label="N3: CPA" active={settings?.node_global_cpa} />
                    <StatusPulse label="N4: TASK" active={settings?.node_micro_tasks} />
                    <StatusPulse label="N5: SURV" active={settings?.node_surveys} />
                    <StatusPulse label="N6: ADS" active={settings?.node_ad_stream} />
                    <StatusPulse label="N7: ANLY" active={settings?.node_content_analysis} />
                    <StatusPulse label="N8: REFR" active={settings?.node_referral_engine} />
                    <StatusPulse label="N9: ARCD" active={settings?.node_arcade_rewards} />
                    <StatusPulse label="N10: DAY" active={settings?.node_daily_checkin} />
                 </div>
              </Card>

              {/* FRAUD SHIELD QUICK VIEW */}
              <Card className="bg-red-500/5 border-red-500/20 border-2 rounded-[3rem] p-10 space-y-6 shadow-2xl">
                 <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                       <ShieldAlert className="h-5 w-5 text-red-500" /> Fraud Log
                    </h3>
                    <Badge className="bg-red-500 text-white border-none font-black px-3 py-1 text-[9px] animate-pulse">ALERTS ACTIVE</Badge>
                 </div>
                 <div className="space-y-1">
                    <p className="text-5xl font-black text-white italic">{fraudData?.length || 0}</p>
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest italic">Suspicious Signals Caught</p>
                 </div>
              </Card>
           </div>
        )}
      </main>
    </div>
  );
}

function NodeCategoryCard({ title, icon, children }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
         <div className="flex items-center gap-3 pb-2 border-b border-white/5">
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">{icon}</div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">{title}</h3>
         </div>
         <div className="space-y-4">
            {children}
         </div>
      </Card>
   );
}

function NodeToggle({ label, active, onToggle }: any) {
   return (
      <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
         <div className="flex items-center gap-3">
            <div className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-green-500 animate-pulse" : "bg-red-500")} />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
         </div>
         <Switch checked={active} onCheckedChange={onToggle} />
      </div>
   );
}

function StatusPulse({ label, active }: any) {
   return (
      <div className="flex items-center gap-2 p-3 bg-black/40 rounded-xl border border-white/5">
         <div className={cn("h-2 w-2 rounded-full", active ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500")} />
         <span className="text-[8px] font-black uppercase text-white/60">{label}</span>
      </div>
   );
}

function AdminLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-6 px-8 py-5 rounded-2xl transition-all text-[11px] font-black uppercase tracking-[0.2em]",
      active ? "bg-primary text-white shadow-xl shadow-primary/20 italic border border-white/10 scale-[1.05]" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      <span className={cn("h-5 w-5 transition-all", active ? "scale-110" : "")}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
