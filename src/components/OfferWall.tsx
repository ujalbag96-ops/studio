
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, ExternalLink, AlertCircle, Coins, Globe, Clock, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings, UserProfile } from '@/app/lib/types';

interface CPALeadOffer {
  title: string;
  payout: string;
  link: string;
  mobile_app: string;
  incentive: string;
  device: string;
}

export default function OfferWall() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [offers, setOffers] = useState<CPALeadOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);

  useEffect(() => {
    async function fetchOffers() {
      if (!settings?.cpaLeadUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Use our local API proxy to bypass CORS
        const proxyUrl = `/api/cpa-offers?url=${encodeURIComponent(settings.cpaLeadUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || 'OFFER SIGNAL JAMMED');
        }
        
        const data = await response.json();
        
        // Handle CPA Lead JSON structure (iterating through 'offers' array)
        let offerList: any[] = [];
        if (data.offers && Array.isArray(data.offers)) {
           offerList = data.offers;
        } else if (Array.isArray(data)) {
           offerList = data;
        }

        if (offerList.length > 0) {
           setOffers(offerList.slice(0, 20));
        } else {
           // If it's a success response but no offers, could be a regional issue or empty feed
           console.warn('API returned success but no offers found.');
           setOffers([]);
        }
      } catch (err: any) {
        setError(err.message || 'Analytical Mission Synchronizer Down');
      } finally {
        setIsLoading(false);
      }
    }

    if (settings?.cpaLeadUrl) fetchOffers();
    else if (!settingsLoading) setIsLoading(false);
  }, [settings?.cpaLeadUrl, settingsLoading]);

  if (settingsLoading || isLoading) return (
    <div className="flex flex-col items-center py-20 gap-4">
      <Loader2 className="animate-spin text-primary h-10 w-10" />
      <p className="text-[10px] font-black uppercase italic text-muted-foreground">Scanning Localized Missions...</p>
    </div>
  );

  if (error) return (
    <div className="p-16 text-center space-y-4 border border-red-500/10 rounded-[2.5rem] bg-red-500/5">
      <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
      <p className="text-sm font-black uppercase italic text-red-400">ERROR: {error}</p>
      <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed max-w-xs mx-auto">
         Ensure the URL in Admin Settings is your "CPA Lead Offers Feed" (JSON format).
      </p>
      <Button variant="outline" onClick={() => window.location.reload()} className="h-10 rounded-xl uppercase text-[10px] font-black">REBOOT SIGNAL</Button>
    </div>
  );

  if (offers.length === 0) return (
    <div className="py-24 text-center space-y-4">
       <ShieldAlert className="h-20 w-20 text-muted-foreground opacity-10 mx-auto" />
       <p className="text-muted-foreground italic font-black uppercase tracking-[0.4em]">No Missions Available in this Sector</p>
       <p className="text-[8px] text-muted-foreground uppercase font-bold">API Sync Active but no offers returned for your region.</p>
    </div>
  );

  return (
    <div className="grid gap-6 max-h-[800px] overflow-y-auto pr-4 no-scrollbar">
      {offers.map((offer, index) => {
        const coinVal = settings?.coinValuePerDollar || 100;
        const adminCut = (settings?.adminProfitPercentage || 50) / 100;
        const rawPayout = parseFloat(offer.payout) || 0.1;
        const reward = Math.round(rawPayout * coinVal * (1 - adminCut));
        
        return (
          <Card key={index} className="bg-black/60 border-white/5 hover:border-primary/20 transition-all rounded-[2rem] shadow-xl overflow-hidden group">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6 min-w-0">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20">
                  <Smartphone className="text-primary h-8 w-8" />
                </div>
                <div className="truncate">
                  <h4 className="text-xl font-black uppercase italic truncate text-white">{offer.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black px-3">VERIFIED MISSION</Badge>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{offer.device || 'Mobile'} Hub</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                <div className="text-right">
                   <p className="text-3xl font-black italic text-white">{reward} <span className="text-sm opacity-40">🪙</span></p>
                </div>
                <Button 
                  onClick={() => window.open(offer.link, '_blank')} 
                  className="h-14 rounded-2xl bg-primary px-10 font-black uppercase italic shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                >
                  START MISSION
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
