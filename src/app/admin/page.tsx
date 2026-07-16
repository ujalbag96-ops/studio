
'use client';

import { useUser, useCollection, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, setDoc, addDoc, increment, query, orderBy, deleteDoc, writeBatch, getDocs, where, limit } from 'firebase/firestore';
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
  Mail,
  Copy,
  Ticket,
  Send
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
  const [voucherInputs, setVoucherInputs] = useState<Record<string, string>>({});

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Subscriptions
  const payoutsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc')) : null, [firestore, isAdminUser]);
  const missionsQuery = useMemoFirebase(() => (firestore && isAdminUser) ? collection(firestore, 'cpa_missions') : null, [firestore, isAdminUser]);
  const globalConfigRef = useMemoFirebase(() => (firestore && isAdminUser) ? doc(firestore, 'app_settings', 'global_config') : null, [firestore, isAdminUser]);
  
  const { data: payoutsData } = useCollection<any>(payoutsQuery);
  const { data: missionsData } = useCollection<any>(missionsQuery);
  const { data: globalConfig } = useDoc<any>(globalConfigRef);

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
    
    const voucherCode = voucherInputs[payout.id] || '';
    if (action === 'approved' && payout.type === 'shop' && !voucherCode) {
      toast({ variant: "destructive", title: "Code Required", description: "Please enter the digital code to dispatch." });
      return;
    }

    setIsProcessing(payout.id);
    
    try {
      const payoutRef = doc(firestore, 'payouts', payout.id);
      const userRef = doc(firestore, 'users', payout.userId);
      const batch = writeBatch(firestore);
      
      if (action === 'rejected') {
        const refundAmount = payout.amount; 
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
          description: `Payout/Shop Rejected: Refunded [${refundAmount} 🪙]`
        });

        await batch.commit();
        toast({ title: "PROTOCOL: REFUNDED" });
      } else {
        // APPROVED / DISPATCHED
        batch.update(payoutRef, { 
          status: 'approved', 
          processedAt: new Date().toISOString(),
          voucherCode: voucherCode 
        });

        // Find and update the corresponding ledger entry if it was from the shop
        const ledgerQ = query(collection(firestore, 'users', payout.userId, 'ledger'), where('payoutId', '==', payout.id), limit(1));
        const ledgerSnap = await getDocs(ledgerQ);
        if (!ledgerSnap.empty) {
          batch.update(ledgerSnap.docs[0].ref, { 
            status: 'completed',
            voucherCode: voucherCode 
          });
        }

        // Notify User
        batch.set(doc(collection(firestore, 'notifications')), {
          userId: payout.userId,
          title: payout.type === 'shop' ? 'Voucher Dispatched!' : 'Payout Successful',
          body: payout.type === 'shop' 
            ? `Your ${payout.itemName} code has been delivered: ${voucherCode}`
            : `Your withdrawal of ${payout.amount} has been processed.`,
          timestamp: new Date().toISOString(),
          type: 'payout',
          voucherCode: voucherCode
        });

        await batch.commit();
        toast({ title: payout.type === 'shop' ? "VOUCHER DISPATCHED" : "PAYOUT SETTLED" });
      }
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Atomic Sync Error" });
    } finally {
      setIsProcessing(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
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
          <AdminLink active={activeTab === 'withdrawals'} icon={<Wallet />} label="Payout & Shop" onClick={() => setActiveTab('withdrawals')} />
          <AdminLink active={activeTab === 'broadcast'} icon={<Megaphone />} label="Broadcast News" onClick={() => setActiveTab('broadcast')} />
          <AdminLink active={activeTab === 'missions'} icon={<Smartphone />} label="CPA Missions" onClick={() => setActiveTab('missions')} />
          <AdminLink active={activeTab === 'ads'} icon={<Monitor />} label="Media & Ads" onClick={() => setActiveTab('ads')} />
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
             <div className="flex items-center gap-4">
                <Wallet className="text-primary h-6 w-6" />
                <h2 className="text-2xl font-black uppercase italic">Payout & Shop Queue</h2>
             </div>
             
             <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                <Table>
                   <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="px-10 py-6 text-[10px] uppercase font-black tracking-widest">Requester / Item</TableHead>
                        <TableHead className="text-[10px] uppercase font-black tracking-widest text-center">Identity / Game ID</TableHead>
                        <TableHead className="text-[10px] uppercase font-black tracking-widest text-right px-10">Verification & Action</TableHead>
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
                                 <Badge className={cn("text-[8px] font-black uppercase px-2 py-0.5", p.type === 'shop' ? "bg-purple-500/20 text-purple-500" : "bg-blue-500/20 text-blue-500")}>
                                    {p.type === 'shop' ? 'Shop Item' : 'Cash Withdrawal'}
                                 </Badge>
                              </div>
                              <p className="text-lg font-black text-primary italic mt-1">{p.type === 'shop' ? p.itemName : `₹${p.amount}`}</p>
                           </TableCell>
                           <TableCell className="text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <p className="text-[9px] font-black text-muted-foreground uppercase">{p.type === 'shop' ? 'Target Character ID' : `Gateway: ${p.method}`}</p>
                                 <div className="flex items-center gap-2 bg-black border border-white/10 px-4 py-2 rounded-xl">
                                    <span className="font-mono text-xs font-black text-green-500">{p.destination}</span>
                                    <button onClick={() => copyToClipboard(p.destination)} className="text-muted-foreground hover:text-white"><Copy className="h-3 w-3" /></button>
                                 </div>
                              </div>
                           </TableCell>
                           <TableCell className="text-right px-10">
                              {p.status === 'pending' ? (
                                <div className="space-y-4">
                                   {p.type === 'shop' && (
                                     <div className="relative">
                                       <Input 
                                          placeholder="Enter Voucher / Txn Code" 
                                          value={voucherInputs[p.id] || ''}
                                          onChange={(e) => setVoucherInputs({...voucherInputs, [p.id]: e.target.value})}
                                          className="bg-black border-white/10 h-10 font-mono text-[10px] text-primary pr-10"
                                       />
                                       <Ticket className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                     </div>
                                   )}
                                   <div className="flex justify-end gap-3">
                                      <Button onClick={() => handlePayoutAction(p, 'approved')} disabled={!!isProcessing} className="bg-green-600 hover:bg-green-500 h-10 px-6 font-black uppercase italic text-[10px] rounded-lg">
                                         {p.type === 'shop' ? 'Dispatch' : 'Approve'}
                                      </Button>
                                      <Button variant="destructive" onClick={() => handlePayoutAction(p, 'rejected')} disabled={!!isProcessing} className="h-10 px-6 font-black uppercase italic text-[10px] rounded-lg">Reject</Button>
                                   </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-end gap-1">
                                   <Badge className={cn("text-[8px] font-black uppercase italic px-4 py-1", p.status === 'approved' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{p.status}</Badge>
                                   {p.voucherCode && <p className="text-[9px] font-mono text-muted-foreground">Code: {p.voucherCode}</p>}
                                </div>
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

              <Card className="bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-t-4 border-t-blue-600">
                 <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-black uppercase italic">Ad Intelligence (AdMob/AppLovin)</h3>
                 </div>
                 <div className="grid md:grid-cols-2 gap-6">
                    <ConfigField label="AdMob App ID" value={systemConfig.adMobAppId} onChange={v => setSystemConfig({...systemConfig, adMobAppId: v})} />
                    <ConfigField label="AdMob Banner ID" value={systemConfig.adMobBannerId} onChange={v => setSystemConfig({...systemConfig, adMobBannerId: v})} />
                    <ConfigField label="AppLovin SDK Key" value={systemConfig.appLovinSdkKey} onChange={v => setSystemConfig({...systemConfig, appLovinSdkKey: v})} />
                    <ConfigField label="AppLovin Zone ID" value={systemConfig.appLovinZoneId} onChange={v => setSystemConfig({...systemConfig, appLovinZoneId: v})} />
                 </div>
              </Card>
              
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
