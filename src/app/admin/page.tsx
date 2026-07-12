
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, addDoc, increment, query, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import { 
  Users as UsersIcon, 
  Settings, 
  Loader2,
  ShieldCheck,
  Wallet,
  Zap,
  Smartphone,
  Trash2,
  Plus,
  RefreshCw,
  Eye,
  Flag,
  Target,
  Monitor,
  Layout,
  Disc
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'missions' | 'ads' | 'jhilli' | 'settings'>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Subscriptions
  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const missionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_missions') : null, [firestore, isAdminUser]);
  const adSettingsRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'app_settings', 'global_config') : null, [firestore, isAdminUser]);
  const jhilliRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'app_settings', 'jhilli_config') : null, [firestore, isAdminUser]);
  
  const { data: payoutsData } = useCollection<any>(payoutsQuery);
  const { data: missionsData } = useCollection<any>(missionsQuery);
  const { data: globalConfig } = useDoc<any>(adSettingsRef);
  const { data: jhilliConfig } = useDoc<any>(jhilliRef);

  // Local state for Ad Config
  const [adConfig, setAdConfig] = useState({
    adMobAppId: '',
    adMobBannerId: '',
    adMobInterstitialId: '',
    appLovinSdkKey: '',
    appLovinZoneId: ''
  });

  // Local state for Jhilli Config
  const [jhilliLocal, setJhilliLocal] = useState({
    rewards: '0, 5, 10, 2, 20, 1, 15, 50',
    dailyFreeLimit: 1,
    spinCost: 10
  });

  useEffect(() => {
    if (globalConfig) {
      setAdConfig({
        adMobAppId: globalConfig.adMobAppId || '',
        adMobBannerId: globalConfig.adMobBannerId || '',
        adMobInterstitialId: globalConfig.adMobInterstitialId || '',
        appLovinSdkKey: globalConfig.appLovinSdkKey || '',
        appLovinZoneId: globalConfig.appLovinZoneId || ''
      });
    }
  }, [globalConfig]);

  useEffect(() => {
    if (jhilliConfig) {
      setJhilliLocal({
        rewards: Array.isArray(jhilliConfig.rewards) ? jhilliConfig.rewards.join(', ') : jhilliConfig.rewards || '0, 5, 10, 2, 20, 1, 15, 50',
        dailyFreeLimit: jhilliConfig.dailyFreeLimit || 1,
        spinCost: jhilliConfig.spinCost || 10
      });
    }
  }, [jhilliConfig]);

  const handleSaveAds = async () => {
    if (!firestore || !isAdminUser) return;
    setIsProcessing('save-ads');
    try {
      await setDoc(doc(firestore, 'app_settings', 'global_config'), adConfig, { merge: true });
      toast({ title: "CONFIGURATION LOCKED", description: "Ad IDs updated project-wide." });
    } catch (e) {
      toast({ variant: "destructive", title: "Write Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSaveJhilli = async () => {
    if (!firestore || !isAdminUser) return;
    setIsProcessing('save-jhilli');
    try {
      const rewardsArray = jhilliLocal.rewards.split(',').map(r => parseFloat(r.trim())).filter(r => !isNaN(r));
      await setDoc(doc(firestore, 'app_settings', 'jhilli_config'), {
        rewards: rewardsArray,
        dailyFreeLimit: Number(jhilliLocal.dailyFreeLimit),
        spinCost: Number(jhilliLocal.spinCost),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "JHILLI ENGINE UPDATED", description: "Spin wheel parameters synced." });
    } catch (e) {
      toast({ variant: "destructive", title: "Config Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handlePayoutAction = async (payout: any, action: 'approved' | 'rejected') => {
    if (!firestore || !isAdminUser) return;
    setIsProcessing(payout.id);
    
    try {
      const payoutRef = doc(firestore, 'payouts', payout.id);
      const userRef = doc(firestore, 'users', payout.userId);
      const batch = writeBatch(firestore);
      
      if (action === 'rejected') {
        const refundAmount = payout.amount * 10; 
        batch.update(payoutRef, { status: 'rejected', processedAt: new Date().toISOString() });
        batch.update(userRef, {
          winningBalance: increment(refundAmount),
          coins: increment(refundAmount)
        });
        
        const ledgerRef = doc(collection(firestore, 'users', payout.userId, 'ledger'));
        batch.set(ledgerRef, {
          type: 'income',
          amount: refundAmount,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Payout Rejected: Automatic Refund [${refundAmount} 🪙]`
        });

        await batch.commit();
        toast({ title: "PROTOCOL: REFUNDED" });
      } else {
        batch.update(payoutRef, { status: 'approved', processedAt: new Date().toISOString() });
        await batch.commit();
        toast({ title: "PROTOCOL: SETTLED" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Atomic Sync Error" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeployMission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !isAdminUser) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const missionData = {
      appName: formData.get('appName'),
      link: formData.get('link'),
      reward: parseInt(formData.get('reward') as string),
      category: 'Mobile Interaction',
      timestamp: new Date().toISOString()
    };

    setIsProcessing('mission-deploy');
    try {
      await addDoc(collection(firestore, 'cpa_missions'), missionData);
      toast({ title: "MISSION LIVE", description: `${missionData.appName} deployed.` });
      form.reset();
    } catch (e) {
      toast({ variant: "destructive", title: "Deployment Interrupted" });
    } finally {
      setIsProcessing(null);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="flex items-center justify-center min-h-screen bg-black text-red-500 font-black p-10 uppercase italic">Access Denied: Master Authorization Required</div>;

  return (
    <div className="flex min-h-screen bg-[#050508] text-white">
      <aside className="w-72 bg-[#0a0a0f] border-r border-white/5 flex flex-col fixed inset-y-0 z-50">
        <div className="p-8 flex items-center gap-4 border-b border-white/5 bg-primary/5">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <span className="font-black text-xl italic uppercase tracking-tighter">ARENA <span className="text-primary">ADMIN</span></span>
        </div>
        <nav className="flex-1 p-6 space-y-2">
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Ledger" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'missions'} icon={<Smartphone />} label="CPA Missions" onClick={() => setActiveTab('missions')} />
          <AdminLink active={activeTab === 'ads'} icon={<Monitor />} label="Media & Ads" onClick={() => setActiveTab('ads')} />
          <AdminLink active={activeTab === 'jhilli'} icon={<Disc />} label="Jhilli Control" onClick={() => setActiveTab('jhilli')} />
          <AdminLink active={activeTab === 'settings'} icon={<Settings />} label="Global System" onClick={() => setActiveTab('settings')} />
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10 space-y-12 pb-32">
        <header className="flex items-center justify-between">
           <div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter">Command <span className="text-primary">Center</span></h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em] mt-1">Industrial Operational Control Active</p>
           </div>
           <Badge className="bg-primary/20 text-primary border-none font-black px-6 py-2 uppercase italic text-[10px]">Master Terminal Online</Badge>
        </header>

        {activeTab === 'withdrawals' && (
          <div className="space-y-8 animate-in fade-in duration-500">
             <div className="flex items-center gap-4">
                <Wallet className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-black uppercase italic">Withdrawal Queue</h2>
             </div>
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="px-10 py-6 text-[10px] uppercase font-black tracking-widest">Warrior Profile</TableHead>
                        <TableHead className="text-[10px] uppercase font-black tracking-widest text-center">Volume (Local)</TableHead>
                        <TableHead className="text-[10px] uppercase font-black tracking-widest text-right px-10">Decision Terminal</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {payoutsData?.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="py-32 text-center text-muted-foreground text-[10px] uppercase font-black italic opacity-30">No operational signals in queue.</TableCell></TableRow>
                      ) : payoutsData?.map((p: any) => (
                        <TableRow key={p.id} className="border-white/5 hover:bg-white/5 transition-all">
                           <TableCell className="py-8 px-10">
                              <p className="text-sm font-black text-white">{p.userEmail || p.userId}</p>
                              <div className="flex items-center gap-3 mt-2">
                                 <Badge variant="outline" className="text-[9px] font-black uppercase border-white/10 text-primary bg-primary/5">{p.method}</Badge>
                                 <p className="text-[10px] text-muted-foreground font-bold font-mono">{p.destination}</p>
                              </div>
                           </TableCell>
                           <TableCell className="text-center">
                              <p className="text-3xl font-black text-green-500 italic tabular-nums">₹{p.amount}</p>
                           </TableCell>
                           <TableCell className="text-right px-10">
                              {p.status === 'pending' ? (
                                <div className="flex justify-end gap-4">
                                   <Button onClick={() => handlePayoutAction(p, 'approved')} disabled={!!isProcessing} className="bg-green-600 hover:bg-green-500 h-12 px-8 font-black uppercase italic text-xs rounded-xl shadow-lg">Approve</Button>
                                   <Button variant="destructive" onClick={() => handlePayoutAction(p, 'rejected')} disabled={!!isProcessing} className="h-12 px-8 font-black uppercase italic text-xs rounded-xl shadow-lg">Reject</Button>
                                </div>
                              ) : (
                                <Badge className={cn("text-[10px] font-black uppercase italic px-6 py-2 rounded-lg", p.status === 'approved' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{p.status}</Badge>
                              )}
                           </TableCell>
                        </TableRow>
                      ))}
                   </TableBody>
                </Table>
             </Card>
          </div>
        )}

        {activeTab === 'jhilli' && (
           <div className="max-w-4xl space-y-12 animate-in fade-in duration-500">
              <div className="flex items-center gap-4">
                 <Disc className="text-primary h-6 w-6" />
                 <h2 className="text-2xl font-black uppercase italic">Jhilli (Lucky Spin) Control</h2>
              </div>

              <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-t-4 border-t-primary">
                 <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Reward Segments (Comma Separated)</Label>
                          <Input value={jhilliLocal.rewards} onChange={e => setJhilliLocal({...jhilliLocal, rewards: e.target.value})} className="bg-black border-white/10 h-14 rounded-xl font-mono text-xs text-primary" placeholder="5, 10, 0, 50..." />
                          <p className="text-[9px] text-muted-foreground italic uppercase">Total 8 segments recommended for visual sync.</p>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Daily Free Spins</Label>
                          <Input type="number" value={jhilliLocal.dailyFreeLimit} onChange={e => setJhilliLocal({...jhilliLocal, dailyFreeLimit: Number(e.target.value)})} className="bg-black border-white/10 h-14 rounded-xl font-black text-primary" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">Cost per Extra Spin (Coins)</Label>
                          <Input type="number" value={jhilliLocal.spinCost} onChange={e => setJhilliLocal({...jhilliLocal, spinCost: Number(e.target.value)})} className="bg-black border-white/10 h-14 rounded-xl font-black text-primary" />
                       </div>
                    </div>
                 </div>
                 
                 <Button onClick={handleSaveJhilli} disabled={isProcessing === 'save-jhilli'} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-lg rounded-2xl shadow-xl transition-all">
                    {isProcessing === 'save-jhilli' ? <Loader2 className="animate-spin" /> : "SAVE JHILLI ENGINE SETTINGS"}
                 </Button>
              </Card>
           </div>
        )}

        {activeTab === 'ads' && (
           <div className="max-w-4xl space-y-12 animate-in fade-in duration-500">
              <div className="flex items-center gap-4">
                 <Monitor className="text-blue-500 h-6 w-6" />
                 <h2 className="text-2xl font-black uppercase italic">Media & Ads Config</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                 <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-t-4 border-t-blue-500">
                    <div className="space-y-1">
                       <h3 className="text-lg font-black uppercase italic">AdMob Industrial</h3>
                    </div>
                    <div className="space-y-6">
                       <ConfigField label="AdMob App ID" value={adConfig.adMobAppId} onChange={v => setAdConfig({...adConfig, adMobAppId: v})} />
                       <ConfigField label="Banner Unit ID" value={adConfig.adMobBannerId} onChange={v => setAdConfig({...adConfig, adMobBannerId: v})} />
                       <ConfigField label="Interstitial Unit ID" value={adConfig.adMobInterstitialId} onChange={v => setAdConfig({...adConfig, adMobInterstitialId: v})} />
                    </div>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-t-4 border-t-amber-500">
                    <div className="space-y-1">
                       <h3 className="text-lg font-black uppercase italic">Video Wall (AppLovin)</h3>
                    </div>
                    <div className="space-y-6">
                       <ConfigField label="AppLovin SDK Key" value={adConfig.appLovinSdkKey} onChange={v => setAdConfig({...adConfig, appLovinSdkKey: v})} />
                       <ConfigField label="Reward Zone ID" value={adConfig.appLovinZoneId} onChange={v => setAdConfig({...adConfig, appLovinZoneId: v})} />
                    </div>
                 </Card>
              </div>
              
              <Button onClick={handleSaveAds} disabled={isProcessing === 'save-ads'} className="w-full h-20 bg-blue-600 hover:bg-blue-500 font-black uppercase italic text-xl rounded-2xl shadow-2xl transition-all">
                 {isProcessing === 'save-ads' ? <Loader2 className="animate-spin" /> : "SAVE MEDIA CONFIGURATION"}
              </Button>
           </div>
        )}

        {activeTab === 'missions' && (
          <div className="grid lg:grid-cols-5 gap-12 animate-in fade-in duration-500">
            <div className="lg:col-span-2 space-y-8">
               <h2 className="text-2xl font-black uppercase italic flex items-center gap-4"><Plus className="text-primary" /> New Mission Deploy</h2>
               <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] shadow-2xl border-2 border-primary/10">
                  <form onSubmit={handleDeployMission} className="space-y-8">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground">App Name / Brand</Label>
                       <Input name="appName" placeholder="e.g. WinZO Pro" required className="bg-black border-white/10 h-14 rounded-xl" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground">Tracking URL</Label>
                       <Input name="link" placeholder="https://..." required className="bg-black border-white/10 h-14 rounded-xl font-mono text-xs" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground">Reward Volume (Coins)</Label>
                       <Input name="reward" type="number" defaultValue="50" required className="bg-black border-white/10 h-14 rounded-xl font-black text-primary" />
                    </div>
                    <Button type="submit" disabled={isProcessing === 'mission-deploy'} className="w-full bg-primary h-16 font-black uppercase italic text-lg rounded-2xl shadow-xl">
                       {isProcessing === 'mission-deploy' ? <Loader2 className="animate-spin" /> : "LAUNCH MISSION"}
                    </Button>
                  </form>
               </Card>
            </div>
            <div className="lg:col-span-3 space-y-8">
               <h2 className="text-2xl font-black uppercase italic">Active Missions ({missionsData?.length})</h2>
               <div className="grid gap-4">
                  {missionsData?.map((m: any) => (
                    <Card key={m.id} className="bg-[#0a0a0f] border-white/5 p-8 flex items-center justify-between rounded-2xl group border-l-4 border-l-primary/40">
                       <div>
                          <p className="font-black uppercase text-lg italic">{m.appName}</p>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{m.reward} COINS</p>
                       </div>
                       <Button variant="ghost" onClick={() => deleteDoc(doc(firestore!, 'cpa_missions', m.id))} className="text-red-500 hover:bg-red-500/10 h-12 w-12 rounded-xl">
                          <Trash2 className="h-6 w-6" />
                       </Button>
                    </Card>
                  ))}
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function AdminLink({ active, icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className={cn(
      "w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all text-[12px] font-black uppercase tracking-widest",
      active ? "bg-primary text-white shadow-2xl italic border border-white/10" : "text-muted-foreground hover:bg-white/5 hover:text-white"
    )}>
      {icon} <span>{label}</span>
    </button>
  );
}

function ConfigField({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
       <Input value={value} onChange={e => onChange(e.target.value)} className="bg-black border-white/10 h-12 font-mono text-xs text-primary" placeholder="Enter ID..." />
    </div>
  );
}
