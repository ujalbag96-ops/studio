
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, ExternalLink, AlertCircle, Coins, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings } from '@/app/lib/types';

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
  const firestore = useFirestore();
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
        if (!response.ok) throw new Error('Failed to reach CPALead Arena.');
        
        const data = await response.json();
        const allOffers: CPALeadOffer[] = data.offers || [];
        
        const androidOffers = allOffers.filter(offer => 
          offer.device.toLowerCase().includes('android')
        );

        setOffers(androidOffers.slice(0, 15));
      } catch (err: any) {
        console.error('CPA Fetch Error:', err);
        setError('Connection to task server timed out.');
      } finally {
        setIsLoading(false);
      }
    }

    if (cpaLeadUrl) {
      fetchOffers();
    }
  }, [cpaLeadUrl]);

  if (settingsLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-secondary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Scanning for new missions...</p>
      </div>
    );
  }

  if (!cpaLeadUrl) {
    return (
      <div className="p-12 text-center space-y-4 bg-black/20 rounded-3xl border border-dashed border-white/5">
        <Lock className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest italic">Offer Wall not configured by Admin.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="h-10 rounded-xl">Retry Sync</Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
      {offers.map((offer, index) => {
        const rawDollarValue = parseFloat(offer.payout);
        const totalBaseCoins = rawDollarValue * COIN_VALUE_PER_DOLLAR;
        const userCoins = Math.round(totalBaseCoins * (1 - ADMIN_PROFIT_PERCENT / 100));
        
        return (
          <Card key={index} className="bg-black/40 border-white/5 hover:border-secondary/30 transition-all group rounded-2xl">
            <CardContent className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
                  <Smartphone className="h-6 w-6 text-secondary" />
                </div>
                <div className="space-y-1 truncate">
                  <h4 className="text-sm font-black text-white truncate group-hover:text-secondary transition-colors uppercase tracking-tight">
                    {offer.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[8px] font-black uppercase">
                      ACTIVE
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Android Task</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black text-white">{userCoins}</span>
                  <Coins className="h-4 w-4 text-amber-500" />
                </div>
                <Button 
                  asChild
                  size="sm"
                  className="h-8 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 font-black text-[10px] tracking-widest px-4"
                >
                  <a href={offer.link} target="_blank" rel="noopener noreferrer">
                    EARN <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
