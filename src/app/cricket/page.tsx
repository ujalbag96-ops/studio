'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, updateDoc, increment, addDoc, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Trophy, Timer, Zap, Globe, Target, ShieldCheck, Loader2, Info, Flag } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, CricketMatch } from '../lib/types';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import RiskDisclosureModal from '@/components/RiskDisclosureModal';

export default function CricketHub() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState<string | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<{ matchId: string, team: string, fee: number } | null>(null);

  const matchesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'cricket_matches') : null, [firestore]);
  const { data: matches, isLoading } = useCollection<CricketMatch>(matchesQuery);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handlePredict = async (matchId: string, team: string, fee: number) => {
    if (!user || !firestore || !profile) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }

    if (!profile.riskNoticeAccepted) {
      setPendingVote({ matchId, team, fee });
      setShowRiskModal(true);
      return;
    }

    if (profile.coins < fee) {
      toast({ variant: "destructive", title: "Insufficient Balance" });
      return;
    }

    setIsVoting(matchId);
    try {
      await updateDoc(userRef!, {
        coins: increment(-fee),
        depositBalance: increment(-fee)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'cricket_stake',
        amount: fee,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Prediction: ${team} to Win Match #${matchId}`
      });

      toast({ title: "PREDICTION SUBMITTED", description: "Successfully joined the prediction pool." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Error" });
    } finally {
      setIsVoting(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <RiskDisclosureModal 
        isOpen={showRiskModal} 
        onOpenChange={setShowRiskModal} 
        onAccepted={() => pendingVote && handlePredict(pendingVote.matchId, pendingVote.team, pendingVote.fee)} 
      />

      <div className="space-y-4 pt-10 text-center md:text-left">
         <Badge className="bg-primary/20 text-primary border-none uppercase font-black tracking-widest px-4 py-1 text-[10px]">Cricket Prediction Arena</Badge>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">Live <span className="text-primary">Stakes</span></h1>
         <p className="text-muted-foreground font-medium text-lg max-w-2xl leading-relaxed">
            Predict match outcomes, runs, and player performances to claim the mega dividend.
         </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
      ) : matches && matches.length > 0 ? (
        <div className="grid gap-10">
          {matches.map((match) => (
            <Card key={match.id} className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden group hover:border-primary/20 transition-all shadow-2xl">
               <div className="p-8 md:p-12">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                     <div className="flex items-center gap-8 md:gap-16">
                        <TeamInfo name={match.teamA} logo={match.teamALogo} />
                        <div className="text-center space-y-2">
                           <span className="text-3xl font-black text-primary italic">VS</span>
                           <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{match.series}</p>
                        </div>
                        <TeamInfo name={match.teamB} logo={match.teamBLogo} reverse />
                     </div>

                     <div className="w-full md:w-80 space-y-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase text-muted-foreground">Select Match Winner</Label>
                           <div className="grid grid-cols-2 gap-3">
                              <Button onClick={() => handlePredict(match.id, match.teamA, 10)} disabled={isVoting === match.id} className="h-14 bg-white/5 border border-white/10 hover:bg-primary rounded-xl font-black uppercase text-xs">
                                {match.teamA}
                              </Button>
                              <Button onClick={() => handlePredict(match.id, match.teamB, 10)} disabled={isVoting === match.id} className="h-14 bg-white/5 border border-white/10 hover:bg-primary rounded-xl font-black uppercase text-xs">
                                {match.teamB}
                              </Button>
                           </div>
                        </div>
                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between">
                           <span className="text-[9px] font-black uppercase text-primary">Entry Bracket</span>
                           <span className="font-black text-white">10 🪙</span>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="bg-white/5 p-4 text-center border-t border-white/5">
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Winnings distributed 15 minutes after official match completion</p>
               </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center space-y-6 border-2 border-dashed border-white/5 rounded-[3rem]">
           <Flag className="h-16 w-16 text-muted-foreground opacity-10 mx-auto" />
           <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">No Active Cricket Deployments</p>
        </div>
      )}
    </div>
  );
}

function TeamInfo({ name, logo, reverse }: any) {
  return (
    <div className={cn("flex items-center gap-6", reverse ? "flex-row-reverse text-right" : "text-left")}>
       <div className="h-20 w-20 rounded-2xl bg-white/5 border border-white/10 p-4 shadow-xl">
          <img src={logo} alt={name} className="h-full w-full object-contain" />
       </div>
       <div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">{name}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Pro Squad</p>
       </div>
    </div>
  );
}
