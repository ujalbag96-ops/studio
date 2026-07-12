
'use client';

import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, increment, collection, addDoc, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Timer, Zap, Globe, Target, ShieldCheck, Loader2, Info } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, PredictionPoll } from '../lib/types';
import Link from 'next/link';

export default function PredictionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState<string | null>(null);

  const pollsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'polls') : null, [firestore]);
  const { data: polls, isLoading: pollsLoading } = useCollection<PredictionPoll>(pollsQuery);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const handleVote = async (pollId: string, fee: number, choice: string) => {
    if (!user || !firestore || !userRef || !profile) {
      toast({ variant: "destructive", title: "Login Required" });
      return;
    }

    if (profile.coins < fee) {
      toast({ variant: "destructive", title: "Insufficient Assets", description: "Top up your wallet to participate." });
      return;
    }

    setIsVoting(pollId);
    try {
      await updateDoc(userRef, {
        coins: increment(-fee),
        depositBalance: increment(-fee)
      });

      const pollRef = doc(firestore, 'polls', pollId);
      await updateDoc(pollRef, {
        totalPool: increment(fee)
      });

      await addDoc(collection(firestore, 'users', user.uid, 'ledger'), {
        type: 'prediction_fee',
        amount: fee,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        description: `Poll Entry: ${choice} (#${pollId})`
      });

      toast({ title: "PREDICTION LOCKED", description: "Your vote has been registered in the arena pool." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Error" });
    } finally {
      setIsVoting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-10 space-y-12 pb-32">
      <div className="space-y-4 pt-10 text-center">
         <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/10 border border-primary/20 shadow-xl">
            <Target className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Predict & Win Hub</span>
         </div>
         <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter">Poll <span className="text-primary">Wars</span></h1>
         <p className="text-muted-foreground font-medium max-w-xl mx-auto">Analyze the event, place your stake, and claim the prize pool dividend.</p>
      </div>

      <div className="grid gap-8">
         {pollsLoading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
         ) : polls && polls.length > 0 ? polls.map((poll) => (
           <Card key={poll.id} className="bg-[#0a0a0f] border-white/5 rounded-[3rem] overflow-hidden group hover:border-primary/30 transition-all shadow-2xl">
              <CardContent className="p-0">
                 <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-6 flex-1 text-center md:text-left">
                       <div className="flex items-center justify-center md:justify-start gap-4">
                          <Badge className="bg-primary/20 text-primary border-none uppercase font-black text-[8px] tracking-widest px-3 py-1">{poll.category}</Badge>
                          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                             <Timer className="h-3 w-3" /> {poll.expiry}
                          </div>
                       </div>
                       <h3 className="text-2xl md:text-4xl font-black uppercase italic leading-tight">{poll.question}</h3>
                       <div className="flex items-center justify-center md:justify-start gap-6">
                          <div>
                             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Prize Pool</p>
                             <p className="text-2xl font-black text-accent italic">{poll.totalPool.toLocaleString()} 🪙</p>
                          </div>
                          <div className="w-px h-10 bg-white/5" />
                          <div>
                             <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Entry Fee</p>
                             <p className="text-2xl font-black text-white italic">{poll.entryFee} 🪙</p>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-4 w-full md:w-64">
                       <Button onClick={() => handleVote(poll.id, poll.entryFee, 'YES')} disabled={!!isVoting} className="h-16 bg-primary hover:bg-primary/90 rounded-2xl font-black text-xl uppercase italic shadow-2xl transition-all">
                          {isVoting === poll.id ? <Loader2 className="animate-spin" /> : "VOTE YES"}
                       </Button>
                       <Button onClick={() => handleVote(poll.id, poll.entryFee, 'NO')} disabled={!!isVoting} variant="outline" className="h-16 border-white/10 hover:bg-white/5 rounded-2xl font-black text-xl uppercase italic">
                          VOTE NO
                       </Button>
                    </div>
                 </div>
                 <div className="bg-white/5 p-4 text-center border-t border-white/5 flex items-center justify-center gap-2">
                    <Info className="h-3 w-3 text-muted-foreground" />
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-[0.3em]">Winning pool is distributed among correct predictors minus 10% platform fee.</p>
                 </div>
              </CardContent>
           </Card>
         )) : (
           <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-[3rem] space-y-4">
              <Target className="h-12 w-12 text-muted-foreground opacity-10 mx-auto" />
              <p className="text-sm font-black uppercase text-muted-foreground tracking-widest">No active polls in this sector.</p>
              <Button asChild variant="link" className="text-primary font-black uppercase text-xs">
                 <Link href="/">Back to Tournaments</Link>
              </Button>
           </div>
         )}
      </div>
    </div>
  );
}
