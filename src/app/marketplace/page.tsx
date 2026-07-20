
'use client';

import { useState } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, orderBy, limit, doc, addDoc, updateDoc, increment } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingBag, 
  FileText, 
  Upload, 
  Loader2, 
  Search, 
  Filter, 
  Zap, 
  ArrowRight,
  ShieldCheck,
  Star,
  Coins,
  History,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserProfile, MarketAsset } from '../lib/types';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const CATEGORIES = ['All', 'NCERT Notes', 'Competitive', 'UPSC', 'Engineering', 'Odia Core'];

export default function KnowledgeMarketplace() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeCat, setActiveCat] = useState('All');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);

  const assetsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'market_assets'), orderBy('downloads', 'desc'), limit(50)) : null, 
    [firestore]
  );
  
  const { data: assets, isLoading: assetsLoading } = useCollection<MarketAsset>(assetsQuery);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handlePurchase = async (asset: MarketAsset) => {
    if (!user || !firestore || !userRef || !profile) return;
    if (profile.coins < asset.price) {
       toast({ variant: "destructive", title: "Insufficient Coins", description: "Earn coins via missions to unlock these notes." });
       return;
    }

    try {
       // Logic: 30% to Author, 70% to Platform Profit
       const authorShare = asset.price * 0.30;
       
       // 1. Deduct from Buyer
       await updateDoc(userRef, {
          coins: increment(-asset.price),
          winningBalance: increment(-asset.price)
       });

       // 2. Credit Author
       const authorRef = doc(firestore, 'users', asset.authorId);
       await updateDoc(authorRef, {
          coins: increment(authorShare),
          winningBalance: increment(authorShare),
          marketSalesCount: increment(1)
       });

       // 3. Log Payout
       await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
          type: 'market_purchase',
          amount: asset.price,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Purchased Notes: ${asset.title}`
       });

       toast({ title: "SIGNAL UNLOCKED", description: "Material successfully synced to your locker." });
       setSelectedAsset(null);
    } catch (e) {
       toast({ variant: "destructive", title: "Sync Failed" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-10">
         <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20">
               <ShoppingBag className="h-4 w-4 text-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Personalized Knowledge Marketplace</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">Market <span className="text-primary">Hub</span></h1>
            <p className="text-muted-foreground font-medium text-lg max-w-xl italic">
               Unlock premium student-made notes. Authors earn 30% profit share on every industrial sale.
            </p>
         </div>

         <div className="flex flex-col gap-4">
            <Card className="bg-[#0a0a0f] border-white/5 p-6 rounded-3xl flex items-center gap-8 shadow-2xl">
               <div className="text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">My Sales</p>
                  <p className="text-2xl font-black text-white italic">{profile?.marketSalesCount || 0}</p>
               </div>
               <div className="w-px h-10 bg-white/10" />
               <Button onClick={() => setIsUploading(true)} className="h-16 px-10 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic text-sm shadow-xl shadow-primary/20">
                  <Upload className="mr-2 h-5 w-5" /> PUBLISH NOTES
               </Button>
            </Card>
         </div>
      </header>

      <div className="flex flex-wrap items-center gap-3 border-b border-white/5 pb-8">
         {CATEGORIES.map(cat => (
           <button 
             key={cat}
             onClick={() => setActiveCat(cat)}
             className={cn(
               "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
               activeCat === cat ? "bg-white/10 text-primary border-primary border shadow-xl italic" : "bg-[#0a0a0f] text-muted-foreground border border-white/5"
             )}
           >
              {cat}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
         {assets?.map((asset) => (
           <Card key={asset.id} className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-primary/30 transition-all shadow-2xl relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-black p-8 flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden">
                 <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <FileText className="h-16 w-16 text-primary drop-shadow-[0_0_20px_rgba(0,122,255,0.5)] group-hover:scale-110 transition-transform" />
                 <Badge variant="outline" className="border-white/20 text-[8px] font-black uppercase tracking-widest italic">{asset.category}</Badge>
              </div>
              <CardContent className="p-8 space-y-6">
                 <div>
                    <h4 className="text-xl font-black uppercase italic text-white truncate">{asset.title}</h4>
                    <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Author: {asset.authorName}</p>
                 </div>
                 <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-end gap-1">
                       <span className="text-2xl font-black text-primary italic tabular-nums">{asset.price}</span>
                       <span className="text-[10px] font-bold opacity-40 mb-1">🪙</span>
                    </div>
                    <Button onClick={() => setSelectedAsset(asset)} className="h-11 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-primary text-white font-black text-[9px] uppercase shadow-lg">UNLOCK</Button>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>

      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
         <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2.5rem] p-10">
            <div className="text-center space-y-8">
               <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20">
                  <Zap className="h-10 w-10 text-primary" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic leading-none">Confirm Signal</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">70/30 Profit Split Protocol Active</p>
               </div>
               
               <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase italic">
                     <span className="text-muted-foreground">Unlock Price</span>
                     <span>{selectedAsset?.price} 🪙</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase italic">
                     <span className="text-muted-foreground">Creator Share</span>
                     <span className="text-primary">{selectedAsset ? Math.floor(selectedAsset.price * 0.3) : 0} 🪙</span>
                  </div>
               </div>

               <Button onClick={() => selectedAsset && handlePurchase(selectedAsset)} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-lg rounded-2xl shadow-xl">
                  AUTHORIZE PURCHASE
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
