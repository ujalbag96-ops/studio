
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Zap, CreditCard, Gift, Ticket, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, ShopItem } from '@/app/lib/types';
import Image from 'next/image';

const MOCK_SHOP_ITEMS: ShopItem[] = [
  { id: 's1', name: '₹100 Google Play', description: 'Instant Digital Gift Code', price: 100, category: 'Redeem Code', imageUrl: 'https://picsum.photos/seed/googleplay/400/200' },
  { id: 's2', name: '60 UC Pack (BGMI)', description: 'Direct Game Credit Transfer', price: 75, category: 'Game Credit', imageUrl: 'https://picsum.photos/seed/bgmi/400/200' },
  { id: 's3', name: '₹500 Amazon Pay', description: 'E-Commerce Shopping Voucher', price: 500, category: 'Voucher', imageUrl: 'https://picsum.photos/seed/amazon/400/200' },
  { id: 's4', name: '100 Free Fire Diamonds', description: 'In-game Currency Top-up', price: 80, category: 'Game Credit', imageUrl: 'https://picsum.photos/seed/ff/400/200' },
];

export default function ShopPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handleRedeem = async (item: ShopItem) => {
    if (!user || !firestore || !userRef || !profile) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }

    if (profile.winningBalance < item.price) {
      toast({ 
        variant: "destructive", 
        title: "Insufficient Winnings", 
        description: `You need ${item.price} winning coins to redeem this.` 
      });
      return;
    }

    setIsRedeeming(item.id);
    try {
      // Professional Transaction Protocol
      await updateDoc(userRef, {
        winningBalance: increment(-item.price),
        coins: increment(-item.price)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'shop_redemption',
        amount: item.price,
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        description: `Purchased: ${item.name} (Awaiting Delivery)`
      });

      toast({
        title: "PURCHASE SUCCESSFUL",
        description: "Your code will be delivered to your inbox within 24 hours.",
      });
      
      new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3').play().catch(() => {});
    } catch (e) {
      toast({ variant: "destructive", title: "Redemption Failed" });
    } finally {
      setIsRedeeming(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <header className="space-y-4 pt-12 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
           <ShoppingBag className="h-4 w-4 text-primary" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Elite Redemption Store</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">WinZO <span className="text-primary">Shop</span></h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
          Redeem your winning cash for digital vouchers and game currencies instantly.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {MOCK_SHOP_ITEMS.map((item) => (
          <Card key={item.id} className="bg-[#0a0a0f] border-white/5 overflow-hidden rounded-[2.5rem] group hover:border-primary/40 transition-all shadow-2xl">
            <div className="relative h-40 w-full overflow-hidden">
               <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" />
               <div className="absolute top-4 left-4">
                  <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase px-3 py-1">
                    {item.category}
                  </Badge>
               </div>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                 <h3 className="text-lg font-black uppercase italic text-white truncate">{item.name}</h3>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase">{item.description}</p>
              </div>
              
              <div className="flex items-center justify-between">
                 <div className="flex items-end gap-1">
                    <span className="text-2xl font-black text-white italic">{item.price}</span>
                    <span className="text-[10px] font-bold text-muted-foreground mb-1">🪙</span>
                 </div>
                 <Button 
                   onClick={() => handleRedeem(item)}
                   disabled={isRedeeming === item.id}
                   className="h-10 rounded-xl bg-white/5 border border-white/10 hover:bg-primary text-white font-black text-[10px] uppercase tracking-widest px-6"
                 >
                   {isRedeeming === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "REDEEM"}
                 </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="pt-10">
         <Card className="bg-gradient-to-br from-[#1a1a24] to-[#0a0a0f] border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 max-w-xl text-center md:text-left">
               <h3 className="text-3xl font-black uppercase italic text-white flex items-center justify-center md:justify-start gap-4">
                  <ShieldCheck className="h-8 w-8 text-primary" /> Delivery Protocol
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                     <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-1" />
                     <p className="text-[10px] text-muted-foreground font-bold uppercase">Codes are sent to your Inbox</p>
                  </div>
                  <div className="flex items-start gap-3">
                     <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-1" />
                     <p className="text-[10px] text-muted-foreground font-bold uppercase">Standard Processing: 2-24 Hours</p>
                  </div>
               </div>
            </div>
            <Button variant="outline" asChild className="h-16 px-10 rounded-2xl border-white/10 hover:bg-white/5 text-white font-black uppercase italic tracking-widest">
               <a href="https://t.me/bracketbattles_support" target="_blank">CONTACT LOGISTICS</a>
            </Button>
         </Card>
      </section>
    </div>
  );
}
