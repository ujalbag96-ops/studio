
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, writeBatch } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Loader2, ShieldCheck, CheckCircle2, Ticket, Globe, Landmark } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, ShopItem } from '@/app/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const DOMESTIC_ITEMS: ShopItem[] = [
  { id: 's1', name: '₹100 Google Play (IN)', description: 'Digital Gift Code', price: 10000, category: 'Redeem Code', imageUrl: 'https://picsum.photos/seed/gp/400/200', geo: 'India' },
  { id: 's2', name: 'Paytm Cash ₹500', description: 'Direct Wallet Transfer', price: 50000, category: 'Cash', imageUrl: 'https://picsum.photos/seed/paytm/400/200', geo: 'India' },
];

const GLOBAL_ITEMS: ShopItem[] = [
  { id: 'g1', name: '$10 PayPal Cash', description: 'Instant PayPal Transfer', price: 10000, category: 'Cash', imageUrl: 'https://picsum.photos/seed/paypal/400/200', geo: 'Global' },
  { id: 'g2', name: '$5 Amazon.com Card', description: 'US Region Voucher', price: 5000, category: 'Voucher', imageUrl: 'https://picsum.photos/seed/amazonus/400/200', geo: 'Global' },
  { id: 'g3', name: '£10 Steam Wallet', description: 'UK Region Credit', price: 12000, category: 'Game Credit', imageUrl: 'https://picsum.photos/seed/steam/400/200', geo: 'United Kingdom' },
];

export default function ShopPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [deliveryId, setDeliveryId] = useState('');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const isIndia = profile?.country === 'India';
  const availableItems = isIndia ? DOMESTIC_ITEMS : GLOBAL_ITEMS;

  const handleRedeemInitiate = (item: ShopItem) => {
    if (!user || !profile) return;
    const userBalance = profile.winningBalance + profile.taskBalance;
    if (userBalance < item.price) {
      toast({ variant: "destructive", title: "Insufficient Coins", description: `You need ${item.price} coins for this.` });
      return;
    }
    setSelectedItem(item);
  };

  const handleConfirmRedeem = async () => {
    if (!user || !firestore || !userRef || !selectedItem || !deliveryId) return;

    setIsRedeeming(true);
    try {
      const batch = writeBatch(firestore);
      const timestamp = new Date().toISOString();
      const dateStr = timestamp.split('T')[0];

      // Atomic Deduct (Deduct from Task Balance first, then winning)
      let rem = selectedItem.price;
      const taskDec = Math.min(profile!.taskBalance, rem);
      rem -= taskDec;
      const winDec = rem;

      batch.update(userRef, {
        taskBalance: increment(-taskDec),
        winningBalance: increment(-winDec),
        coins: increment(-selectedItem.price)
      });

      const payoutRef = doc(collection(firestore, 'payouts'));
      batch.set(payoutRef, {
        userId: user.uid,
        userEmail: user.email,
        amount: selectedItem.price,
        method: 'Global Shop Redemption',
        destination: deliveryId,
        status: 'pending',
        timestamp,
        itemName: selectedItem.name,
        geo: profile?.country
      });

      batch.set(doc(collection(firestore, 'users', user.uid, 'ledger')), {
        type: 'shop_redemption',
        amount: selectedItem.price,
        date: dateStr,
        status: 'pending',
        description: `Redeemed: ${selectedItem.name}`
      });

      await batch.commit();
      toast({ title: "REDEEM REQUEST SENT", description: "Verification signal dispatched." });
      setSelectedItem(null);
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-4">
           <Badge className="bg-primary/20 text-primary border-none uppercase font-black px-4 py-1 text-[9px] tracking-widest italic">
             {isIndia ? 'Domestic Hub: INR' : 'Global Hub: USD/GBP'}
           </Badge>
           <Badge variant="outline" className="border-white/10 text-[9px] font-black uppercase text-muted-foreground">35% Revenue Share System</Badge>
        </div>
        <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Reward <span className="text-primary">Shop</span></h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl">
          Redeem your shared mission revenue for regional gift cards and digital cash payouts.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {availableItems.map((item) => (
          <Card key={item.id} className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-primary/40 transition-all shadow-2xl relative">
            <div className="aspect-video relative overflow-hidden">
               <img src={item.imageUrl} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt={item.name} />
               <div className="absolute top-4 right-4">
                  <Badge className="bg-black/60 text-white border-none text-[8px] font-black uppercase px-2 py-1">{item.geo}</Badge>
               </div>
            </div>
            <CardContent className="p-8 space-y-6">
              <div>
                 <h3 className="text-xl font-black uppercase italic text-white truncate">{item.name}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{item.description}</p>
              </div>
              <div className="flex items-center justify-between border-t border-white/5 pt-4">
                 <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-primary italic">{item.price}</span>
                    <span className="text-[10px] font-bold opacity-40 mb-1">🪙</span>
                 </div>
                 <Button onClick={() => handleRedeemInitiate(item)} className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-primary text-white font-black text-[10px] uppercase">REDEEM</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] p-10">
           <DialogHeader className="space-y-4">
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                 <Landmark className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-3xl font-black uppercase italic">Payer Identity</DialogTitle>
           </DialogHeader>
           <div className="py-6 space-y-6">
              <div className="space-y-2">
                 <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Delivery Destination (Email/ID)</Label>
                 <Input value={deliveryId} onChange={e => setDeliveryId(e.target.value)} placeholder="Enter PayPal or Amazon Email" className="h-16 bg-black border-white/10 rounded-2xl font-black text-lg focus:ring-primary" />
              </div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold text-center leading-relaxed">
                 Signal verification takes 2-24 hours. Reward will be sent to your in-app inbox once settled.
              </p>
           </div>
           <DialogFooter>
              <Button onClick={handleConfirmRedeem} disabled={isRedeeming || !deliveryId} className="w-full h-16 bg-primary font-black uppercase italic text-lg rounded-2xl shadow-xl">
                 {isRedeeming ? <Loader2 className="animate-spin" /> : "CONFIRM REDEEM"}
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
