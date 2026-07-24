
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, query, where, getDocs, limit, writeBatch, increment } from 'firebase/firestore';
import { 
  Loader2, Zap, Wallet, LayoutGrid, DollarSign, ArrowRightLeft, 
  Search, PlusCircle, MinusCircle, Palette, CheckCircle2, 
  Star, Volume2, Music, Play, Bell
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
import { AppSettings, PlatformRevenue, UserProfile } from '../lib/types';
import { MODULE_REGISTRY, ModuleCategory } from '../lib/module-registry';
import { MASTER_THEMES } from '@/app/lib/themes';
import { MASTER_SOUNDS, SoundSignal } from '@/app/lib/sounds';

const ADMIN_EMAIL = 'ujalbag96@gmail.com';
const APP_CATEGORIES: ModuleCategory[] = ['Learning', 'Skills', 'Earning', 'Productivity', 'System'];

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'visibility' | 'wallets' | 'revenue' | 'currency' | 'branding' | 'sounds'>('visibility');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // States for forms
  const [searchQuery, setSearchTerm] = useState('');
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustRemark, setAdjustRemark] = useState('');
  const [adjustUnit, setAdjustUnit] = useState<'coin' | 'inr'>('coin');
  const [soundSearch, setSoundSearch] = useState('');

  const isAdminUser = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  const { data: settings } = useDoc<AppSettings>(settingsRef);
  
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

  const handleUserSearch = async () => {
    if (!firestore || !searchQuery.trim()) return;
    setIsProcessing('search');
    setTargetUser(null);
    try {
      const q = query(collection(firestore, 'users'), where('email', '==', searchQuery.trim().toLowerCase()), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTargetUser({ id: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile);
      } else {
        toast({ variant: "destructive", title: "WARRIOR NOT FOUND" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "SEARCH ERROR" });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleWalletAdjustment = async (mode: 'credit' | 'debit') => {
    if (!firestore || !targetUser || !adjustAmount || !adjustRemark) return;
    const amt = parseFloat(adjustAmount);
    if (isNaN(amt) || amt <= 0) return;

    setIsProcessing('adjustment');
    try {
      const finalCoinAmount = adjustUnit === 'coin' ? amt : amt * (settings?.coinsPerINR || 100);
      const multiplier = mode === 'credit' ? 1 : -1;
      const batch = writeBatch(firestore);
      const userRef = doc(firestore, 'users', targetUser.id);
      
      batch.update(userRef, {
        coins: increment(finalCoinAmount * multiplier),
        winningBalance: increment(finalCoinAmount * multiplier)
      });

      batch.set(doc(collection(firestore, 'users', targetUser.id, 'ledger')), {
        type: mode === 'credit' ? 'admin_credit' : 'admin_debit',
        amount: finalCoinAmount,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Admin Adjustment: ${adjustRemark}`
      });

      await batch.commit();
      toast({ title: "WALLET CALIBRATED" });
      setTargetUser(null);
      setAdjustAmount('');
    } catch (e) {
      toast({ variant: "destructive", title: "ADJUSTMENT FAILED" });
    } finally {
      setIsProcessing(null);
    }
  };

  const previewSound = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(() => {});
  };

  const filteredSounds = MASTER_SOUNDS.filter(s => 
    s.name.toLowerCase().includes(soundSearch.toLowerCase()) || 
    s.category.toLowerCase().includes(soundSearch.toLowerCase())
  );

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!isAdminUser) return <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-black">ACCESS DENIED</div>;

  return (
    <div className="min-h-screen bg-background text-white pb-32">
      <header className="fixed top-0 inset-x-0 h-20 bg-black/60 backdrop-blur-xl border-b border-white/5 z-[100] px-6 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg"><Zap className="h-5 w-5 text-white" /></div>
            <p className="text-sm font-black uppercase italic">Admin <span className="text-primary">Hub</span></p>
         </div>
         <Badge variant="outline" className="border-green-500/20 text-green-500 text-[8px] font-black uppercase">v190.0 Active</Badge>
      </header>

      <main className="pt-28 px-4 md:px-6 space-y-10 max-w-6xl mx-auto">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            <NavPill active={activeTab === 'visibility'} label="Modules" icon={<LayoutGrid className="h-3 w-3" />} onClick={() => setActiveTab('visibility')} />
            <NavPill active={activeTab === 'branding'} label="Themes" icon={<Palette className="h-3 w-3" />} onClick={() => setActiveTab('branding')} />
            <NavPill active={activeTab === 'sounds'} label="Sounds" icon={<Volume2 className="h-3 w-3" />} onClick={() => setActiveTab('sounds')} />
            <NavPill active={activeTab === 'wallets'} label="Adjust" icon={<Wallet className="h-3 w-3" />} onClick={() => setActiveTab('wallets')} />
            <NavPill active={activeTab === 'currency'} label="Economy" icon={<ArrowRightLeft className="h-3 w-3" />} onClick={() => setActiveTab('currency')} />
         </div>

         {activeTab === 'sounds' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Sonic <span className="text-primary">Terminal</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">120+ Industrial Audio Signals</p>
               </div>

               <Card className="bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 border-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3">
                        <Music className="text-primary" /> Audio Matrix
                     </h3>
                     <Input 
                       value={soundSearch}
                       onChange={e => setSoundSearch(e.target.value)}
                       placeholder="Search 120+ sounds..." 
                       className="h-10 bg-black border-white/10 w-full sm:w-64 text-[10px] uppercase font-bold"
                     />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                     {filteredSounds.map((sound) => {
                        const isCurrentReward = settings?.globalRewardSoundUrl === sound.url;
                        return (
                          <div key={sound.id} className={cn(
                             "p-4 rounded-2xl border-2 transition-all group flex items-center justify-between",
                             isCurrentReward ? "border-primary bg-primary/10" : "border-white/5 bg-white/5 hover:border-white/20"
                          )}>
                             <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase italic truncate max-w-[120px]">{sound.name}</p>
                                <Badge className="bg-black/40 text-[7px] font-black uppercase px-2">{sound.category}</Badge>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => previewSound(sound.url)} className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary transition-all">
                                   <Play className="h-3 w-3 fill-white" />
                                </button>
                                <button 
                                  onClick={() => updateSetting('globalRewardSoundUrl', sound.url)}
                                  className={cn("h-8 px-3 rounded-lg text-[8px] font-black uppercase transition-all", isCurrentReward ? "bg-green-600" : "bg-white/10 hover:bg-primary")}
                                >
                                   {isCurrentReward ? "ACTIVE" : "SET GLOBAL"}
                                </button>
                             </div>
                          </div>
                        );
                     })}
                  </div>
               </Card>
            </div>
         )}

         {activeTab === 'branding' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Theme <span className="text-primary">Terminal</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">100+ Programmable High-Fidelity Styles</p>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-1 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 border-2">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3">Visual Assets</h3>
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[9px] font-black uppercase text-muted-foreground">Custom Logo URL</Label>
                           <Input value={settings?.customLogoUrl || ''} onChange={e => updateSetting('customLogoUrl', e.target.value)} className="bg-black border-white/10 h-12 rounded-xl text-xs" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/20">
                           <p className="text-[10px] font-black uppercase">Festival Mode</p>
                           <Switch checked={!!settings?.festivalModeActive} onCheckedChange={(v) => updateSetting('festivalModeActive', v)} />
                        </div>
                     </div>
                  </Card>
                  <Card className="lg:col-span-2 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-8 border-2">
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                        {MASTER_THEMES.map((theme) => (
                           <button
                              key={theme.id}
                              onClick={() => updateSetting('currentThemeId', theme.id)}
                              className={cn(
                                 "p-4 rounded-2xl border-2 transition-all relative overflow-hidden",
                                 settings?.currentThemeId === theme.id ? "border-primary bg-primary/10" : "border-white/5 bg-white/5"
                              )}
                              style={{ borderLeftColor: `hsl(${theme.primary})`, borderLeftWidth: '8px' }}
                           >
                              <div className="space-y-2 text-left">
                                 <p className="text-[10px] font-black uppercase italic truncate">{theme.name}</p>
                                 <Badge className="bg-black/40 text-[7px] font-black uppercase px-2">{theme.category}</Badge>
                              </div>
                           </button>
                        ))}
                     </div>
                  </Card>
               </div>
            </div>
         )}

         {activeTab === 'wallets' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="space-y-2">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Wallet <span className="text-primary">Mastery</span></h2>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Manual Warrior Portfolio Intervention</p>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-1 bg-[#0a0a0f] border-white/5 p-8 rounded-[2.5rem] space-y-6 border-2">
                     <h3 className="text-xl font-black uppercase italic flex items-center gap-3"><Search className="text-primary" /> User Hub</h3>
                     <div className="space-y-4">
                        <Input value={searchQuery} onChange={e => setSearchTerm(e.target.value)} placeholder="Warrior email..." className="bg-black border-white/10 h-12 rounded-xl" />
                        <Button onClick={handleUserSearch} disabled={isProcessing === 'search'} className="w-full h-12 bg-primary font-black uppercase italic rounded-xl">
                           {isProcessing === 'search' ? <Loader2 className="animate-spin" /> : "INSPECT SIGNAL"}
                        </Button>
                     </div>
                     {targetUser && (
                        <div className="p-6 bg-white/5 border border-white/10 rounded-2xl space-y-4">
                           <p className="text-[10px] font-black uppercase text-muted-foreground">Target: {targetUser.email}</p>
                           <p className="text-lg font-black text-primary italic">{targetUser.coins.toLocaleString()} 🪙</p>
                        </div>
                     )}
                  </Card>
                  <Card className={cn("lg:col-span-2 bg-[#0a0a0f] border-white/5 p-10 rounded-[2.5rem] space-y-8 border-2", !targetUser && "opacity-30 grayscale pointer-events-none")}>
                     <h3 className="text-2xl font-black uppercase italic"><Zap className="text-amber-500" /> Adjustment Terminal</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} placeholder="0.00" className="h-16 bg-black border-white/10 rounded-2xl font-black text-2xl text-primary" />
                           <Input value={adjustRemark} onChange={e => setAdjustRemark(e.target.value)} placeholder="Remark..." className="h-12 bg-black border-white/10 rounded-xl uppercase text-[10px]" />
                        </div>
                        <div className="flex flex-col gap-4">
                           <Button onClick={() => handleWalletAdjustment('credit')} className="h-16 bg-green-600 font-black uppercase italic rounded-2xl shadow-xl">CREDIT FUNDS</Button>
                           <Button onClick={() => handleWalletAdjustment('debit')} className="h-16 bg-red-600 font-black uppercase italic rounded-2xl shadow-xl">DEBIT FUNDS</Button>
                        </div>
                     </div>
                  </Card>
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
          "px-6 py-3 rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[9px] tracking-widest whitespace-nowrap border-2",
          active ? "bg-primary/10 border-primary text-primary italic shadow-lg" : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
        )}
      >
         {icon} <span>{label}</span>
      </button>
   );
}
