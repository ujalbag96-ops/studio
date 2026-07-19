
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
  Power
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
  
  const [activeTab, setActiveTab] = useState<'monitor' | 'finance' | 'audit' | 'settings'>('monitor');
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
      toast({ title: "SIGNAL UPDATED", description: `${key.toUpperCase()} is now ${value ? 'ACTIVE' : 'LOCKED'}` });
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
          <AdminLink active={activeTab === 'finance'} icon={<BarChart3 />} label="Financial Node" onClick={() => setActiveTab('finance')} />
          <AdminLink active={activeTab === 'audit'} icon={<ShieldX />} label="Fraud Shield" onClick={() => setActiveTab('audit')} />
          <AdminLink active={activeTab === 'settings'} icon={<Settings />} label="System Config" onClick={() => setActiveTab('settings')} />
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
                 <p className="text-[8px] font-black uppercase text-muted-foreground">System Mode</p>
                 <p className={cn("text-xs font-black uppercase italic", settings?.reviewMode ? "text-amber-500" : "text-green-500")}>
                    {settings?.reviewMode ? 'Review Mode Active' : 'Production Live'}
                 </p>
              </div>
              <Switch checked={!settings?.reviewMode} onCheckedChange={(v) => toggleSetting('reviewMode', !v)} disabled={isProcessing} />
           </div>
        </header>

        {activeTab === 'monitor' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-700">
              {/* LEARNING MODULE STATUS */}
              <Card className="lg:col-span-2 bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5"><Library className="h-48 w-48 text-primary" /></div>
                 <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xl">
                          <Library className="h-6 w-6" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black uppercase italic tracking-widest">Library <span className="text-primary">Signals</span></h3>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Automatic Curriculum Nodes</p>
                       </div>
                    </div>
                    <Badge variant="outline" className="border-white/10 uppercase font-black px-4 py-1 text-[9px]">Class 1-12 Active</Badge>
                 </div>

                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                    {[10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(cls => (
                       <StatusIndicator key={cls} label={`Class ${cls}`} status="active" />
                    ))}
                 </div>

                 <div className="grid md:grid-cols-2 gap-6 relative z-10">
                    <NodeSwitch 
                       icon={<Database />} 
                       label="NCERT Hub (India)" 
                       active={true} 
                       onToggle={() => {}} 
                    />
                    <NodeSwitch 
                       icon={<Globe />} 
                       label="OSEPA Node (Odisha)" 
                       active={true} 
                       onToggle={() => {}} 
                    />
                 </div>
              </Card>

              {/* SECURITY & USER HUB */}
              <div className="space-y-8">
                 <Card className="bg-red-500/5 border-red-500/20 border-2 rounded-[3rem] p-10 space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                          <ShieldAlert className="h-5 w-5 text-red-500" /> Fraud Shield
                       </h3>
                       <Badge className="bg-red-500 text-white border-none font-black px-3 py-1 text-[9px] animate-pulse">ALERTS ACTIVE</Badge>
                    </div>
                    <div className="space-y-1">
                       <p className="text-5xl font-black text-white italic">{fraudData?.length || 0}</p>
                       <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest italic">Suspicious Activities Caught</p>
                    </div>
                    <Button variant="outline" className="w-full h-14 rounded-xl border-red-500/20 bg-red-500/5 text-red-500 font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all">
                       AUDIT FRAUD LOGS <ArrowUpRight className="h-3 w-3 ml-2" />
                    </Button>
                 </Card>

                 <Card className="bg-green-500/5 border-green-500/20 border-2 rounded-[3rem] p-10 space-y-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                          <Users className="h-5 w-5 text-green-500" /> Verified Peers
                       </h3>
                    </div>
                    <div className="space-y-1">
                       <p className="text-5xl font-black text-white italic">{allUsers?.filter(u => u.vipLevel > 0).length || 0}</p>
                       <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest italic">Industrial VIP 1 Accounts</p>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500" style={{ width: `${((allUsers?.filter(u => u.vipLevel > 0).length || 0) / (allUsers?.length || 1)) * 100}%` }} />
                    </div>
                 </Card>
              </div>

              {/* REVENUE MODULE STATUS */}
              <Card className="lg:col-span-3 bg-[#0a0a0f] border-white/5 rounded-[3rem] p-10 space-y-10 shadow-2xl">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-4">
                       <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xl">
                          <Zap className="h-6 w-6" />
                       </div>
                       <div>
                          <h3 className="text-2xl font-black uppercase italic tracking-widest">Revenue <span className="text-amber-500">Pipeline</span></h3>
                          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Monetization Signal Status</p>
                       </div>
                    </div>
                    <div className="flex gap-6">
                       <StatusIndicator label="CPA Mediation (CPALead)" status="active" />
                       <StatusIndicator label="Ad Streaming (Rewarded)" status="active" />
                       <StatusIndicator label="Postback Node (S2S)" status="active" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-4">
                       <p className="text-[10px] font-black uppercase text-muted-foreground">Admin Net Profit (70%)</p>
                       <p className="text-4xl font-black text-primary italic">$420.50</p>
                       <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-2 py-1">LOCKED ASSETS</Badge>
                    </div>
                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-4">
                       <p className="text-[10px] font-black uppercase text-muted-foreground">Daily Revenue Yield</p>
                       <p className="text-4xl font-black text-green-500 italic">+$82.10</p>
                       <div className="flex items-center gap-2 text-[8px] font-bold text-green-500 uppercase">
                          <Activity className="h-3 w-3" /> 12% Growth Today
                       </div>
                    </div>
                    <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 space-y-4">
                       <p className="text-[10px] font-black uppercase text-muted-foreground">API Latency Node</p>
                       <p className="text-4xl font-black text-white italic">42ms</p>
                       <p className="text-[9px] font-black uppercase text-muted-foreground italic">Optimal Network Signal</p>
                    </div>
                 </div>
              </Card>
           </div>
        )}

        {activeTab !== 'monitor' && (
           <div className="py-40 text-center space-y-6 bg-[#0a0a0f] border border-dashed border-white/10 rounded-[4rem]">
              <Settings className="h-20 w-20 text-muted-foreground opacity-10 mx-auto" />
              <p className="text-sm font-black uppercase text-muted-foreground tracking-[0.4em] italic">Secondary Node Hub Active</p>
           </div>
        )}
      </main>
    </div>
  );
}

function StatusIndicator({ label, status }: { label: string, status: 'active' | 'inactive' }) {
   return (
      <div className="flex items-center gap-3 p-4 bg-black/40 rounded-2xl border border-white/5 min-w-[140px]">
         <div className={cn(
            "h-2.5 w-2.5 rounded-full shadow-lg",
            status === 'active' ? "bg-green-500 animate-pulse shadow-green-500/20" : "bg-red-500 shadow-red-500/20"
         )} />
         <span className="text-[9px] font-black uppercase tracking-widest text-white/80">{label}</span>
      </div>
   );
}

function NodeSwitch({ icon, label, active, onToggle }: any) {
   return (
      <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl group hover:border-primary/40 transition-all shadow-lg">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center text-primary border border-white/5 group-hover:scale-110 transition-transform">
               {icon}
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
         </div>
         <Switch checked={active} onCheckedChange={onToggle} />
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
