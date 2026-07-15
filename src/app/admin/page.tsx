
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
  CheckCircle2,
  Activity,
  Search,
  Megaphone,
  Mail
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'withdrawals' | 'missions' | 'ads' | 'jili' | 'settings' | 'cricket' | 'polls' | 'broadcast'>('withdrawals');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Subscriptions
  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const missionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_missions') : null, [firestore, isAdminUser]);
  const globalConfigRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'app_settings', 'global_config') : null, [firestore, isAdminUser]);
  const paymentSignalsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payment_signals'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  
  const { data: payoutsData } = useCollection<any>(payoutsQuery);
  const { data: missionsData } = useCollection<any>(missionsQuery);
  const { data: globalConfig } = useDoc<any>(globalConfigRef);
  const { data: paymentSignals } = useCollection<any>(paymentSignalsQuery);

  // Broadcast state
  const [notif, setNotif] = useState({ title: '', body: '', imageUrl: '' });

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !isAdminUser) return;
    setIsProcessing('broadcast');
    try {
      await addDoc(collection(firestore, 'notifications'), {
        ...notif,
        timestamp: new Date().toISOString(),
        type: 'broadcast'
      });
      toast({ title: "BROADCAST DISPATCHED", description: "Signal sent to all user inboxes." });
      setNotif({ title: '', body: '', imageUrl: '' });
    } catch (e) {
      toast({ variant: "destructive", title: "Broadcast Failed" });
    } finally {
      setIsProcessing(null);
    }
  };

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
    earningBannerReward: 5,
    cricketApiKey: ''
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
        earningBannerReward: globalConfig.earningBannerReward || 5,
        cricketApiKey: globalConfig.cricketApiKey || ''
      });
    }
  }, [globalConfig]);

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
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto no-scrollbar">
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout Ledger" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'broadcast'} icon={<Megaphone />} label="Broadcast News" onClick={() => setActiveTab('broadcast')} />
          <AdminLink active={activeTab === 'missions'} icon={<Smartphone />} label="CPA Missions" onClick={() => setActiveTab('missions')} />
          <AdminLink active={activeTab === 'ads'} icon={<Monitor />} label="Media & Ads" onClick={() => setActiveTab('ads')} />
          <AdminLink active={activeTab === 'jili'} icon={<Gamepad2 />} label="JILI Games Hub" onClick={() => setActiveTab('jili')} />
          <AdminLink active={activeTab === 'cricket'} icon={<Flag />} label="Cricket Arena" onClick={() => setActiveTab('cricket')} />
          <AdminLink active={activeTab === 'polls'} icon={<Target />} label="Poll Manager" onClick={() => setActiveTab('polls')} />
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
          <div className="space-y-12 animate-in fade-in duration-500">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Wallet className="text-primary h-6 w-6" />
                  <h2 className="text-2xl font-black uppercase italic">Withdrawal Queue</h2>
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

        {activeTab === 'broadcast' && (
           <div className="max-w-3xl space-y-12 animate-in fade-in duration-500">
              <div className="flex items-center gap-4">
                 <Megaphone className="text-primary h-6 w-6" />
                 <h2 className="text-2xl font-black uppercase italic">Broadcast System News</h2>
              </div>
              <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] shadow-2xl border-t-4 border-t-primary">
                 <form onSubmit={handleSendBroadcast} className="space-y-8">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Headline Title</Label>
                       <Input required value={notif.title} onChange={e => setNotif({...notif, title: e.target.value})} placeholder="e.g. MEGA CRICKET LEAGUE LIVE!" className="h-14 bg-black border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Image URL (Optional)</Label>
                       <Input value={notif.imageUrl} onChange={e => setNotif({...notif, imageUrl: e.target.value})} placeholder="https://..." className="h-14 bg-black border-white/10 rounded-xl font-mono text-xs" />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Message Content</Label>
                       <Textarea required value={notif.body} onChange={e => setNotif({...notif, body: e.target.value})} placeholder="Describe the tactical update..." className="min-h-32 bg-black border-white/10 rounded-xl" />
                    </div>
                    <Button type="submit" disabled={isProcessing === 'broadcast'} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-xl">
                       {isProcessing === 'broadcast' ? <Loader2 className="animate-spin" /> : "DISPATCH GLOBAL SIGNAL"}
                    </Button>
                 </form>
              </Card>
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
              
              <Button onClick={handleSaveSystem} disabled={isProcessing === 'save-system'} className="w-full h-20 bg-primary font-black uppercase italic text-xl rounded-2xl shadow-2xl transition-all">
                 {isProcessing === 'save-system' ? <Loader2 className="animate-spin" /> : "DEPLOY SYSTEM STATE"}
              </Button>
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

function ConfigField({ label, value, onChange, placeholder = "Enter ID...", name }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, name?: string }) {
  return (
    <div className="space-y-2 flex-1">
       <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{label}</Label>
       <Input name={name} value={value} onChange={e => onChange(e.target.value)} className="bg-black border-white/10 h-12 font-mono text-xs text-primary" placeholder={placeholder} />
    </div>
  );
}
