
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Timer, Zap, Globe, Target, ShieldCheck, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '../lib/types';

export default function PredictionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState<string | null>(null);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handleVote = async (id: string, fee: number, choice: string) => {
    if (!user || !firestore || !userRef || !profile) {
      toast({ variant: "destructive", title: "Authentication Required" });
      return;
    }

    if (profile.coins < fee) {
      toast({ variant: "destructive", title: "Insufficient Coins" });
      return;
    }

    setIsVoting(id);
    try {
      await updateDoc(userRef, {
        coins: increment(-fee),
        depositBalance: increment(-fee)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'prediction_fee',
        amount: fee,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Poll Vote: ${choice} (Poll #${id})`
      });

      toast({ title: "VOTE REGISTERED", description: "Your prediction has been locked in the arena." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    } finally {
      setIsVoting(null);
    }
  };

  const dummyPolls = [
    { id: 'p1', question: "IPL 2024: Will RCB score more than 180 runs tonight?", category: "Cricket", fee: 10, pool: 5000, expiry: "2h remaining" },
    { id: 'p2', question: "BGMI Masters: Will Team Soul finish in Top 3?", category: "Esports", fee: 5, pool: 2500, expiry: "5h remaining" },
    { id: 'p3', question: "Free Fire Pro: Will there be a 1vs4 clutch today?", category: "Esports", fee: 10, pool: 1200, expiry: "1h remaining" }
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="space-y-4 pt-10 text-center">
         <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-secondary/10 border border-secondary/20 shadow-xl">
            <Target className="h-4 w-4 text-secondary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">Predict & Win Arena</span>
         </div>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter">Poll <span className="text-secondary">Wars</span></h1>
         <p className="text-muted-foreground font-medium max-w-xl mx-auto">Analyze the signals, cast your vote, and claim the prize pool dividend.</p>
      </div>

      <div className="grid gap-8">
         {dummyPolls.map((poll) => (
           <Card key={poll.id} className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden group hover:border-secondary/40 transition-all shadow-2xl">
              <CardContent className="p-0">
                 <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-6 flex-1 text-center md:text-left">
                       <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                          <Badge className="bg-secondary/20 text-secondary border-none uppercase font-black text-[8px] tracking-widest px-3 py-1">{poll.category}</Badge>
                          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                             <Timer className="h-3 w-3" /> {poll.expiry}
                          </div>
                       </div>
                       <h3 className="text-2xl md:text-4xl font-black uppercase italic leading-tight">{poll.question}</h3>
                       <div className="flex items-center justify-center md:justify-start gap-6">
                          <div>
                             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Prize Pool</p>
                             <p className="text-2xl font-black text-accent italic">{poll.pool.toLocaleString()} 🪙</p>
                          </div>
                          <div className="w-px h-10 bg-white/5" />
                          <div>
                             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Entry Fee</p>
                             <p className="text-2xl font-black text-white italic">{poll.fee} 🪙</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-64">
                       <Button onClick={() => handleVote(poll.id, poll.fee, 'YES')} disabled={!!isVoting} className="h-16 bg-secondary hover:bg-secondary/90 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all active:scale-95">
                          {isVoting === poll.id ? <Loader2 className="animate-spin" /> : "VOTE YES"}
                       </Button>
                       <Button onClick={() => handleVote(poll.id, poll.fee, 'NO')} disabled={!!isVoting} variant="outline" className="h-16 border-white/10 hover:bg-white/5 rounded-2xl font-black text-xl uppercase italic transition-all active:scale-95">
                          VOTE NO
                       </Button>
                    </div>
                 </div>
                 <div className="bg-white/5 p-4 text-center border-t border-white/5">
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.4em]">928 Warriors Participated</p>
                 </div>
              </CardContent>
           </Card>
         ))}
      </div>
    </div>
  );
}
