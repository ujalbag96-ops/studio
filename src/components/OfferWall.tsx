
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, ExternalLink, AlertCircle, Coins, Globe, Clock, ShieldAlert, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings, UserProfile } from '@/app/lib/types';

interface CPALeadOffer {
  title: string;
  payout: string;
  link: string;
  mobile_app?: string;
  incentive?: string;
  device?: string;
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
        const proxyUrl = `/api/cpa-offers?url=${encodeURIComponent(settings.cpaLeadUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
           const errData = await response.json();
           throw new Error(errData.error || 'OFFER SIGNAL JAMMED');
        }
        
        const data = await response.json();
        
        let offerList: CPALeadOffer[] = [];
        if (data.offers && Array.isArray(data.offers)) {
           offerList = data.offers;
        } else if (Array.isArray(data)) {
           offerList = data;
        }

        if (offerList.length > 0) {
           setOffers(offerList.slice(0, 15));
        } else {
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
    <div className="flex flex-col items-center py-32 gap-6">
      <Loader2 className="animate-spin text-primary h-12 w-12" />
      <div className="text-center space-y-1">
         <p className="text-[10px] font-black uppercase italic tracking-widest text-white">Scanning Real-Time Opportunities</p>
         <p className="text-[8px] font-bold text-muted-foreground uppercase">Synchronizing with Strategic Networks...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-16 text-center space-y-6 border border-red-500/10 rounded-[2.5rem] bg-red-500/5">
      <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
      <div className="space-y-1">
         <p className="text-sm font-black uppercase italic text-red-400">Signal Jammed: {error}</p>
         <p className="text-[9px] font-bold text-muted-foreground uppercase leading-relaxed max-w-xs mx-auto">
            Check your network connection or contact tactical support.
         </p>
      </div>
      <Button variant="outline" onClick={() => window.location.reload()} className="h-12 rounded-xl border-white/10 text-white uppercase text-[10px] font-black tracking-widest px-8">REBOOT SIGNAL</Button>
    </div>
  );

  if (offers.length === 0) return (
    <div className="py-32 text-center space-y-6">
       <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
          <ShieldAlert className="h-8 w-8 text-muted-foreground opacity-20" />
       </div>
       <div className="space-y-1">
          <p className="text-muted-foreground italic font-black uppercase tracking-[0.4em]">No Missions Available</p>
          <p className="text-[8px] text-muted-foreground uppercase font-bold">Please check back in 15 minutes for new strategic updates.</p>
       </div>
    </div>
  );

  return (
    <div className="grid gap-6 max-h-[1000px] overflow-y-auto pr-4 no-scrollbar">
      {offers.map((offer, index) => {
        const coinVal = settings?.coinValuePerDollar || 100;
        const adminCut = (settings?.adminProfitPercentage || 50) / 100;
        const rawPayout = parseFloat(offer.payout) || 0.1;
        const reward = Math.round(rawPayout * coinVal * (1 - adminCut));
        
        // Append user ID to tracking link for postback
        const trackingLink = `${offer.link}&subid=${user?.uid || 'anonymous'}`;
        
        return (
          <Card key={index} className="bg-white/5 border-white/5 hover:border-primary/40 transition-all rounded-[2rem] shadow-xl overflow-hidden group">
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6 min-w-0">
                <div className="h-20 w-20 bg-primary/10 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-primary/20 shadow-inner group-hover:rotate-3 transition-transform">
                  <Smartphone className="text-primary h-10 w-10" />
                </div>
                <div className="truncate space-y-2">
                  <h4 className="text-2xl font-black uppercase italic truncate text-white tracking-tight">{offer.title}</h4>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-secondary/20 text-secondary border-none text-[8px] font-black px-3 py-1 uppercase italic tracking-widest">
                       SECURE MISSION
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground uppercase">
                       <Globe className="h-3 w-3" /> {offer.device || 'Mobile'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-none pt-6 md:pt-0 border-white/5">
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1 italic">Mission Dividend</p>
                   <p className="text-4xl font-black italic text-white flex items-baseline gap-2">
                      {reward} <span className="text-sm opacity-40 font-bold">🪙</span>
                   </p>
                </div>
                <Button 
                  onClick={() => window.open(trackingLink, '_blank')} 
                  className="h-16 rounded-2xl bg-primary hover:bg-primary/90 px-12 font-black uppercase italic shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-lg tracking-widest"
                >
                  START MISSION
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      <div className="p-10 text-center border-t border-white/5">
         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] italic"> End of Current Deployment Zone </p>
      </div>
    </div>
  );
}
