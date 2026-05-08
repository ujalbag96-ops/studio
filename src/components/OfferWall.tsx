
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, ExternalLink, AlertCircle, Coins, Lock, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings } from '@/app/lib/types';
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
}

export default function OfferWall() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [offers, setOffers] = useState<CPALeadOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

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
        if (!response.ok) throw new Error('CPA Network Unreachable.');
        
        const data = await response.json();
        const allOffers: CPALeadOffer[] = data.offers || [];
        
        // Filter for relevant global offers
        const relevantOffers = allOffers.filter(offer => 
          offer.incentive && offer.incentive.toLowerCase().includes('yes')
        );

        setOffers(relevantOffers.slice(0, 10));
      } catch (err: any) {
        console.error('CPA Fetch Error:', err);
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
  }, [cpaLeadUrl]);

  const handleOfferClick = (offer: CPALeadOffer) => {
    if (!user) {
      toast({ variant: "destructive", title: "Access Denied", description: "Login to complete missions." });
      return;
    }

    // SCAM PREVENTION: Never award coins on click. Wait for Postback.
    window.open(offer.link, '_blank');
    toast({
      title: "Mission Deployed",
      description: "Winning balance will sync ONLY after successful network verification.",
    });
  };

  if (settingsLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <Loader2 className="h-12 w-12 animate-spin text-secondary" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Scanning Global Payouts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-12 text-center space-y-6 bg-red-500/5 rounded-[2rem] border border-red-500/10">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground font-medium uppercase italic">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="h-12 rounded-xl border-white/10 font-black">RETRY SCAN</Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 max-h-[600px] overflow-y-auto pr-4 no-scrollbar">
      {offers.map((offer, index) => {
        const rawDollarValue = parseFloat(offer.payout) || 0.50;
        const totalBaseCoins = rawDollarValue * COIN_VALUE_PER_DOLLAR;
        const userCoins = Math.round(totalBaseCoins * (1 - ADMIN_PROFIT_PERCENT / 100));
        
        return (
          <Card key={index} className="bg-black/40 border-white/5 hover:border-secondary/40 transition-all group rounded-[1.5rem]">
            <CardContent className="p-6 flex items-center justify-between gap-6">
              <div className="flex items-center gap-6 flex-1 min-w-0">
                <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20 shadow-xl group-hover:scale-110 transition-transform">
                  <Smartphone className="h-8 w-8 text-secondary" />
                </div>
                <div className="space-y-1.5 truncate">
                  <h4 className="text-base font-black text-white truncate group-hover:text-secondary transition-colors uppercase italic">
                    {offer.title}
                  </h4>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] font-black uppercase px-3">
                      PENDING VERIFICATION
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                      <Clock className="h-2 w-2" /> {offer.device} Sector
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-white tracking-tighter">{userCoins}</span>
                  <Coins className="h-6 w-6 text-amber-500" />
                </div>
                <Button 
                  onClick={() => handleOfferClick(offer)}
                  className="h-11 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-black text-[10px] tracking-widest px-8 shadow-xl shadow-secondary/10"
                >
                  START <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
