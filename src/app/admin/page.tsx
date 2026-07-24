
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, arrayUnion, where, getDocs, writeBatch, increment } from 'firebase/firestore';
import { 
  Loader2, Zap, Settings, Book, Database, RefreshCw, LayoutGrid, DollarSign, Wallet, 
  History, Globe, Info, Ban, Megaphone, Fingerprint, Activity, ClipboardCheck, 
  Smartphone, Target, ShieldCheck, CheckCircle2, PieChart, BarChart3, TrendingUp,
  Coins, ArrowRightLeft, Percent, Calculator, ListTodo, Search, User, CreditCard,
  PlusCircle, MinusCircle, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { AppSettings, PayoutRequest, PlatformRevenue, UserProfile } from '../lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '../lib/module-registry';
import { getCurrencyData, formatCurrency } from '@/lib/currency';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';
const APP_CATEGORIES: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'wallets' | 'revenue' | 'currency' | 'payouts'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // --- Wallet Adjustment States ---
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [adjAmount, setAdjAmount] = useState('');
  const [adjReason, setAdjReason] = useState('');
  const [adjType, setAdjType] = useState<'coins' | 'inr'>('coins');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const statsRef = useMemoFirebase(() => firestore ? doc(firestore, 'platform_stats', 'revenue') : null, [firestore]);
  const auditQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'admin_adjustments'), orderBy('timestamp', 'desc'), limit(30)) : null, [firestore]);
  
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: stats } = useDoc<PlatformRevenue>(statsRef);
  const { data: adjustments } = useCollection<any>(auditQuery);
  
  const updateSetting = async (key: string, value: any) => {
    if (!settingsRef) return;
    setIsProcessing(key);
    try {
      const oldVal = (settings as any)?.[key];
      await updateDoc(settingsRef, { 
        [key]: value,
        rateHistory: arrayUnion({
          timestamp: new Date().toISOString(),
          type: key,
          oldValue: oldVal ?? 0,
          newValue: value
        })
      });
      toast({ title: "SIGNAL SYNCED", description: `${key.toUpperCase()} updated.` });
    } catch (e) {
      toast({ variant: "destructive", title: "SYNC FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleUserSearch = async () => {
    if (!searchEmail || !firestore) return;
    setSearchLoading(true);
    setFoundUser(null);
    try {
      const q = query(collection(firestore, 'users'), where('email', '==', searchEmail.toLowerCase().trim()), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setFoundUser({ ...snap.docs[0].data(), id: snap.docs[0].id } as UserProfile);
      } else {
        toast({ variant: "destructive", title: "WARRIOR NOT FOUND", description: "Verify email node." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "SEARCH FAILED" });
    } finally {
      setSearchLoading(false);
    }
  };

  const handleWalletAdjustment = async (mode: 'credit' | 'debit') => {
    if (!firestore || !foundUser || !adjAmount || !adjReason) {
      toast({ variant: "destructive", title: "MISSING DATA", description: "Reason and Amount are mandatory." });
      return;
    }

    setIsAdjusting(true);
    try {
      const amount = parseFloat(adjAmount);
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', foundUser.id);
      
      const currencyData = getCurrencyData(foundUser.country, settings || undefined);
      const coinValue = adjType === 'coins' ? amount : amount * currencyData.rateToCoins;
      const finalDelta = mode === 'credit' ? coinValue : -coinValue;

      // 1. Update User Balances
      batch.update(userRef, {
        coins: increment(finalDelta),
        winningBalance: increment(finalDelta) // Manual adjustments affect winning for flexibility
      });

      // 2. Add to User Ledger
      const userLedgerRef = doc(collection(firestore, 'users', foundUser.id, 'ledger'));
      batch.set(userLedgerRef, {
        type: 'manual_adjustment',
        amount: Math.abs(coinValue),
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `ADMIN ${mode.toUpperCase()}: ${adjReason}`,
        isCredit: mode === 'credit'
      });

      // 3. Add to Admin Audit Trail
      const auditRef = doc(collection(firestore, 'admin_adjustments'));
      batch.set(auditRef, {
        adminId: user?.uid,
        adminEmail: user?.email,
        targetUserId: foundUser.id,
        targetUserEmail: foundUser.email,
        mode,
        amount: amount,
        unit: adjType,
        coinValue,
        reason: adjReason,
        timestamp: new Date().toISOString()
      });

      await batch.commit();
      
      toast({ title: "ADJUSTMENT SYNCED", description: `Successfully ${mode}ed ${amount} ${adjType}.` });
      
      // Refresh local view
      setFoundUser(prev => prev ? { ...prev, coins: prev.coins + finalDelta, winningBalance: prev.winningBalance + finalDelta } : null);
      setAdjAmount('');
      setAdjReason('');
    } catch (e) {
      toast({ variant: "destructive", title: "ADJUSTMENT FAILED" });
    } finally {
      setIsAdjusting(false);
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black tracking-[0.5em]">ACCESS DENIED</div>;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <header className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
            <div>
               <p className="text-sm font-black uppercase italic leading-none">Admin <span className="text-primary">Hub</span></p>
               <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Enterprise Command v150.0</p>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <Badge className="bg-green-600/20 text-green-500 border-none text-[8px] font-black uppercase px-3 italic">System Pulse Normal</Badge>
         </div>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-6xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'wallets'} label="Adjustment" icon={<Wallet className="h-3 w-3" />} onClick={() => setActiveTab('wallets')} />
            <NavPill active={activeTab === 'currency'} label="Economy" icon={<ArrowRightLeft className="h-3 w-3" />} onClick={() => setActiveTab('currency')} />
            <NavPill active={activeTab === 'revenue'} label="Revenue" icon={<DollarSign className="h-3 w-3" />} onClick={() => setActiveTab('revenue')} />
         </div>

         {activeTab === 'wallets' && (
           <div className="space-y-10 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Wallet <span className="text-primary">Terminal</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Manual Liquidity Injection & Audit</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* SEARCH & INSPECT */}
                 <Card className="lg:col-span-1 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl border-2">
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Search Warrior by Email</Label>
                          <div className="flex gap-2">
                             <Input 
                               value={searchEmail} 
                               onChange={e => setSearchEmail(e.target.value)} 
                               placeholder="student@gmail.com" 
                               className="bg-black border-white/10 h-12 rounded-xl text-xs uppercase" 
                             />
                             <Button onClick={handleUserSearch} disabled={searchLoading} className="h-12 w-12 bg-primary rounded-xl shrink-0">
                                {searchLoading ? <Loader2 className="animate-spin h-4 w-4" /> : <Search className="h-4 w-4" />}
                             </Button>
                          </div>
                       </div>

                       {foundUser ? (
                          <div className="space-y-6 animate-in zoom-in-95 duration-300">
                             <div className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex items-center gap-4">
                                   <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20">
                                      {foundUser.email?.[0].toUpperCase()}
                                   </div>
                                   <div className="flex-1 min-w-0">
                                      <p className="text-xs font-black uppercase truncate text-white">{foundUser.email?.split('@')[0]}</p>
                                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{foundUser.rank} Warrior • {foundUser.country}</p>
                                   </div>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="grid grid-cols-2 gap-4">
                                   <div>
                                      <p className="text-[7px] font-black uppercase text-muted-foreground">Coins</p>
                                      <p className="text-lg font-black text-amber-500 italic tabular-nums">{foundUser.coins.toLocaleString()}</p>
                                   </div>
                                   <div>
                                      <p className="text-[7px] font-black uppercase text-muted-foreground">Equiv. Value</p>
                                      <p className="text-lg font-black text-green-500 italic tabular-nums">{formatCurrency(foundUser.coins, foundUser.country, settings || undefined)}</p>
                                   </div>
                                </div>
                             </div>
                             <Button variant="outline" onClick={() => setFoundUser(null)} className="w-full border-white/10 h-10 rounded-xl text-[9px] font-black uppercase">Switch Target</Button>
                          </div>
                       ) : (
                          <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl opacity-20">
                             <User className="h-10 w-10 mb-2" />
                             <p className="text-[8px] font-black uppercase tracking-widest italic">Awaiting Target Signal</p>
                          </div>
                       )}
                    </div>
                 </Card>

                 {/* ADJUSTMENT CONTROLS */}
                 <Card className={cn(
                   "lg:col-span-2 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] shadow-2xl border-2 transition-all",
                   !foundUser && "opacity-20 pointer-events-none grayscale"
                 )}>
                    <div className="space-y-8">
                       <div className="flex items-center justify-between">
                          <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                             <Fingerprint className="h-5 w-5 text-primary" /> Adjustment Node
                          </h3>
                          <div className="flex bg-black p-1 rounded-xl border border-white/5">
                             <button onClick={() => setAdjType('coins')} className={cn("px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all", adjType === 'coins' ? "bg-primary text-white" : "text-muted-foreground")}>Coins</button>
                             <button onClick={() => setAdjType('inr')} className={cn("px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all", adjType === 'inr' ? "bg-primary text-white" : "text-muted-foreground")}>Rupees (INR)</button>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Volume to Adjust</Label>
                             <Input 
                                type="number" 
                                value={adjAmount} 
                                onChange={e => setAdjAmount(e.target.value)} 
                                className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-primary text-center" 
                                placeholder="0.00"
                             />
                          </div>
                          <div className="space-y-3">
                             <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Reason for Audit (Mandatory)</Label>
                             <Input 
                                value={adjReason} 
                                onChange={e => setAdjReason(e.target.value)} 
                                className="h-14 bg-black border-white/10 rounded-xl text-xs uppercase font-bold" 
                                placeholder="E.G. SPECIAL PERFORMANCE BONUS"
                             />
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button 
                            onClick={() => handleWalletAdjustment('credit')} 
                            disabled={isAdjusting || !adjAmount || !adjReason}
                            className="h-20 bg-green-600 hover:bg-green-500 rounded-2xl font-black text-xl uppercase italic shadow-xl flex items-center justify-center gap-4"
                          >
                             {isAdjusting ? <Loader2 className="animate-spin" /> : <><PlusCircle className="h-6 w-6" /> Credit Funds</>}
                          </Button>
                          <Button 
                            onClick={() => handleWalletAdjustment('debit')} 
                            disabled={isAdjusting || !adjAmount || !adjReason}
                            variant="destructive"
                            className="h-20 rounded-2xl font-black text-xl uppercase italic shadow-xl flex items-center justify-center gap-4"
                          >
                             {isAdjusting ? <Loader2 className="animate-spin" /> : <><MinusCircle className="h-6 w-6" /> Debit Funds</>}
                          </Button>
                       </div>
                    </div>
                 </Card>
              </div>

              {/* AUDIT TRAIL */}
              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="bg-white/5 p-6 border-b border-white/5 flex items-center justify-between">
                    <h4 className="text-[10px] font-black uppercase italic flex items-center gap-2">
                       <History className="h-4 w-4 text-muted-foreground" /> Manual Adjustment Audit Trail
                    </h4>
                 </div>
                 <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto no-scrollbar">
                    {adjustments && adjustments.length > 0 ? adjustments.map((log: any) => (
                       <div key={log.id} className="p-5 flex items-center justify-between group hover:bg-white/[0.02] transition-all">
                          <div className="flex items-center gap-4">
                             <div className={cn(
                                "h-10 w-10 rounded-xl flex items-center justify-center",
                                log.mode === 'credit' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                             )}>
                                {log.mode === 'credit' ? <PlusCircle className="h-5 w-5" /> : <MinusCircle className="h-5 w-5" />}
                             </div>
                             <div>
                                <p className="text-xs font-black uppercase text-white">{log.targetUserEmail?.split('@')[0]}</p>
                                <p className="text-[8px] font-bold text-muted-foreground uppercase">{log.reason}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className={cn("text-lg font-black italic", log.mode === 'credit' ? "text-green-500" : "text-red-500")}>
                                {log.mode === 'credit' ? '+' : '-'}{log.coinValue.toLocaleString()} 🪙
                             </p>
                             <p className="text-[7px] font-bold text-muted-foreground uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                          </div>
                       </div>
                    )) : (
                       <div className="py-20 text-center opacity-20">
                          <AlertCircle className="h-10 w-10 mx-auto mb-2" />
                          <p className="text-[8px] font-black uppercase tracking-widest italic">Zero Adjustment History</p>
                       </div>
                    )}
                 </div>
              </Card>
           </div>
         )}

         {activeTab === 'currency' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Currency <span className="text-primary">Terminal</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Dynamic Coin-to-Cash Calibration</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl border-2">
                    <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                       <Calculator className="h-5 w-5 text-primary" /> Exchange Rates
                    </h3>
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Coins Per 1 INR (₹)</Label>
                          <Input 
                            type="number" 
                            defaultValue={settings?.coinsPerINR || 100} 
                            onBlur={(e) => updateSetting('coinsPerINR', parseInt(e.target.value))}
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-primary text-center" 
                          />
                          <p className="text-[8px] font-bold text-muted-foreground uppercase text-center italic">"Default: 100 Coins = ₹1"</p>
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Coins Per 1 USD ($)</Label>
                          <Input 
                            type="number" 
                            defaultValue={settings?.coinsPerUSD || 1000} 
                            onBlur={(e) => updateSetting('coinsPerUSD', parseInt(e.target.value))}
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-white text-center" 
                          />
                          <p className="text-[8px] font-bold text-muted-foreground uppercase text-center italic">"Default: 1000 Coins = $1"</p>
                       </div>
                    </div>
                 </Card>

                 <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 shadow-2xl border-2">
                    <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                       <Percent className="h-5 w-5 text-amber-500" /> Profit Margins
                    </h3>
                    <div className="space-y-6">
                       <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">User Revenue Share (%)</Label>
                          <Input 
                            type="number" 
                            defaultValue={settings?.userRevenueSharePercent || 20} 
                            onBlur={(e) => updateSetting('userRevenueSharePercent', parseInt(e.target.value))}
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-amber-500 text-center" 
                          />
                       </div>
                       <div className="space-y-3">
                          <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">CPA Reward Multiplier</Label>
                          <Input 
                            type="number" 
                            step="0.1"
                            defaultValue={settings?.cpaRewardMultiplier || 1.0} 
                            onBlur={(e) => updateSetting('cpaRewardMultiplier', parseFloat(e.target.value))}
                            className="h-14 bg-black border-white/10 rounded-xl font-black text-2xl text-white text-center" 
                          />
                       </div>
                    </div>
                 </Card>
              </div>

              <Card className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="bg-white/5 p-6 border-b border-white/5">
                    <h4 className="text-[10px] font-black uppercase italic flex items-center gap-2">
                       <History className="h-4 w-4 text-muted-foreground" /> Rate Audit History
                    </h4>
                 </div>
                 <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto">
                    {settings?.rateHistory?.slice().reverse().map((log, i) => (
                      <div key={i} className="p-4 flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase text-white">{log.type.replace(/([A-Z])/g, ' $1')}</p>
                            <p className="text-[8px] font-bold text-muted-foreground uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-[9px] font-bold text-muted-foreground line-through">{log.oldValue}</span>
                            <span className="text-sm font-black text-primary italic">{log.newValue}</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </Card>
           </div>
         )}

         {activeTab === 'revenue' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Profit <span className="text-primary">Analytics</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Global Revenue Share Model</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <AnalyticsCard label="Total Ad Revenue" value={`$${(stats?.totalDailyRevenueUSD || 0).toFixed(2)}`} icon={<BarChart3 />} color="text-white" />
                  <AnalyticsCard label="Admin Profit" value={`$${(stats?.totalAdminProfitUSD || 0).toFixed(2)}`} icon={<ShieldCheck />} color="text-primary" />
                  <AnalyticsCard label="User Dividend" value={`$${(stats?.totalUserDividendUSD || 0).toFixed(2)}`} icon={<TrendingUp />} color="text-green-500" />
               </div>
            </div>
         )}

         {activeTab === 'visibility' && (
           <div className="space-y-8 animate-in fade-in duration-500">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black uppercase italic tracking-tighter">Feature <span className="text-primary">Controller</span></h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Modular Node Management</p>
              </div>
              <Tabs defaultValue="Learning" className="w-full">
                 <TabsList className="w-full h-14 bg-white/5 p-1 rounded-2xl border border-white/10 flex overflow-x-auto no-scrollbar">
                    {APP_CATEGORIES.map(cat => (
                       <TabsTrigger key={cat} value={cat} className="flex-1 font-black text-[9px] uppercase data-[state=active]:bg-primary rounded-xl px-6">
                          {cat}
                       </TabsTrigger>
                    ))}
                 </TabsList>
                 {APP_CATEGORIES.map(cat => (
                    <TabsContent key={cat} value={cat} className="mt-8">
                       <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                          {MODULE_REGISTRY.filter(m => m.category === cat).map((module) => {
                             const isActive = (settings as any)?.[module.visibilityKey];
                             return (
                                <Card key={module.id} className="bg-[#0a0a0f] border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-primary/20 transition-all border-2">
                                   <div className="flex items-center gap-4">
                                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", isActive ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground")}>
                                         <module.icon className="h-4 w-4" />
                                      </div>
                                      <p className={cn("text-[10px] font-black uppercase italic", isActive ? "text-white" : "text-muted-foreground opacity-50")}>{module.label}</p>
                                   </div>
                                   <Switch checked={!!isActive} onCheckedChange={(v) => updateSetting(module.visibilityKey, v)} className="data-[state=checked]:bg-primary" />
                                </Card>
                             );
                          })}
                       </div>
                    </TabsContent>
                 ))}
              </Tabs>
           </div>
         )}
      </main>
    </div>
  );
}

function AnalyticsCard({ label, value, icon, color }: any) {
   return (
      <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2rem] flex flex-col justify-between h-40 border-2">
         <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">{icon}</div>
            <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
         </div>
         <h3 className={cn("text-4xl font-black italic tabular-nums", color)}>{value}</h3>
      </Card>
   );
}

function NavPill({ active, label, icon, onClick }: any) {
   return (
      <button 
        onClick={onClick}
        className={cn(
          "px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[9px] tracking-widest whitespace-nowrap border-2",
          active ? "bg-primary/10 border-primary text-primary italic shadow-lg" : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
        )}
      >
         {icon} <span>{label}</span>
      </button>
   );
}
