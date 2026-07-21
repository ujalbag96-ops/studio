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
  Zap, 
  ShieldCheck,
  Star,
  Coins,
  Globe,
  Layout,
  UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserProfile, MarketAsset } from '../lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CATEGORIES = ['All', 'Scholar Notes', 'Competitive', 'UPSC', 'Technical', 'Language Core'];

export default function KnowledgeMarketplace() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeCat, setActiveCat] = useState('All');
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
  
  // Publish Form State
  const [newAsset, setNewAsset] = useState({ title: '', category: 'Scholar Notes', price: '50' });

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
       toast({ variant: "destructive", title: "INSUFFICIENT ASSETS", description: "Earn scholarship coins via lessons to unlock this material." });
       return;
    }

    try {
       const authorShare = asset.price * 0.30;
       
       await updateDoc(userRef, {
          coins: increment(-asset.price),
          winningBalance: increment(-asset.price)
       });

       const authorRef = doc(firestore, 'users', asset.authorId);
       await updateDoc(authorRef, {
          coins: increment(authorShare),
          winningBalance: increment(authorShare),
          marketSalesCount: increment(1)
       });

       await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
          type: 'asset_unlock',
          amount: asset.price,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          description: `Unlocked Material: ${asset.title}`
       });

       toast({ title: "SIGNAL UNLOCKED", description: "Content successfully synced to your personal locker." });
       setSelectedAsset(null);
    } catch (e) {
       toast({ variant: "destructive", title: "SYNC FAILURE" });
    }
  };

  const handlePublish = async () => {
    if (!user || !firestore || !newAsset.title) return;
    try {
       await addDoc(collection(firestore, 'market_assets'), {
          title: newAsset.title,
          category: newAsset.category,
          price: parseFloat(newAsset.price),
          authorId: user.uid,
          authorName: user.email?.split('@')[0] || 'Warrior',
          downloads: 0,
          timestamp: new Date().toISOString()
       });
       toast({ title: "MATERIAL PUBLISHED", description: "Your scholarly work is now live in the hub feed." });
       setIsPublishing(false);
       setNewAsset({ title: '', category: 'Scholar Notes', price: '50' });
    } catch (e) {
       toast({ variant: "destructive", title: "PUBLISH FAILED" });
    }
  };

  if (isUserLoading) return <div className="flex items-center justify-center min-h-screen bg-black"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 space-y-12 pb-32">
      <header className="space-y-6 pt-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-10">
         <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20">
               <ShoppingBag className="h-4 w-4 text-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Student Innovation & Resource Hub</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">Scholar <span className="text-primary">Hub</span></h1>
            <p className="text-muted-foreground font-medium text-lg max-w-xl italic">
               The central feed for student-made academic assets. Earn 30% industrial commission on every download signal.
            </p>
         </div>

         <div className="flex flex-col gap-4">
            <Card className="bg-[#0a0a0f] border-white/5 p-6 rounded-3xl flex items-center gap-8 shadow-2xl">
               <div className="text-center">
                  <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Hub Sales</p>
                  <p className="text-2xl font-black text-white italic tabular-nums">{profile?.marketSalesCount || 0}</p>
               </div>
               <div className="w-px h-10 bg-white/10" />
               <Button onClick={() => setIsPublishing(true)} className="h-16 px-10 bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic text-sm shadow-xl shadow-primary/20">
                  <Upload className="mr-2 h-5 w-5" /> PUBLISH MATERIAL
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

      {assetsLoading ? (
         <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest italic">Syncing Hub Feed...</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {assets?.filter(a => activeCat === 'All' || a.category === activeCat).map((asset) => (
              <Card key={asset.id} className="bg-[#0a0a0f] border-white/5 rounded-[2.5rem] overflow-hidden group hover:border-primary/30 transition-all shadow-2xl relative">
                 <div className="aspect-[4/3] bg-gradient-to-br from-primary/20 to-black p-8 flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden">
                    <FileText className="h-16 w-16 text-primary drop-shadow-[0_0_20px_rgba(0,122,255,0.5)] group-hover:scale-110 transition-transform" />
                    <Badge variant="outline" className="border-white/20 text-[8px] font-black uppercase tracking-widest italic">{asset.category}</Badge>
                 </div>
                 <CardContent className="p-8 space-y-6">
                    <div>
                       <h4 className="text-xl font-black uppercase italic text-white truncate">{asset.title}</h4>
                       <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 flex items-center gap-1.5"><UserCheck className="h-3 w-3" /> Author: {asset.authorName}</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                       <div className="flex items-end gap-1">
                          <span className="text-2xl font-black text-primary italic tabular-nums">{asset.price}</span>
                          <span className="text-[10px] font-bold opacity-40 mb-1">🪙</span>
                       </div>
                       <Button onClick={() => setSelectedAsset(asset)} className="h-11 px-6 rounded-xl bg-white/5 border border-white/10 hover:bg-primary text-white font-black text-[9px] uppercase">UNLOCK SIGNAL</Button>
                    </div>
                 </CardContent>
              </Card>
            ))}
         </div>
      )}

      {/* Publish Dialog */}
      <Dialog open={isPublishing} onOpenChange={setIsPublishing}>
         <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-md rounded-[2.5rem] p-10 shadow-2xl">
            <DialogHeader className="text-center space-y-3">
               <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 mb-2">
                  <Upload className="h-8 w-8 text-primary" />
               </div>
               <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Publish <span className="text-primary">Node</span></DialogTitle>
               <DialogDescription className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Broadcasting scholarly innovation globally.</DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-6">
               <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Title of Creation</Label>
                  <Input 
                    value={newAsset.title} 
                    onChange={e => setNewAsset({...newAsset, title: e.target.value})} 
                    className="h-14 bg-black border-white/10 rounded-xl font-bold text-white uppercase text-xs" 
                    placeholder="E.G. PHYSICS LAB NOTES CLASS 12..."
                  />
               </div>
               <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Asset Value (Coins)</Label>
                  <Input 
                    type="number" 
                    value={newAsset.price} 
                    onChange={e => setNewAsset({...newAsset, price: e.target.value})} 
                    className="h-14 bg-black border-white/10 rounded-xl font-black text-lg text-primary text-center" 
                  />
               </div>
            </div>

            <Button onClick={handlePublish} disabled={!newAsset.title} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-lg rounded-2xl shadow-xl">
               INITIALIZE BROADCAST
            </Button>
         </DialogContent>
      </Dialog>

      {/* Unlock Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
         <DialogContent className="bg-[#0a0a0f] border-white/10 text-white max-w-sm rounded-[2.5rem] p-10 shadow-2xl">
            <div className="text-center space-y-8">
               <div className="h-20 w-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20">
                  <Zap className="h-10 w-10 text-primary" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic leading-none text-white">Unlock Signal</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">70/30 Industrial Split Active</p>
               </div>
               
               <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase italic">
                     <span className="text-muted-foreground">Material Value</span>
                     <span className="text-white">{selectedAsset?.price} 🪙</span>
                  </div>
               </div>

               <Button onClick={() => selectedAsset && handlePurchase(selectedAsset)} className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic text-lg rounded-2xl shadow-xl">
                  AUTHORIZE TRANSACTION
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}