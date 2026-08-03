'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, limit, orderBy, increment, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { 
  Loader2, Zap, LayoutGrid, ArrowRightLeft, 
  Search, CheckCircle2, 
  Star, Volume2, Music, Play, Bell, Eye, EyeOff, BarChart3, TrendingUp,
  Users as UsersIcon, ShieldAlert, UserCheck, Globe, ShieldX, Terminal, Filter,
  PieChart, Activity, Fingerprint, MapPin, Calendar, Mail, Lock, Key, CreditCard, 
  Settings, UserPlus, UserMinus, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, UserProfile, PayoutRequest } from '../lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '../lib/module-registry';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';
const APP_CATEGORIES: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'warriors' | 'economy' | 'withdrawals'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  // Controls State
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [walletAmount, setWalletAmount] = useState('');

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
  const warriorsQuery = useMemoFirebase(() => {
     if (!firestore) return null;
     return query(collection(firestore, 'users'), orderBy('joinedAt', 'desc'), limit(100));
  }, [firestore]);
  const { data: warriors, isLoading: warriorsLoading } = useCollection<UserProfile>(warriorsQuery);

  const payoutQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'payouts'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore]);
  const { data: payouts, isLoading: payoutsLoading } = useCollection<PayoutRequest>(payoutQuery);

  const updateSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      await updateDoc(settingsRef, { [key]: value });
      toast({ title: "SIGNAL SYNCED", description: `${key} updated successfully.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const adjustWallet = async (type: 'add' | 'subtract') => {
    if (!firestore || !targetUserId || !walletAmount) return;
    setIsProcessing('wallet-adjust');
    try {
      const amount = parseFloat(walletAmount);
      const userRef = doc(firestore, 'users', targetUserId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        toast({ variant: "destructive", title: "USER NOT FOUND" });
        return;
      }

      const finalAmount = type === 'add' ? amount : -amount;
      await updateDoc(userRef, {
        coins: increment(finalAmount * 100),
        winningBalance: increment(finalAmount * 100),
        walletBalanceINR: increment(finalAmount)
      });

      await addDoc(collection(firestore, 'users', targetUserId, 'ledger'), {
        type: 'admin_adjustment',
        amount: finalAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Admin Manual Adjustment: ${type.toUpperCase()}`
      });

      toast({ title: "WALLET ADJUSTED", description: `Successfully ${type}ed ₹${amount}` });
      setWalletAmount('');
    } catch (e) {
      toast({ variant: "destructive", title: "ADJUSTMENT FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleSuspension = async (userId: string, currentStatus: boolean) => {
     if (!firestore) return;
     setIsProcessing(`suspend-${userId}`);
     try {
        const userRef = doc(firestore, 'users', userId);
        await updateDoc(userRef, { isSuspended: !currentStatus });
        toast({ title: !currentStatus ? "WARRIOR SUSPENDED" : "SIGNAL RESTORED" });
     } catch (e) {
        toast({ variant: "destructive", title: "LOCKDOWN FAILED" });
     } finally {
        setIsProcessing(null);
     }
  };

  const handlePayoutAction = async (payoutId: string, status: 'completed' | 'rejected') => {
    if (!firestore) return;
    setIsProcessing(`payout-${payoutId}`);
    try {
      const payoutRef = doc(firestore, 'payouts', payoutId);
      await updateDoc(payoutRef, { status });
      toast({ title: `PAYOUT ${status.toUpperCase()}` });
    } catch (e) {
      toast({ variant: "destructive", title: "ACTION FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredWarriors = warriors?.filter(w => 
    w.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
    w.id.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    w.referralCode?.toLowerCase().includes(userSearchTerm.toLowerCase())
  ) || [];

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black">ACCESS DENIED</div>;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <header className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
            <p className="text-sm font-black uppercase italic">Admin <span className="text-primary">Hub</span></p>
         </div>
         <Badge variant="outline" className="border-green-500/20 text-green-500 text-[8px] font-black uppercase tracking-[0.3em]">Industrial Mastery Node v6.0</Badge>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-7xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'warriors'} label="Warriors" icon={<UsersIcon className="h-3 w-3" />} onClick={() => setActiveTab('warriors')} />
            <NavPill active={activeTab === 'economy'} label="Economy" icon={<TrendingUp className="h-3 w-3" />} onClick={() => setActiveTab('economy')} />
            <NavPill active={activeTab === 'withdrawals'} label="Withdrawals" icon={<CreditCard className="h-3 w-3" />} onClick={() => setActiveTab('withdrawals')} />
         </div>

         {activeTab === 'economy' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid md:grid-cols-2 gap-8">
                 <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8">
                    <h3 className="text-xl font-black uppercase italic text-primary flex items-center gap-3"><Settings className="h-5 w-5" /> Global Earning Config</h3>
                    <div className="space-y-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">User Revenue Share (%)</Label>
                          <div className="flex gap-3">
                             <Input 
                               type="number" 
                               defaultValue={settings?.userRevenueSharePercent || 10}
                               onBlur={(e) => updateSetting('userRevenueSharePercent', parseInt(e.target.value))}
                               className="h-12 bg-black border-white/10 rounded-xl font-black text-primary"
                             />
                             <Button size="icon" className="h-12 w-12 rounded-xl"><Check className="h-4 w-4" /></Button>
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Max Daily Videos Per User</Label>
                          <div className="flex gap-3">
                             <Input 
                               type="number" 
                               defaultValue={settings?.maxDailyVideosPerUser || 20}
                               onBlur={(e) => updateSetting('maxDailyVideosPerUser', parseInt(e.target.value))}
                               className="h-12 bg-black border-white/10 rounded-xl font-black text-white"
                             />
                             <Button size="icon" className="h-12 w-12 rounded-xl"><Check className="h-4 w-4" /></Button>
                          </div>
                       </div>
                    </div>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8">
                    <h3 className="text-xl font-black uppercase italic text-amber-500 flex items-center gap-3"><UserCheck className="h-5 w-5" /> Manual Wallet Overrides</h3>
                    <div className="space-y-4">
                       <Input 
                          placeholder="TARGET USER ID / EMAIL" 
                          value={targetUserId}
                          onChange={e => setTargetUserId(e.target.value)}
                          className="h-12 bg-black border-white/10 rounded-xl text-[10px] font-black uppercase"
                       />
                       <Input 
                          type="number" 
                          placeholder="AMOUNT (INR)" 
                          value={walletAmount}
                          onChange={e => setWalletAmount(e.target.value)}
                          className="h-12 bg-black border-white/10 rounded-xl text-lg font-black text-primary"
                       />
                       <div className="grid grid-cols-2 gap-4">
                          <Button onClick={() => adjustWallet('add')} className="h-14 bg-green-600 hover:bg-green-500 rounded-xl font-black uppercase italic text-[10px]"><UserPlus className="h-4 w-4 mr-2" /> Add Funds</Button>
                          <Button onClick={() => adjustWallet('subtract')} className="h-14 bg-red-600 hover:bg-red-500 rounded-xl font-black uppercase italic text-[10px]"><UserMinus className="h-4 w-4 mr-2" /> Deduct Funds</Button>
                       </div>
                    </div>
                 </Card>
              </div>
           </div>
         )}

         {activeTab === 'withdrawals' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">Settlement <span className="text-primary">Queue</span></h2>
              <div className="grid gap-4">
                 {payoutsLoading ? <Loader2 className="animate-spin h-10 w-10 mx-auto" /> : payouts?.map(p => (
                   <Card key={p.id} className="bg-[#0a0a0f] border-white/5 p-6 rounded-2xl flex items-center justify-between group hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-6">
                         <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center"><CreditCard className="text-primary h-6 w-6" /></div>
                         <div>
                            <p className="text-xs font-black uppercase text-white truncate max-w-[200px]">{p.userEmail || p.userId}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.method}: {p.destination}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <div className="text-right">
                            <p className="text-xl font-black text-green-500 italic">₹{p.amount}</p>
                            <Badge className={cn("text-[7px] font-black uppercase", p.status === 'completed' ? "bg-green-600" : "bg-yellow-600")}>{p.status}</Badge>
                         </div>
                         {p.status === 'pending' && (
                           <div className="flex gap-2">
                              <Button onClick={() => handlePayoutAction(p.id, 'completed')} size="icon" className="bg-green-600 h-10 w-10 rounded-lg"><Check className="h-4 w-4" /></Button>
                              <Button onClick={() => handlePayoutAction(p.id, 'rejected')} size="icon" className="bg-red-600 h-10 w-10 rounded-lg"><X className="h-4 w-4" /></Button>
                           </div>
                         )}
                      </div>
                   </Card>
                 ))}
                 {payouts?.length === 0 && <p className="text-center py-20 text-muted-foreground uppercase font-black text-xs">No pending requests.</p>}
              </div>
           </div>
         )}

         {activeTab === 'warriors' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                     <h2 className="text-4xl font-black uppercase italic tracking-tighter">Warrior <span className="text-primary">Registry</span></h2>
                     <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Identity & Technical Security Audit Log</p>
                  </div>
                  <div className="relative w-full md:w-80">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input 
                       value={userSearchTerm}
                       onChange={e => setUserSearchTerm(e.target.value)}
                       placeholder="SEARCH GMAIL, UID, CODE..." 
                       className="h-12 bg-black border-white/10 rounded-xl pl-12 font-black uppercase text-[10px] tracking-widest"
                     />
                  </div>
               </div>

               {warriorsLoading ? (
                 <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-primary h-10 w-10" /></div>
               ) : (
                 <div className="grid gap-6">
                    {filteredWarriors.map((w) => (
                      <Card key={w.id} className={cn(
                        "bg-[#0a0a0f] border-white/5 rounded-[2rem] overflow-hidden transition-all relative group",
                        w.isSuspended ? "opacity-50 grayscale border-red-500/40" : "hover:border-primary/30"
                      )}>
                         <div className="p-8 space-y-8">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                               <div className="flex items-center gap-6">
                                  <div className={cn(
                                    "h-20 w-20 rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-2xl transition-transform group-hover:rotate-3",
                                    w.isSuspended ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary border border-primary/20"
                                  )}>
                                     {w.email?.[0].toUpperCase() || 'U'}
                                  </div>
                                  <div className="space-y-3">
                                     <div className="flex items-center gap-3">
                                        <p className="text-xl font-black uppercase italic text-white truncate max-w-[300px]">{w.email || 'Anonymous Warrior'}</p>
                                        <Badge variant="outline" className="text-[8px] font-black uppercase border-white/10">{w.rank || 'Bronze'}</Badge>
                                     </div>
                                     <div className="flex flex-wrap gap-2">
                                        <Badge className="bg-white/5 text-muted-foreground border-none text-[8px] font-black uppercase px-2 italic flex items-center gap-1">
                                           <Key className="h-2.5 w-2.5 text-primary" /> UID: {w.id}
                                        </Badge>
                                        <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black uppercase px-2 italic flex items-center gap-1">
                                           <Lock className="h-2.5 w-2.5" /> PWD: ENCRYPTED_NODE
                                        </Badge>
                                     </div>
                                  </div>
                               </div>

                               <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                  <UserHisaab label="Coin Pulse" value={w.coins?.toLocaleString()} unit="🪙" />
                                  <UserHisaab label="Mission Yield" value={w.taskBalance?.toLocaleString()} unit="🪙" />
                                  <UserHisaab label="Rev Share" value={`$${(w.pendingRevenueShare || 0).toFixed(2)}`} />
                                  <UserHisaab label="Recruits" value={w.totalReferrals || 0} />
                               </div>

                               <div className="flex items-center gap-4 border-l border-white/5 pl-8 xl:min-w-[200px] justify-between">
                                  <div className="text-right">
                                     <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Signal Status</p>
                                     <Badge className={cn("px-4 py-1 text-[8px] font-black uppercase", w.isSuspended ? "bg-red-600" : "bg-green-600")}>
                                        {w.isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                                     </Badge>
                                  </div>
                                  <button 
                                    onClick={() => toggleSuspension(w.id, w.isSuspended || false)}
                                    disabled={isProcessing === `suspend-${w.id}`}
                                    className={cn(
                                      "h-14 w-14 rounded-2xl border flex items-center justify-center transition-all shadow-xl",
                                      w.isSuspended ? "border-green-500/20 text-green-500 hover:bg-green-500/10" : "border-red-500/20 text-red-500 hover:bg-red-500/10"
                                    )}
                                  >
                                     {isProcessing === `suspend-${w.id}` ? <Loader2 className="animate-spin" /> : w.isSuspended ? <UserCheck /> : <ShieldX />}
                                  </button>
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-white/5 bg-white/[0.02] -mx-8 px-8 pb-4">
                               <AuditItem icon={<Fingerprint className="text-primary h-3 w-3" />} label="Device Identity" value={w.deviceId || 'NOT_SYNCED'} />
                               <AuditItem icon={<MapPin className="text-amber-500 h-3 w-3" />} label="Last Linked IP" value={w.lastIp || '0.0.0.0'} />
                               <AuditItem icon={<Globe className="text-blue-500 h-3 w-3" />} label="Geo Region" value={`${w.geo_region || 'Global'} (${w.country || 'Unknown'})`} />
                               <AuditItem icon={<Calendar className="text-green-500 h-3 w-3" />} label="Joined Arena" value={w.joinedAt ? new Date(w.joinedAt).toLocaleString() : 'Legacy'} />
                            </div>
                         </div>
                      </Card>
                    ))}
                 </div>
               )}
            </div>
         )}

         {activeTab === 'visibility' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2 text-center md:text-left">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Module <span className="text-primary">Gate</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Global Sector Visibility Control</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {APP_CATEGORIES.map(cat => (
                    <Card key={cat} className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6">
                       <h3 className="text-lg font-black uppercase italic text-primary flex items-center gap-3">
                          <LayoutGrid className="h-4 w-4" /> {cat} Sector
                       </h3>
                       <div className="space-y-4">
                          {MODULE_REGISTRY.filter(m => m.category === cat).map(module => (
                            <div key={module.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-primary/20 transition-all">
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                     <module.icon size={16} />
                                  </div>
                                  <span className="text-[10px] font-black uppercase tracking-widest">{module.label}</span>
                               </div>
                               <Switch 
                                 checked={!!(settings as any)?.[module.visibilityKey]} 
                                 onCheckedChange={(v) => updateSetting(module.visibilityKey, v)} 
                               />
                            </div>
                          ))}
                       </div>
                    </Card>
                  ))}
               </div>
            </div>
         )}
      </main>
    </div>
  );
}

function NavPill({ active, label, icon, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className={cn(
          "px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[9px] tracking-widest border-2 whitespace-nowrap",
          active ? "bg-primary/10 border-primary text-primary italic shadow-lg" : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
        )}
      >
         {icon} <span>{label}</span>
      </button>
   );
}

function UserHisaab({ label, value, unit }: any) {
   return (
      <div className="bg-black/40 p-4 rounded-xl border border-white/5 text-center">
         <p className="text-[7px] font-black uppercase text-muted-foreground tracking-tighter mb-0.5">{label}</p>
         <p className="text-sm font-black text-white italic tabular-nums">{value} <span className="text-[8px] opacity-40">{unit}</span></p>
      </div>
   );
}

function AuditItem({ icon, label, value }: { icon: any, label: string, value: string }) {
   return (
      <div className="space-y-1">
         <div className="flex items-center gap-2">
            <span className="opacity-50">{icon}</span>
            <p className="text-[7px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
         </div>
         <p className="text-[10px] font-bold text-white truncate px-2 bg-white/5 rounded border border-white/5 py-1.5">{value}</p>
      </div>
   );
}