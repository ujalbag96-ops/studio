
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  Loader2, 
  ShieldCheck, 
  CheckCircle2, 
  Ticket, 
  Globe, 
  Landmark, 
  CreditCard, 
  Send, 
  Wallet,
  Smartphone,
  Zap,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/app/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface WithdrawalItem {
  id: string;
  name: string;
  description: string;
  minCoins: number;
  category: 'UPI' | 'PayPal' | 'Voucher' | 'Crypto';
  geo: string;
  icon: React.ReactNode;
}

const WITHDRAWAL_ITEMS: WithdrawalItem[] = [
  // India Specific
  { id: 'upi_1', name: 'UPI Digital Payout', description: 'G-Pay, PhonePe, Paytm', minCoins: 10000, category: 'UPI', geo: 'India', icon: <Smartphone className="h-6 w-6" /> },
  { id: 'paytm_1', name: 'Paytm Wallet', description: 'Direct Wallet Transfer', minCoins: 5000, category: 'UPI', geo: 'India', icon: <Wallet className="h-6 w-6" /> },
  
  // Global
  { id: 'paypal_1', name: 'PayPal Global', description: 'Verified Personal/Business', minCoins: 50000, category: 'PayPal', geo: 'Global', icon: <Send className="h-6 w-6" /> },
  { id: 'usdt_1', name: 'USDT (TRC20)', description: 'Crypto Wallet Transfer', minCoins: 100000, category: 'Crypto', geo: 'Global', icon: <Landmark className="h-6 w-6" /> },
  
  // Vouchers
  { id: 'amz_1', name: 'Amazon Gift Card', description: 'Digital Voucher Code', minCoins: 5000, category: 'Voucher', geo: 'Global', icon: <Ticket className="h-6 w-6" /> },
  { id: 'play_1', name: 'Google Play Code', description: 'App Store Credit', minCoins: 10000, category: 'Voucher', geo: 'India', icon: <CreditCard className="h-6 w-6" /> },
];

export default function PayoutTerminal() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeCat, setActiveCat] = useState('All');
  const [selectedItem, setSelectedItem] = useState<WithdrawalItem | null>(null);
  const [destinationId, setDestinationId] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);

  const categories = ['All', 'UPI', 'PayPal', 'Voucher', 'Crypto'];
  
  const filteredItems = WITHDRAWAL_ITEMS.filter(item => {
    const catMatch = activeCat === 'All' || item.category === activeCat;
    const geoMatch = item.geo === 'Global' || item.geo === profile?.country;
    return catMatch && geoMatch;
  });

  const handleRedeemInitiate = (item: WithdrawalItem) => {
    if (!user || !profile) {
      toast({ variant: "destructive", title: "Identity Required" });
      return;
    }
    if (profile.coins < item.minCoins) {
      toast({ variant: "destructive", title: "Insufficient Assets", description: `You need at least ${item.minCoins} coins.` });
      return;
    }
    setSelectedItem(item);
  };

  const handleConfirmRedeem = async () => {
    if (!user || !firestore || !userRef || !selectedItem || !destinationId) return;

    setIsRedeeming(true);
    try {
      const batch = writeBatch(firestore);
      const timestamp = new Date().toISOString();
      const dateStr = timestamp.split('T')[0];

      // Atomic Deduct
      batch.update(userRef, {
        coins: increment(-selectedItem.minCoins),
        winningBalance: increment(-selectedItem.minCoins)
      });

      // Log Withdrawal Request
      const payoutRef = doc(collection(firestore, 'payouts'));
      batch.set(payoutRef, {
        userId: user.uid,
        userEmail: user.email,
        amount: selectedItem.minCoins,
        method: selectedItem.name,
        destination: destinationId,
        status: 'pending',
        timestamp,
        geo: profile?.country
      });

      // Ledger Entry
      batch.set(doc(collection(firestore, 'users', user.uid, 'ledger')), {
        type: 'withdrawal_request',
        amount: selectedItem.minCoins,
        date: dateStr,
        status: 'pending',
        description: `Requested Payout: ${selectedItem.name}`
      });

      await batch.commit();
      toast({ title: "SIGNAL DISPATCHED", description: "Audit node will verify your credentials shortly." });
      setSelectedItem(null);
      setDestinationId('');
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsRedeeming(false);
    }
  };

  if (profileLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
           <div className="space-y-4">
              <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1.5 text-[9px] tracking-widest italic">Industrial Withdrawal Hub v26.0</Badge>
              <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">Withdrawal <span className="text-primary">Terminal</span></h1>
              <p className="text-muted-foreground font-medium text-lg max-w-2xl italic">
                 Convert your verified scholarly yield into local currency. Multi-node digital gateways are operational.
              </p>
           </div>
           <Card className="bg-white/[0.02] border-white/10 p-8 rounded-[2rem] flex items-center gap-8 shadow-2xl backdrop-blur-xl">
              <div className="text-center">
                 <p className="text-[9px] font-black uppercase text-muted-foreground mb-1 italic">Available Liquidity</p>
                 <p className="text-3xl font-black text-white italic tabular-nums">{profile?.coins?.toLocaleString() || 0} <span className="text-xs opacity-40">🪙</span></p>
              </div>
              <div className="h-12 w-px bg-white/10" />
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <Zap className="h-6 w-6 animate-pulse" />
              </div>
           </Card>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-8">
         {categories.map(cat => (
           <button 
             key={cat}
             onClick={() => setActiveCat(cat)}
             className={cn(
               "px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
               activeCat === cat ? "bg-primary/10 text-primary border-primary shadow-xl italic" : "bg-white/5 text-muted-foreground border-transparent hover:border-white/10"
             )}
           >
              {cat === 'Voucher' ? 'Gift Cards' : cat}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
         {filteredItems.map((item) => (
           <Card key={item.id} className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-primary/40 transition-all shadow-2xl relative border-2">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-black flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary shadow-xl group-hover:scale-110 transition-transform">
                    {item.icon}
                 </div>
                 <div className="absolute top-4 right-4">
                    <Badge className="bg-black/60 backdrop-blur-md text-white border-none text-[8px] font-black uppercase px-3 py-1 italic">{item.geo}</Badge>
                 </div>
              </div>
              <CardContent className="p-8 space-y-6">
                 <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase italic text-white leading-tight">{item.name}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.description}</p>
                 </div>
                 <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div>
                       <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Floor Rate</p>
                       <p className="text-xl font-black text-primary italic">{item.minCoins.toLocaleString()} 🪙</p>
                    </div>
                    <Button onClick={() => handleRedeemInitiate(item)} className="h-11 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-primary text-white font-black text-[9px] uppercase shadow-lg">SETTLE</Button>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] p-10 shadow-2xl">
           <div className="text-center space-y-8">
              <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
                 {selectedItem?.icon}
              </div>
              <div className="space-y-2">
                 <h3 className="text-3xl font-black uppercase italic leading-none">Payout Protocol</h3>
                 <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{selectedItem?.name}</p>
              </div>

              <div className="space-y-4 text-left">
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">
                       {selectedItem?.category === 'UPI' ? 'Enter VPA / UPI ID' : 'Enter Settlement Target (Email/Wallet)'}
                    </Label>
                    <Input 
                      value={destinationId} 
                      onChange={e => setDestinationId(e.target.value)} 
                      placeholder={selectedItem?.category === 'UPI' ? "E.G. USERNAME@BANK" : "E.G. EMAIL@DOMAIN.COM"}
                      className="h-16 bg-black border-white/10 rounded-2xl font-black text-lg focus:ring-primary text-center uppercase text-xs" 
                    />
                 </div>
                 <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-bold text-amber-500 uppercase leading-relaxed italic">
                       Manual Audit Node Active. Payouts are verified against mission integrity records before release (Est. 2-6 Hours).
                    </p>
                 </div>
              </div>

              <Button onClick={handleConfirmRedeem} disabled={isRedeeming || !destinationId} className="w-full h-20 bg-primary hover:bg-primary/90 font-black uppercase italic text-xl rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95">
                 {isRedeeming ? <Loader2 className="animate-spin h-6 w-6" /> : "FINALIZE SIGNAL"}
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
