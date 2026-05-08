
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, ExternalLink, AlertCircle, Coins, Globe, Clock } from 'lucide-react';
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
  incentive: string;
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
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);

  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);
  const { data: profile } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    async function fetchOffers() {
      if (!settings?.cpaLeadUrl) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(settings.cpaLeadUrl);
        if (!response.ok) throw new Error('CPA SIGNAL JAMMED');
        
        const data = await response.json();
        const allOffers: CPALeadOffer[] = data.offers || [];
        
        const filtered = allOffers.filter(offer => 
          offer.incentive && offer.incentive.toLowerCase().includes('yes')
        );

        setOffers(filtered.slice(0, 15));
      } catch (err: any) {
        setError('Analytical Mission Synchronizer Down');
        // Fallback or empty state handled by error state
      } finally {
        setIsLoading(false);
      }
    }

    if (settings?.cpaLeadUrl) fetchOffers();
    else setIsLoading(false);
  }, [settings?.cpaLeadUrl]);

  if (settingsLoading || isLoading) return <div className="flex flex-col items-center py-20 gap-4"><Loader2 className="animate-spin text-primary h-10 w-10" /><p className="text-[10px] font-black uppercase italic text-muted-foreground">Scanning Localized Missions...</p></div>;

  if (error) return (
    <div className="p-20 text-center space-y-4 border border-red-500/10 rounded-[2.5rem] bg-red-500/5">
      <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
      <p className="text-sm font-black uppercase italic text-muted-foreground">{error}</p>
      <Button variant="outline" onClick={() => window.location.reload()} className="h-10 rounded-xl uppercase text-[10px] font-black">REBOOT SIGNAL</Button>
    </div>
  );

  return (
    <div className="grid gap-6 max-h-[700px] overflow-y-auto pr-4 no-scrollbar">
      {offers.map((offer, index) => {
        const reward = Math.round((parseFloat(offer.payout) || 0.5) * (settings?.coinValuePerDollar || 100) * (1 - (settings?.adminProfitPercentage || 50) / 100));
        return (
          <Card key={index} className="bg-black/60 border-white/5 hover:border-primary/20 transition-all rounded-[2rem] shadow-xl overflow-hidden group">
            <CardContent className="p-8 flex items-center justify-between gap-8">
              <div className="flex items-center gap-6 min-w-0">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20"><Smartphone className="text-primary h-8 w-8" /></div>
                <div className="truncate">
                  <h4 className="text-xl font-black uppercase italic truncate">{offer.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <Badge className="bg-green-500/10 text-green-500 border-none text-[8px] font-black px-3">VERIFIED MISSION</Badge>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase"><Globe className="inline h-2 w-2 mr-1" /> {offer.device} Hub</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                   <p className="text-3xl font-black italic">{reward} <span className="text-sm opacity-40">🪙</span></p>
                </div>
                <Button onClick={() => window.open(offer.link, '_blank')} className="h-14 rounded-2xl bg-primary px-10 font-black uppercase italic shadow-lg shadow-primary/20 hover:scale-105 transition-transform">START MISSION</Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
