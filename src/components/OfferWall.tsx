
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, ExternalLink, AlertCircle, Coins, Lock, CheckCircle2, Clock, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useToast } from '@/hooks/use-toast';

interface CPALeadOffer {
  title: string;
  payout: string;
  link: string;
  mobile_app: string;
  pre_order: string;
  incentive: string;
  browsers: string;
  device: string;
  countries?: string;
}

export default function OfferWall() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [offers, setOffers] = useState<CPALeadOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const COIN_VALUE_PER_DOLLAR = settings?.coinValuePerDollar ?? 100;
  const ADMIN_PROFIT_PERCENT = settings?.adminProfitPercentage ?? 50;
  const cpaLeadUrl = settings?.cpaLeadUrl;

  useEffect(() => {
    async function fetchOffers() {
      if (!cpaLeadUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(cpaLeadUrl);
        if (!response.ok) throw new Error('CPA Network Signal Jammed.');
        
        const data = await response.json();
        const allOffers: CPALeadOffer[] = data.offers || [];
        
        // Dynamic Offer Scaler: Tier-1 optimization
        const userCountry = profile?.countryCode || 'IN';
        
        let filtered = allOffers.filter(offer => 
          offer.incentive && offer.incentive.toLowerCase().includes('yes')
        );

        // Prioritize Tier 1 if applicable
        if (['US', 'GB', 'CA', 'AU'].includes(userCountry)) {
           filtered = filtered.sort((a, b) => parseFloat(b.payout) - parseFloat(a.payout));
        }

        setOffers(filtered.slice(0, 15));
      } catch (err: any) {
        setError('Arena task synchronizer failed.');
      } finally {
        setIsLoading(false);
      }
    }

    if (cpaLeadUrl) {
      fetchOffers();
    } else {
      setIsLoading(false);
    }
  }, [cpaLeadUrl, profile?.countryCode]);

  const handleOfferClick = (offer: CPALeadOffer) => {
    if (!user) {
      toast({ variant: "destructive", title: "Identity Required", description: "Enlist to execute missions." });
      return;
    }

    // Ghost Monitoring: Start tracking execution time
    localStorage.setItem(`task_start_${offer.title}`, Date.now().toString());

    window.open(offer.link, '_blank');
    toast({
      title: "Mission Deployed",
      description: "Winning balance will sync ONLY after successful network verification.",
    });
  };

  if (settingsLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground italic">Scanning Localized Payouts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center space-y-6 bg-red-500/5 rounded-[2.5rem] border border-red-500/10">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground font-black uppercase italic tracking-widest">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="h-12 rounded-2xl border-white/10 font-black uppercase text-[10px] tracking-widest">Retry Scan</Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 max-h-[700px] overflow-y-auto pr-4 no-scrollbar">
      {offers.map((offer, index) => {
        const rawDollarValue = parseFloat(offer.payout) || 0.50;
        const totalBaseCoins = rawDollarValue * COIN_VALUE_PER_DOLLAR;
        const userCoins = Math.round(totalBaseCoins * (1 - ADMIN_PROFIT_PERCENT / 100));
        
        return (
          <Card key={index} className="bg-black/60 border-white/5 hover:border-primary/40 transition-all group rounded-[2rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-1000">
               <Globe className="h-40 w-40 text-primary" />
            </div>
            <CardContent className="p-8 flex items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-8 flex-1 min-w-0">
                <div className="h-20 w-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 shadow-2xl group-hover:rotate-6 transition-transform">
                  <Smartphone className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2 truncate">
                  <h4 className="text-xl font-black text-white truncate group-hover:text-primary transition-colors uppercase italic tracking-tighter">
                    {offer.title}
                  </h4>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-black uppercase px-4 py-1 tracking-widest rounded-lg">
                      PENDING SIGNAL
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Clock className="h-3 w-3" /> {offer.device} HUB
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-white tracking-tighter italic">{userCoins}</span>
                  <Coins className="h-8 w-8 text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.3)]" />
                </div>
                <Button 
                  onClick={() => handleOfferClick(offer)}
                  className="h-14 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black text-[11px] tracking-[0.2em] px-12 shadow-2xl shadow-primary/20 uppercase italic transition-all hover:scale-105"
                >
                  START MISSION <ExternalLink className="h-4 w-4 ml-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
