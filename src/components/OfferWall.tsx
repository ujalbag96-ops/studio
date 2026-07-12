
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Smartphone, Globe, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { doc } from 'firebase/firestore';
import { AppSettings } from '@/app/lib/types';

interface CPALeadOffer {
  title: string;
  payout: string;
  link: string;
  device?: string;
}

export default function OfferWall() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [offers, setOffers] = useState<CPALeadOffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'global') : null, [firestore]);
  const tasksQuery = useMemoFirebase(() => firestore ? doc(firestore, 'cpa_tasks', 'placeholder') : null, [firestore]); // Not needed for collection

  const { data: settings } = useDoc<AppSettings>(settingsRef);
  const { data: manualTasks } = useCollection(useMemoFirebase(() => firestore ? doc(firestore, 'cpa_tasks', 'null').parent : null, [firestore]));

  useEffect(() => {
    async function fetchExternalOffers() {
      if (!settings?.cpaLeadUrl) {
        setIsLoadingOffers(false);
        return;
      }

      try {
        const proxyUrl = `/api/cpa-offers?url=${encodeURIComponent(settings.cpaLeadUrl)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        let offerList: CPALeadOffer[] = [];
        if (data.offers && Array.isArray(data.offers)) offerList = data.offers;
        else if (Array.isArray(data)) offerList = data;

        setOffers(offerList.slice(0, 10));
      } catch (err) {
        console.error('Offer sync failure');
      } finally {
        setIsLoadingOffers(false);
      }
    }

    if (settings?.cpaLeadUrl) fetchExternalOffers();
    else setIsLoadingOffers(false);
  }, [settings?.cpaLeadUrl]);

  if (isLoadingOffers) return (
    <div className="flex flex-col items-center py-20 gap-6">
      <Loader2 className="animate-spin text-primary h-10 w-10" />
      <p className="text-[10px] font-black uppercase text-muted-foreground italic">Scanning Live Signal...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Manual Admin Tasks First */}
      {manualTasks?.map((task: any) => (
        <TaskItem 
          key={task.id}
          title={task.appName}
          reward={task.reward}
          link={`${task.link}&uid=${user?.uid}`}
          device="Mobile"
        />
      ))}

      {/* External CPA Offers */}
      {offers.map((offer, index) => {
        const coinVal = settings?.coinValuePerDollar || 100;
        const adminCut = (settings?.adminProfitPercentage || 50) / 100;
        const rawPayout = parseFloat(offer.payout) || 0.1;
        const reward = Math.round(rawPayout * coinVal * (1 - adminCut));
        const trackingLink = `${offer.link}&subid=${user?.uid || 'anonymous'}`;
        
        return (
          <TaskItem 
            key={`ext-${index}`}
            title={offer.title}
            reward={reward}
            link={trackingLink}
            device={offer.device || 'Global'}
          />
        );
      })}

      {offers.length === 0 && (!manualTasks || manualTasks.length === 0) && (
        <div className="py-20 text-center space-y-4">
           <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-muted-foreground italic font-black uppercase text-[10px] tracking-widest">No Missions Currently Active</p>
        </div>
      )}
    </div>
  );
}

function TaskItem({ title, reward, link, device }: any) {
  return (
    <Card className="bg-white/5 border-white/5 hover:border-primary/40 transition-all rounded-2xl overflow-hidden group">
      <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5 min-w-0">
          <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 border border-primary/20">
            <Smartphone className="text-primary h-6 w-6" />
          </div>
          <div className="truncate">
            <h4 className="text-lg font-black uppercase italic truncate text-white">{title}</h4>
            <div className="flex items-center gap-3 mt-1">
              <Badge className="bg-secondary/20 text-secondary border-none text-[8px] font-black px-2 py-0.5 uppercase italic">Verified</Badge>
              <span className="text-[9px] font-black text-muted-foreground uppercase"><Globe className="h-2 w-2 inline mr-1" /> {device}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
             <p className="text-[8px] font-black uppercase text-muted-foreground mb-0.5">Reward</p>
             <p className="text-2xl font-black italic text-white">{reward} 🪙</p>
          </div>
          <Button onClick={() => window.open(link, '_blank')} className="h-12 rounded-xl bg-primary hover:bg-primary/90 px-8 font-black uppercase italic shadow-xl transition-all">
            START
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
