
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Loader2, 
  Smartphone, 
  Globe, 
  Zap, 
  ArrowRight,
  ClipboardList,
  Signal,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useMemoFirebase, useUser, useCollection, useDoc } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { UserProfile, AppSettings } from '@/app/lib/types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const NETWORKS = [
  { id: 'api_cpalead_active', name: 'CPALead', provider: 'Global CPA', icon: <Zap className="text-primary" /> },
  { id: 'api_adgate_active', name: 'AdGate Media', provider: 'Offerwall', icon: <Smartphone className="text-blue-400" /> },
  { id: 'api_cpx_active', name: 'CPX Research', provider: 'Surveys', icon: <ClipboardList className="text-amber-500" /> },
  { id: 'api_notik_active', name: 'Notik.me', provider: 'App Installs', icon: <Signal className="text-green-500" /> },
  { id: 'api_bitreach_active', name: 'BitReach', provider: 'Gaming', icon: <Target className="text-red-500" /> },
];

export default function OfferWall({ filterType }: { filterType: string }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'app_settings', 'global_config') : null, [firestore]);
  
  const { data: profile } = useDoc<UserProfile>(userRef);
  const { data: settings } = useDoc<AppSettings>(settingsRef);

  // Simulation of global offers based on geo_region
  const offers = [
    { id: 'off1', name: 'Alibaba Group Install', reward: 45, network: 'CPALead', type: 'missions', geo: 'India' },
    { id: 'off2', name: 'Robinhood Crypto Trade', reward: 450, network: 'AdGate Media', type: 'missions', geo: 'Global' },
    { id: 'off3', name: 'Nielsen Market Research', reward: 120, network: 'CPX Research', type: 'surveys', geo: 'Global' },
    { id: 'off4', name: 'Zomato Daily Quiz', reward: 12, network: 'Notik.me', type: 'missions', geo: 'India' },
    { id: 'off5', name: 'Skillz Gaming Tournament', reward: 80, network: 'BitReach', type: 'missions', geo: 'Global' },
    { id: 'off6', name: 'Netflix Viewer Feedback', reward: 30, network: 'CPX Research', type: 'surveys', geo: 'Global' },
  ];

  const filteredOffers = offers.filter(o => {
    const geoMatch = o.geo === 'Global' || o.geo === profile?.country;
    const typeMatch = o.type === filterType;
    return geoMatch && typeMatch;
  });

  return (
    <div className="space-y-6">
       <div className="grid gap-px bg-white/10 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
          {NETWORKS.map((network) => {
             const isActive = (settings as any)?.[network.id];
             const networkOffers = filteredOffers.filter(o => o.network === network.name);

             return (
                <div key={network.id} className={cn(
                  "group bg-background transition-all",
                  !isActive ? "opacity-20 grayscale pointer-events-none" : "hover:bg-white/[0.03]"
                )}>
                   <div className="p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
                      <div className="flex items-center gap-8">
                         <div className="h-16 w-16 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500">
                            {network.icon}
                         </div>
                         <div className="space-y-1">
                            <div className="flex items-center gap-3">
                               <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white group-hover:text-primary transition-colors">{network.name}</h4>
                               <Badge variant="outline" className="border-white/10 text-[7px] font-black uppercase px-2 italic text-muted-foreground">{network.provider}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="status-pulse">
                                  <span className={cn("status-pulse-dot", isActive ? "bg-green-500" : "bg-red-500")} />
                                  <span className={cn("relative inline-flex rounded-full h-1.5 w-1.5", isActive ? "bg-green-500" : "bg-red-500")} />
                               </div>
                               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic">{isActive ? 'Signal Online' : 'Signal Offline'}</p>
                            </div>
                         </div>
                      </div>

                      <div className="flex-1 flex flex-wrap gap-4 items-center xl:justify-center">
                         {networkOffers.length > 0 ? networkOffers.map(off => (
                           <div key={off.id} className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl flex items-center gap-6 hover:border-primary/40 transition-colors">
                              <div className="space-y-0.5">
                                 <p className="text-[9px] font-black text-white uppercase truncate max-w-[120px]">{off.name}</p>
                                 <p className="text-[10px] font-black text-primary italic tabular-nums">+{off.reward} 🪙</p>
                              </div>
                              <Button size="sm" className="h-8 px-4 bg-primary rounded-lg font-black text-[8px] uppercase tracking-widest shadow-lg">GO</Button>
                           </div>
                         )) : (
                           <p className="text-[10px] font-bold text-muted-foreground uppercase italic tracking-widest opacity-30">Waiting for localized signals...</p>
                         )}
                      </div>

                      <div className="xl:border-l xl:border-white/5 xl:pl-10">
                         <Button className="h-14 px-10 bg-white/5 hover:bg-primary border border-white/10 rounded-2xl font-black uppercase italic text-[10px] transition-all group-hover:shadow-xl">
                            OPEN WALL <ArrowRight className="ml-2 h-4 w-4" />
                         </Button>
                      </div>
                   </div>
                </div>
             );
          })}
       </div>

       <div className="flex items-center justify-center gap-6 pt-6 opacity-30">
          <Badge variant="outline" className="border-white/10 text-[8px] font-bold uppercase tracking-[0.4em]">AES-256 S2S ENCRYPTION</Badge>
          <Badge variant="outline" className="border-white/10 text-[8px] font-bold uppercase tracking-[0.4em]">FRAUD SHIELD v12.0</Badge>
       </div>
    </div>
  );
}
