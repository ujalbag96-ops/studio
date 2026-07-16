
'use client';

import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  Zap, 
  Clock,
  PlayCircle,
  ShieldCheck,
  AlertCircle,
  FileBarChart,
  ShieldAlert,
  ExternalLink,
  Target,
  Video
} from 'lucide-react';
import { AppSettings, UserProfile } from '@/app/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import OfferWall from '@/components/OfferWall';
import Link from 'next/link';

export default function EarningHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const settingsRef = useMemoFirebase(() => 
    firestore ? doc(firestore, 'app_settings', 'global_config') : null, 
    [firestore]
  );
  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  
  const { data: settings, isLoading: settingsLoading } = useDoc<AppSettings>(settingsRef);
  const { data: profile, isLoading: profileLoading } = useDoc<UserProfile>(userRef);

  if (settingsLoading || profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050508] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Synchronizing Secure Signal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="space-y-6 pt-12 text-center md:text-left">
        <div className="flex items-center justify-center md:justify-start gap-4">
           <Badge className="bg-amber-500/20 text-amber-500 border-none uppercase font-black tracking-widest px-4 py-1 text-[9px]">Postback-Locked Earning</Badge>
           <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4 text-primary" /> Verified Payout Protocol
           </div>
        </div>
        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-none italic text-white">
          Activity <span className="text-primary">Incentive</span> Hub
        </h1>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed">
          Centralized portal for supplemental capital. Credits are managed strictly via server-to-server postbacks to ensure platform integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <Card className="bg-[#0a0a0f] border-primary/20 border-2 rounded-[3rem] overflow-hidden group shadow-2xl">
            <div className="p-10 space-y-8">
               <div className="flex items-center justify-between">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                     <Video className="h-8 w-8" />
                  </div>
                  <Badge className="bg-green-500/20 text-green-500 border-none uppercase font-black px-3 py-1 italic">300 COINS PER SESSION</Badge>
               </div>
               <div className="space-y-2">
                  <h3 className="text-3xl font-black uppercase italic text-white">Movie Watch samples</h3>
                  <p className="text-muted-foreground text-sm font-medium uppercase tracking-tight">Watch cinematic samples for exactly 10 minutes to trigger the margin reward.</p>
               </div>
               <Button asChild className="w-full h-16 bg-primary hover:bg-primary/90 font-black uppercase italic rounded-2xl shadow-xl">
                  <Link href="/watch-earn">ENTER MOVIE ENGINE</Link>
               </Button>
            </div>
         </Card>

         <Card className="bg-amber-500/5 border-amber-500/20 border-2 rounded-[3rem] p-10 flex flex-col justify-between group">
            <div className="space-y-6">
               <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <FileBarChart className="h-8 w-8 text-amber-500" />
               </div>
               <div>
                  <h3 className="text-xl font-black uppercase italic text-white">Incentive Balance</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit-Passed Assets Only</p>
               </div>
               <h2 className="text-6xl font-black text-white italic tracking-tighter">
                 {profile?.taskBalance?.toFixed(1) || '0.0'} <span className="text-2xl align-top opacity-40">🪙</span>
               </h2>
            </div>
            <Button asChild variant="outline" className="w-full h-16 rounded-2xl border-amber-500/20 hover:bg-amber-500/10 text-amber-500 font-black uppercase tracking-widest mt-8">
               <Link href="/dashboard">VIEW AUDIT LOG</Link>
            </Button>
         </Card>
      </div>

      <section className="space-y-8">
        <div className="flex items-center justify-between px-4">
           <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">External <span className="text-amber-500">Missions</span></h2>
           <Badge variant="outline" className="border-white/10 px-4 py-2 opacity-60 text-[10px] font-black uppercase">Postback Delivery Only</Badge>
        </div>
        
        <Card className="bg-[#1a1a1a] border-white/5 border rounded-[3rem] overflow-hidden">
          <CardContent className="p-10 space-y-8">
             <div className="flex items-center gap-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                <AlertCircle className="h-6 w-6 text-amber-500 shrink-0" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase leading-relaxed">
                  Notice: Our systems utilize server-to-server (S2S) postbacks. Any attempts to manipulate local storage or client-side scripts will result in immediate account termination.
                </p>
             </div>
             <OfferWall />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
