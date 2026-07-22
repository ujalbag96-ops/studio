
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, limit } from 'firebase/firestore';
import { 
  Loader2, Monitor, Activity, Power, Server, Signal, Cpu, LineChart, Zap, 
  ShieldAlert, ShieldX, Lock, Users, Globe, Smartphone, ClipboardList, Target, 
  Eye, EyeOff, LayoutGrid, LayoutList, CheckCircle2, ChevronRight, Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, AppSettings, PlatformRevenue } from '../lib/types';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

const VISIBILITY_NODES = [
  { id: 'node_scholar_dividend', name: 'Library & Books', icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'node_tutor_visible', name: 'AI Human Tutor', icon: <Cpu className="h-4 w-4" /> },
  { id: 'node_global_cpa', name: 'Pocket Money (CPA)', icon: <Smartphone className="h-4 w-4" /> },
  { id: 'node_quiz_arena', name: 'Quiz Arena Hub', icon: <Target className="h-4 w-4" /> },
  { id: 'node_daily_streak_visible', name: 'Daily Streak & Bonus', icon: <Activity className="h-4 w-4" /> },
  { id: 'node_referral_engine', name: 'Refer & Earn Node', icon: <Users className="h-4 w-4" /> },
  { id: 'node_book_download', name: 'Book Download Feature', icon: <Server className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'monitor' | 'finance'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
  const toggleSetting = async (key: string, value: boolean) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL SYNCED", description: `${key.replace('node_', '').toUpperCase()} visibility updated.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] text-red-500 font-black p-10 text-center gap-6"><ShieldAlert className="h-20 w-20" /><h2 className="text-2xl uppercase italic italic tracking-tighter">Identity Not Verified</h2><Button asChild variant="outline" className="border-red-500/20 text-red-500 uppercase font-black"><a href="/login">Return to Gate</a></Button></div>;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      {/* Mobile Top Navigation */}
      <header className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
            <div>
               <p className="text-sm font-black uppercase italic leading-none">Master <span className="text-primary">Hub</span></p>
               <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Admin v35.0 (Mobile)</p>
            </div>
         </div>
         <Badge className="bg-green-600/20 text-green-500 border-none text-[8px] font-black uppercase px-3 italic">Live Sync Active</Badge>
      </header>

      {/* Main Content Hub */}
      <main className="pt-28 px-6 space-y-10 max-w-2xl mx-auto">
         
         {/* Navigation Pills */}
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Visibility" icon={<Eye className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'monitor'} label="System" icon={<Monitor className="h-3 w-3" />} onClick={() => setActiveTab('monitor')} />
            <NavPill active={activeTab === 'finance'} label="Profit" icon={<LineChart className="h-3 w-3" />} onClick={() => setActiveTab('finance')} />
         </div>

         {activeTab === 'visibility' && (
           <div className="space-y-6 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter">Feature <span className="text-primary">Control</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Instant Hide/Unhide Node - No Delete Permitted</p>
              </div>

              <div className="grid gap-4">
                 {VISIBILITY_NODES.map((node) => {
                    const isActive = (settings as any)?.[node.id];
                    return (
                       <Card key={node.id} className="bg-[#0a0a0f] border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-primary/20 transition-all">
                          <div className="flex items-center gap-5">
                             <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center transition-all", isActive ? "bg-primary/10 text-primary border border-primary/20 shadow-lg" : "bg-white/5 text-muted-foreground border border-white/10")}>
                                {node.icon}
                             </div>
                             <div>
                                <p className={cn("text-sm font-black uppercase italic", isActive ? "text-white" : "text-muted-foreground opacity-50")}>{node.name}</p>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">
                                   {isActive ? "ACTIVE SIGNAL" : "SIGNAL MUTED"}
                                </p>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             {isProcessing === node.id ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : (
                               <Switch 
                                checked={!!isActive} 
                                onCheckedChange={(v) => toggleSetting(node.id, v)}
                                className="data-[state=checked]:bg-primary"
                               />
                             )}
                             {isActive ? <Eye className="h-3 w-3 text-primary opacity-40" /> : <EyeOff className="h-3 w-3 text-muted-foreground opacity-20" />}
                          </div>
                       </Card>
                    );
                 })}
              </div>
           </div>
         )}

         {activeTab === 'monitor' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Operational <span className="text-primary">Status</span></h2>
              
              <div className="grid gap-4">
                 <ModeRow label="Maintenance Mode" active={settings?.maintenanceMode} onToggle={(v) => toggleSetting('maintenanceMode', v)} icon={<Power />} />
                 <ModeRow label="Review Mode (Ads Off)" active={settings?.reviewMode} onToggle={(v) => toggleSetting('reviewMode', v)} icon={<Signal />} />
                 <ModeRow label="Razorpay Auto-Pay" active={settings?.razorpayAutoPayout} onToggle={(v) => toggleSetting('razorpayAutoPayout', v)} icon={<Cpu />} />
              </div>

              <Card className="bg-red-500/5 border-red-500/20 p-8 rounded-3xl space-y-4">
                 <div className="flex justify-between items-center">
                    <ShieldX className="text-red-500 h-6 w-6" />
                    <Badge className="bg-red-600 text-[8px] font-black">SECURITY NODE</Badge>
                 </div>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase">VPN/Proxy Identity Lock: Active</p>
              </Card>
           </div>
         )}

         {activeTab === 'finance' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Revenue <span className="text-primary">Node</span></h2>
              <div className="grid grid-cols-2 gap-4">
                 <MiniMetric label="Daily Gross" value="$42.50" color="primary" />
                 <MiniMetric label="Admin Profit" value="$29.75" color="green" />
                 <MiniMetric label="User Rewards" value="$12.75" color="amber" />
                 <MiniMetric label="AI Margin" value="100%" color="purple" />
              </div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase text-center opacity-40 italic tracking-widest">
                 Industrial Settlement Policy: 70/30 Margin Locked
              </p>
           </div>
         )}
      </main>

      {/* Industrial Bottom Indicator */}
      <footer className="fixed bottom-0 inset-x-0 p-8 flex justify-center pointer-events-none">
         <div className="bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full flex items-center gap-3 shadow-2xl">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-white tracking-[0.4em] italic">CampusHub Security Signal Active</span>
         </div>
      </footer>
    </div>
  );
}

function NavPill({ active, label, icon, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className={cn(
          "px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[9px] tracking-widest whitespace-nowrap border-2",
          active ? "bg-primary/10 border-primary text-primary italic" : "bg-white/5 border-transparent text-muted-foreground"
        )}
      >
         {icon} <span>{label}</span>
      </button>
   );
}

function ModeRow({ label, active, onToggle, icon }: any) {
   return (
      <Card className="bg-white/5 border-white/5 p-6 flex items-center justify-between rounded-3xl">
         <div className="flex items-center gap-4">
            <div className="text-primary">{icon}</div>
            <span className="text-xs font-black uppercase italic">{label}</span>
         </div>
         <Switch checked={active} onCheckedChange={onToggle} className="data-[state=checked]:bg-primary" />
      </Card>
   );
}

function MiniMetric({ label, value, color }: any) {
   const colors = { primary: "text-primary bg-primary/5 border-primary/20", green: "text-green-500 bg-green-500/5 border-green-500/20", amber: "text-amber-500 bg-amber-500/5 border-amber-500/20", purple: "text-purple-500 bg-purple-500/5 border-purple-500/20" };
   return (
      <Card className={cn("p-6 rounded-3xl border text-center", colors[color as keyof typeof colors])}>
         <p className="text-[8px] font-black uppercase opacity-60 mb-1">{label}</p>
         <p className="text-xl font-black italic">{value}</p>
      </Card>
   );
}
