
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
  Disc,
  ShieldAlert,
  Power,
  Gamepad2,
  Server,
  Lock,
  ExternalLink,
  CreditCard,
  Image as ImageIcon,
  Video,
  Fingerprint,
  CheckCircle2
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'missions' | 'ads' | 'jili' | 'settings'>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Subscriptions
  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const missionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_missions') : null, [firestore, isAdminUser]);
  const globalConfigRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'app_settings', 'global_config') : null, [firestore, isAdminUser]);
  const jiliRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'app_settings', 'jili_integration') : null, [firestore, isAdminUser]);
  
  const { data: payoutsData } = useCollection<any>(payoutsQuery);
  const { data: missionsData } = useCollection<any>(missionsQuery);
  const { data: globalConfig } = useDoc<any>(globalConfigRef);
  const { data: jiliConfig } = useDoc<any>(jiliRef);

  // Local state for Global System Config
  const [systemConfig, setSystemConfig] = useState({
    adMobAppId: '',
    adMobBannerId: '',
    adMobInterstitialId: '',
    appLovinSdkKey: '',
    appLovinZoneId: '',
    maintenanceMode: false,
    offerWallEnabled: true,
    adminUpiId: '',
    depositTelegramUrl: '',
    automaticGatewayEnabled: true,
    earningBannerUrl: '',
    earningBannerLink: '',
    earningBannerReward: 5
  });

  // Local state for JILI Integration
  const [jiliLocal, setJiliLocal] = useState({
    apiEndpoint: '',
    agentId: '',
    secureKey: '',
    slotsEnabled: true,
    crashEnabled: true,
    rummyEnabled: true,
    rouletteEnabled: true
  });

  useEffect(() => {
    if (globalConfig) {
      setSystemConfig({
        adMobAppId: globalConfig.adMobAppId || '',
        adMobBannerId: globalConfig.adMobBannerId || '',
        adMobInterstitialId: globalConfig.adMobInterstitialId || '',
        appLovinSdkKey: globalConfig.appLovinSdkKey || '',
        appLovinZoneId: globalConfig.appLovinZoneId || '',
        maintenanceMode: !!globalConfig.maintenanceMode,
        offerWallEnabled: globalConfig.offerWallEnabled !== false,
        adminUpiId: globalConfig.adminUpiId || '',
        depositTelegramUrl: globalConfig.depositTelegramUrl || '',
        automaticGatewayEnabled: globalConfig.automaticGatewayEnabled !== false,
        earningBannerUrl: globalConfig.earningBannerUrl || '',
        earningBannerLink: globalConfig.earningBannerLink || '',
        earningBannerReward: globalConfig.earningBannerReward || 5
      });
    }
  }, [globalConfig]);

  useEffect(() => {
    if (jiliConfig) {
      setJiliLocal({
        apiEndpoint: jiliConfig.apiEndpoint || '',
        agentId: jiliConfig.agentId || '',
        secureKey: jiliConfig.secureKey || '',
        slotsEnabled: jiliConfig.enabledModules?.slots !== false,
        crashEnabled: jiliConfig.enabledModules?.crash !== false,
        rummyEnabled: jiliConfig.enabledModules?.rummy !== false,
        rouletteEnabled: jiliConfig.enabledModules?.roulette !== false
      });
    }
  }, [jiliConfig]);

  const handleSaveSystem = async () => {
    if (!firestore || !isAdminUser) return;
    setIsProcessing('save-system');
    try {
      await setDoc(doc(firestore, 'app_settings', 'global_config'), systemConfig, { merge: true });
      toast({ title: "SYSTEM UPDATED", description: "Global configurations locked successfully." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleSaveJili = async () => {
    if (!firestore || !isAdminUser) return;
    setIsProcessing('save-jili');
    try {
      await setDoc(doc(firestore, 'app_settings', 'jili_integration'), {
        apiEndpoint: jiliLocal.apiEndpoint,
        agentId: jiliLocal.agentId,
        secureKey: jiliLocal.secureKey,
        enabledModules: {
          slots: jiliLocal.slotsEnabled,
          crash: jiliLocal.crashEnabled,
          rummy: jiliLocal.rummyEnabled,
          roulette: jiliLocal.rouletteEnabled
        },
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast({ title: "JILI HUB SYNCHRONIZED", description: "API Integration parameters verified and saved." });
    } catch (e) {
      toast({ variant: "destructive", title: "Integration Failed" });
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
          <AdminLink active={activeTab === 'jili'} icon={<Gamepad2 />} label="JILI Games Hub" onClick={() => setActiveTab('jili')} />
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
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Wallet className="text-primary h-6 w-6" />
                  <h2 className="text-2xl font-black uppercase italic">Withdrawal Queue</h2>
                </div>
                <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">UTR Match Engine Live</span>
                </div>
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
                              <div className="flex items-center gap-3">
                                 <p className="text-sm font-black text-white">{p.userEmail || p.userId}</p>
                                 {p.isAutoVerified && (
                                   <Badge className="bg-green-500/20 text-green-500 border-none text-[8px] font-black uppercase px-2 py-0.5 flex items-center gap-1">
                                      <CheckCircle2 className="h-2 w-2" /> Auto-Verified
                                   </Badge>
                                 )}
                              </div>
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

        {activeTab === 'jili' && (
           <div className="max-w-4xl space-y-12 animate-in fade-in duration-500">
              <div className="flex items-center gap-4">
                 <Gamepad2 className="text-primary h-6 w-6" />
                 <h2 className="text-2xl font-black uppercase italic">JILI Games Hub Integration</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                 <Card className="md:col-span-2 bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-t-4 border-t-primary">
                    <div className="space-y-6">
                       <ConfigField label="API Endpoint URL" value={jiliLocal.apiEndpoint} onChange={v => setJiliLocal({...jiliLocal, apiEndpoint: v})} placeholder="https://api.jiligames.com/..." />
                       <div className="grid grid-cols-2 gap-6">
                          <ConfigField label="Merchant ID / Agent" value={jiliLocal.agentId} onChange={v => setJiliLocal({...jiliLocal, agentId: v})} placeholder="Agent ID" />
                          <ConfigField label="Secret Key / MD5" value={jiliLocal.secureKey} onChange={v => setJiliLocal({...jiliLocal, secureKey: v})} placeholder="MD5 Salt" />
                       </div>
                    </div>
                    
                    <Button onClick={handleSaveJili} disabled={isProcessing === 'save-jili'} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-lg rounded-2xl shadow-xl transition-all">
                       {isProcessing === 'save-jili' ? <Loader2 className="animate-spin" /> : "SAVE JILI API PARAMETERS"}
                    </Button>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-t-4 border-t-blue-500">
                    <h3 className="text-sm font-black uppercase italic flex items-center gap-2"><Server className="h-4 w-4" /> Game Modules</h3>
                    <div className="space-y-6">
                       <GameToggle label="Slots Infrastructure" checked={jiliLocal.slotsEnabled} onChange={v => setJiliLocal({...jiliLocal, slotsEnabled: v})} />
                       <GameToggle label="Crash Games (Aviator)" checked={jiliLocal.crashEnabled} onChange={v => setJiliLocal({...jiliLocal, crashEnabled: v})} />
                       <GameToggle label="Rummy / Card Games" checked={jiliLocal.rummyEnabled} onChange={v => setJiliLocal({...jiliLocal, rummyEnabled: v})} />
                       <GameToggle label="Live Roulette Feed" checked={jiliLocal.rouletteEnabled} onChange={v => setJiliLocal({...jiliLocal, rouletteEnabled: v})} />
                    </div>
                 </Card>
              </div>

              <Card className="bg-primary/5 border border-primary/20 p-8 rounded-2xl">
                 <div className="flex items-start gap-4">
                    <ShieldAlert className="h-6 w-6 text-primary shrink-0" />
                    <div className="space-y-2">
                       <p className="text-xs font-black uppercase text-white">Callback Integration Required</p>
                       <p className="text-[10px] text-muted-foreground uppercase leading-relaxed font-bold">
                          Ensure your server whitelist IP matches the JILI panel. Callback URL for JILI Dashboard: 
                          <span className="text-primary ml-2 font-mono">https://your-app.com/api/jili/callback</span>
                       </p>
                    </div>
                 </div>
              </Card>
           </div>
        )}

        {activeTab === 'ads' && (
           <div className="max-w-5xl space-y-12 animate-in fade-in duration-500">
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
                       <ConfigField label="AdMob App ID" value={systemConfig.adMobAppId} onChange={v => setSystemConfig({...systemConfig, adMobAppId: v})} />
                       <ConfigField label="Banner Unit ID" value={systemConfig.adMobBannerId} onChange={v => setSystemConfig({...systemConfig, adMobBannerId: v})} />
                       <ConfigField label="Interstitial Unit ID" value={systemConfig.adMobInterstitialId} onChange={v => setSystemConfig({...systemConfig, adMobInterstitialId: v})} />
                    </div>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-t-4 border-t-amber-500">
                    <div className="space-y-1">
                       <h3 className="text-lg font-black uppercase italic">Video Wall (AppLovin)</h3>
                    </div>
                    <div className="space-y-6">
                       <ConfigField label="AppLovin SDK Key" value={systemConfig.appLovinSdkKey} onChange={v => setSystemConfig({...systemConfig, appLovinSdkKey: v})} />
                       <ConfigField label="Reward Zone ID" value={systemConfig.appLovinZoneId} onChange={v => setSystemConfig({...systemConfig, appLovinZoneId: v})} />
                    </div>
                 </Card>
              </div>

              {/* EARNING BANNER SECTION */}
              <div className="space-y-8">
                 <div className="flex items-center gap-4">
                    <ImageIcon className="text-primary h-6 w-6" />
                    <h2 className="text-2xl font-black uppercase italic">Sponsored Earning Banners</h2>
                 </div>
                 <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-t-4 border-t-green-600">
                    <div className="grid md:grid-cols-3 gap-8">
                       <ConfigField label="Banner Image URL" value={systemConfig.earningBannerUrl} onChange={v => setSystemConfig({...systemConfig, earningBannerUrl: v})} placeholder="https://..." />
                       <ConfigField label="Click Target URL" value={systemConfig.earningBannerLink} onChange={v => setSystemConfig({...systemConfig, earningBannerLink: v})} placeholder="https://..." />
                       <ConfigField label="User Reward (Coins)" value={systemConfig.earningBannerReward.toString()} onChange={v => setSystemConfig({...systemConfig, earningBannerReward: parseInt(v) || 0})} placeholder="5" />
                    </div>
                    {systemConfig.earningBannerUrl && (
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-[8px] font-black uppercase text-muted-foreground mb-2">Live Preview</p>
                        <img src={systemConfig.earningBannerUrl} className="h-20 w-full object-cover rounded-lg opacity-80" alt="Preview" />
                      </div>
                    )}
                 </Card>
              </div>
              
              <Button onClick={handleSaveSystem} disabled={isProcessing === 'save-system'} className="w-full h-20 bg-blue-600 hover:bg-blue-500 font-black uppercase italic text-xl rounded-2xl shadow-2xl transition-all">
                 {isProcessing === 'save-system' ? <Loader2 className="animate-spin" /> : "SAVE MEDIA CONFIGURATION"}
              </Button>
           </div>
        )}

        {activeTab === 'settings' && (
           <div className="max-w-4xl space-y-12 animate-in fade-in duration-500">
              <div className="flex items-center gap-4">
                 <Settings className="text-primary h-6 w-6" />
                 <h2 className="text-2xl font-black uppercase italic">Global System Control</h2>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                 <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] flex items-center justify-between border-t-4 border-t-red-600">
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <Power className="h-5 w-5 text-red-500" />
                          <h3 className="text-lg font-black uppercase italic">Maintenance Mode</h3>
                       </div>
                       <p className="text-[9px] text-muted-foreground uppercase font-bold">Lock entire app for maintenance</p>
                    </div>
                    <Switch 
                      checked={systemConfig.maintenanceMode} 
                      onCheckedChange={(v) => setSystemConfig({...systemConfig, maintenanceMode: v})}
                    />
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] flex items-center justify-between border-t-4 border-t-primary">
                    <div className="space-y-1">
                       <div className="flex items-center gap-3">
                          <Smartphone className="h-5 w-5 text-primary" />
                          <h3 className="text-lg font-black uppercase italic">OfferWall Master</h3>
                       </div>
                       <p className="text-[9px] text-muted-foreground uppercase font-bold">Global CPA Mission switch</p>
                    </div>
                    <Switch 
                      checked={systemConfig.offerWallEnabled} 
                      onCheckedChange={(v) => setSystemConfig({...systemConfig, offerWallEnabled: v})}
                    />
                 </Card>
              </div>

              <div className="space-y-8">
                 <h2 className="text-2xl font-black uppercase italic flex items-center gap-4"><CreditCard className="text-primary" /> Wallet & Deposit Config</h2>
                 <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-t-4 border-t-green-600">
                    <div className="grid md:grid-cols-2 gap-8">
                       <ConfigField label="Master Admin UPI ID" value={systemConfig.adminUpiId} onChange={v => setSystemConfig({...systemConfig, adminUpiId: v})} placeholder="e.g. ujalbag@upi" />
                       <ConfigField label="Deposit Verification Telegram" value={systemConfig.depositTelegramUrl} onChange={v => setSystemConfig({...systemConfig, depositTelegramUrl: v})} placeholder="https://t.me/your_support" />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                       <div className="space-y-1">
                          <p className="text-sm font-black uppercase italic">Automatic Digital Gateway</p>
                          <p className="text-[9px] text-muted-foreground uppercase">Enable instant payment gateway simulation</p>
                       </div>
                       <Switch 
                        checked={systemConfig.automaticGatewayEnabled} 
                        onCheckedChange={(v) => setSystemConfig({...systemConfig, automaticGatewayEnabled: v})}
                       />
                    </div>
                 </Card>
              </div>
              
              <Button onClick={handleSaveSystem} disabled={isProcessing === 'save-system'} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-2xl transition-all">
                 {isProcessing === 'save-system' ? <Loader2 className="animate-spin" /> : "DEPLOY SYSTEM STATE"}
              </Button>
           </div>
        )}

        {activeTab === 'missions' && (
          <div className="grid lg:grid-cols-5 gap-12 animate-in fade-in duration-500">
            <div className="lg:col-span-2 space-y-8">
               <h2 className="text-2xl font-black uppercase italic flex items-center gap-4"><Plus className="text-primary" /> New Mission Deploy</h2>
               <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] shadow-2xl border-2 border-primary/10">
                  <form onSubmit={async (e) => {
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
                  }} className="space-y-8">
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

function ConfigField({ label, value, onChange, placeholder = "Enter ID..." }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="space-y-2">
       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
       <Input value={value} onChange={e => onChange(e.target.value)} className="bg-black border-white/10 h-12 font-mono text-xs text-primary" placeholder={placeholder} />
    </div>
  );
}

function GameToggle({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
       <span className="text-[10px] font-black uppercase text-white/80">{label}</span>
       <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
